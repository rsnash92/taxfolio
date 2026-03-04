-- Approval workflow: add 4-eyes principle toggle to practices
ALTER TABLE public.practices
  ADD COLUMN IF NOT EXISTS require_different_reviewer boolean DEFAULT false;
