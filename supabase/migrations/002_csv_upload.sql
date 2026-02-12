-- Add CSV upload support to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'truelayer',
  ADD COLUMN IF NOT EXISTS csv_upload_batch_id uuid;

-- Make account_id nullable to support CSV uploads (which don't have an account)
ALTER TABLE public.transactions
  ALTER COLUMN account_id DROP NOT NULL;

-- Create index for batch queries
CREATE INDEX IF NOT EXISTS idx_transactions_csv_batch
  ON public.transactions(csv_upload_batch_id)
  WHERE csv_upload_batch_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.source IS 'Transaction source: truelayer or csv_upload';
COMMENT ON COLUMN public.transactions.csv_upload_batch_id IS 'Groups transactions from the same CSV upload';
