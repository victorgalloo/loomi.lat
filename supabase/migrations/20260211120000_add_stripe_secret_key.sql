-- Add per-tenant Stripe secret key column
ALTER TABLE tenant_integrations
  ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT;
