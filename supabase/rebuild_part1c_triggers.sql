-- Part 1C: Functions, triggers, seed data, and column additions
SET statement_timeout = '300s';

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on public.users for each row execute procedure public.update_updated_at_column();
create trigger update_bank_connections_updated_at before update on public.bank_connections for each row execute procedure public.update_updated_at_column();
create trigger update_accounts_updated_at before update on public.accounts for each row execute procedure public.update_updated_at_column();
create trigger update_transactions_updated_at before update on public.transactions for each row execute procedure public.update_updated_at_column();
create trigger update_tax_years_updated_at before update on public.tax_years for each row execute procedure public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

alter table public.transactions add column if not exists source text default 'bank' check (source in ('bank', 'csv', 'manual'));
alter table public.transactions add column if not exists csv_upload_batch_id uuid;

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

alter table public.accounts add column if not exists is_business_account boolean default false;
