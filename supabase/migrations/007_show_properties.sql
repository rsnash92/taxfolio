-- Add show_properties column to users table
-- This allows sole traders to optionally enable property tracking
-- Default is NULL, which means the UI will infer based on user_type

ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_properties boolean DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.show_properties IS 'Whether to show Properties tab in navigation. NULL = infer from user_type (landlord/both = true, sole_trader = false)';
