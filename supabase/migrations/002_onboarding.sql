-- Add onboarding fields to users table
alter table public.users add column if not exists onboarding_completed boolean default false;
alter table public.users add column if not exists user_type text; -- 'sole_trader', 'landlord', 'both'
