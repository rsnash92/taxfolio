-- ============================================
-- TaxFolio Database Rebuild - PART 1: Core Tables
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  business_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bank Connections
create table if not exists public.bank_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  institution_name text not null,
  institution_id text not null,
  connection_id text not null unique,
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
  account_id text not null,
  name text not null,
  official_name text,
  type text,
  subtype text,
  mask text,
  balance_current numeric(15, 2),
  balance_available numeric(15, 2),
  currency_code text default 'GBP',
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, account_id)
);

-- HMRC Tax Categories
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sa105_box text,
  hmrc_category text,
  parent_id uuid references public.categories(id),
  icon text,
  color text,
  is_system boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade,
  transaction_id text,
  amount numeric(15, 2) not null,
  currency_code text default 'GBP',
  date date not null,
  description text,
  merchant_name text,
  category_id uuid references public.categories(id),
  category_confidence numeric(3, 2),
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
  year_start date not null,
  year_end date not null,
  status text default 'in_progress' check (status in ('in_progress', 'submitted', 'accepted')),
  submission_date timestamp with time zone,
  hmrc_receipt_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, year_start)
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.bank_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.tax_years enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Bank connections policies
create policy "Users can view own bank connections" on public.bank_connections for select using (auth.uid() = user_id);
create policy "Users can insert own bank connections" on public.bank_connections for insert with check (auth.uid() = user_id);
create policy "Users can update own bank connections" on public.bank_connections for update using (auth.uid() = user_id);
create policy "Users can delete own bank connections" on public.bank_connections for delete using (auth.uid() = user_id);

-- Accounts policies
create policy "Users can view own accounts" on public.accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts for delete using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Tax years policies
create policy "Users can view own tax years" on public.tax_years for select using (auth.uid() = user_id);
create policy "Users can insert own tax years" on public.tax_years for insert with check (auth.uid() = user_id);
create policy "Users can update own tax years" on public.tax_years for update using (auth.uid() = user_id);

-- Categories are public read
create policy "Categories are viewable by everyone" on public.categories for select using (true);

-- Updated at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers
create trigger update_users_updated_at before update on public.users for each row execute procedure public.update_updated_at_column();
create trigger update_bank_connections_updated_at before update on public.bank_connections for each row execute procedure public.update_updated_at_column();
create trigger update_accounts_updated_at before update on public.accounts for each row execute procedure public.update_updated_at_column();
create trigger update_transactions_updated_at before update on public.transactions for each row execute procedure public.update_updated_at_column();
create trigger update_tax_years_updated_at before update on public.tax_years for each row execute procedure public.update_updated_at_column();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
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

-- Add extra columns to transactions
alter table public.transactions add column if not exists source text default 'bank' check (source in ('bank', 'csv', 'manual'));
alter table public.transactions add column if not exists csv_upload_batch_id uuid;

-- Add columns to users
alter table public.users add column if not exists onboarding_completed boolean default false;
alter table public.users add column if not exists user_type text check (user_type in ('sole_trader', 'limited_company', 'partnership', 'landlord'));
alter table public.users add column if not exists show_properties boolean default false;
alter table public.users add column if not exists stripe_customer_id text unique;
alter table public.users add column if not exists subscription_id text;
alter table public.users add column if not exists subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', null));
alter table public.users add column if not exists subscription_tier text check (subscription_tier in ('lite', 'pro', 'lifetime', null));
alter table public.users add column if not exists trial_ends_at timestamp with time zone;
alter table public.users add column if not exists current_period_end timestamp with time zone;
alter table public.users add column if not exists intro_session_id text;
alter table public.users add column if not exists experience_level text;
alter table public.users add column if not exists primary_income_source text;

-- Add is_business_account to accounts
alter table public.accounts add column if not exists is_business_account boolean default false;

-- END PART 1
