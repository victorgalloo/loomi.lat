-- Add qualification fields to leads table
-- These fields capture data from WhatsApp Flows qualification process

ALTER TABLE leads ADD COLUMN IF NOT EXISTS challenge TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS message_volume TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT FALSE;

-- Add index for qualified leads
CREATE INDEX IF NOT EXISTS idx_leads_is_qualified ON leads(is_qualified) WHERE is_qualified = TRUE;

-- Comment on columns
COMMENT ON COLUMN leads.challenge IS 'Main challenge: manual_responses, lost_sales, scale_without_hiring, other';
COMMENT ON COLUMN leads.message_volume IS 'Daily message volume: less_50, 50_200, 200_500, more_500';
COMMENT ON COLUMN leads.is_qualified IS 'Whether lead has completed qualification flow';
