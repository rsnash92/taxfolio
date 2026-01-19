-- HMRC API Logs Table
-- Stores all HMRC API requests and responses for debugging and audit

CREATE TABLE IF NOT EXISTS hmrc_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  endpoint TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER NOT NULL,
  response_body JSONB,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER NOT NULL,
  correlation_id TEXT,
  gov_test_scenario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_hmrc_api_logs_user_id ON hmrc_api_logs(user_id);
CREATE INDEX idx_hmrc_api_logs_timestamp ON hmrc_api_logs(timestamp DESC);
CREATE INDEX idx_hmrc_api_logs_error_code ON hmrc_api_logs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX idx_hmrc_api_logs_response_status ON hmrc_api_logs(response_status);

-- RLS Policies
ALTER TABLE hmrc_api_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view own logs"
  ON hmrc_api_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON hmrc_api_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs"
  ON hmrc_api_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE hmrc_api_logs IS 'Logs all HMRC API requests and responses for debugging';
