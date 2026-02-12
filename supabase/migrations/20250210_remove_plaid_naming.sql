-- Rename plaid columns to provider-agnostic names
ALTER TABLE public.bank_connections RENAME COLUMN plaid_item_id TO provider_item_id;
ALTER TABLE public.bank_connections RENAME COLUMN plaid_access_token TO access_token_blob;
ALTER TABLE public.accounts RENAME COLUMN plaid_account_id TO external_account_id;
ALTER TABLE public.transactions RENAME COLUMN plaid_transaction_id TO external_transaction_id;

-- Update default source value from 'plaid' to 'truelayer'
ALTER TABLE public.transactions ALTER COLUMN source SET DEFAULT 'truelayer';
