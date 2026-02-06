ALTER TABLE leads ADD COLUMN IF NOT EXISTS broadcast_classification TEXT
  CHECK (broadcast_classification IN ('hot', 'warm', 'cold', 'bot_autoresponse'));
