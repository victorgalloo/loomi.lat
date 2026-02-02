-- Add knowledge documents and custom tools for tenants
-- Enables sandbox to have uploadable context and executable tools

-- ============================================
-- KNOWLEDGE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Document metadata
  name TEXT NOT NULL,
  description TEXT,
  doc_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'pdf', 'url', 'json'

  -- Content
  content TEXT NOT NULL, -- Raw text content (extracted from PDF if needed)
  content_tokens INTEGER, -- Approximate token count for context budgeting

  -- Source info
  source_url TEXT, -- Original URL if fetched
  file_name TEXT, -- Original filename if uploaded
  file_size INTEGER, -- Size in bytes

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast tenant lookups
CREATE INDEX idx_tenant_documents_tenant ON tenant_documents(tenant_id);
CREATE INDEX idx_tenant_documents_active ON tenant_documents(tenant_id, is_active) WHERE is_active = true;

-- ============================================
-- CUSTOM TOOLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tool definition
  name TEXT NOT NULL, -- Function name (snake_case)
  display_name TEXT NOT NULL, -- Human-readable name
  description TEXT NOT NULL, -- What the tool does (shown to AI)

  -- Parameters schema (JSON Schema format)
  parameters JSONB NOT NULL DEFAULT '{}',
  -- Example: {"type": "object", "properties": {"query": {"type": "string", "description": "Search query"}}, "required": ["query"]}

  -- Execution config
  execution_type TEXT NOT NULL DEFAULT 'webhook', -- 'webhook', 'mock', 'code'
  webhook_url TEXT, -- URL to call when tool is executed
  webhook_method TEXT DEFAULT 'POST', -- HTTP method
  webhook_headers JSONB DEFAULT '{}', -- Custom headers
  mock_response JSONB, -- Response to return in mock mode

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique tool names per tenant
  UNIQUE(tenant_id, name)
);

-- Index for fast tenant lookups
CREATE INDEX idx_tenant_tools_tenant ON tenant_tools(tenant_id);
CREATE INDEX idx_tenant_tools_active ON tenant_tools(tenant_id, is_active) WHERE is_active = true;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tenant_documents IS 'Knowledge base documents per tenant - used as context for AI responses';
COMMENT ON TABLE tenant_tools IS 'Custom tools/functions per tenant - executable by the AI agent';

COMMENT ON COLUMN tenant_documents.content_tokens IS 'Approximate token count for context window budgeting';
COMMENT ON COLUMN tenant_tools.parameters IS 'JSON Schema defining tool parameters';
COMMENT ON COLUMN tenant_tools.execution_type IS 'webhook=call URL, mock=return mock_response, code=execute embedded code';
