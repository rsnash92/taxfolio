-- Dashboard onboarding flow columns (separate from SA intro wizard's onboarding_completed/user_type)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS dashboard_onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dashboard_onboarding_data jsonb DEFAULT '{
    "currentStep": 1,
    "aboutYou": null,
    "hmrcConnected": false,
    "hmrcSkipped": false,
    "bankConnected": false,
    "bankSkipped": false
  }'::jsonb;
