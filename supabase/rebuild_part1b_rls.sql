-- Part 1B: Enable RLS and create policies
SET statement_timeout = '300s';

alter table public.users enable row level security;
alter table public.bank_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.tax_years enable row level security;

create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can view own bank connections" on public.bank_connections for select using (auth.uid() = user_id);
create policy "Users can insert own bank connections" on public.bank_connections for insert with check (auth.uid() = user_id);
create policy "Users can update own bank connections" on public.bank_connections for update using (auth.uid() = user_id);
create policy "Users can delete own bank connections" on public.bank_connections for delete using (auth.uid() = user_id);

create policy "Users can view own accounts" on public.accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

create policy "Users can view own tax years" on public.tax_years for select using (auth.uid() = user_id);
create policy "Users can insert own tax years" on public.tax_years for insert with check (auth.uid() = user_id);
create policy "Users can update own tax years" on public.tax_years for update using (auth.uid() = user_id);

create policy "Categories are viewable by everyone" on public.categories for select using (true);
