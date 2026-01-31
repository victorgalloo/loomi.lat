-- Add is_test flag to leads table for test data separation
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Index for filtering test leads
CREATE INDEX IF NOT EXISTS idx_leads_is_test ON leads(is_test) WHERE is_test = true;

-- Helper function to reset test data
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void AS $$
BEGIN
  -- Delete messages from test conversations
  DELETE FROM messages
  WHERE conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN leads l ON c.lead_id = l.id
    WHERE l.is_test = true
  );

  -- Delete conversations from test leads
  DELETE FROM conversations
  WHERE lead_id IN (SELECT id FROM leads WHERE is_test = true);

  -- Delete test leads
  DELETE FROM leads WHERE is_test = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_test_data() IS 'Deletes all test leads and their associated data. Call with: SELECT reset_test_data();';
