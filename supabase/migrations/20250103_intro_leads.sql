-- Intro Leads table for capturing intro wizard data before signup
-- This enables pre-populating the assessment wizard with user's intro answers

CREATE TABLE IF NOT EXISTS public.intro_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,

  -- Lead capture
  email TEXT,
  marketing_consent BOOLEAN DEFAULT false,

  -- Wizard answers
  intent TEXT, -- 'file-return', 'check-if-needed', 'understand-taxes', 'deadline-panic'
  income_source TEXT, -- 'self-employed', 'landlord', 'employed-side-income', 'director', 'investor', 'multiple'
  filing_experience TEXT, -- 'first-time', 'been-a-while', 'every-year', 'use-accountant'
  situation TEXT, -- 'documents-ready', 'need-to-gather', 'deadline-rush', 'just-exploring'

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  ip_country TEXT,
  user_agent TEXT,

  -- Conversion tracking
  converted_to_user BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  converted_at TIMESTAMPTZ,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add intro session fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS intro_session_id TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT, -- 'beginner', 'intermediate', 'expert'
ADD COLUMN IF NOT EXISTS primary_income_source TEXT;

-- Create index for session lookup
CREATE INDEX IF NOT EXISTS idx_intro_leads_session_id ON public.intro_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_intro_leads_email ON public.intro_leads(email);
CREATE INDEX IF NOT EXISTS idx_intro_leads_user_id ON public.intro_leads(user_id);

-- Enable RLS
ALTER TABLE public.intro_leads ENABLE ROW LEVEL SECURITY;

-- Policies for intro_leads
-- Anyone can insert (anonymous users filling out intro wizard)
CREATE POLICY "Anyone can create intro leads"
  ON public.intro_leads FOR INSERT
  WITH CHECK (true);

-- Users can read their own linked intro data
CREATE POLICY "Users can view their own intro lead"
  ON public.intro_leads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can update (for linking sessions to users)
CREATE POLICY "Service can update intro leads"
  ON public.intro_leads FOR UPDATE
  USING (true);

-- Function to link intro session to a user after signup/login
CREATE OR REPLACE FUNCTION public.link_intro_session(
  p_user_id UUID,
  p_session_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_lead intro_leads%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Find the intro lead by session_id
  SELECT * INTO v_lead
  FROM intro_leads
  WHERE session_id = p_session_id
  AND converted_to_user = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or already converted'
    );
  END IF;

  -- Update the intro_leads record
  UPDATE intro_leads
  SET
    user_id = p_user_id,
    converted_to_user = true,
    converted_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id;

  -- Update the user profile with intro data
  UPDATE users
  SET
    intro_session_id = p_session_id,
    experience_level = CASE v_lead.filing_experience
      WHEN 'first-time' THEN 'beginner'
      WHEN 'been-a-while' THEN 'beginner'
      WHEN 'every-year' THEN 'intermediate'
      WHEN 'use-accountant' THEN 'intermediate'
      ELSE 'beginner'
    END,
    primary_income_source = v_lead.income_source,
    updated_at = now()
  WHERE id = p_user_id;

  -- Return the intro data for client use
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'intent', v_lead.intent,
      'income_source', v_lead.income_source,
      'filing_experience', v_lead.filing_experience,
      'situation', v_lead.situation
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger
CREATE TRIGGER update_intro_leads_updated_at
  BEFORE UPDATE ON public.intro_leads
  FOR EACH row EXECUTE PROCEDURE public.update_updated_at_column();
