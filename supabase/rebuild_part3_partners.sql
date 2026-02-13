-- ============================================
-- TaxFolio Database Rebuild - PART 3: Partners & TrueLayer
-- Run this THIRD in Supabase SQL Editor
-- ============================================

-- Partners/Affiliates system
create table if not exists public.partners (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique,
  name text not null,
  email text not null unique,
  company_name text,
  website text,
  referral_code text unique not null,
  commission_rate numeric(5, 2) default 20.00,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  payout_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Partner referrals tracking
create table if not exists public.partner_referrals (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,
  referred_user_id uuid references public.users(id) on delete set null,
  referred_email text,
  status text default 'clicked' check (status in ('clicked', 'signed_up', 'subscribed', 'churned')),
  attribution_source text,
  ip_address text,
  user_agent text,
  landing_page text,
  signed_up_at timestamp with time zone,
  subscribed_at timestamp with time zone,
  subscription_amount numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Partner commissions
create table if not exists public.partner_commissions (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,
  referral_id uuid references public.partner_referrals(id) on delete set null,
  amount numeric(10, 2) not null,
  currency text default 'GBP',
  status text default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  stripe_payment_id text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paid_at timestamp with time zone
);

-- Partner payouts
create table if not exists public.partner_payouts (
  id uuid default uuid_generate_v4() primary key,
  partner_id uuid references public.partners(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  currency text default 'GBP',
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payout_method text,
  reference text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

alter table public.partners enable row level security;
alter table public.partner_referrals enable row level security;
alter table public.partner_commissions enable row level security;
alter table public.partner_payouts enable row level security;

create policy "Partners can view own profile" on public.partners for select using (auth.uid() = user_id);
create policy "Partners can view own referrals" on public.partner_referrals for select using (partner_id in (select id from public.partners where user_id = auth.uid()));
create policy "Partners can view own commissions" on public.partner_commissions for select using (partner_id in (select id from public.partners where user_id = auth.uid()));
create policy "Partners can view own payouts" on public.partner_payouts for select using (partner_id in (select id from public.partners where user_id = auth.uid()));

create trigger update_partners_updated_at before update on public.partners for each row execute procedure public.update_updated_at_column();
create trigger update_partner_referrals_updated_at before update on public.partner_referrals for each row execute procedure public.update_updated_at_column();

-- TrueLayer Open Banking connections
create table if not exists public.truelayer_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  connection_id text unique not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone,
  provider_id text not null,
  provider_display_name text,
  status text default 'active' check (status in ('active', 'expired', 'revoked', 'error')),
  last_synced_at timestamp with time zone,
  consent_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TrueLayer accounts
create table if not exists public.truelayer_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  connection_id uuid references public.truelayer_connections(id) on delete cascade not null,
  account_id text not null,
  account_type text,
  display_name text,
  currency text default 'GBP',
  account_number_last_4 text,
  sort_code text,
  provider_name text,
  balance numeric(15, 2),
  balance_updated_at timestamp with time zone,
  is_visible boolean default true,
  is_business_account boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(connection_id, account_id)
);

alter table public.truelayer_connections enable row level security;
alter table public.truelayer_accounts enable row level security;

create policy "Users can view own TrueLayer connections" on public.truelayer_connections for select using (auth.uid() = user_id);
create policy "Users can insert own TrueLayer connections" on public.truelayer_connections for insert with check (auth.uid() = user_id);
create policy "Users can update own TrueLayer connections" on public.truelayer_connections for update using (auth.uid() = user_id);
create policy "Users can delete own TrueLayer connections" on public.truelayer_connections for delete using (auth.uid() = user_id);

create policy "Users can view own TrueLayer accounts" on public.truelayer_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own TrueLayer accounts" on public.truelayer_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own TrueLayer accounts" on public.truelayer_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own TrueLayer accounts" on public.truelayer_accounts for delete using (auth.uid() = user_id);

create trigger update_truelayer_connections_updated_at before update on public.truelayer_connections for each row execute procedure public.update_updated_at_column();
create trigger update_truelayer_accounts_updated_at before update on public.truelayer_accounts for each row execute procedure public.update_updated_at_column();

-- END PART 3
