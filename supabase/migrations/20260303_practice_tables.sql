-- Migration: TaxFolio for Accountants - Practice Management Tables
-- Adds multi-tenancy layer for accountant practices managing MTD + SA100 clients.

-- =============================================================================
-- Part 1: Core Practice Tables
-- =============================================================================

-- practices: accountancy firm
CREATE TABLE public.practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  branding jsonb DEFAULT '{}',
  hmrc_arn text,
  subscription_tier text DEFAULT 'starter',
  subscription_status text DEFAULT 'none',
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  max_clients int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- practice_members: team members within a practice
CREATE TABLE public.practice_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'preparer')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(practice_id, user_id)
);

-- clients: accountant's clients (taxpayers)
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  nino_encrypted text,
  nino_last4 text,
  name text NOT NULL,
  email text,
  phone text,
  reference text,
  agent_type text DEFAULT 'main' CHECK (agent_type IN ('main', 'supporting')),
  auth_status text DEFAULT 'pending' CHECK (auth_status IN ('pending', 'authorised', 'revoked')),
  businesses jsonb DEFAULT '[]',
  notes text,
  assigned_to uuid REFERENCES auth.users(id),
  data_source text DEFAULT 'none' CHECK (data_source IN ('none', 'bank', 'csv', 'manual')),
  last_activity timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Part 2: Pipeline Tables
-- =============================================================================

-- client_quarters: MTD quarterly pipeline tracking
CREATE TABLE public.client_quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tax_year text NOT NULL,
  quarter int NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  business_id text,
  stage text NOT NULL DEFAULT 'not_started',
  period_start date,
  period_end date,
  due_date date,
  prepared_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  hmrc_correlation_id text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, tax_year, quarter, business_id)
);

-- client_sa100: SA100 annual return pipeline tracking
CREATE TABLE public.client_sa100 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tax_year text NOT NULL,
  stage text NOT NULL DEFAULT 'not_started',
  declaration_id uuid,
  prepared_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  hmrc_ref text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, tax_year)
);

-- =============================================================================
-- Part 3: Communication & Auth Tables
-- =============================================================================

-- client_emails: email history per client
CREATE TABLE public.client_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  template_type text,
  subject text NOT NULL,
  body_html text NOT NULL,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- practice_hmrc_tokens: agent OAuth tokens (one per practice)
CREATE TABLE public.practice_hmrc_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Part 4: Audit Log
-- =============================================================================

CREATE TABLE public.practice_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Part 5: Add practice columns to existing tables (denormalized for RLS)
-- =============================================================================

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES public.practices(id);

ALTER TABLE public.manual_adjustments ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.manual_adjustments ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES public.practices(id);

ALTER TABLE public.mtd_submissions ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.mtd_submissions ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES public.practices(id);

-- =============================================================================
-- Part 6: updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.practice_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.practices
  FOR EACH ROW EXECUTE FUNCTION public.practice_update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.practice_update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.client_quarters
  FOR EACH ROW EXECUTE FUNCTION public.practice_update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.client_sa100
  FOR EACH ROW EXECUTE FUNCTION public.practice_update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.practice_hmrc_tokens
  FOR EACH ROW EXECUTE FUNCTION public.practice_update_updated_at();

-- =============================================================================
-- Part 7: Indexes
-- =============================================================================

CREATE INDEX idx_practice_members_user ON public.practice_members(user_id);
CREATE INDEX idx_practice_members_practice ON public.practice_members(practice_id);
CREATE INDEX idx_clients_practice ON public.clients(practice_id);
CREATE INDEX idx_clients_assigned ON public.clients(assigned_to);
CREATE INDEX idx_clients_reference ON public.clients(practice_id, reference);
CREATE INDEX idx_client_quarters_client ON public.client_quarters(client_id);
CREATE INDEX idx_client_quarters_stage ON public.client_quarters(stage);
CREATE INDEX idx_client_quarters_tax_year ON public.client_quarters(client_id, tax_year, quarter);
CREATE INDEX idx_client_sa100_client ON public.client_sa100(client_id);
CREATE INDEX idx_client_sa100_stage ON public.client_sa100(stage);
CREATE INDEX idx_client_emails_client ON public.client_emails(client_id);
CREATE INDEX idx_transactions_client ON public.transactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_transactions_practice ON public.transactions(practice_id) WHERE practice_id IS NOT NULL;
CREATE INDEX idx_manual_adjustments_client ON public.manual_adjustments(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_mtd_submissions_client ON public.mtd_submissions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_audit_log_practice ON public.practice_audit_log(practice_id);
CREATE INDEX idx_audit_log_client ON public.practice_audit_log(client_id);
CREATE INDEX idx_audit_log_created ON public.practice_audit_log(created_at);

-- =============================================================================
-- Part 8: Row Level Security
-- =============================================================================

-- practices
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own practice"
  ON public.practices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members
    WHERE practice_id = practices.id AND user_id = auth.uid()
  ));

CREATE POLICY "Owner can update practice"
  ON public.practices FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Any user can create a practice"
  ON public.practices FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- practice_members
ALTER TABLE public.practice_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view practice members"
  ON public.practice_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_members.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert practice members"
  ON public.practice_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practices p
    WHERE p.id = practice_members.practice_id AND p.owner_id = auth.uid()
  ) OR auth.uid() = user_id);

CREATE POLICY "Owner can update practice members"
  ON public.practice_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.practices p
    WHERE p.id = practice_members.practice_id AND p.owner_id = auth.uid()
  ));

CREATE POLICY "Owner can delete practice members"
  ON public.practice_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.practices p
    WHERE p.id = practice_members.practice_id AND p.owner_id = auth.uid()
  ));

-- clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view clients"
  ON public.clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Owner/manager can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'manager')
  ));

CREATE POLICY "Practice members can update clients"
  ON public.clients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Owner/manager can delete clients"
  ON public.clients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = clients.practice_id AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'manager')
  ));

-- client_quarters
ALTER TABLE public.client_quarters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view client quarters"
  ON public.client_quarters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_quarters.client_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can insert client quarters"
  ON public.client_quarters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_quarters.client_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can update client quarters"
  ON public.client_quarters FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_quarters.client_id AND pm.user_id = auth.uid()
  ));

-- client_sa100
ALTER TABLE public.client_sa100 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view client sa100"
  ON public.client_sa100 FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_sa100.client_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can insert client sa100"
  ON public.client_sa100 FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_sa100.client_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can update client sa100"
  ON public.client_sa100 FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.practice_members pm ON pm.practice_id = c.practice_id
    WHERE c.id = client_sa100.client_id AND pm.user_id = auth.uid()
  ));

-- client_emails
ALTER TABLE public.client_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view client emails"
  ON public.client_emails FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = client_emails.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can insert client emails"
  ON public.client_emails FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = client_emails.practice_id AND pm.user_id = auth.uid()
  ));

-- practice_hmrc_tokens
ALTER TABLE public.practice_hmrc_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view hmrc tokens"
  ON public.practice_hmrc_tokens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_hmrc_tokens.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Owner can manage hmrc tokens"
  ON public.practice_hmrc_tokens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_hmrc_tokens.practice_id AND pm.user_id = auth.uid()
    AND pm.role = 'owner'
  ));

CREATE POLICY "Owner can update hmrc tokens"
  ON public.practice_hmrc_tokens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_hmrc_tokens.practice_id AND pm.user_id = auth.uid()
    AND pm.role = 'owner'
  ));

-- practice_audit_log
ALTER TABLE public.practice_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view audit log"
  ON public.practice_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_audit_log.practice_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Practice members can insert audit log"
  ON public.practice_audit_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.practice_members pm
    WHERE pm.practice_id = practice_audit_log.practice_id AND pm.user_id = auth.uid()
  ));

-- =============================================================================
-- Part 9: Update existing table RLS for practice access
-- =============================================================================

-- transactions: add practice access (uses denormalized practice_id for performance)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view own or practice transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      practice_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.practice_members pm
        WHERE pm.practice_id = transactions.practice_id AND pm.user_id = auth.uid()
      )
    )
  );

-- transactions: allow practice members to insert for clients
CREATE POLICY "Practice members can insert client transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (
      practice_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.practice_members pm
        WHERE pm.practice_id = transactions.practice_id AND pm.user_id = auth.uid()
      )
    )
  );

-- manual_adjustments: add practice access
DROP POLICY IF EXISTS "Users can view own adjustments" ON public.manual_adjustments;
CREATE POLICY "Users can view own or practice adjustments"
  ON public.manual_adjustments FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      practice_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.practice_members pm
        WHERE pm.practice_id = manual_adjustments.practice_id AND pm.user_id = auth.uid()
      )
    )
  );

-- mtd_submissions: add practice access
DROP POLICY IF EXISTS "Users can view own submissions" ON public.mtd_submissions;
CREATE POLICY "Users can view own or practice submissions"
  ON public.mtd_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      practice_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.practice_members pm
        WHERE pm.practice_id = mtd_submissions.practice_id AND pm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Practice members can insert client submissions"
  ON public.mtd_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (
      practice_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.practice_members pm
        WHERE pm.practice_id = mtd_submissions.practice_id AND pm.user_id = auth.uid()
      )
    )
  );
