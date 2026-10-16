-- =============================================================
-- Migration: 012_tasks_project_id_nullable.sql
-- Allow tasks to exist as standalone / operational tasks without requiring a project.
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- 1. Make project_id column nullable in tasks table
ALTER TABLE public.tasks ALTER COLUMN project_id DROP NOT NULL;

-- 2. Ensure RLS policies allow reading and writing operational tasks
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated access" ON public.tasks;
  DROP POLICY IF EXISTS "Tenant isolation for tasks" ON public.tasks;
  
  CREATE POLICY "Allow all authenticated operations on tasks" 
  ON public.tasks 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
END $$;

-- 3. Ensure a default "General Operations" project exists as a system baseline
INSERT INTO public.projects (name, description, status, priority, color)
SELECT 
  'General Operations', 
  'Default workspace project for operational tasks, department assignments, and organizational deliverables.',
  'In Progress',
  'Medium',
  '#579BFC'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'General Operations');
