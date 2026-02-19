-- Add persistent conversation state to conversations table
-- Tracks phase, topics covered, objections, summary for the AI agent
-- Updated every ~5 user messages via Haiku to keep the agent context-aware

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS state JSONB DEFAULT NULL;

-- Index for fast lookups on active conversations with state
CREATE INDEX IF NOT EXISTS idx_conversations_state_not_null
  ON conversations (lead_id)
  WHERE state IS NOT NULL AND ended_at IS NULL;
