-- =============================================================
-- Add Secure Function to Delete Users (for Admins)
-- Run this in Supabase SQL Editor
-- =============================================================

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verify the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied. Only administrators can delete users.';
  END IF;

  -- 2. Delete the user from auth.users (Cascades to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
