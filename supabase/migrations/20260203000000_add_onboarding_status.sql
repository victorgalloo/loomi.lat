-- Add onboarding status tracking to tenants table
-- This tracks the self-service onboarding progress for each tenant

-- Add onboarding_status column
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_status JSONB DEFAULT '{
  "currentStep": "industry",
  "completedSteps": [],
  "startedAt": null,
  "completedAt": null,
  "selectedIndustry": null,
  "businessInfo": null,
  "customizations": null,
  "testResults": null
}'::jsonb;

-- Add industry column for quick filtering
ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add index for querying tenants by onboarding status
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_current_step
  ON tenants ((onboarding_status->>'currentStep'));

CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_completed
  ON tenants ((onboarding_status->>'completedAt'))
  WHERE (onboarding_status->>'completedAt') IS NOT NULL;

-- Function to check if tenant has completed onboarding
CREATE OR REPLACE FUNCTION is_onboarding_complete(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (onboarding_status->>'completedAt') IS NOT NULL
    FROM tenants
    WHERE id = p_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenants stuck in onboarding (for admin follow-up)
CREATE OR REPLACE FUNCTION get_incomplete_onboardings(p_hours_since_start INT DEFAULT 24)
RETURNS TABLE (
  tenant_id UUID,
  email TEXT,
  current_step TEXT,
  started_at TIMESTAMPTZ,
  hours_since_start NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.email,
    t.onboarding_status->>'currentStep',
    (t.onboarding_status->>'startedAt')::TIMESTAMPTZ,
    EXTRACT(EPOCH FROM (NOW() - (t.onboarding_status->>'startedAt')::TIMESTAMPTZ)) / 3600
  FROM tenants t
  WHERE t.onboarding_status->>'completedAt' IS NULL
    AND t.onboarding_status->>'startedAt' IS NOT NULL
    AND (t.onboarding_status->>'startedAt')::TIMESTAMPTZ < NOW() - (p_hours_since_start || ' hours')::INTERVAL
  ORDER BY (t.onboarding_status->>'startedAt')::TIMESTAMPTZ ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_onboarding_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_incomplete_onboardings(INT) TO service_role;

-- Comment
COMMENT ON COLUMN tenants.onboarding_status IS 'JSON tracking self-service onboarding progress: currentStep, completedSteps, businessInfo, etc.';
COMMENT ON COLUMN agent_configs.industry IS 'Industry template selected during onboarding';
