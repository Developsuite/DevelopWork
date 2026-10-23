-- Fix the delete_user RPC: null out foreign-key references from other tables
-- (tasks.assignee_id, tasks.created_by, etc.) BEFORE deleting the auth user, so
-- the cascade into profiles no longer trips the tasks_assignee_id_fkey check.
--
-- Historical records (completed tasks, invoices, etc.) are preserved — only the
-- link to the now-deleted user is cleared.

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Verify the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied. Only administrators can delete users.';
  END IF;

  -- 2. Null out every foreign-key column in public.* that points at profiles(id)
  --    and does NOT already cascade or set null on delete. We generate the UPDATE
  --    statements dynamically so a new FK added later is handled automatically.
  FOR r IN
    SELECT
      tc.table_name,
      kcu.column_name,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
     AND tc.table_schema   = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
     AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_schema = 'public'
      AND ccu.table_name  = 'profiles'
      AND ccu.column_name = 'id'
      AND rc.delete_rule  = 'NO ACTION'
  LOOP
    EXECUTE format(
      'UPDATE public.%I SET %I = NULL WHERE %I = $1',
      r.table_name, r.column_name, r.column_name
    ) USING target_user_id;
  END LOOP;

  -- 3. Delete the user from auth.users (cascades to public.profiles via its own FK)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
