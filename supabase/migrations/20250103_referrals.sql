-- ============================================
-- MIGRATION: 20250103_referrals.sql
-- TaxFolio Referral System
-- ============================================

-- Referral codes (one per user)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,

  -- Referred user info (captured at signup, before they have user record)
  referred_email TEXT,

  -- Status tracking
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'started_return', 'submitted', 'paid')),
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  started_return_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Purchase & Reward
  product_type TEXT,
  purchase_amount DECIMAL(10,2),
  reward_amount DECIMAL(10,2),
  reward_status TEXT DEFAULT 'pending' CHECK (reward_status IN ('pending', 'credited', 'paid_out', 'expired')),
  credited_at TIMESTAMPTZ,

  -- Stripe reference
  stripe_payment_intent_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referral balance ledger (for accurate balance tracking)
CREATE TABLE IF NOT EXISTS referral_balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'payout', 'adjustment')),
  referral_id UUID REFERENCES referrals(id),
  payout_id UUID,
  description TEXT,
  balance_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payout requests
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Payment details
  payment_method TEXT DEFAULT 'bank_transfer',
  account_holder_name TEXT,
  sort_code TEXT,
  account_number TEXT,

  -- Processing
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  failure_reason TEXT,

  -- Reference
  reference TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON referral_balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON referral_payouts(status);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
DROP POLICY IF EXISTS "Users can read own referral code" ON referral_codes;
CREATE POLICY "Users can read own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read referrals they made
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
CREATE POLICY "Users can read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can read their balance transactions
DROP POLICY IF EXISTS "Users can read own balance transactions" ON referral_balance_transactions;
CREATE POLICY "Users can read own balance transactions"
  ON referral_balance_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their payout requests
DROP POLICY IF EXISTS "Users can read own payouts" ON referral_payouts;
CREATE POLICY "Users can read own payouts"
  ON referral_payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert payout requests
DROP POLICY IF EXISTS "Users can request payouts" ON referral_payouts;
CREATE POLICY "Users can request payouts"
  ON referral_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate referral code for user
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if user already has a code
  SELECT code INTO v_code
  FROM referral_codes
  WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique code
  LOOP
    v_code := 'TAXFOLIO_' || UPPER(substr(md5(random()::text), 1, 8));

    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insert new code
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code);

  RETURN v_code;
END;
$$;

-- Apply referral code (called during signup)
CREATE OR REPLACE FUNCTION apply_referral_code(
  p_referred_user_id UUID,
  p_referred_email TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  -- Normalize code
  p_code := UPPER(TRIM(p_code));

  -- Find the referral code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;

  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referred_email,
    referral_code,
    status,
    signed_up_at
  ) VALUES (
    v_referrer_id,
    p_referred_user_id,
    p_referred_email,
    p_code,
    'signed_up',
    now()
  )
  RETURNING id INTO v_referral_id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id
  );
END;
$$;

-- Credit referral reward (called after payment)
CREATE OR REPLACE FUNCTION credit_referral_reward(
  p_referred_user_id UUID,
  p_product_type TEXT,
  p_purchase_amount DECIMAL,
  p_stripe_payment_intent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_reward_amount DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_referred_user_id
    AND reward_status = 'pending'
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending referral found');
  END IF;

  -- Determine reward amount based on product
  v_reward_amount := CASE p_product_type
    WHEN 'self_assessment' THEN 15.00
    WHEN 'premium_support' THEN 5.00
    ELSE 0.00
  END;

  IF v_reward_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid product type');
  END IF;

  -- Update referral
  UPDATE referrals
  SET
    status = 'paid',
    paid_at = now(),
    product_type = p_product_type,
    purchase_amount = p_purchase_amount,
    reward_amount = v_reward_amount,
    reward_status = 'credited',
    credited_at = now(),
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    updated_at = now()
  WHERE id = v_referral.id;

  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_current_balance
  FROM referral_balance_transactions
  WHERE user_id = v_referral.referrer_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Add balance transaction
  INSERT INTO referral_balance_transactions (
    user_id,
    amount,
    type,
    referral_id,
    description,
    balance_after
  ) VALUES (
    v_referral.referrer_id,
    v_reward_amount,
    'credit',
    v_referral.id,
    'Referral reward for ' || p_product_type,
    v_current_balance + v_reward_amount
  );

  RETURN jsonb_build_object(
    'success', true,
    'reward_amount', v_reward_amount,
    'new_balance', v_current_balance + v_reward_amount
  );
END;
$$;

-- Get user's referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_balance DECIMAL;
  v_total_earned DECIMAL;
  v_total_paid_out DECIMAL;
  v_referral_count INT;
  v_converted_count INT;
BEGIN
  -- Get referral code (generate if doesn't exist)
  SELECT generate_referral_code(p_user_id) INTO v_code;

  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM referral_balance_transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get total earned
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM referral_balance_transactions
  WHERE user_id = p_user_id AND type = 'credit';

  -- Get total paid out
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid_out
  FROM referral_payouts
  WHERE user_id = p_user_id AND status = 'completed';

  -- Get referral counts
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id;

  SELECT COUNT(*) INTO v_converted_count
  FROM referrals
  WHERE referrer_id = p_user_id AND status = 'paid';

  RETURN jsonb_build_object(
    'code', v_code,
    'balance', COALESCE(v_balance, 0),
    'total_earned', COALESCE(v_total_earned, 0),
    'total_paid_out', COALESCE(v_total_paid_out, 0),
    'referral_count', COALESCE(v_referral_count, 0),
    'converted_count', COALESCE(v_converted_count, 0)
  );
END;
$$;

-- Request payout
CREATE OR REPLACE FUNCTION request_referral_payout(
  p_user_id UUID,
  p_amount DECIMAL,
  p_account_holder_name TEXT,
  p_sort_code TEXT,
  p_account_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_payout_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(balance_after, 0) INTO v_balance
  FROM referral_balance_transactions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  -- Validate amount
  IF p_amount < 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum payout is £20');
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Check for pending payout
  IF EXISTS (
    SELECT 1 FROM referral_payouts
    WHERE user_id = p_user_id AND status IN ('pending', 'processing')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a pending payout request');
  END IF;

  -- Create payout request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    account_holder_name,
    sort_code,
    account_number
  ) VALUES (
    p_user_id,
    p_amount,
    p_account_holder_name,
    p_sort_code,
    p_account_number
  )
  RETURNING id INTO v_payout_id;

  -- Deduct from balance
  INSERT INTO referral_balance_transactions (
    user_id,
    amount,
    type,
    payout_id,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    'payout',
    v_payout_id,
    'Payout request',
    v_balance - p_amount
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'new_balance', v_balance - p_amount
  );
END;
$$;
