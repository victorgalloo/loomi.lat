-- Broadcast "Sin Bot" feature
-- When suppress_bot is enabled on a campaign, recipient replies are saved
-- but the bot does NOT auto-respond, regardless of auto_reply_enabled.

-- 1. Flag on campaign
ALTER TABLE broadcast_campaigns
  ADD COLUMN IF NOT EXISTS suppress_bot BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Flag + link on conversation (set when recipient replies)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS broadcast_suppress_bot BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS broadcast_campaign_id UUID REFERENCES broadcast_campaigns(id);

-- 3. Index for fast webhook lookup
CREATE INDEX IF NOT EXISTS idx_conversations_broadcast_suppress
  ON conversations (broadcast_suppress_bot)
  WHERE broadcast_suppress_bot = TRUE;
