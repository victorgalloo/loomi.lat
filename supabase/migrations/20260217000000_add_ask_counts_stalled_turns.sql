-- Add missing columns to conversation_states
-- ask_counts: tracks how many times the agent has asked about each topic (JSONB object)
-- stalled_turns: counts consecutive turns with no new info to detect stalled conversations

ALTER TABLE conversation_states
  ADD COLUMN IF NOT EXISTS ask_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stalled_turns INTEGER NOT NULL DEFAULT 0;
