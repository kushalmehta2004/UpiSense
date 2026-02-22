-- Tier 1: Family/shared wallet – link users for combined view
CREATE TABLE IF NOT EXISTS family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_user_id, member_user_id),
  CHECK (owner_user_id != member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_links_owner ON family_links(owner_user_id);

ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all family_links for server" ON family_links FOR ALL USING (true);
