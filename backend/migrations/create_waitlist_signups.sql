-- Public waitlist signups (email only)
-- Store signups so you can gauge interest before launch.

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  email TEXT PRIMARY KEY,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Server-only table: the backend uses SUPABASE_SERVICE_ROLE_KEY to insert.
DROP POLICY IF EXISTS "Allow all waitlist_signups" ON public.waitlist_signups;
CREATE POLICY "waitlist_signups server only" ON public.waitlist_signups
  FOR ALL USING (false);

