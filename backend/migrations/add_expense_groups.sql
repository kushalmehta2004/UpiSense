-- Tier 1: Expense groups and members (Splitwise-style)
CREATE TABLE IF NOT EXISTS expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(15) NOT NULL,
  display_name VARCHAR(100),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_expense_groups_created_by ON expense_groups(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all expense_groups for server" ON expense_groups FOR ALL USING (true);
CREATE POLICY "Allow all group_members for server" ON group_members FOR ALL USING (true);
