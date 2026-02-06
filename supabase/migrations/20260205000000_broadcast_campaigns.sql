-- Broadcast Campaigns: send WhatsApp template messages to contact lists
CREATE TABLE broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_language TEXT DEFAULT 'es',
  template_components JSONB,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  wa_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_broadcast_campaigns_tenant ON broadcast_campaigns(tenant_id);
CREATE INDEX idx_broadcast_recipients_campaign ON broadcast_recipients(campaign_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(campaign_id, status);

-- RLS
ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own campaigns"
  ON broadcast_campaigns FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.email()));

CREATE POLICY "Tenants can manage recipients of their campaigns"
  ON broadcast_recipients FOR ALL
  USING (campaign_id IN (
    SELECT id FROM broadcast_campaigns
    WHERE tenant_id IN (SELECT id FROM tenants WHERE email = auth.email())
  ));
