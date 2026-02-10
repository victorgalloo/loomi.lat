-- Tenant integrations for OAuth connections (Cal.com, Stripe Connect)
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('calcom', 'stripe_connect')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'pending', 'connected', 'error')),

  -- Cal.com OAuth tokens (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Cal.com OAuth app credentials (per-tenant)
  cal_client_id TEXT,
  cal_client_secret_encrypted TEXT,

  -- Cal.com config
  cal_event_type_id TEXT,
  cal_username TEXT,

  -- Stripe Connect credentials (per-tenant)
  stripe_secret_key_encrypted TEXT,

  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,

  -- Meta
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tenant_id, provider)
);

-- Index for quick lookups
CREATE INDEX idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX idx_tenant_integrations_provider ON tenant_integrations(tenant_id, provider);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_integrations_updated_at();

-- RLS
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own integrations"
  ON tenant_integrations FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can update own integrations"
  ON tenant_integrations FOR UPDATE
  USING (tenant_id = auth.uid());
