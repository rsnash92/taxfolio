-- Add is_business_account flag to bank_accounts
alter table public.bank_accounts add column if not exists is_business_account boolean default false;

-- Create index for filtering business accounts
create index if not exists idx_bank_accounts_is_business on public.bank_accounts(is_business_account);
