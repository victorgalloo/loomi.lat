-- Multi-tenant Schema Migration
-- Adds tenants, whatsapp_accounts, and agent_configs tables
-- Modifies existing tables to support multi-tenancy

-- 1. Tabla de Tenants (clientes de Loomi)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'pro', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'past_due', 'canceled')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de WhatsApp Accounts (WABAs conectadas)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL UNIQUE,
  display_phone_number TEXT,
  business_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  webhook_verify_token TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(tenant_id, waba_id)
);

-- 3. Tabla de Configuración del Agente AI
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT,
  business_description TEXT,
  products_services TEXT,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual', 'formal')),
  custom_instructions TEXT,
  business_hours JSONB DEFAULT '{}',
  auto_reply_enabled BOOLEAN DEFAULT true,
  greeting_message TEXT,
  fallback_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- 4. Agregar tenant_id a tablas existentes (nullable initially for migration)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_phone_number_id ON whatsapp_accounts(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_tenant_id ON whatsapp_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant_id ON agent_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);

-- 6. Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Service role has full access
DROP POLICY IF EXISTS "Service role full access tenants" ON tenants;
CREATE POLICY "Service role full access tenants" ON tenants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Service role full access whatsapp_accounts" ON whatsapp_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access agent_configs" ON agent_configs;
CREATE POLICY "Service role full access agent_configs" ON agent_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. RLS Policies - Users can only see their own tenant data
DROP POLICY IF EXISTS "Users read own tenant" ON tenants;
CREATE POLICY "Users read own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Users update own tenant" ON tenants;
CREATE POLICY "Users update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Users read own whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Users read own whatsapp_accounts" ON whatsapp_accounts
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Users manage own whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Users manage own whatsapp_accounts" ON whatsapp_accounts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Users read own agent_configs" ON agent_configs;
CREATE POLICY "Users read own agent_configs" ON agent_configs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Users manage own agent_configs" ON agent_configs;
CREATE POLICY "Users manage own agent_configs" ON agent_configs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE email = auth.jwt()->>'email'));

-- 9. Function to get tenant by phone_number_id (for webhook routing)
CREATE OR REPLACE FUNCTION get_tenant_by_phone_number_id(p_phone_number_id TEXT)
RETURNS TABLE (
  tenant_id UUID,
  access_token_encrypted TEXT,
  waba_id TEXT,
  phone_number_id TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wa.tenant_id,
    wa.access_token_encrypted,
    wa.waba_id,
    wa.phone_number_id,
    wa.status
  FROM whatsapp_accounts wa
  WHERE wa.phone_number_id = p_phone_number_id
    AND wa.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to get or create tenant by email
CREATE OR REPLACE FUNCTION get_or_create_tenant(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to find existing tenant
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE email = p_email;

  -- If not found, create one
  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (email, name, company_name)
    VALUES (p_email, COALESCE(p_name, p_email), p_company_name)
    RETURNING id INTO v_tenant_id;
  END IF;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_configs_updated_at ON agent_configs;
CREATE TRIGGER update_agent_configs_updated_at
  BEFORE UPDATE ON agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_tenant_by_phone_number_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_tenant(TEXT, TEXT, TEXT) TO authenticated;

-- Comment on tables for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant customers who use the Loomi platform';
COMMENT ON TABLE whatsapp_accounts IS 'WhatsApp Business Accounts connected via Embedded Signup';
COMMENT ON TABLE agent_configs IS 'AI agent configuration per tenant';
COMMENT ON COLUMN whatsapp_accounts.access_token_encrypted IS 'AES-256-GCM encrypted access token';
