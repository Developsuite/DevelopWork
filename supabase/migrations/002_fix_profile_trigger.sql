-- =============================================================
-- FIX: Profile creation trigger failing during signup
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'employee'
  );
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix RLS policy on profiles - allow the trigger to INSERT
-- Drop the old policy first
DROP POLICY IF EXISTS "Allow authenticated access" ON profiles;

-- Separate policies for different operations
CREATE POLICY "Allow read for authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow insert for service" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete for authenticated" ON profiles
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. Clean up any stuck auth users that don't have profiles
-- (from your previous failed attempts)
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM profiles);
