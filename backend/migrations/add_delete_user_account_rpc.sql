-- Allow account deletion via RPC (runs with definer rights, bypasses RLS).
-- Backend must call this with SUPABASE_SERVICE_ROLE_KEY so only authenticated users can delete their own account.
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM users WHERE id = p_user_id;
END;
$$;

-- Only service_role can execute (backend uses SUPABASE_SERVICE_ROLE_KEY for this call).
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO service_role;

COMMENT ON FUNCTION public.delete_user_account(UUID) IS 'Deletes the user and all cascaded data. Call only with authenticated user id from backend.';
