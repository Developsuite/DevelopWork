-- Admin-only RPC: change a user's login email AND keep the profiles / employees
-- rows in sync. Updating profiles.email alone does not change the password login,
-- because Supabase's authentication reads auth.users.email.

CREATE OR REPLACE FUNCTION public.admin_update_user_email(
  target_user_id UUID,
  new_email      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalised_email TEXT := lower(trim(new_email));
  caller_tenant    UUID;
  target_tenant    UUID;
  conflict_count   INT;
BEGIN
  -- 1. Caller must be an admin.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied. Only administrators can change a user''s email.';
  END IF;

  -- 2. Target must be in the admin's workspace (tenant).
  SELECT tenant_id INTO caller_tenant FROM public.profiles WHERE id = auth.uid();
  SELECT tenant_id INTO target_tenant FROM public.profiles WHERE id = target_user_id;
  IF target_tenant IS NULL OR caller_tenant IS NULL OR target_tenant <> caller_tenant THEN
    RAISE EXCEPTION 'Target user is not in your workspace.';
  END IF;

  -- 3. Validate format.
  IF normalised_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'That email address does not look valid.';
  END IF;

  -- 4. Make sure nobody else has this email.
  SELECT COUNT(*) INTO conflict_count
  FROM auth.users WHERE lower(email) = normalised_email AND id <> target_user_id;
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'That email is already in use by another account.';
  END IF;

  -- 5. Update auth.users directly. Mark the email confirmed so the user can log in
  --    straight away without clicking a confirmation link.
  UPDATE auth.users
     SET email              = normalised_email,
         email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
         updated_at         = NOW()
   WHERE id = target_user_id;

  -- 6. Keep profiles.email mirrored.
  UPDATE public.profiles
     SET email      = normalised_email,
         updated_at = NOW()
   WHERE id = target_user_id;

  -- 7. If this user also has an HR directory row, mirror there too.
  UPDATE public.employees
     SET email      = normalised_email
   WHERE profile_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_email(UUID, TEXT) TO authenticated;
