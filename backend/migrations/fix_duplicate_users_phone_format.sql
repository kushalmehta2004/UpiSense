-- Fix: Transactions stored under webhook-created user (e.g. 919372999366)
-- while login user has different format (e.g. 9372999366) = different user IDs.
--
-- Run this in Supabase SQL Editor.
--
-- 1. First, find your users:
SELECT id, phone, whatsapp_number, created_at, 
       (SELECT COUNT(*) FROM transactions t WHERE t.user_id = users.id) as txn_count
FROM users 
ORDER BY created_at;

-- 2. Identify: login_user_id (the one you use in the app) and webhook_user_id (has the transactions).
-- 3. Reassign transactions (replace the UUIDs with yours):
-- UPDATE transactions SET user_id = 'YOUR_LOGIN_USER_ID' WHERE user_id = 'WEBHOOK_USER_ID';

-- 4. Remove duplicate user and related rows (replace WEBHOOK_USER_ID):
-- DELETE FROM merchant_memory WHERE user_id = 'WEBHOOK_USER_ID';
-- DELETE FROM pending_clarifications WHERE user_id = 'WEBHOOK_USER_ID';
-- DELETE FROM users WHERE id = 'WEBHOOK_USER_ID';
