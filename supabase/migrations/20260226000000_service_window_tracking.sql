-- Service Window Tracking
-- Track 24h (standard) and 72h (CTWA) windows for free messaging

-- Leads: service window fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS service_window_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_window_type TEXT CHECK (service_window_type IN ('standard', 'ctwa'));

CREATE INDEX IF NOT EXISTS idx_leads_service_window
  ON leads(tenant_id, service_window_start DESC)
  WHERE service_window_start IS NOT NULL;

-- Messages: tag outgoing messages with window status
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS in_service_window BOOLEAN;
