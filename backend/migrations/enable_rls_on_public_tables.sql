-- Re-enable Row Level Security on all public tables that have RLS policies.
-- Fixes Supabase linter: "Policy Exists RLS Disabled" and "RLS Disabled in Public".
-- Run this in production; do not run fix-rls.sql (disable) in production.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_category_confirmation ENABLE ROW LEVEL SECURITY;
