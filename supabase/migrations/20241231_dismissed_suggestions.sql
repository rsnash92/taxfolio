-- Track dismissed suggestions
create table if not exists public.dismissed_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  suggestion_key text not null,
  tax_year text not null,
  dismissed_at timestamp with time zone default now(),

  unique(user_id, suggestion_key, tax_year)
);

-- Index for faster lookups
create index if not exists idx_dismissed_suggestions_user
  on dismissed_suggestions(user_id, tax_year);

-- RLS
alter table public.dismissed_suggestions enable row level security;

create policy "Users can view own dismissed suggestions"
  on public.dismissed_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own dismissed suggestions"
  on public.dismissed_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own dismissed suggestions"
  on public.dismissed_suggestions for delete
  using (auth.uid() = user_id);
