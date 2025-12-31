-- Admin Dashboard Tables and Functions

-- Payments table (if you don't have one)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_invoice_id text,
  amount decimal(10,2) not null,
  currency text default 'gbp',
  status text not null, -- succeeded, failed, refunded
  plan text, -- lite, pro, lifetime
  type text, -- subscription, one_time
  created_at timestamp with time zone default now()
);

-- Index for faster queries
create index if not exists idx_payments_created_at on payments(created_at);
create index if not exists idx_payments_user_id on payments(user_id);

-- Activity log table
create table if not exists public.activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null, -- signup, subscription, bank_connected, etc.
  details jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_activity_log_created_at on activity_log(created_at desc);

-- Enable RLS
alter table public.payments enable row level security;
alter table public.activity_log enable row level security;

-- Policies for payments (users can only see their own)
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Function to get admin dashboard stats
create or replace function get_admin_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_users', (select count(*) from auth.users),
    'users_today', (select count(*) from auth.users where created_at > current_date),
    'users_this_week', (select count(*) from auth.users where created_at > current_date - interval '7 days'),
    'users_this_month', (select count(*) from auth.users where created_at > current_date - interval '30 days'),
    'active_subscriptions', (select count(*) from public.users where subscription_status = 'active'),
    'trialing_users', (select count(*) from public.users where subscription_status = 'trialing'),
    'churned_users', (select count(*) from public.users where subscription_status = 'canceled'),
    'bank_connections', (select count(*) from bank_connections where status = 'active'),
    'total_transactions', (select count(*) from transactions)
  ) into result;

  return result;
end;
$$;

-- Function to get daily signups for chart
create or replace function get_daily_signups(days_back int default 30)
returns table(date date, count bigint)
language sql
security definer
as $$
  select
    date_trunc('day', created_at)::date as date,
    count(*) as count
  from auth.users
  where created_at > current_date - (days_back || ' days')::interval
  group by date_trunc('day', created_at)::date
  order by date;
$$;

-- Function to get revenue by day
create or replace function get_daily_revenue(days_back int default 30)
returns table(date date, amount numeric, count bigint)
language sql
security definer
as $$
  select
    date_trunc('day', created_at)::date as date,
    coalesce(sum(amount), 0) as amount,
    count(*) as count
  from payments
  where created_at > current_date - (days_back || ' days')::interval
    and status = 'succeeded'
  group by date_trunc('day', created_at)::date
  order by date;
$$;

-- Function to get users with details for admin
create or replace function get_admin_users(
  p_limit int default 50,
  p_offset int default 0,
  p_search text default null,
  p_status text default null
)
returns table(
  id uuid,
  email text,
  created_at timestamptz,
  full_name text,
  subscription_status text,
  subscription_plan text,
  trial_ends_at timestamptz,
  transaction_count bigint,
  bank_connected boolean
)
language sql
security definer
as $$
  select
    au.id,
    au.email,
    au.created_at,
    pu.full_name,
    pu.subscription_status,
    pu.subscription_tier as subscription_plan,
    pu.trial_ends_at,
    (select count(*) from transactions t where t.user_id = au.id) as transaction_count,
    exists(select 1 from bank_connections bc where bc.user_id = au.id and bc.status = 'active') as bank_connected
  from auth.users au
  left join public.users pu on pu.id = au.id
  where
    (p_search is null or au.email ilike '%' || p_search || '%' or pu.full_name ilike '%' || p_search || '%')
    and (p_status is null or pu.subscription_status = p_status)
  order by au.created_at desc
  limit p_limit
  offset p_offset;
$$;

-- Function to count users for pagination
create or replace function count_admin_users(
  p_search text default null,
  p_status text default null
)
returns bigint
language sql
security definer
as $$
  select count(*)
  from auth.users au
  left join public.users pu on pu.id = au.id
  where
    (p_search is null or au.email ilike '%' || p_search || '%' or pu.full_name ilike '%' || p_search || '%')
    and (p_status is null or pu.subscription_status = p_status);
$$;

-- Function to log activity
create or replace function log_activity(
  p_user_id uuid,
  p_user_email text,
  p_action text,
  p_details jsonb default null
)
returns void
language sql
security definer
as $$
  insert into activity_log (user_id, user_email, action, details)
  values (p_user_id, p_user_email, p_action, p_details);
$$;
