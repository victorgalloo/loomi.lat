-- Performance indexes for hot query paths
-- These indexes target the most frequent queries in the webhook pipeline

-- messages: RPC query ORDER BY created_at DESC LIMIT 20
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- conversations: RPC find active conversation for lead
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_lead_active
  ON conversations(lead_id, started_at DESC) WHERE ended_at IS NULL;

-- broadcast_recipients: webhook status updates by wa_message_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_broadcast_recipients_wa_message_id
  ON broadcast_recipients(wa_message_id) WHERE wa_message_id IS NOT NULL;

-- leads: non-tenant phone lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_phone
  ON leads(phone);
