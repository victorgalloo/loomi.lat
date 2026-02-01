-- Meta Conversions API Queue
-- Stores failed conversion events for retry by cron job

CREATE TABLE IF NOT EXISTS conversion_events_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  email TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_conversion_events_queue_status
  ON conversion_events_queue(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_conversion_events_queue_created_at
  ON conversion_events_queue(created_at);

-- Add RLS policies
ALTER TABLE conversion_events_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access on conversion_events_queue"
  ON conversion_events_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE conversion_events_queue IS 'Queue for Meta Conversions API events that failed to send and need retry';
COMMENT ON COLUMN conversion_events_queue.event_name IS 'Meta event type: Lead, CompleteRegistration, or Purchase';
COMMENT ON COLUMN conversion_events_queue.status IS 'Event status: pending, sent, or failed';
COMMENT ON COLUMN conversion_events_queue.attempts IS 'Number of send attempts made';
COMMENT ON COLUMN conversion_events_queue.payload IS 'Full event payload for retry';
