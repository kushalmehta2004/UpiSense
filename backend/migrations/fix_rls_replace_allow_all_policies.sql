-- Replace permissive "Allow all" RLS policies with user-scoped or server-only policies.
-- Fixes Supabase linter: "RLS Policy Always True" (0024_permissive_rls_policy).
-- Backend uses JWT (auth.uid()) for API access; these policies restrict rows by user.
--
-- APPLY: Supabase Dashboard → SQL Editor → paste this file → Run (backup project first).
-- Required before public launch if linter still flags policies like "Allow all budgets for server".

-- ========== budgets (user_id) ==========
DROP POLICY IF EXISTS "Allow all budgets for server" ON public.budgets;
CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== debt_entries (user_id) ==========
DROP POLICY IF EXISTS "Allow all debt_entries for server" ON public.debt_entries;
CREATE POLICY "Users can manage their own debt_entries" ON public.debt_entries
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== expense_groups (created_by_user_id; members via group_members) ==========
DROP POLICY IF EXISTS "Allow all expense_groups for server" ON public.expense_groups;
CREATE POLICY "Users can manage expense_groups they own or belong to" ON public.expense_groups
  FOR ALL
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid())
  )
  WITH CHECK (created_by_user_id = auth.uid());

-- ========== group_members (user_id or group creator) ==========
DROP POLICY IF EXISTS "Allow all group_members for server" ON public.group_members;
CREATE POLICY "Users can manage group_members in their groups" ON public.group_members
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.expense_groups eg WHERE eg.id = group_id AND eg.created_by_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.expense_groups eg WHERE eg.id = group_id AND eg.created_by_user_id = auth.uid())
  );

-- ========== expenses (paid_by_user_id or participant) ==========
DROP POLICY IF EXISTS "Allow all expenses for server" ON public.expenses;
CREATE POLICY "Users can manage expenses they paid or participate in" ON public.expenses
  FOR ALL
  USING (
    paid_by_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.expense_participants ep WHERE ep.expense_id = id AND ep.user_id = auth.uid())
  )
  WITH CHECK (paid_by_user_id = auth.uid());

-- ========== expense_participants (user_id) ==========
DROP POLICY IF EXISTS "Allow all expense_participants for server" ON public.expense_participants;
CREATE POLICY "Users can manage their own expense_participants" ON public.expense_participants
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== settle_ups (from_user_id / to_user_id) ==========
DROP POLICY IF EXISTS "Allow all settle_ups for server" ON public.settle_ups;
CREATE POLICY "Users can view settle_ups they are part of" ON public.settle_ups
  FOR ALL
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- ========== family_links (owner_user_id / member_user_id) ==========
DROP POLICY IF EXISTS "Allow all family_links for server" ON public.family_links;
CREATE POLICY "Users can manage family_links they own or are member of" ON public.family_links
  FOR ALL
  USING (owner_user_id = auth.uid() OR member_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR member_user_id = auth.uid());

-- ========== last_recipient_reply (user_id) ==========
DROP POLICY IF EXISTS "Allow all last_recipient_reply for server" ON public.last_recipient_reply;
CREATE POLICY "Users can manage their own last_recipient_reply" ON public.last_recipient_reply
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== pending_recipient_ask (user_id) ==========
DROP POLICY IF EXISTS "Allow all pending_recipient_ask for server" ON public.pending_recipient_ask;
CREATE POLICY "Users can manage their own pending_recipient_ask" ON public.pending_recipient_ask
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== pending_recurring_suggestion (user_id) ==========
DROP POLICY IF EXISTS "Allow all pending_recurring_suggestion" ON public.pending_recurring_suggestion;
CREATE POLICY "Users can manage their own pending_recurring_suggestion" ON public.pending_recurring_suggestion
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== pending_split_transaction (user_id) ==========
DROP POLICY IF EXISTS "Allow all pending_split_transaction" ON public.pending_split_transaction;
CREATE POLICY "Users can manage their own pending_split_transaction" ON public.pending_split_transaction
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- ========== pending_category_confirmation (user_id PK → users) ==========
DROP POLICY IF EXISTS "Allow all pending_category_confirmation for server" ON public.pending_category_confirmation;
CREATE POLICY "Users can manage their own pending_category_confirmation" ON public.pending_category_confirmation
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== parse_failures (no user_id — server-only) ==========
-- Table has no user_id; only backend should write/read (error logging, admin summary).
-- USING (false) = no role going through RLS can access; service_role bypasses RLS and has full access.
-- Backend must use SUPABASE_SERVICE_ROLE_KEY client for parse_failures (see whatsapp.js + features.js).
DROP POLICY IF EXISTS "Allow all parse_failures" ON public.parse_failures;
CREATE POLICY "parse_failures server only" ON public.parse_failures
  FOR ALL USING (false);
