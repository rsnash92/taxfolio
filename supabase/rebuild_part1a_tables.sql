-- Part 1A: Create core tables only
SET statement_timeout = '300s';

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  business_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
