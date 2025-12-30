-- Add subscription fields to users table
alter table public.users add column if not exists stripe_customer_id text unique;
alter table public.users add column if not exists subscription_tier text default 'free'
  check (subscription_tier in ('free', 'trial', 'lite', 'pro', 'lifetime'));
alter table public.users add column if not exists subscription_status text default 'none'
  check (subscription_status in ('none', 'trialing', 'active', 'canceled', 'past_due'));
alter table public.users add column if not exists subscription_id text unique;
alter table public.users add column if not exists subscription_price_id text;
alter table public.users add column if not exists subscription_current_period_end timestamptz;
alter table public.users add column if not exists subscription_cancel_at_period_end boolean default false;
alter table public.users add column if not exists trial_ends_at timestamptz;
alter table public.users add column if not exists is_lifetime boolean default false;

-- Indexes
create index if not exists idx_users_stripe_customer on public.users(stripe_customer_id);
create index if not exists idx_users_subscription_tier on public.users(subscription_tier);
create index if not exists idx_users_is_lifetime on public.users(is_lifetime);

-- Track lifetime deals sold (for counter)
create table if not exists public.lifetime_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount integer not null, -- in pence
  purchased_at timestamptz default now()
);

-- Subscription events log
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  stripe_event_id text unique,
  data jsonb,
  created_at timestamptz default now()
);

-- RLS for lifetime_deals
alter table public.lifetime_deals enable row level security;

create policy "Users can view own lifetime deal"
  on public.lifetime_deals for select
  using (auth.uid() = user_id);

-- RLS for subscription_events
alter table public.subscription_events enable row level security;

create policy "Users can view own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);
