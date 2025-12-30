-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bank connections table
create table public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  plaid_item_id text unique not null,
  plaid_access_token text not null,
  institution_name text,
  institution_id text,
  status text default 'active',
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Accounts table
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  bank_connection_id uuid references public.bank_connections(id) on delete cascade not null,
  plaid_account_id text unique not null,
  name text,
  official_name text,
  type text,
  subtype text,
  mask text,
  is_business_account boolean default false,
  created_at timestamptz default now()
);

-- Categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null,
  hmrc_box text,
  description text,
  keywords text[],
  display_order int
);

-- Transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  plaid_transaction_id text unique,
  date date not null,
  description text not null,
  amount decimal(12,2) not null,
  currency text default 'GBP',
  merchant_name text,
  category_id uuid references public.categories(id),
  ai_suggested_category_id uuid references public.categories(id),
  ai_confidence decimal(3,2),
  review_status text default 'pending',
  notes text,
  tax_year text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tax years table
create table public.tax_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  year text not null,
  total_income decimal(12,2) default 0,
  total_expenses decimal(12,2) default 0,
  net_profit decimal(12,2) default 0,
  estimated_tax decimal(12,2) default 0,
  estimated_ni decimal(12,2) default 0,
  status text default 'in_progress',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year)
);

-- Seed HMRC categories
insert into public.categories (code, name, type, hmrc_box, description, keywords, display_order) values
  ('income_sales', 'Sales/Turnover', 'income', 'SA103 Box 9', 'Income from sales of goods or services', array['invoice', 'payment received', 'client payment'], 1),
  ('income_other', 'Other Business Income', 'income', 'SA103 Box 10', 'Other business income including grants', array['grant', 'refund', 'rebate'], 2),
  ('expense_cogs', 'Cost of Goods Sold', 'expense', 'SA103 Box 10', 'Direct costs of goods sold', array['inventory', 'stock', 'materials', 'supplies'], 10),
  ('expense_wages', 'Employee Costs', 'expense', 'SA103 Box 11', 'Wages, salaries, bonuses, pensions', array['salary', 'wages', 'payroll', 'pension'], 11),
  ('expense_subcontractor', 'Subcontractor Costs', 'expense', 'SA103 Box 12', 'CIS deductions and subcontractor payments', array['contractor', 'subcontractor', 'cis'], 12),
  ('expense_premises', 'Premises Costs', 'expense', 'SA103 Box 13', 'Rent, rates, power, insurance for business premises', array['rent', 'rates', 'electricity', 'gas', 'water', 'insurance'], 13),
  ('expense_repairs', 'Repairs & Maintenance', 'expense', 'SA103 Box 14', 'Repairs and maintenance of property and equipment', array['repair', 'maintenance', 'fix', 'service'], 14),
  ('expense_motor', 'Motor Expenses', 'expense', 'SA103 Box 15', 'Vehicle running costs, fuel, insurance', array['fuel', 'petrol', 'diesel', 'car', 'van', 'vehicle', 'mot', 'parking'], 15),
  ('expense_travel', 'Travel & Subsistence', 'expense', 'SA103 Box 16', 'Business travel, accommodation, meals', array['train', 'flight', 'hotel', 'uber', 'taxi', 'travel'], 16),
  ('expense_advertising', 'Advertising & Marketing', 'expense', 'SA103 Box 17', 'Advertising, marketing, PR costs', array['advertising', 'marketing', 'google ads', 'facebook', 'promotion'], 17),
  ('expense_professional', 'Professional Fees', 'expense', 'SA103 Box 18', 'Accountant, legal, professional services', array['accountant', 'solicitor', 'lawyer', 'legal', 'professional'], 18),
  ('expense_finance', 'Interest & Bank Charges', 'expense', 'SA103 Box 19', 'Bank charges, interest, card fees', array['bank charge', 'interest', 'overdraft', 'fee'], 19),
  ('expense_phone', 'Phone, Internet & IT', 'expense', 'SA103 Box 20', 'Phone, broadband, software subscriptions', array['phone', 'mobile', 'broadband', 'internet', 'software', 'subscription', 'saas'], 20),
  ('expense_office', 'Office & Admin', 'expense', 'SA103 Box 20', 'Stationery, postage, office supplies', array['stationery', 'postage', 'office', 'supplies', 'amazon'], 21),
  ('expense_other', 'Other Allowable Expenses', 'expense', 'SA103 Box 21', 'Other business expenses not listed above', array[]::text[], 22),
  ('personal', 'Personal / Not Business', 'personal', null, 'Personal expenses - not deductible', array['personal', 'groceries', 'entertainment', 'clothing'], 90),
  ('transfer', 'Transfer / Internal', 'transfer', null, 'Transfers between accounts - ignore', array['transfer', 'moved', 'savings'], 91),
  ('needs_review', 'Needs Review', 'unknown', null, 'AI uncertain - needs manual review', array[]::text[], 99);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.bank_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.tax_years enable row level security;

-- RLS Policies for users
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies for bank_connections
create policy "Users can view their own bank connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bank connections"
  on public.bank_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bank connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);

-- RLS Policies for accounts
create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- RLS Policies for transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- RLS Policies for tax_years
create policy "Users can view their own tax years"
  on public.tax_years for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tax years"
  on public.tax_years for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tax years"
  on public.tax_years for update
  using (auth.uid() = user_id);

-- Categories are public (read-only for everyone)
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- Create indexes for performance
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_tax_year on public.transactions(tax_year);
create index idx_transactions_review_status on public.transactions(review_status);
create index idx_accounts_user_id on public.accounts(user_id);
create index idx_bank_connections_user_id on public.bank_connections(user_id);

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.update_updated_at_column();

create trigger update_tax_years_updated_at
  before update on public.tax_years
  for each row execute procedure public.update_updated_at_column();
