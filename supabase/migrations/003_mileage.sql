-- Create mileage_trips table
create table public.mileage_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year text not null,

  -- Trip details
  trip_date date not null,
  description text not null,
  from_location text,
  to_location text,

  -- Distance
  miles numeric(10,1) not null check (miles > 0),
  is_return_journey boolean default false,

  -- Vehicle
  vehicle_type text not null default 'car' check (vehicle_type in ('car', 'motorcycle', 'bicycle')),

  -- Calculated (stored for convenience)
  calculated_allowance numeric(10,2),

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for querying by user and tax year
create index idx_mileage_trips_user_tax_year on public.mileage_trips(user_id, tax_year);
create index idx_mileage_trips_date on public.mileage_trips(trip_date);

-- Enable RLS
alter table public.mileage_trips enable row level security;

-- RLS policies
create policy "Users can view own mileage trips"
  on public.mileage_trips for select
  using (auth.uid() = user_id);

create policy "Users can insert own mileage trips"
  on public.mileage_trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mileage trips"
  on public.mileage_trips for update
  using (auth.uid() = user_id);

create policy "Users can delete own mileage trips"
  on public.mileage_trips for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create trigger update_mileage_trips_updated_at
  before update on public.mileage_trips
  for each row
  execute function public.update_updated_at_column();
