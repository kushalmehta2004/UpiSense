-- Clear all transactions and related data for a fresh start
-- Run in Supabase SQL Editor

-- Delete in order (respecting foreign keys)
DELETE FROM pending_clarifications;
DELETE FROM merchant_memory;
DELETE FROM transactions;
