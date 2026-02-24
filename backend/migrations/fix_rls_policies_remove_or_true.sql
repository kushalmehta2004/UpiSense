-- Fix RLS: remove OR TRUE so access is restricted by auth.uid() (Privacy/DPDP).
-- Run in Supabase SQL Editor if your project was created with the old permissive policies.

-- Users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Merchant memory
DROP POLICY IF EXISTS "Users can view their own merchant memory" ON merchant_memory;
DROP POLICY IF EXISTS "Users can manage their own merchant memory" ON merchant_memory;
CREATE POLICY "Users can view their own merchant memory" ON merchant_memory
  FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their own merchant memory" ON merchant_memory
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Categories
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories
  FOR SELECT USING (is_default = TRUE OR auth.uid()::text = user_id::text);

-- Pending clarifications (was "Allow all"; now restrict by user)
DROP POLICY IF EXISTS "Allow all pending_clarifications" ON pending_clarifications;
CREATE POLICY "Users can manage their own pending_clarifications" ON pending_clarifications
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);
