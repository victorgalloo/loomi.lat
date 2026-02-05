-- Growth Rockstar Pilot: bot pause, handoffs tracking, model config
-- Migration: 20260206000000_growth_rockstar_pilot.sql

-- 1. Add model column to agent_configs
ALTER TABLE agent_configs
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gpt-4o';

-- 2. Add bot_paused columns to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS bot_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_by TEXT;

-- 3. Create handoffs table
CREATE TABLE IF NOT EXISTS handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  conversation_id UUID REFERENCES conversations(id),
  lead_id UUID REFERENCES leads(id),
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_handoffs_tenant_id ON handoffs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON handoffs(status);
CREATE INDEX IF NOT EXISTS idx_handoffs_created_at ON handoffs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_paused ON conversations(bot_paused) WHERE bot_paused = true;

-- 5. RLS policies for handoffs
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own handoffs"
  ON handoffs FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE email = auth.email()
  ));

CREATE POLICY "Service role can manage handoffs"
  ON handoffs FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Enable realtime on handoffs
ALTER PUBLICATION supabase_realtime ADD TABLE handoffs;
