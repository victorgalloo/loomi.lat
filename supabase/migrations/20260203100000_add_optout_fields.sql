-- Add opt-out tracking fields to leads table
-- This allows us to respect user preferences and stop follow-ups when requested

-- Add opted_out field to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS opted_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opted_out_reason TEXT;

-- Create index for quick lookup of non-opted-out leads
CREATE INDEX IF NOT EXISTS idx_leads_opted_out ON leads(opted_out) WHERE opted_out = false;

-- Add opted_out status to follow_ups table if it doesn't exist
-- This handles the new 'opted_out' status value
DO $$
BEGIN
  -- Check if the constraint exists and modify it
  ALTER TABLE follow_ups
  DROP CONSTRAINT IF EXISTS follow_ups_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Constraint doesn't exist, that's fine
END $$;

-- Add check constraint for valid status values (including opted_out)
ALTER TABLE follow_ups
ADD CONSTRAINT follow_ups_status_check
CHECK (status IN ('pending', 'sent', 'cancelled', 'failed', 'opted_out'));

-- Comment on columns for documentation
COMMENT ON COLUMN leads.opted_out IS 'Whether the lead has opted out of follow-up messages';
COMMENT ON COLUMN leads.opted_out_at IS 'Timestamp when the lead opted out';
COMMENT ON COLUMN leads.opted_out_reason IS 'Reason or detected signal that triggered opt-out';
