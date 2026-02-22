-- Task 7: Parse failure logging (for error summary on Vercel)
-- Run in Supabase SQL Editor for production so GET /api/admin/error-summary works on Vercel.

CREATE TABLE IF NOT EXISTS parse_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snippet VARCHAR(500),
  error VARCHAR(500) NOT NULL,
  meta JSONB DEFAULT '{}' 
);

CREATE INDEX IF NOT EXISTS idx_parse_failures_ts ON parse_failures(ts DESC);

ALTER TABLE parse_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all parse_failures" ON parse_failures
  FOR ALL USING (true);
