-- Fix leads unique constraint for multi-tenancy
-- Same phone number can be a lead for different tenants
-- Change from UNIQUE(phone) to UNIQUE(phone, tenant_id)

-- Drop the old unique constraint on phone only
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_key;

-- Add new composite unique constraint
ALTER TABLE leads ADD CONSTRAINT leads_phone_tenant_key UNIQUE (phone, tenant_id);

-- Create index for tenant-scoped phone lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone_tenant ON leads(phone, tenant_id);
