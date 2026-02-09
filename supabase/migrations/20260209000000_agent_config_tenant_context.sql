-- Add configurable tenant context fields to agent_configs
-- These allow each tenant to have their own product/sales context
-- instead of using hardcoded Loomi defaults

ALTER TABLE agent_configs
  ADD COLUMN IF NOT EXISTS product_context TEXT,
  ADD COLUMN IF NOT EXISTS pricing_context TEXT,
  ADD COLUMN IF NOT EXISTS sales_process_context TEXT,
  ADD COLUMN IF NOT EXISTS qualification_context TEXT,
  ADD COLUMN IF NOT EXISTS competitor_context TEXT,
  ADD COLUMN IF NOT EXISTS objection_handlers JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analysis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_response_tokens INTEGER DEFAULT 250,
  ADD COLUMN IF NOT EXISTS temperature NUMERIC(3,2) DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_role TEXT;
