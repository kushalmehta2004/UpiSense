-- Tier 1: Monthly budget per category
-- One budget limit per user per category (monthly).
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount_limit DECIMAL(12, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all budgets for server" ON budgets FOR ALL USING (true);
