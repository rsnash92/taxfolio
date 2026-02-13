-- ============================================
-- TaxFolio Database Rebuild - PART 5: Intro Leads & Referrals
-- Run this FIFTH (LAST) in Supabase SQL Editor
-- ============================================

-- Intro Leads table
CREATE TABLE IF NOT EXISTS public.intro_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  intent TEXT,
  income_source TEXT,
  filing_experience TEXT,
  situation TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  ip_country TEXT,
  user_agent TEXT,
  converted_to_user BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intro_leads_session_id ON public.intro_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_intro_leads_email ON public.intro_leads(email);
CREATE INDEX IF NOT EXISTS idx_intro_leads_user_id ON public.intro_leads(user_id);

ALTER TABLE public.intro_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create intro leads" ON public.intro_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own intro lead" ON public.intro_leads FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Service can update intro leads" ON public.intro_leads FOR UPDATE USING (true);

-- Function to link intro session
CREATE OR REPLACE FUNCTION public.link_intro_session(
  p_user_id UUID,
  p_session_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_lead intro_leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM intro_leads WHERE session_id = p_session_id AND converted_to_user = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found or already converted');
  END IF;

  UPDATE intro_leads SET user_id = p_user_id, converted_to_user = true, converted_at = now(), updated_at = now() WHERE session_id = p_session_id;

  UPDATE users SET
    intro_session_id = p_session_id,
    experience_level = CASE v_lead.filing_experience WHEN 'first-time' THEN 'beginner' WHEN 'been-a-while' THEN 'beginner' WHEN 'every-year' THEN 'intermediate' WHEN 'use-accountant' THEN 'intermediate' ELSE 'beginner' END,
    primary_income_source = v_lead.income_source,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('intent', v_lead.intent, 'income_source', v_lead.income_source, 'filing_experience', v_lead.filing_experience, 'situation', v_lead.situation));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_intro_leads_updated_at BEFORE UPDATE ON public.intro_leads FOR EACH row EXECUTE PROCEDURE public.update_updated_at_column();

-- Referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'started_return', 'submitted', 'paid')),
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  started_return_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  product_type TEXT,
  purchase_amount DECIMAL(10,2),
  reward_amount DECIMAL(10,2),
  reward_status TEXT DEFAULT 'pending' CHECK (reward_status IN ('pending', 'credited', 'paid_out', 'expired')),
  credited_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referral balance transactions
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

-- Referral payouts
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT DEFAULT 'bank_transfer',
  account_holder_name TEXT,
  sort_code TEXT,
  account_number TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  failure_reason TEXT,
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

-- RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own referral code" ON referral_codes;
CREATE POLICY "Users can read own referral code" ON referral_codes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can read own balance transactions" ON referral_balance_transactions;
CREATE POLICY "Users can read own balance transactions" ON referral_balance_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own payouts" ON referral_payouts;
CREATE POLICY "Users can read own payouts" ON referral_payouts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request payouts" ON referral_payouts;
CREATE POLICY "Users can request payouts" ON referral_payouts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generate referral code function
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  LOOP
    v_code := 'TAXFOLIO_' || UPPER(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    IF NOT v_exists THEN EXIT; END IF;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END;
$$;

-- Apply referral code function
CREATE OR REPLACE FUNCTION apply_referral_code(p_referred_user_id UUID, p_referred_email TEXT, p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  p_code := UPPER(TRIM(p_code));
  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = p_code;

  IF v_referrer_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code'); END IF;
  IF v_referrer_id = p_referred_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code'); END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN RETURN jsonb_build_object('success', false, 'error', 'Already referred'); END IF;

  INSERT INTO referrals (referrer_id, referred_id, referred_email, referral_code, status, signed_up_at)
  VALUES (v_referrer_id, p_referred_user_id, p_referred_email, p_code, 'signed_up', now())
  RETURNING id INTO v_referral_id;

  RETURN jsonb_build_object('success', true, 'referral_id', v_referral_id, 'referrer_id', v_referrer_id);
END;
$$;

-- Credit referral reward function
CREATE OR REPLACE FUNCTION credit_referral_reward(p_referred_user_id UUID, p_product_type TEXT, p_purchase_amount DECIMAL, p_stripe_payment_intent_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_reward_amount DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  SELECT * INTO v_referral FROM referrals WHERE referred_id = p_referred_user_id AND reward_status = 'pending' LIMIT 1;
  IF v_referral IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No pending referral found'); END IF;

  v_reward_amount := CASE p_product_type WHEN 'self_assessment' THEN 15.00 WHEN 'premium_support' THEN 5.00 ELSE 0.00 END;
  IF v_reward_amount = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid product type'); END IF;

  UPDATE referrals SET status = 'paid', paid_at = now(), product_type = p_product_type, purchase_amount = p_purchase_amount, reward_amount = v_reward_amount, reward_status = 'credited', credited_at = now(), stripe_payment_intent_id = p_stripe_payment_intent_id, updated_at = now() WHERE id = v_referral.id;

  SELECT COALESCE(balance_after, 0) INTO v_current_balance FROM referral_balance_transactions WHERE user_id = v_referral.referrer_id ORDER BY created_at DESC LIMIT 1;
  IF v_current_balance IS NULL THEN v_current_balance := 0; END IF;

  INSERT INTO referral_balance_transactions (user_id, amount, type, referral_id, description, balance_after)
  VALUES (v_referral.referrer_id, v_reward_amount, 'credit', v_referral.id, 'Referral reward for ' || p_product_type, v_current_balance + v_reward_amount);

  RETURN jsonb_build_object('success', true, 'reward_amount', v_reward_amount, 'new_balance', v_current_balance + v_reward_amount);
END;
$$;

-- Get referral stats function
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code TEXT;
  v_balance DECIMAL;
  v_total_earned DECIMAL;
  v_total_paid_out DECIMAL;
  v_referral_count INT;
  v_converted_count INT;
BEGIN
  SELECT generate_referral_code(p_user_id) INTO v_code;
  SELECT COALESCE(balance_after, 0) INTO v_balance FROM referral_balance_transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned FROM referral_balance_transactions WHERE user_id = p_user_id AND type = 'credit';
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid_out FROM referral_payouts WHERE user_id = p_user_id AND status = 'completed';
  SELECT COUNT(*) INTO v_referral_count FROM referrals WHERE referrer_id = p_user_id;
  SELECT COUNT(*) INTO v_converted_count FROM referrals WHERE referrer_id = p_user_id AND status = 'paid';

  RETURN jsonb_build_object('code', v_code, 'balance', COALESCE(v_balance, 0), 'total_earned', COALESCE(v_total_earned, 0), 'total_paid_out', COALESCE(v_total_paid_out, 0), 'referral_count', COALESCE(v_referral_count, 0), 'converted_count', COALESCE(v_converted_count, 0));
END;
$$;

-- Request payout function
CREATE OR REPLACE FUNCTION request_referral_payout(p_user_id UUID, p_amount DECIMAL, p_account_holder_name TEXT, p_sort_code TEXT, p_account_number TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
  v_payout_id UUID;
BEGIN
  SELECT COALESCE(balance_after, 0) INTO v_balance FROM referral_balance_transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;
  IF v_balance IS NULL THEN v_balance := 0; END IF;

  IF p_amount < 20 THEN RETURN jsonb_build_object('success', false, 'error', 'Minimum payout is £20'); END IF;
  IF p_amount > v_balance THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
  IF EXISTS (SELECT 1 FROM referral_payouts WHERE user_id = p_user_id AND status IN ('pending', 'processing')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a pending payout request');
  END IF;

  INSERT INTO referral_payouts (user_id, amount, account_holder_name, sort_code, account_number)
  VALUES (p_user_id, p_amount, p_account_holder_name, p_sort_code, p_account_number)
  RETURNING id INTO v_payout_id;

  INSERT INTO referral_balance_transactions (user_id, amount, type, payout_id, description, balance_after)
  VALUES (p_user_id, -p_amount, 'payout', v_payout_id, 'Payout request', v_balance - p_amount);

  RETURN jsonb_build_object('success', true, 'payout_id', v_payout_id, 'new_balance', v_balance - p_amount);
END;
$$;

-- ============================================
-- END OF REBUILD SCRIPTS
-- All tables have been created!
-- ============================================
