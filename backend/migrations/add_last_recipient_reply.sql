-- When user replies to "Who did you pay?" we record it here; if another message
-- arrives within ~20s that looks like a second name, we reconfirm instead of creating 2 txns.
CREATE TABLE IF NOT EXISTS last_recipient_reply (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_last_recipient_reply_created ON last_recipient_reply(created_at);
ALTER TABLE last_recipient_reply ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all last_recipient_reply for server" ON last_recipient_reply FOR ALL USING (true);
