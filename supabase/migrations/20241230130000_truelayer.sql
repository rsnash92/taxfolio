-- TrueLayer Open Banking Integration

-- Bank connections table
create table if not exists public.bank_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- TrueLayer tokens
  access_token text not null,
  refresh_token text,
  token_type text default 'Bearer',
  expires_at timestamp with time zone not null,

  -- Provider info
  provider text default 'truelayer',
  provider_id text,

  -- Bank info
  bank_name text,
  bank_id text,

  -- Status
  status text default 'active',
  last_synced_at timestamp with time zone,
  error_message text,

  -- Metadata
  scopes text[],
  consent_expires_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(user_id, provider_id)
);

-- Store account details
create table if not exists public.bank_accounts (
  id uuid default gen_random_uuid() primary key,
  connection_id uuid references public.bank_connections(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- TrueLayer account info
  account_id text not null,
  account_type text,
  display_name text,
  account_number_last4 text,
  sort_code text,
  currency text default 'GBP',

  -- Balance (cached)
  current_balance decimal(12,2),
  available_balance decimal(12,2),
  balance_updated_at timestamp with time zone,

  -- Sync tracking
  last_transaction_date date,

  -- Status
  is_active boolean default true,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(connection_id, account_id)
);

-- Add bank_account_id to transactions if not exists
alter table public.transactions add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete set null;
alter table public.transactions add column if not exists external_id text;
alter table public.transactions add column if not exists raw_data jsonb;

-- RLS Policies
alter table public.bank_connections enable row level security;
alter table public.bank_accounts enable row level security;

create policy "Users can view own connections"
  on public.bank_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own connections"
  on public.bank_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connections"
  on public.bank_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own connections"
  on public.bank_connections for delete
  using (auth.uid() = user_id);

create policy "Users can view own accounts"
  on public.bank_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.bank_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.bank_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.bank_accounts for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_bank_connections_user_id on public.bank_connections(user_id);
create index if not exists idx_bank_connections_status on public.bank_connections(status);
create index if not exists idx_bank_accounts_connection_id on public.bank_accounts(connection_id);
create index if not exists idx_bank_accounts_user_id on public.bank_accounts(user_id);
create index if not exists idx_transactions_external_id on public.transactions(external_id);
