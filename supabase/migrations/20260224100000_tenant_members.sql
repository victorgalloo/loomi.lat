-- Multi-user per tenant: tenant_members table, helper function, RLS updates
-- Allows multiple users (emails) to access the same tenant/dashboard

-- ============================================
-- 1. TENANT MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES tenants(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_tenant_members_email ON tenant_members(email);
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);

-- ============================================
-- 2. BACKFILL: Insert existing tenant owners
-- ============================================
INSERT INTO tenant_members (tenant_id, email, role, invited_at, joined_at)
SELECT id, email, 'owner', created_at, created_at
FROM tenants
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================
-- 3. HELPER FUNCTION: get tenant IDs for an email
--    Returns UNION of tenants.email + tenant_members.email
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_ids_for_email(p_email TEXT)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
    SELECT id FROM tenants WHERE email = p_email
    UNION
    SELECT tenant_id FROM tenant_members WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_tenant_ids_for_email(TEXT) TO authenticated;

-- ============================================
-- 4. RLS ON tenant_members
-- ============================================
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "Service role full access tenant_members"
  ON tenant_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Owners/admins can manage members of their tenant
CREATE POLICY "Owners and admins manage tenant members"
  ON tenant_members FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      WHERE tm.email = auth.jwt()->>'email'
        AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      WHERE tm.email = auth.jwt()->>'email'
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Members can read their own membership
CREATE POLICY "Members read own membership"
  ON tenant_members FOR SELECT TO authenticated
  USING (email = auth.jwt()->>'email');

-- ============================================
-- 5. UPDATE RLS POLICIES: tenants table
-- ============================================

-- SELECT: users can read tenant if they are owner OR member
DROP POLICY IF EXISTS "Users read own tenant" ON tenants;
CREATE POLICY "Users read own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- UPDATE: users can update tenant if they are owner OR member
DROP POLICY IF EXISTS "Users update own tenant" ON tenants;
CREATE POLICY "Users update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING (id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')))
  WITH CHECK (id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 6. UPDATE RLS POLICIES: whatsapp_accounts
-- ============================================
DROP POLICY IF EXISTS "Users read own whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Users read own whatsapp_accounts" ON whatsapp_accounts
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

DROP POLICY IF EXISTS "Users manage own whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Users manage own whatsapp_accounts" ON whatsapp_accounts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')))
  WITH CHECK (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 7. UPDATE RLS POLICIES: agent_configs
-- ============================================
DROP POLICY IF EXISTS "Users read own agent_configs" ON agent_configs;
CREATE POLICY "Users read own agent_configs" ON agent_configs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

DROP POLICY IF EXISTS "Users manage own agent_configs" ON agent_configs;
CREATE POLICY "Users manage own agent_configs" ON agent_configs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')))
  WITH CHECK (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 8. UPDATE RLS POLICIES: pipeline_stages
-- ============================================
DROP POLICY IF EXISTS "Users read own pipeline_stages" ON pipeline_stages;
CREATE POLICY "Users read own pipeline_stages" ON pipeline_stages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 9. UPDATE RLS POLICIES: broadcast_campaigns
-- ============================================
DROP POLICY IF EXISTS "Tenants can manage their own campaigns" ON broadcast_campaigns;
CREATE POLICY "Tenants can manage their own campaigns" ON broadcast_campaigns
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')))
  WITH CHECK (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 10. UPDATE RLS POLICIES: broadcast_recipients
-- ============================================
DROP POLICY IF EXISTS "Tenants can manage recipients of their campaigns" ON broadcast_recipients;
CREATE POLICY "Tenants can manage recipients of their campaigns" ON broadcast_recipients
  FOR ALL TO authenticated
  USING (campaign_id IN (
    SELECT id FROM broadcast_campaigns
    WHERE tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email'))
  ))
  WITH CHECK (campaign_id IN (
    SELECT id FROM broadcast_campaigns
    WHERE tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email'))
  ));

-- ============================================
-- 11. UPDATE RLS POLICIES: handoffs
-- ============================================
DROP POLICY IF EXISTS "Tenants can view their own handoffs" ON handoffs;
CREATE POLICY "Tenants can view their own handoffs" ON handoffs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 12. UPDATE RLS POLICIES: twilio_provisioned_numbers
-- ============================================
DROP POLICY IF EXISTS "Tenants can view their own numbers" ON twilio_provisioned_numbers;
CREATE POLICY "Tenants can view their own numbers" ON twilio_provisioned_numbers
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

-- ============================================
-- 13. UPDATE RLS POLICIES: tenant_integrations
--     (was using auth.uid() which is wrong, fix to use helper)
-- ============================================
DROP POLICY IF EXISTS "Tenants can view own integrations" ON tenant_integrations;
CREATE POLICY "Tenants can view own integrations" ON tenant_integrations
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));

DROP POLICY IF EXISTS "Tenants can update own integrations" ON tenant_integrations;
CREATE POLICY "Tenants can update own integrations" ON tenant_integrations
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')))
  WITH CHECK (tenant_id IN (SELECT get_tenant_ids_for_email(auth.jwt()->>'email')));
