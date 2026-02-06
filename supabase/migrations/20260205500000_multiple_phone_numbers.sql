-- Migration: Support multiple WhatsApp phone numbers per tenant
-- Previously: UNIQUE(tenant_id, waba_id) limited one number per WABA per tenant
-- Now: UNIQUE(tenant_id, phone_number_id) allows multiple numbers under same WABA

-- Drop the old constraint that limits one number per WABA per tenant
ALTER TABLE whatsapp_accounts DROP CONSTRAINT IF EXISTS whatsapp_accounts_tenant_id_waba_id_key;

-- Add new constraint: a phone number can only belong to one tenant
-- (the global UNIQUE(phone_number_id) already exists and is kept)
ALTER TABLE whatsapp_accounts ADD CONSTRAINT whatsapp_accounts_tenant_id_phone_number_id_key UNIQUE (tenant_id, phone_number_id);
