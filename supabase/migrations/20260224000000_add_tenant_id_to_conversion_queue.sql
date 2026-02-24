-- Add tenant_id to conversion_events_queue for dashboard visibility
-- Previously events had no tenant association, only lead_id

ALTER TABLE conversion_events_queue
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Index for efficient tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_conversion_events_queue_tenant_id
  ON conversion_events_queue(tenant_id);

-- Backfill tenant_id from lead_id -> leads.tenant_id
UPDATE conversion_events_queue ceq
SET tenant_id = l.tenant_id
FROM leads l
WHERE ceq.lead_id = l.id
  AND ceq.tenant_id IS NULL
  AND l.tenant_id IS NOT NULL;
