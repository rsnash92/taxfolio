-- Partner types enum
create type partner_type as enum ('accountant', 'affiliate');
create type partner_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type payout_status as enum ('pending', 'processing', 'paid', 'failed');

-- Partners table (both accountants and affiliates)
create table public.partners (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,

  -- Partner info
  type partner_type not null,
  status partner_status default 'pending',

  -- Business details
  company_name text not null,
  contact_name text not null,
  email text not null unique,
  phone text,
  website text,

  -- For accountants
  accounting_body text,
  registration_number text,

  -- Referral tracking
  referral_code text unique not null,

  -- Commission settings
  commission_rate decimal(5,2) not null,
  commission_recurring boolean default false,

  -- Payout details
  payout_email text,
  bank_account_name text,
  bank_sort_code text,
  bank_account_number text,
  payout_method text default 'bank_transfer',
  minimum_payout decimal(10,2) default 50.00,

  -- Stats (denormalized for performance)
  total_referrals integer default 0,
  total_conversions integer default 0,
  total_earnings decimal(10,2) default 0,
  pending_earnings decimal(10,2) default 0,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  approved_at timestamp with time zone,

  -- Notes
  admin_notes text,
  rejection_reason text
);

-- Referrals tracking
create table public.referrals (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,

  -- Referred user
  referred_user_id uuid references auth.users(id) on delete set null,
  referred_email text,

  -- Tracking
  referral_code text not null,
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address text,
  user_agent text,

  -- Status
  status text default 'clicked',

  -- Timestamps
  clicked_at timestamp with time zone default now(),
  signed_up_at timestamp with time zone,
  subscribed_at timestamp with time zone,

  -- Attribution window (30 days)
  expires_at timestamp with time zone default (now() + interval '30 days')
);

-- Payouts to partners
create table public.payouts (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,

  -- Amount
  amount decimal(10,2) not null,
  currency text default 'gbp',

  -- Status
  status payout_status default 'pending',

  -- Payment details
  payout_method text not null,
  payout_reference text,

  -- Period
  period_start date not null,
  period_end date not null,

  -- Timestamps
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone,
  paid_at timestamp with time zone,

  -- Notes
  notes text,
  failure_reason text
);

-- Commissions earned
create table public.commissions (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,
  referral_id uuid references public.referrals(id) on delete set null,

  -- Related payment
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,

  -- Amounts
  payment_amount decimal(10,2) not null,
  commission_rate decimal(5,2) not null,
  commission_amount decimal(10,2) not null,
  currency text default 'gbp',

  -- Type
  type text not null,

  -- Status
  status text default 'pending',

  -- User info
  referred_user_id uuid references auth.users(id) on delete set null,
  plan_name text,

  -- Timestamps
  created_at timestamp with time zone default now(),
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,

  -- Payout reference
  payout_id uuid references public.payouts(id) on delete set null
);

-- Track which referral code a user signed up with
alter table public.users add column if not exists referred_by_partner_id uuid references public.partners(id);
alter table public.users add column if not exists referral_code_used text;

-- Indexes
create index idx_partners_referral_code on public.partners(referral_code);
create index idx_partners_status on public.partners(status);
create index idx_partners_type on public.partners(type);
create index idx_referrals_partner_id on public.referrals(partner_id);
create index idx_referrals_referral_code on public.referrals(referral_code);
create index idx_referrals_referred_user_id on public.referrals(referred_user_id);
create index idx_commissions_partner_id on public.commissions(partner_id);
create index idx_commissions_status on public.commissions(status);
create index idx_payouts_partner_id on public.payouts(partner_id);

-- RLS Policies
alter table public.partners enable row level security;
alter table public.referrals enable row level security;
alter table public.commissions enable row level security;
alter table public.payouts enable row level security;

-- Partners can view their own data
create policy "Partners can view own profile"
  on public.partners for select
  using (user_id = auth.uid());

create policy "Partners can update own profile"
  on public.partners for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Anyone can insert (for applications)
create policy "Anyone can apply as partner"
  on public.partners for insert
  with check (true);

-- Partners can view their referrals
create policy "Partners can view own referrals"
  on public.referrals for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

-- Service role can insert referrals
create policy "Service can insert referrals"
  on public.referrals for insert
  with check (true);

-- Partners can view their commissions
create policy "Partners can view own commissions"
  on public.commissions for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

-- Partners can view their payouts
create policy "Partners can view own payouts"
  on public.payouts for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

-- Function to generate unique referral code
create or replace function generate_referral_code(partner_name text)
returns text as $$
declare
  base_code text;
  final_code text;
  counter integer := 0;
begin
  base_code := upper(regexp_replace(
    substring(partner_name from 1 for 10),
    '[^A-Za-z0-9]', '', 'g'
  ));

  if length(base_code) < 4 then
    base_code := base_code || substring(md5(random()::text) from 1 for (4 - length(base_code)));
  end if;

  final_code := base_code;

  while exists (select 1 from public.partners where referral_code = final_code) loop
    counter := counter + 1;
    final_code := base_code || counter::text;
  end loop;

  return final_code;
end;
$$ language plpgsql;

-- Function to increment partner referrals
create or replace function increment_partner_referrals(p_partner_id uuid)
returns void as $$
begin
  update public.partners
  set total_referrals = total_referrals + 1,
      updated_at = now()
  where id = p_partner_id;
end;
$$ language plpgsql security definer;

-- Function to increment partner conversions
create or replace function increment_partner_conversions(p_partner_id uuid)
returns void as $$
begin
  update public.partners
  set total_conversions = total_conversions + 1,
      updated_at = now()
  where id = p_partner_id;
end;
$$ language plpgsql security definer;

-- Function to update partner earnings
create or replace function increment_partner_pending_earnings(p_partner_id uuid, p_amount decimal)
returns void as $$
begin
  update public.partners
  set pending_earnings = pending_earnings + p_amount,
      updated_at = now()
  where id = p_partner_id;
end;
$$ language plpgsql security definer;

-- Function to decrement partner pending earnings (for refunds)
create or replace function decrement_partner_pending_earnings(p_partner_id uuid, p_amount decimal)
returns void as $$
begin
  update public.partners
  set pending_earnings = greatest(0, pending_earnings - p_amount),
      updated_at = now()
  where id = p_partner_id;
end;
$$ language plpgsql security definer;

-- Function to get partner stats
create or replace function get_partner_stats(p_partner_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'totalReferrals', p.total_referrals,
    'totalConversions', p.total_conversions,
    'conversionRate', case when p.total_referrals > 0
      then round((p.total_conversions::decimal / p.total_referrals) * 100, 1)
      else 0 end,
    'totalEarnings', p.total_earnings,
    'pendingEarnings', p.pending_earnings,
    'thisMonthEarnings', coalesce((
      select sum(commission_amount)
      from public.commissions
      where partner_id = p_partner_id
        and created_at >= date_trunc('month', now())
    ), 0),
    'activeUsers', (
      select count(distinct referred_user_id)
      from public.referrals
      where partner_id = p_partner_id
        and status = 'subscribed'
    )
  ) into result
  from public.partners p
  where p.id = p_partner_id;

  return result;
end;
$$ language plpgsql security definer;
