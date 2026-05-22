-- 010_multi_tenancy.sql

-- 1. Create the function to safely get the current user's tenant_id
CREATE OR REPLACE FUNCTION get_auth_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Apply multi-tenancy schema changes and RLS policies
DO $$
DECLARE
  v_default_tenant UUID;
  table_name_var TEXT;
  pol_record RECORD;
  tables_to_update TEXT[] := ARRAY[
    'employees', 'leave_requests', 'candidates', 'performance_reviews', 'payroll', 
    'clients', 'client_projects', 'transactions', 'invoices', 'expenses', 
    'leads', 'lead_stage_history', 'contacts', 'projects', 'tasks', 
    'project_members', 'sprints', 'documents', 'document_versions', 
    'document_folders', 'approval_history', 'audit_logs', 'notifications', 
    'chatbot_logs', 'boards', 'board_columns', 'board_groups', 'board_items', 
    'task_comments', 'task_attachments', 'task_activity', 'task_dependencies', 'labels'
  ];
BEGIN
  -- Find the first admin to act as the default tenant for existing data
  SELECT id INTO v_default_tenant FROM profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1;
  IF v_default_tenant IS NULL THEN
    SELECT id INTO v_default_tenant FROM profiles ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Update profiles table first
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
    ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES profiles(id);
  END IF;

  IF v_default_tenant IS NOT NULL THEN
    UPDATE profiles SET tenant_id = v_default_tenant WHERE tenant_id IS NULL;
  END IF;

  -- Add tenant_id to all business tables
  FOREACH table_name_var IN ARRAY tables_to_update
  LOOP
    -- Only proceed if the table actually exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name_var) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = table_name_var AND column_name = 'tenant_id') THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID DEFAULT get_auth_tenant_id() REFERENCES profiles(id)', table_name_var);
      END IF;

      IF v_default_tenant IS NOT NULL THEN
        EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', table_name_var, v_default_tenant);
      END IF;
    END IF;
  END LOOP;
  
  -- Drop existing RLS policies on profiles
  FOR pol_record IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol_record.policyname);
  END LOOP;

  -- Drop existing RLS policies on all business tables
  FOREACH table_name_var IN ARRAY tables_to_update
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name_var) THEN
      FOR pol_record IN SELECT policyname FROM pg_policies WHERE tablename = table_name_var
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_record.policyname, table_name_var);
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- 3. Create Tenant Isolation RLS Policies
-- For profiles: users can see themselves, OR anyone in the same tenant
CREATE POLICY "Tenant isolation for profiles" ON profiles
FOR ALL USING (
  tenant_id = get_auth_tenant_id() 
  OR id = auth.uid()
);

-- For all other tables (cannot easily be done in a loop for CREATE POLICY, so we generate the statements or just write them out)
-- Actually, a PL/PGSQL DO block can execute CREATE POLICY statements!
DO $$
DECLARE
  table_name_var TEXT;
  tables_to_update TEXT[] := ARRAY[
    'employees', 'leave_requests', 'candidates', 'performance_reviews', 'payroll', 
    'clients', 'client_projects', 'transactions', 'invoices', 'expenses', 
    'leads', 'lead_stage_history', 'contacts', 'projects', 'tasks', 
    'project_members', 'sprints', 'documents', 'document_versions', 
    'document_folders', 'approval_history', 'audit_logs', 'notifications', 
    'chatbot_logs', 'boards', 'board_columns', 'board_groups', 'board_items', 
    'task_comments', 'task_attachments', 'task_activity', 'task_dependencies', 'labels'
  ];
BEGIN
  FOREACH table_name_var IN ARRAY tables_to_update
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name_var) THEN
      EXECUTE format('CREATE POLICY "Tenant isolation for %I" ON %I FOR ALL USING (tenant_id = get_auth_tenant_id())', table_name_var, table_name_var);
    END IF;
  END LOOP;
END;
$$;

-- 4. Update the handle_new_user trigger to assign tenant_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_role TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  -- If invited, use the provided tenant_id. Otherwise, this is a new admin, so their id IS their tenant_id.
  IF NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  ELSE
    v_tenant_id := NEW.id;
  END IF;

  INSERT INTO public.profiles (id, name, email, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_role,
    v_tenant_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
