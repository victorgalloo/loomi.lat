-- Add CRM fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;

-- Create pipeline_stages table for custom stages per tenant
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Index for pipeline stages
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant ON pipeline_stages(tenant_id);

-- RLS for pipeline_stages
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access pipeline_stages" ON pipeline_stages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users read own pipeline_stages" ON pipeline_stages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'));

-- Insert default pipeline stages for existing tenants
INSERT INTO pipeline_stages (tenant_id, name, color, position, is_won, is_lost)
SELECT
  t.id,
  stage.name,
  stage.color,
  stage.position,
  stage.is_won,
  stage.is_lost
FROM tenants t
CROSS JOIN (
  VALUES
    ('Nuevo', 'cyan', 0, false, false),
    ('Contactado', 'amber', 1, false, false),
    ('Calificado', 'purple', 2, false, false),
    ('Propuesta', 'blue', 3, false, false),
    ('Negociacion', 'orange', 4, false, false),
    ('Ganado', 'emerald', 5, true, false),
    ('Perdido', 'red', 6, false, true)
) AS stage(name, color, position, is_won, is_lost)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Update leads stage column to reference stage name
COMMENT ON COLUMN leads.stage IS 'Pipeline stage name - references pipeline_stages.name for the tenant';
COMMENT ON COLUMN leads.deal_value IS 'Potential deal value in currency';
COMMENT ON COLUMN leads.priority IS 'Lead priority: low, medium, high';
