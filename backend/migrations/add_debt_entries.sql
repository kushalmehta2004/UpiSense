-- IOU / debt tracking: "X owes me" and "I owe X"
CREATE TABLE IF NOT EXISTS debt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('owed_to_me', 'i_owe')),
  person_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  note VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_entries_user ON debt_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_entries_user_direction ON debt_entries(user_id, direction);

ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all debt_entries for server" ON debt_entries FOR ALL USING (true);
