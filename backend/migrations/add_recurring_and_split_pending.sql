-- Tier 1: Recurring detection + Split this transaction
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_note VARCHAR(100);

CREATE TABLE IF NOT EXISTS pending_recurring_suggestion (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_split_transaction (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE pending_recurring_suggestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_split_transaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pending_recurring_suggestion" ON pending_recurring_suggestion FOR ALL USING (true);
CREATE POLICY "Allow all pending_split_transaction" ON pending_split_transaction FOR ALL USING (true);
