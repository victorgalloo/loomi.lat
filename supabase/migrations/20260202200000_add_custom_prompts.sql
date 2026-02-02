-- Add custom prompts to agent_configs for multi-tenant personalization
-- This allows each tenant to have their own system prompt, few-shot examples, and products catalog

-- Add new columns to agent_configs
ALTER TABLE agent_configs
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS few_shot_examples JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS products_catalog JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN agent_configs.system_prompt IS 'Custom system prompt for the AI agent. If null, uses the default insurance prompt.';
COMMENT ON COLUMN agent_configs.few_shot_examples IS 'JSON array of conversation examples for few-shot learning. Format: [{id, tags, context, conversation, whyItWorked}]';
COMMENT ON COLUMN agent_configs.products_catalog IS 'JSON object containing products/services catalog. Format varies by industry.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant_system_prompt ON agent_configs(tenant_id) WHERE system_prompt IS NOT NULL;
