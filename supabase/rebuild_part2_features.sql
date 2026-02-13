-- ============================================
-- TaxFolio Database Rebuild - PART 2: Feature Tables
-- Run this SECOND in Supabase SQL Editor
-- ============================================

-- Mileage trips table
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
  tax_year_start date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mileage_trips enable row level security;
create policy "Users can view own mileage" on public.mileage_trips for select using (auth.uid() = user_id);
create policy "Users can insert own mileage" on public.mileage_trips for insert with check (auth.uid() = user_id);
create policy "Users can update own mileage" on public.mileage_trips for update using (auth.uid() = user_id);
create policy "Users can delete own mileage" on public.mileage_trips for delete using (auth.uid() = user_id);
create trigger update_mileage_trips_updated_at before update on public.mileage_trips for each row execute procedure public.update_updated_at_column();

-- Lifetime deals table
create table if not exists public.lifetime_deals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  source text not null,
  license_key text unique,
  tier text not null check (tier in ('lite', 'pro')),
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

alter table public.lifetime_deals enable row level security;
create policy "Users can view own lifetime deals" on public.lifetime_deals for select using (auth.uid() = user_id);

-- Subscription events table
create table if not exists public.subscription_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  stripe_event_id text,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscription_events enable row level security;
create policy "Users can view own subscription events" on public.subscription_events for select using (auth.uid() = user_id);

-- Properties table for SA105
create table if not exists public.properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  postcode text not null,
  country text default 'UK',
  property_type text check (property_type in ('residential', 'commercial', 'holiday_let', 'furnished_holiday_let')),
  ownership_type text default 'sole' check (ownership_type in ('sole', 'joint')),
  ownership_percentage numeric(5, 2) default 100.00,
  is_furnished boolean default false,
  rooms_let integer,
  annual_rent numeric(12, 2),
  let_start_date date,
  let_end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Property finance costs
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

-- Add property_id to transactions
alter table public.transactions add column if not exists property_id uuid references public.properties(id) on delete set null;

alter table public.properties enable row level security;
alter table public.property_finance_costs enable row level security;

create policy "Users can view own properties" on public.properties for select using (auth.uid() = user_id);
create policy "Users can insert own properties" on public.properties for insert with check (auth.uid() = user_id);
create policy "Users can update own properties" on public.properties for update using (auth.uid() = user_id);
create policy "Users can delete own properties" on public.properties for delete using (auth.uid() = user_id);

create policy "Users can view own property finance" on public.property_finance_costs for select using (auth.uid() = user_id);
create policy "Users can insert own property finance" on public.property_finance_costs for insert with check (auth.uid() = user_id);
create policy "Users can update own property finance" on public.property_finance_costs for update using (auth.uid() = user_id);
create policy "Users can delete own property finance" on public.property_finance_costs for delete using (auth.uid() = user_id);

create trigger update_properties_updated_at before update on public.properties for each row execute procedure public.update_updated_at_column();
create trigger update_property_finance_costs_updated_at before update on public.property_finance_costs for each row execute procedure public.update_updated_at_column();

-- Property expense categories
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

-- Use of home calculations
create table if not exists public.use_of_home (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tax_year_start date not null,
  hours_per_month integer,
  total_household_costs numeric(10, 2),
  rooms_in_home integer,
  rooms_used_for_business integer,
  business_use_percentage numeric(5, 2),
  method text default 'simplified' check (method in ('simplified', 'actual')),
  calculated_deduction numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tax_year_start)
);

alter table public.use_of_home enable row level security;
create policy "Users can view own use of home" on public.use_of_home for select using (auth.uid() = user_id);
create policy "Users can insert own use of home" on public.use_of_home for insert with check (auth.uid() = user_id);
create policy "Users can update own use of home" on public.use_of_home for update using (auth.uid() = user_id);
create policy "Users can delete own use of home" on public.use_of_home for delete using (auth.uid() = user_id);
create trigger update_use_of_home_updated_at before update on public.use_of_home for each row execute procedure public.update_updated_at_column();

-- HMRC OAuth tokens
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

alter table public.hmrc_tokens enable row level security;
create policy "Users can view own HMRC tokens" on public.hmrc_tokens for select using (auth.uid() = user_id);
create policy "Users can insert own HMRC tokens" on public.hmrc_tokens for insert with check (auth.uid() = user_id);
create policy "Users can update own HMRC tokens" on public.hmrc_tokens for update using (auth.uid() = user_id);
create policy "Users can delete own HMRC tokens" on public.hmrc_tokens for delete using (auth.uid() = user_id);
create trigger update_hmrc_tokens_updated_at before update on public.hmrc_tokens for each row execute procedure public.update_updated_at_column();

-- Dismissed suggestions
create table if not exists public.dismissed_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  suggestion_key text not null,
  tax_year text not null,
  dismissed_at timestamp with time zone default now(),
  unique(user_id, suggestion_key, tax_year)
);

create index if not exists idx_dismissed_suggestions_user on dismissed_suggestions(user_id, tax_year);
alter table public.dismissed_suggestions enable row level security;
create policy "Users can view own dismissed suggestions" on public.dismissed_suggestions for select using (auth.uid() = user_id);
create policy "Users can insert own dismissed suggestions" on public.dismissed_suggestions for insert with check (auth.uid() = user_id);
create policy "Users can delete own dismissed suggestions" on public.dismissed_suggestions for delete using (auth.uid() = user_id);

-- Year end reports
create table if not exists public.year_end_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tax_year text not null,
  report_data jsonb not null,
  ai_insights jsonb,
  generated_at timestamp with time zone default now(),
  pdf_url text,
  unique(user_id, tax_year)
);

create index if not exists idx_year_end_reports_user on year_end_reports(user_id, tax_year);
alter table public.year_end_reports enable row level security;
create policy "Users can view own reports" on public.year_end_reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on public.year_end_reports for insert with check (auth.uid() = user_id);
create policy "Users can update own reports" on public.year_end_reports for update using (auth.uid() = user_id);
create policy "Users can delete own reports" on public.year_end_reports for delete using (auth.uid() = user_id);

-- HMRC API Logs
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

CREATE INDEX idx_hmrc_api_logs_user_id ON hmrc_api_logs(user_id);
CREATE INDEX idx_hmrc_api_logs_timestamp ON hmrc_api_logs(timestamp DESC);
CREATE INDEX idx_hmrc_api_logs_error_code ON hmrc_api_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX idx_hmrc_api_logs_response_status ON hmrc_api_logs(response_status);

ALTER TABLE hmrc_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON hmrc_api_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON hmrc_api_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON hmrc_api_logs FOR DELETE USING (auth.uid() = user_id);

-- END PART 2
