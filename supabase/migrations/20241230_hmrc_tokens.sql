-- Store HMRC OAuth tokens per user
create table if not exists public.hmrc_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  access_token text not null,
  refresh_token text not null,
  token_type text default 'Bearer',
  expires_at timestamp with time zone not null,
  scope text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- RLS policies
alter table public.hmrc_tokens enable row level security;

create policy "Users can view own tokens"
  on public.hmrc_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on public.hmrc_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on public.hmrc_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own tokens"
  on public.hmrc_tokens for delete
  using (auth.uid() = user_id);

-- Add HMRC-related columns to users table if not exists
alter table public.users add column if not exists hmrc_business_id text;
alter table public.users add column if not exists hmrc_nino text;
alter table public.users add column if not exists hmrc_property_business_id text;

-- Index for faster lookups
create index if not exists idx_hmrc_tokens_user_id on public.hmrc_tokens(user_id);
