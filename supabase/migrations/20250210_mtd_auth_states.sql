-- MTD OAuth state tokens for CSRF protection
create table if not exists public.mtd_auth_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  state_nonce text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null,
  unique(user_id, state_nonce)
);

-- RLS policies
alter table public.mtd_auth_states enable row level security;

-- Users can insert their own state (during authorize flow)
create policy "Users can insert own auth states"
  on public.mtd_auth_states for insert
  with check (auth.uid() = user_id);

-- Users can view their own state
create policy "Users can view own auth states"
  on public.mtd_auth_states for select
  using (auth.uid() = user_id);

-- Users can delete their own state
create policy "Users can delete own auth states"
  on public.mtd_auth_states for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists idx_mtd_auth_states_user_nonce
  on public.mtd_auth_states(user_id, state_nonce);

-- MTD submission records
create table if not exists public.mtd_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id text not null,
  business_type text not null,
  tax_year text not null,
  submission_type text not null,
  period_id text,
  period_start text,
  period_end text,
  data jsonb,
  submitted_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.mtd_submissions enable row level security;

create policy "Users can view own submissions"
  on public.mtd_submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert own submissions"
  on public.mtd_submissions for insert
  with check (auth.uid() = user_id);

create index if not exists idx_mtd_submissions_user
  on public.mtd_submissions(user_id);
