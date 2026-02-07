-- Migration: Twilio provisioned phone numbers for tenants
-- Allows tenants to purchase numbers via Twilio, then register them with WhatsApp Business

CREATE TABLE IF NOT EXISTS twilio_provisioned_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  twilio_sid TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  friendly_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'MX',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_whatsapp', 'whatsapp_connected', 'released', 'error')),
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  monthly_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_twilio_numbers_tenant_id ON twilio_provisioned_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twilio_numbers_phone ON twilio_provisioned_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_twilio_numbers_status ON twilio_provisioned_numbers(status);

-- RLS
ALTER TABLE twilio_provisioned_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own numbers"
  ON twilio_provisioned_numbers FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_email = auth.jwt() ->> 'email'
  ));

-- Updated_at trigger
CREATE TRIGGER set_updated_at_twilio_numbers
  BEFORE UPDATE ON twilio_provisioned_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
