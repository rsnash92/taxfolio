-- Store generated year-end reports for caching/history
create table if not exists public.year_end_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tax_year text not null,

  -- Report data (JSON)
  report_data jsonb not null,
  ai_insights jsonb,

  -- Metadata
  generated_at timestamp with time zone default now(),
  pdf_url text,

  unique(user_id, tax_year)
);

-- Index
create index if not exists idx_year_end_reports_user
  on year_end_reports(user_id, tax_year);

-- RLS
alter table public.year_end_reports enable row level security;

create policy "Users can view own reports"
  on public.year_end_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.year_end_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.year_end_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.year_end_reports for delete
  using (auth.uid() = user_id);
