-- Fix: infinite recursion in practice_members RLS
-- The practice_members SELECT policy referenced itself via
-- EXISTS (SELECT FROM practice_members), causing Postgres to recurse
-- infinitely whenever any policy checked practice membership.
-- Fix: use SECURITY DEFINER functions to bypass RLS when checking membership.

-- =============================================================================
-- Helper functions (SECURITY DEFINER — bypass RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_practice_member(p_practice_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.practice_members
    WHERE practice_id = p_practice_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_practice_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT practice_id FROM public.practice_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_practice_owner(p_practice_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.practices
    WHERE id = p_practice_id AND owner_id = auth.uid()
  );
$$;

-- =============================================================================
-- Drop all practice-related policies that caused recursion
-- =============================================================================

DROP POLICY IF EXISTS "Members can view own practice" ON public.practices;
DROP POLICY IF EXISTS "Members can view practice members" ON public.practice_members;
DROP POLICY IF EXISTS "Owner can insert practice members" ON public.practice_members;
DROP POLICY IF EXISTS "Owner can update practice members" ON public.practice_members;
DROP POLICY IF EXISTS "Owner can delete practice members" ON public.practice_members;
DROP POLICY IF EXISTS "Practice members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Owner/manager can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Practice members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Owner/manager can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Practice members can view client quarters" ON public.client_quarters;
DROP POLICY IF EXISTS "Practice members can insert client quarters" ON public.client_quarters;
DROP POLICY IF EXISTS "Practice members can update client quarters" ON public.client_quarters;
DROP POLICY IF EXISTS "Practice members can view client sa100" ON public.client_sa100;
DROP POLICY IF EXISTS "Practice members can insert client sa100" ON public.client_sa100;
DROP POLICY IF EXISTS "Practice members can update client sa100" ON public.client_sa100;
DROP POLICY IF EXISTS "Practice members can view client emails" ON public.client_emails;
DROP POLICY IF EXISTS "Practice members can insert client emails" ON public.client_emails;
DROP POLICY IF EXISTS "Practice members can view hmrc tokens" ON public.practice_hmrc_tokens;
DROP POLICY IF EXISTS "Owner can manage hmrc tokens" ON public.practice_hmrc_tokens;
DROP POLICY IF EXISTS "Owner can update hmrc tokens" ON public.practice_hmrc_tokens;
DROP POLICY IF EXISTS "Practice members can view audit log" ON public.practice_audit_log;
DROP POLICY IF EXISTS "Practice members can insert audit log" ON public.practice_audit_log;
DROP POLICY IF EXISTS "Users can view own or practice transactions" ON public.transactions;
DROP POLICY IF EXISTS "Practice members can insert client transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own or practice adjustments" ON public.manual_adjustments;
DROP POLICY IF EXISTS "Users can view own or practice submissions" ON public.mtd_submissions;
DROP POLICY IF EXISTS "Practice members can insert client submissions" ON public.mtd_submissions;

-- =============================================================================
-- Recreate all policies using SECURITY DEFINER functions (no recursion)
-- =============================================================================

-- practices
CREATE POLICY "Members can view own practice" ON public.practices FOR SELECT
  USING (public.is_practice_member(id));

-- practice_members
CREATE POLICY "Members can view practice members" ON public.practice_members FOR SELECT
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Owner can insert practice members" ON public.practice_members FOR INSERT
  WITH CHECK (public.is_practice_owner(practice_id) OR auth.uid() = user_id);

CREATE POLICY "Owner can update practice members" ON public.practice_members FOR UPDATE
  USING (public.is_practice_owner(practice_id));

CREATE POLICY "Owner can delete practice members" ON public.practice_members FOR DELETE
  USING (public.is_practice_owner(practice_id));

-- clients
CREATE POLICY "Practice members can view clients" ON public.clients FOR SELECT
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Owner/manager can insert clients" ON public.clients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'manager')
  ));

CREATE POLICY "Practice members can update clients" ON public.clients FOR UPDATE
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Owner/manager can delete clients" ON public.clients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'manager')
  ));

-- client_quarters
CREATE POLICY "Practice members can view client quarters" ON public.client_quarters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_quarters.client_id
    AND public.is_practice_member(c.practice_id)
  ));

CREATE POLICY "Practice members can insert client quarters" ON public.client_quarters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_quarters.client_id
    AND public.is_practice_member(c.practice_id)
  ));

CREATE POLICY "Practice members can update client quarters" ON public.client_quarters FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_quarters.client_id
    AND public.is_practice_member(c.practice_id)
  ));

-- client_sa100
CREATE POLICY "Practice members can view client sa100" ON public.client_sa100 FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_sa100.client_id
    AND public.is_practice_member(c.practice_id)
  ));

CREATE POLICY "Practice members can insert client sa100" ON public.client_sa100 FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_sa100.client_id
    AND public.is_practice_member(c.practice_id)
  ));

CREATE POLICY "Practice members can update client sa100" ON public.client_sa100 FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_sa100.client_id
    AND public.is_practice_member(c.practice_id)
  ));

-- client_emails
CREATE POLICY "Practice members can view client emails" ON public.client_emails FOR SELECT
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Practice members can insert client emails" ON public.client_emails FOR INSERT
  WITH CHECK (public.is_practice_member(practice_id));

-- practice_hmrc_tokens
CREATE POLICY "Practice members can view hmrc tokens" ON public.practice_hmrc_tokens FOR SELECT
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Owner can manage hmrc tokens" ON public.practice_hmrc_tokens FOR INSERT
  WITH CHECK (public.is_practice_owner(practice_id));

CREATE POLICY "Owner can update hmrc tokens" ON public.practice_hmrc_tokens FOR UPDATE
  USING (public.is_practice_owner(practice_id));

-- practice_audit_log
CREATE POLICY "Practice members can view audit log" ON public.practice_audit_log FOR SELECT
  USING (public.is_practice_member(practice_id));

CREATE POLICY "Practice members can insert audit log" ON public.practice_audit_log FOR INSERT
  WITH CHECK (public.is_practice_member(practice_id));

-- transactions: individual access + practice access
CREATE POLICY "Users can view own or practice transactions" ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (practice_id IS NOT NULL AND public.is_practice_member(practice_id))
  );

CREATE POLICY "Practice members can insert client transactions" ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (practice_id IS NOT NULL AND public.is_practice_member(practice_id))
  );

-- manual_adjustments
CREATE POLICY "Users can view own or practice adjustments" ON public.manual_adjustments FOR SELECT
  USING (
    auth.uid() = user_id
    OR (practice_id IS NOT NULL AND public.is_practice_member(practice_id))
  );

-- mtd_submissions
CREATE POLICY "Users can view own or practice submissions" ON public.mtd_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (practice_id IS NOT NULL AND public.is_practice_member(practice_id))
  );

CREATE POLICY "Practice members can insert client submissions" ON public.mtd_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (practice_id IS NOT NULL AND public.is_practice_member(practice_id))
  );
