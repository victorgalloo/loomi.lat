-- Accounts table for Stripe subscriptions
-- Links leads to payment/subscription status

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'none' CHECK (plan IN ('none', 'starter', 'growth', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'canceled')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id ON accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Link leads to accounts
ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON accounts;
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

-- RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to accounts"
  ON accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Pricing tiers table (for knowledge base)
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_volume INTEGER NOT NULL DEFAULT 0,
  max_volume INTEGER,
  price_usd DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing tiers
INSERT INTO pricing_tiers (name, min_volume, max_volume, price_usd, features, recommended) VALUES
  ('Starter', 0, 100, 199.00, '["Respuestas 24/7", "Calificación de leads", "Agenda automática", "Dashboard básico"]', false),
  ('Growth', 101, 300, 349.00, '["Todo de Starter", "Integraciones CRM", "Reportes avanzados", "Soporte prioritario"]', true),
  ('Business', 301, 1000, 599.00, '["Todo de Growth", "Multi-agente", "API personalizada", "Account manager"]', false),
  ('Enterprise', 1001, NULL, 0.00, '["Todo de Business", "SLA garantizado", "Desarrollo custom", "Soporte 24/7"]', false)
ON CONFLICT DO NOTHING;

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case studies table
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  industry TEXT NOT NULL,
  challenge TEXT,
  solution TEXT,
  results TEXT,
  company_name TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to pricing_tiers"
  ON pricing_tiers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to knowledge_base"
  ON knowledge_base FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to case_studies"
  ON case_studies FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public read access to pricing
CREATE POLICY "Public read access to pricing_tiers"
  ON pricing_tiers FOR SELECT TO anon
  USING (true);
