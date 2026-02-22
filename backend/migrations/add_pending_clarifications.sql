-- Task 5: Pending P2P clarification table
-- Run this in Supabase SQL Editor if your DB was created before Task 5

CREATE TABLE IF NOT EXISTS pending_clarifications (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  merchant_name VARCHAR(255) NOT NULL,
  upi_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE pending_clarifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all pending_clarifications" ON pending_clarifications
  FOR ALL USING (true);
