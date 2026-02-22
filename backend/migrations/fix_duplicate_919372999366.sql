-- Fix duplicate users for 919372999366
-- Run in Supabase SQL Editor
--
-- Automatically keeps the OLDEST user and merges the duplicate into it.

DO $$
DECLARE
  keep_id UUID;
  dup_id UUID;
BEGIN
  -- Get the two duplicate user IDs (oldest first)
  SELECT id INTO keep_id FROM users 
  WHERE phone = '919372999366' OR whatsapp_number = '919372999366'
  ORDER BY created_at ASC LIMIT 1;
  
  SELECT id INTO dup_id FROM users 
  WHERE (phone = '919372999366' OR whatsapp_number = '919372999366')
  AND id != keep_id
  LIMIT 1;
  
  IF keep_id IS NOT NULL AND dup_id IS NOT NULL THEN
    -- Move transactions to keep user
    UPDATE transactions SET user_id = keep_id WHERE user_id = dup_id;
    -- Move merchant_memory
    UPDATE merchant_memory SET user_id = keep_id WHERE user_id = dup_id;
    -- Remove pending_clarifications for duplicate (or move if needed)
    DELETE FROM pending_clarifications WHERE user_id = dup_id;
    DELETE FROM merchant_memory WHERE user_id = dup_id;
    -- Delete duplicate user
    DELETE FROM users WHERE id = dup_id;
    RAISE NOTICE 'Merged duplicate user % into %', dup_id, keep_id;
  ELSE
    RAISE NOTICE 'No duplicate found or only one user exists.';
  END IF;
END $$;
