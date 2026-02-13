-- Migration: Add manual_adjustments table for MTD digital record compliance
-- HMRC requires all submission data to trace back to stored digital records.
-- This table stores user-created adjustments (mileage, use of home, cash expenses, etc.)
-- that supplement bank transaction data in quarterly submissions.

CREATE TABLE public.manual_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id text NOT NULL,
  tax_year text NOT NULL,
  hmrc_field text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  adjustment_type text NOT NULL DEFAULT 'other'
    CHECK (adjustment_type IN (
      'mileage_allowance',
      'use_of_home',
      'capital_allowance',
      'cash_expense',
      'prior_period',
      'other'
    )),
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.manual_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adjustments"
  ON public.manual_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adjustments"
  ON public.manual_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adjustments"
  ON public.manual_adjustments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adjustments"
  ON public.manual_adjustments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_manual_adjustments_user_tax_year
  ON public.manual_adjustments(user_id, tax_year, hmrc_field);

CREATE INDEX idx_manual_adjustments_user_business
  ON public.manual_adjustments(user_id, business_id, tax_year);
