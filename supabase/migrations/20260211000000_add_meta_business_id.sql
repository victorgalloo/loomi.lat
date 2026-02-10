-- Add meta_business_id to tenants for tech provider API calls
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_business_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tenants_meta_business_id ON tenants(meta_business_id);

-- Add solution tracking to whatsapp_accounts
ALTER TABLE whatsapp_accounts ADD COLUMN IF NOT EXISTS solution_id TEXT;
ALTER TABLE whatsapp_accounts ADD COLUMN IF NOT EXISTS account_review_status TEXT;
