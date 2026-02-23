-- When we ask "Reply YES or tell us the right category", we need to know which transaction to update
CREATE TABLE IF NOT EXISTS pending_category_confirmation (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_category_confirmation_user ON pending_category_confirmation(user_id);

ALTER TABLE pending_category_confirmation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pending_category_confirmation for server" ON pending_category_confirmation FOR ALL USING (true);
