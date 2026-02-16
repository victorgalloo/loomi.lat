-- Create follow_ups table for scheduling and tracking follow-up messages
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  attempt INT DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron job: find pending follow-ups due for sending
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending_scheduled
  ON follow_ups(scheduled_for) WHERE status = 'pending';

-- Index for rate limiting: recent follow-ups per lead
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_status
  ON follow_ups(lead_id, status, sent_at DESC);

-- Index for cancellation: find pending follow-ups by lead + type
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_type_pending
  ON follow_ups(lead_id, type) WHERE status = 'pending';
