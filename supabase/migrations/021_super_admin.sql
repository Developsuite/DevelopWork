-- =============================================
-- Super Admin: top-level role that provisions admin workspaces
-- =============================================

-- Add a disabled flag to profiles so the super admin can suspend a workspace.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- Note: all super-admin management (listing/creating/suspending workspaces) runs
-- through the `super-admin` Edge Function using the service-role key, which bypasses
-- RLS. The super admin reads their own profile via the existing `id = auth.uid()`
-- clause in the "Tenant isolation for profiles" policy, so no extra policy is needed.
-- The super admin has no tenant data of their own.
