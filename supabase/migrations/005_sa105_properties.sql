-- SA105 Landlord Support: Properties and Finance Costs

-- Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  -- Property details
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  country text default 'United Kingdom',

  -- Property type
  property_type text not null default 'residential'
    check (property_type in ('residential', 'commercial', 'fhl')),

  -- Ownership
  ownership_percentage numeric(5,2) default 100.00,
  ownership_start_date date,
  ownership_end_date date,

  -- Mortgage details
  has_mortgage boolean default false,

  -- Status
  is_active boolean default true,

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property finance costs (for Section 24 tax credit)
create table if not exists public.property_finance_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tax_year text not null,

  -- Finance costs for the year
  mortgage_interest numeric(12,2) default 0,
  other_finance_costs numeric(12,2) default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(property_id, tax_year)
);

-- Add property reference to transactions
alter table public.transactions add column if not exists property_id uuid references public.properties(id);

-- Add SA105 property categories
insert into public.categories (code, name, type, hmrc_box, description, keywords, display_order) values
  -- Property Income
  ('property_income_rent', 'Rental Income', 'income', 'SA105 Box 5', 'Rent received from tenants', array['rent', 'tenant', 'rental', 'landlord'], 3),
  ('property_income_other', 'Other Property Income', 'income', 'SA105 Box 5', 'Insurance payouts, grants for property', array['insurance payout', 'grant', 'property income'], 4),

  -- Property Expenses (SA105 Box 26)
  ('property_expense_agent', 'Letting Agent Fees', 'expense', 'SA105 Box 26', 'Property management and letting fees', array['letting agent', 'foxtons', 'countrywide', 'openrent', 'purplebricks', 'management fee'], 30),
  ('property_expense_insurance', 'Property Insurance', 'expense', 'SA105 Box 26', 'Buildings, contents, landlord insurance', array['homelet', 'landlord insurance', 'buildings insurance', 'property insurance'], 31),
  ('property_expense_repairs', 'Property Repairs', 'expense', 'SA105 Box 26', 'Like-for-like repairs and maintenance', array['repair', 'maintenance', 'plumber', 'electrician', 'boiler', 'checkatrade'], 32),
  ('property_expense_ground_rent', 'Ground Rent & Service Charges', 'expense', 'SA105 Box 26', 'Leasehold charges', array['ground rent', 'service charge', 'leasehold', 'freeholder'], 33),
  ('property_expense_council_tax', 'Property Council Tax', 'expense', 'SA105 Box 26', 'Council tax if paid by landlord', array['council tax'], 34),
  ('property_expense_utilities', 'Property Utilities', 'expense', 'SA105 Box 26', 'Utilities if paid by landlord', array['electric', 'gas', 'water', 'utility'], 35),
  ('property_expense_legal', 'Property Legal Fees', 'expense', 'SA105 Box 26', 'Evictions, lease renewals, tenancy disputes', array['solicitor', 'eviction', 'legal', 'tenancy'], 36),
  ('property_expense_advertising', 'Property Advertising', 'expense', 'SA105 Box 26', 'Tenant finding costs', array['rightmove', 'zoopla', 'advertising', 'tenant find'], 37),
  ('property_expense_travel', 'Property Travel', 'expense', 'SA105 Box 26', 'Travel to property for inspections', array['inspection', 'property visit'], 38),
  ('property_expense_certificates', 'Safety Certificates', 'expense', 'SA105 Box 26', 'Gas safety, EPC, electrical certificates', array['gas safe', 'epc', 'electrical certificate', 'safety check'], 39),
  ('property_expense_other', 'Other Property Expenses', 'expense', 'SA105 Box 26', 'Other allowable property costs', array[]::text[], 40)
on conflict (code) do nothing;

-- RLS for properties
alter table public.properties enable row level security;

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

-- RLS for property_finance_costs
alter table public.property_finance_costs enable row level security;

create policy "Users can view own finance costs"
  on public.property_finance_costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own finance costs"
  on public.property_finance_costs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own finance costs"
  on public.property_finance_costs for update
  using (auth.uid() = user_id);

create policy "Users can delete own finance costs"
  on public.property_finance_costs for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_properties_user on public.properties(user_id);
create index if not exists idx_properties_active on public.properties(user_id, is_active);
create index if not exists idx_property_finance_costs_property on public.property_finance_costs(property_id);
create index if not exists idx_property_finance_costs_tax_year on public.property_finance_costs(user_id, tax_year);
create index if not exists idx_transactions_property on public.transactions(property_id);

-- Trigger for updated_at on properties
create trigger update_properties_updated_at
  before update on public.properties
  for each row execute procedure public.update_updated_at_column();

-- Trigger for updated_at on property_finance_costs
create trigger update_property_finance_costs_updated_at
  before update on public.property_finance_costs
  for each row execute procedure public.update_updated_at_column();
