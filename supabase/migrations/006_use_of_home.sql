-- Use of Home Calculator: Working from home tax deduction

-- Use of home settings per tax year
create table if not exists public.use_of_home (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tax_year text not null,

  -- Method selection
  calculation_method text not null default 'simplified'
    check (calculation_method in ('simplified', 'actual', 'none')),

  -- Simplified method inputs
  hours_per_week numeric(4,1), -- Average hours worked from home per week
  weeks_per_year integer default 48, -- Weeks worked (excluding holidays)

  -- Actual costs method inputs
  total_rooms integer, -- Total rooms in property (excluding bathrooms/hallways)
  business_rooms integer default 1, -- Rooms used for business

  -- Annual household costs (for actual method)
  cost_electricity numeric(10,2) default 0,
  cost_gas numeric(10,2) default 0,
  cost_water numeric(10,2) default 0,
  cost_council_tax numeric(10,2) default 0,
  cost_mortgage_interest numeric(10,2) default 0, -- OR rent, not both
  cost_rent numeric(10,2) default 0,
  cost_insurance numeric(10,2) default 0,
  cost_broadband numeric(10,2) default 0,
  cost_repairs numeric(10,2) default 0,
  cost_other numeric(10,2) default 0,

  -- Calculated values (stored for reference)
  simplified_amount numeric(10,2),
  actual_amount numeric(10,2),
  recommended_method text,
  final_amount numeric(10,2),

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, tax_year)
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

-- Indexes
create index if not exists idx_use_of_home_user on public.use_of_home(user_id);
create index if not exists idx_use_of_home_tax_year on public.use_of_home(user_id, tax_year);

-- Trigger for updated_at
create trigger update_use_of_home_updated_at
  before update on public.use_of_home
  for each row execute procedure public.update_updated_at_column();
