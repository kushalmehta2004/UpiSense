-- When we asked "Who did you pay ₹X to?" we store amount; next message = recipient
CREATE TABLE IF NOT EXISTS pending_recipient_ask (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_recipient_ask_user ON pending_recipient_ask(user_id);
ALTER TABLE pending_recipient_ask ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pending_recipient_ask for server" ON pending_recipient_ask FOR ALL USING (true);
