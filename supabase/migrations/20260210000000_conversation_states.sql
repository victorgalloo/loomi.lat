CREATE TABLE conversation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phase VARCHAR(50) NOT NULL DEFAULT 'discovery',
  turn_count INTEGER NOT NULL DEFAULT 0,
  lead_info JSONB NOT NULL DEFAULT '{"business_type":null,"volume":null,"pain_points":[],"current_solution":null,"referral_source":null}'::jsonb,
  topics_covered TEXT[] NOT NULL DEFAULT '{}',
  products_offered TEXT[] NOT NULL DEFAULT '{}',
  objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  last_summary_turn INTEGER NOT NULL DEFAULT 0,
  previous_topic VARCHAR(100),
  proposed_datetime JSONB,
  awaiting_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_states_conv ON conversation_states(conversation_id);
CREATE INDEX idx_conv_states_lead ON conversation_states(lead_id);

ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON conversation_states FOR ALL USING (true);

CREATE OR REPLACE FUNCTION update_conv_state_ts() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conv_state_ts BEFORE UPDATE ON conversation_states
FOR EACH ROW EXECUTE FUNCTION update_conv_state_ts();
