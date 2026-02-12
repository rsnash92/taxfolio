-- ============================================
-- TaxFolio Complete Database Rebuild Script
-- Generated from migration files
-- Run this in Supabase SQL Editor to rebuild all tables
-- ============================================

-- ============================================
-- 001: INITIAL SCHEMA
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  business_type text, -- 'sole_trader', 'limited_company', 'partnership'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bank Connections (TrueLayer Open Banking)
create table if not exists public.bank_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  institution_name text not null,
  institution_id text not null,
  connection_id text not null unique, -- Provider-specific connection ID
  status text default 'active' check (status in ('active', 'error', 'disconnected')),
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bank Accounts
create table if not exists public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  bank_connection_id uuid references public.bank_connections(id) on delete cascade,
  account_id text not null, -- Provider-specific account ID
  name text not null,
  official_name text,
  type text, -- 'checking', 'savings', 'credit', etc.
  subtype text,
  mask text, -- Last 4 digits
  balance_current numeric(15, 2),
  balance_available numeric(15, 2),
  currency_code text default 'GBP',
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, account_id)
);

-- HMRC Tax Categories (seed data inserted below)
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sa105_box text, -- For UK Self Assessment
  hmrc_category text, -- HMRC official category
  parent_id uuid references public.categories(id),
  icon text,
  color text,
  is_system boolean default false, -- System categories can't be deleted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade,
  transaction_id text, -- Provider-specific transaction ID
  amount numeric(15, 2) not null,
  currency_code text default 'GBP',
  date date not null,
  description text,
  merchant_name text,
  category_id uuid references public.categories(id),
  category_confidence numeric(3, 2), -- AI categorization confidence
  is_tax_relevant boolean default false,
  is_reviewed boolean default false,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tax Years
create table if not exists public.tax_years (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  year_start date not null, -- e.g., 2024-04-06
  year_end date not null, -- e.g., 2025-04-05
  status text default 'in_progress' check (status in ('in_progress', 'submitted', 'accepted')),
  submission_date timestamp with time zone,
  hmrc_receipt_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, year_start)
);

-- Row Level Security Policies
alter table public.users enable row level security;
alter table public.bank_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.tax_years enable row level security;

-- Users policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Bank connections policies
create policy "Users can view own bank connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own bank connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bank connections"
  on public.bank_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own bank connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);

-- Accounts policies
create policy "Users can view own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Tax years policies
create policy "Users can view own tax years"
  on public.tax_years for select
  using (auth.uid() = user_id);

create policy "Users can insert own tax years"
  on public.tax_years for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tax years"
  on public.tax_years for update
  using (auth.uid() = user_id);

-- Categories are public read
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- Updated at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_bank_connections_updated_at
  before update on public.bank_connections
  for each row execute procedure public.update_updated_at_column();

create trigger update_accounts_updated_at
  before update on public.accounts
  for each row execute procedure public.update_updated_at_column();

create trigger update_transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.update_updated_at_column();

create trigger update_tax_years_updated_at
  before update on public.tax_years
  for each row execute procedure public.update_updated_at_column();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users to create public.users profile
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed HMRC expense categories
insert into public.categories (name, sa105_box, hmrc_category, icon, color, is_system) values
  ('Cost of Sales', 'Box 10', 'cost_of_sales', 'package', '#3b82f6', true),
  ('Travel & Subsistence', 'Box 18', 'travel', 'car', '#10b981', true),
  ('Vehicle Running Costs', 'Box 20', 'vehicle', 'fuel', '#f59e0b', true),
  ('Premises Costs', 'Box 15', 'premises', 'home', '#8b5cf6', true),
  ('Admin & Office Costs', 'Box 17', 'admin', 'briefcase', '#ec4899', true),
  ('Marketing & Advertising', 'Box 16', 'advertising', 'megaphone', '#06b6d4', true),
  ('Legal & Professional', 'Box 21', 'legal', 'scale', '#f97316', true),
  ('Financial Costs', 'Box 14', 'financial', 'credit-card', '#6366f1', true),
  ('Staff Costs', 'Box 19', 'staff', 'users', '#14b8a6', true),
  ('Repairs & Maintenance', 'Box 13', 'repairs', 'wrench', '#ef4444', true),
  ('Insurance', 'Box 22', 'insurance', 'shield', '#84cc16', true),
  ('Training & Development', 'Box 17', 'training', 'graduation-cap', '#a855f7', true),
  ('Technology & Software', 'Box 17', 'technology', 'laptop', '#0ea5e9', true),
  ('Bank Charges', 'Box 14', 'bank', 'landmark', '#64748b', true),
  ('Other Expenses', 'Box 23', 'other', 'more-horizontal', '#9ca3af', true),
  ('Not Business', null, 'personal', 'x-circle', '#dc2626', true),
  ('Income', null, 'income', 'pound-sterling', '#22c55e', true)
on conflict do nothing;

-- ============================================
-- 002: CSV UPLOAD
-- ============================================

-- Add source column to transactions
alter table public.transactions
add column if not exists source text default 'bank' check (source in ('bank', 'csv', 'manual'));

-- Add CSV upload batch tracking
alter table public.transactions
add column if not exists csv_upload_batch_id uuid;

-- ============================================
-- 002: ONBOARDING
-- ============================================

-- Add onboarding completed flag to users
alter table public.users
add column if not exists onboarding_completed boolean default false;

-- Add user type field
alter table public.users
add column if not exists user_type text check (user_type in ('sole_trader', 'limited_company', 'partnership', 'landlord'));

-- ============================================
-- 003: MILEAGE
-- ============================================

-- Mileage trips table for HMRC mileage allowance tracking
create table if not exists public.mileage_trips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  description text not null,
  start_location text,
  end_location text,
  miles numeric(8, 1) not null,
  vehicle_type text default 'car' check (vehicle_type in ('car', 'motorcycle', 'bicycle')),
  is_passenger boolean default false,
  passenger_count integer default 0,
  tax_year_start date not null, -- e.g., 2024-04-06
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for mileage
alter table public.mileage_trips enable row level security;

create policy "Users can view own mileage"
  on public.mileage_trips for select
  using (auth.uid() = user_id);

create policy "Users can insert own mileage"
  on public.mileage_trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mileage"
  on public.mileage_trips for update
  using (auth.uid() = user_id);

create policy "Users can delete own mileage"
  on public.mileage_trips for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger update_mileage_trips_updated_at
  before update on public.mileage_trips
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 004: STRIPE SUBSCRIPTIONS
-- ============================================

-- Add subscription fields to users table
alter table public.users
add column if not exists stripe_customer_id text unique,
add column if not exists subscription_id text,
add column if not exists subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', null)),
add column if not exists subscription_tier text check (subscription_tier in ('lite', 'pro', 'lifetime', null)),
add column if not exists trial_ends_at timestamp with time zone,
add column if not exists current_period_end timestamp with time zone;

-- Lifetime deals table
create table if not exists public.lifetime_deals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  source text not null, -- 'appsumo', 'direct', etc.
  license_key text unique,
  tier text not null check (tier in ('lite', 'pro')),
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

alter table public.lifetime_deals enable row level security;

create policy "Users can view own lifetime deals"
  on public.lifetime_deals for select
  using (auth.uid() = user_id);

-- Subscription events table for tracking changes
create table if not exists public.subscription_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  stripe_event_id text,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscription_events enable row level security;

create policy "Users can view own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- ============================================
-- 005: SA105 PROPERTIES (Landlords)
-- ============================================

-- Properties table for SA105 (UK Property Income)
create table if not exists public.properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,

  -- Property details
  address_line1 text not null,
  address_line2 text,
  city text not null,
  postcode text not null,
  country text default 'UK',

  -- Property type
  property_type text check (property_type in ('residential', 'commercial', 'holiday_let', 'furnished_holiday_let')),
  ownership_type text default 'sole' check (ownership_type in ('sole', 'joint')),
  ownership_percentage numeric(5, 2) default 100.00,

  -- Rental details
  is_furnished boolean default false,
  rooms_let integer, -- For rent-a-room scheme
  annual_rent numeric(12, 2),

  -- Dates
  let_start_date date,
  let_end_date date,

  -- Status
  is_active boolean default true,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Property finance costs (for Section 24 restriction)
create table if not exists public.property_finance_costs (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  tax_year_start date not null,
  mortgage_interest numeric(12, 2) default 0,
  other_finance_costs numeric(12, 2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(property_id, tax_year_start)
);

-- Add property_id to transactions (optional link)
alter table public.transactions
add column if not exists property_id uuid references public.properties(id) on delete set null;

-- RLS for properties
alter table public.properties enable row level security;
alter table public.property_finance_costs enable row level security;

create policy "Users can view own properties"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on public.properties for update
  using (auth.uid() = user_id);

create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = user_id);

create policy "Users can view own property finance"
  on public.property_finance_costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own property finance"
  on public.property_finance_costs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own property finance"
  on public.property_finance_costs for update
  using (auth.uid() = user_id);

create policy "Users can delete own property finance"
  on public.property_finance_costs for delete
  using (auth.uid() = user_id);

-- Triggers
create trigger update_properties_updated_at
  before update on public.properties
  for each row execute procedure public.update_updated_at_column();

create trigger update_property_finance_costs_updated_at
  before update on public.property_finance_costs
  for each row execute procedure public.update_updated_at_column();

-- Property expense categories (extends main categories)
insert into public.categories (name, sa105_box, hmrc_category, icon, color, is_system) values
  ('Rent Received', 'Box 5', 'property_income', 'home', '#22c55e', true),
  ('Letting Agent Fees', 'Box 24', 'property_agent', 'user-check', '#3b82f6', true),
  ('Property Insurance', 'Box 24', 'property_insurance', 'shield', '#10b981', true),
  ('Ground Rent & Service Charges', 'Box 24', 'property_charges', 'building', '#8b5cf6', true),
  ('Property Repairs', 'Box 24', 'property_repairs', 'hammer', '#f59e0b', true),
  ('Council Tax (Void Periods)', 'Box 24', 'property_council_tax', 'landmark', '#ec4899', true),
  ('Water Rates', 'Box 24', 'property_utilities', 'droplet', '#06b6d4', true),
  ('Mortgage Interest', 'Box 26', 'property_mortgage', 'percent', '#ef4444', true)
on conflict do nothing;

-- ============================================
-- 006: USE OF HOME
-- ============================================

-- Use of home calculations for working from home deductions
create table if not exists public.use_of_home (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tax_year_start date not null,

  -- Simplified method (flat rate)
  hours_per_month integer, -- HMRC tiered rates: 25-50hrs=£10, 51-100hrs=£18, 101+hrs=£26

  -- Actual costs method
  total_household_costs numeric(10, 2), -- Annual total of utilities, council tax, mortgage/rent, etc.
  rooms_in_home integer,
  rooms_used_for_business integer,
  business_use_percentage numeric(5, 2), -- Calculated or overridden

  -- Method chosen
  method text default 'simplified' check (method in ('simplified', 'actual')),

  -- Calculated deduction
  calculated_deduction numeric(10, 2),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tax_year_start)
);

-- RLS
alter table public.use_of_home enable row level security;

create policy "Users can view own use of home"
  on public.use_of_home for select
  using (auth.uid() = user_id);

create policy "Users can insert own use of home"
  on public.use_of_home for insert
  with check (auth.uid() = user_id);

create policy "Users can update own use of home"
  on public.use_of_home for update
  using (auth.uid() = user_id);

create policy "Users can delete own use of home"
  on public.use_of_home for delete
  using (auth.uid() = user_id);

create trigger update_use_of_home_updated_at
  before update on public.use_of_home
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 007: SHOW PROPERTIES
-- ============================================

-- Add show_properties flag to users (to control sidebar visibility)
alter table public.users
add column if not exists show_properties boolean default false;

-- ============================================
-- 20241230: HMRC TOKENS
-- ============================================

-- HMRC OAuth tokens storage
create table if not exists public.hmrc_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text not null,
  token_type text default 'bearer',
  expires_at timestamp with time zone not null,
  scope text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.hmrc_tokens enable row level security;

create policy "Users can view own HMRC tokens"
  on public.hmrc_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own HMRC tokens"
  on public.hmrc_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own HMRC tokens"
  on public.hmrc_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own HMRC tokens"
  on public.hmrc_tokens for delete
  using (auth.uid() = user_id);

create trigger update_hmrc_tokens_updated_at
  before update on public.hmrc_tokens
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 20241230: PARTNERS
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
  commission_rate numeric(5, 2) default 20.00, -- percentage
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  payout_details jsonb, -- bank details for payouts
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
  attribution_source text, -- where they came from
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
  payout_method text, -- 'bank_transfer', 'paypal', etc.
  reference text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- RLS for partners
alter table public.partners enable row level security;
alter table public.partner_referrals enable row level security;
alter table public.partner_commissions enable row level security;
alter table public.partner_payouts enable row level security;

create policy "Partners can view own profile"
  on public.partners for select
  using (auth.uid() = user_id);

create policy "Partners can view own referrals"
  on public.partner_referrals for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

create policy "Partners can view own commissions"
  on public.partner_commissions for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

create policy "Partners can view own payouts"
  on public.partner_payouts for select
  using (partner_id in (select id from public.partners where user_id = auth.uid()));

-- Triggers
create trigger update_partners_updated_at
  before update on public.partners
  for each row execute procedure public.update_updated_at_column();

create trigger update_partner_referrals_updated_at
  before update on public.partner_referrals
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 20241230: TRUELAYER
-- ============================================

-- TrueLayer Open Banking connections
create table if not exists public.truelayer_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  connection_id text unique not null, -- TrueLayer connection ID
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

-- TrueLayer accounts (separate from main accounts for clarity)
create table if not exists public.truelayer_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  connection_id uuid references public.truelayer_connections(id) on delete cascade not null,
  account_id text not null, -- TrueLayer account_id
  account_type text, -- TRANSACTION, SAVINGS, CARD
  display_name text,
  currency text default 'GBP',
  account_number_last_4 text,
  sort_code text,
  provider_name text,
  balance numeric(15, 2),
  balance_updated_at timestamp with time zone,
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(connection_id, account_id)
);

-- RLS
alter table public.truelayer_connections enable row level security;
alter table public.truelayer_accounts enable row level security;

create policy "Users can view own TrueLayer connections"
  on public.truelayer_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own TrueLayer connections"
  on public.truelayer_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own TrueLayer connections"
  on public.truelayer_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own TrueLayer connections"
  on public.truelayer_connections for delete
  using (auth.uid() = user_id);

create policy "Users can view own TrueLayer accounts"
  on public.truelayer_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own TrueLayer accounts"
  on public.truelayer_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own TrueLayer accounts"
  on public.truelayer_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own TrueLayer accounts"
  on public.truelayer_accounts for delete
  using (auth.uid() = user_id);

-- Triggers
create trigger update_truelayer_connections_updated_at
  before update on public.truelayer_connections
  for each row execute procedure public.update_updated_at_column();

create trigger update_truelayer_accounts_updated_at
  before update on public.truelayer_accounts
  for each row execute procedure public.update_updated_at_column();

-- ============================================
-- 20241231: ADD BUSINESS ACCOUNT FLAG
-- ============================================

-- Add is_business_account to accounts table
alter table public.accounts
add column if not exists is_business_account boolean default false;

-- Also add to TrueLayer accounts
alter table public.truelayer_accounts
add column if not exists is_business_account boolean default false;

-- ============================================
-- 20241231: ADMIN TABLES
-- ============================================

-- Payments table
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

-- ============================================
-- 20241231: DISMISSED SUGGESTIONS
-- ============================================

-- Track dismissed suggestions
create table if not exists public.dismissed_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  suggestion_key text not null,
  tax_year text not null,
  dismissed_at timestamp with time zone default now(),

  unique(user_id, suggestion_key, tax_year)
);

-- Index for faster lookups
create index if not exists idx_dismissed_suggestions_user
  on dismissed_suggestions(user_id, tax_year);

-- RLS
alter table public.dismissed_suggestions enable row level security;

create policy "Users can view own dismissed suggestions"
  on public.dismissed_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own dismissed suggestions"
  on public.dismissed_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own dismissed suggestions"
  on public.dismissed_suggestions for delete
  using (auth.uid() = user_id);

-- ============================================
-- 20241231: YEAR END REPORTS
-- ============================================

-- Store generated year-end reports for caching/history
create table if not exists public.year_end_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tax_year text not null,

  -- Report data (JSON)
  report_data jsonb not null,
  ai_insights jsonb,

  -- Metadata
  generated_at timestamp with time zone default now(),
  pdf_url text,

  unique(user_id, tax_year)
);

-- Index
create index if not exists idx_year_end_reports_user
  on year_end_reports(user_id, tax_year);

-- RLS
alter table public.year_end_reports enable row level security;

create policy "Users can view own reports"
  on public.year_end_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.year_end_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.year_end_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.year_end_reports for delete
  using (auth.uid() = user_id);

-- ============================================
-- 20250103: INTRO LEADS
-- ============================================

-- Intro Leads table for capturing intro wizard data before signup
CREATE TABLE IF NOT EXISTS public.intro_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,

  -- Lead capture
  email TEXT,
  marketing_consent BOOLEAN DEFAULT false,

  -- Wizard answers
  intent TEXT, -- 'file-return', 'check-if-needed', 'understand-taxes', 'deadline-panic'
  income_source TEXT, -- 'self-employed', 'landlord', 'employed-side-income', 'director', 'investor', 'multiple'
  filing_experience TEXT, -- 'first-time', 'been-a-while', 'every-year', 'use-accountant'
  situation TEXT, -- 'documents-ready', 'need-to-gather', 'deadline-rush', 'just-exploring'

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  ip_country TEXT,
  user_agent TEXT,

  -- Conversion tracking
  converted_to_user BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  converted_at TIMESTAMPTZ,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add intro session fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS intro_session_id TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT, -- 'beginner', 'intermediate', 'expert'
ADD COLUMN IF NOT EXISTS primary_income_source TEXT;

-- Create index for session lookup
CREATE INDEX IF NOT EXISTS idx_intro_leads_session_id ON public.intro_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_intro_leads_email ON public.intro_leads(email);
CREATE INDEX IF NOT EXISTS idx_intro_leads_user_id ON public.intro_leads(user_id);

-- Enable RLS
ALTER TABLE public.intro_leads ENABLE ROW LEVEL SECURITY;

-- Policies for intro_leads
-- Anyone can insert (anonymous users filling out intro wizard)
CREATE POLICY "Anyone can create intro leads"
  ON public.intro_leads FOR INSERT
  WITH CHECK (true);

-- Users can read their own linked intro data
CREATE POLICY "Users can view their own intro lead"
  ON public.intro_leads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can update (for linking sessions to users)
CREATE POLICY "Service can update intro leads"
  ON public.intro_leads FOR UPDATE
  USING (true);

-- Function to link intro session to a user after signup/login
CREATE OR REPLACE FUNCTION public.link_intro_session(
  p_user_id UUID,
  p_session_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_lead intro_leads%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Find the intro lead by session_id
  SELECT * INTO v_lead
  FROM intro_leads
  WHERE session_id = p_session_id
  AND converted_to_user = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or already converted'
    );
  END IF;

  -- Update the intro_leads record
  UPDATE intro_leads
  SET
    user_id = p_user_id,
    converted_to_user = true,
    converted_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id;

  -- Update the user profile with intro data
  UPDATE users
  SET
    intro_session_id = p_session_id,
    experience_level = CASE v_lead.filing_experience
      WHEN 'first-time' THEN 'beginner'
      WHEN 'been-a-while' THEN 'beginner'
      WHEN 'every-year' THEN 'intermediate'
      WHEN 'use-accountant' THEN 'intermediate'
      ELSE 'beginner'
    END,
    primary_income_source = v_lead.income_source,
    updated_at = now()
  WHERE id = p_user_id;

  -- Return the intro data for client use
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'intent', v_lead.intent,
      'income_source', v_lead.income_source,
      'filing_experience', v_lead.filing_experience,
      'situation', v_lead.situation
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger
CREATE TRIGGER update_intro_leads_updated_at
  BEFORE UPDATE ON public.intro_leads
  FOR EACH row EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================
-- 20250103: REFERRALS
-- ============================================

-- Referral codes (one per user)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,

  -- Referred user info (captured at signup, before they have user record)
  referred_email TEXT,

  -- Status tracking
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'started_return', 'submitted', 'paid')),
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  started_return_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Purchase & Reward
  product_type TEXT,
  purchase_amount DECIMAL(10,2),
  reward_amount DECIMAL(10,2),
  reward_status TEXT DEFAULT 'pending' CHECK (reward_status IN ('pending', 'credited', 'paid_out', 'expired')),
  credited_at TIMESTAMPTZ,

  -- Stripe reference
  stripe_payment_intent_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referral balance ledger (for accurate balance tracking)
CREATE TABLE IF NOT EXISTS referral_balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'payout', 'adjustment')),
  referral_id UUID REFERENCES referrals(id),
  payout_id UUID,
  description TEXT,
  balance_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payout requests
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Payment details
  payment_method TEXT DEFAULT 'bank_transfer',
  account_holder_name TEXT,
  sort_code TEXT,
  account_number TEXT,

  -- Processing
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  failure_reason TEXT,

  -- Reference
  reference TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON referral_balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON referral_payouts(status);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
DROP POLICY IF EXISTS "Users can read own referral code" ON referral_codes;
CREATE POLICY "Users can read own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read referrals they made
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
CREATE POLICY "Users can read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can read their balance transactions
DROP POLICY IF EXISTS "Users can read own balance transactions" ON referral_balance_transactions;
CREATE POLICY "Users can read own balance transactions"
  ON referral_balance_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their payout requests
DROP POLICY IF EXISTS "Users can read own payouts" ON referral_payouts;
CREATE POLICY "Users can read own payouts"
  ON referral_payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert payout requests
DROP POLICY IF EXISTS "Users can request payouts" ON referral_payouts;
CREATE POLICY "Users can request payouts"
  ON referral_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REFERRAL FUNCTIONS
-- ============================================

-- Generate referral code for user
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if user already has a code
  SELECT code INTO v_code
  FROM referral_codes
  WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique code
  LOOP
    v_code := 'TAXFOLIO_' || UPPER(substr(md5(random()::text), 1, 8));

    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insert new code
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code);

  RETURN v_code;
END;
$$;

-- Apply referral code (called during signup)
CREATE OR REPLACE FUNCTION apply_referral_code(
  p_referred_user_id UUID,
  p_referred_email TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  -- Normalize code
  p_code := UPPER(TRIM(p_code));

  -- Find the referral code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;

  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referred_email,
    referral_code,
    status,
    signed_up_at
  ) VALUES (
    v_referrer_id,
    p_referred_user_id,
    p_referred_email,
    p_code,
    'signed_up',
    now()
  )
  RETURNING id INTO v_referral_id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id
  );
END;
$$;

-- Credit referral reward (called after payment)
CREATE OR REPLACE FUNCTION credit_referral_reward(
  p_referred_user_id UUID,
  p_product_type TEXT,
  p_purchase_amount DECIMAL,
  p_stripe_payment_intent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_reward_amount DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_referred_user_id
    AND reward_status = 'pending'
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending referral found');
  END IF;

  -- Determine reward amount based on product
  v_reward_amount := CASE p_product_type
    WHEN 'self_assessment' THEN 15.00
    WHEN 'premium_support' THEN 5.00
    ELSE 0.00
  END;

  IF v_reward_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid product type');
  END IF;

  -- Update referral
  UPDATE referrals
  SET
    status = 'paid',
    paid_at = now(),
    product_type = p_product_type,
    purchase_amount = p_purchase_amount,
    reward_amount = v_reward_amount,
    reward_status = 'credited',
    credited_at = now(),
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    updated_at = now()
  WHERE id = v_referral.id;

  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_current_balance
  FROM referral_balance_transactions
  WHERE user_id = v_referral.referrer_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Add balance transaction
  INSERT INTO referral_balance_transactions (
    user_id,
    amount,
    type,
    referral_id,
    description,
    balance_after
  ) VALUES (
    v_referral.referrer_id,
    v_reward_amount,
    'credit',
    v_referral.id,
    'Referral reward for ' || p_product_type,
    v_current_balance + v_reward_amount
  );

  RETURN jsonb_build_object(
    'success', true,
    'reward_amount', v_reward_amount,
    'new_balance', v_current_balance + v_reward_amount
  );
END;
$$;

-- Get user's referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_balance DECIMAL;
  v_total_earned DECIMAL;
  v_total_paid_out DECIMAL;
  v_referral_count INT;
  v_converted_count INT;
BEGIN
  -- Get referral code (generate if doesn't exist)
  SELECT generate_referral_code(p_user_id) INTO v_code;

  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM referral_balance_transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get total earned
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM referral_balance_transactions
  WHERE user_id = p_user_id AND type = 'credit';

  -- Get total paid out
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid_out
  FROM referral_payouts
  WHERE user_id = p_user_id AND status = 'completed';

  -- Get referral counts
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id;

  SELECT COUNT(*) INTO v_converted_count
  FROM referrals
  WHERE referrer_id = p_user_id AND status = 'paid';

  RETURN jsonb_build_object(
    'code', v_code,
    'balance', COALESCE(v_balance, 0),
    'total_earned', COALESCE(v_total_earned, 0),
    'total_paid_out', COALESCE(v_total_paid_out, 0),
    'referral_count', COALESCE(v_referral_count, 0),
    'converted_count', COALESCE(v_converted_count, 0)
  );
END;
$$;

-- Request payout
CREATE OR REPLACE FUNCTION request_referral_payout(
  p_user_id UUID,
  p_amount DECIMAL,
  p_account_holder_name TEXT,
  p_sort_code TEXT,
  p_account_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_payout_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM referral_balance_transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  -- Validate amount
  IF p_amount < 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum payout is £20');
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Check for pending payout
  IF EXISTS (
    SELECT 1 FROM referral_payouts
    WHERE user_id = p_user_id AND status IN ('pending', 'processing')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a pending payout request');
  END IF;

  -- Create payout request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    account_holder_name,
    sort_code,
    account_number
  ) VALUES (
    p_user_id,
    p_amount,
    p_account_holder_name,
    p_sort_code,
    p_account_number
  )
  RETURNING id INTO v_payout_id;

  -- Deduct from balance
  INSERT INTO referral_balance_transactions (
    user_id,
    amount,
    type,
    payout_id,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    'payout',
    v_payout_id,
    'Payout request',
    v_balance - p_amount
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'new_balance', v_balance - p_amount
  );
END;
$$;

-- ============================================
-- 20250113: HMRC API LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS hmrc_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  endpoint TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER NOT NULL,
  response_body JSONB,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER NOT NULL,
  correlation_id TEXT,
  gov_test_scenario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_hmrc_api_logs_user_id ON hmrc_api_logs(user_id);
CREATE INDEX idx_hmrc_api_logs_timestamp ON hmrc_api_logs(timestamp DESC);
CREATE INDEX idx_hmrc_api_logs_error_code ON hmrc_api_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX idx_hmrc_api_logs_response_status ON hmrc_api_logs(response_status);

-- RLS Policies
ALTER TABLE hmrc_api_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view own logs"
  ON hmrc_api_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON hmrc_api_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs"
  ON hmrc_api_logs
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE hmrc_api_logs IS 'Logs all HMRC API requests and responses for debugging';

-- ============================================
-- END OF REBUILD SCRIPT
-- ============================================
