-- FILE: 001_initial_schema.sql
-- =============================================================
-- DevelopWork Backend — Complete Database Schema
-- Run this ENTIRE script in Supabase SQL Editor (one shot)
-- =============================================================

-- ========================
-- 1. PROFILES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee')),
  assigned_module TEXT,
  department TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================
-- 2. HR MODULE
-- ========================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  department TEXT NOT NULL DEFAULT 'Engineering',
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  join_date DATE DEFAULT CURRENT_DATE,
  employment_type TEXT DEFAULT 'Full-time'
    CHECK (employment_type IN ('Full-time','Part-time','Contract','Remote')),
  status TEXT DEFAULT 'Active'
    CHECK (status IN ('Active','On Leave','Terminated')),
  location TEXT DEFAULT 'Islamabad',
  salary NUMERIC(12,2) DEFAULT 0 CHECK (salary >= 0),
  bonus NUMERIC(12,2) DEFAULT 0 CHECK (bonus >= 0),
  deductions NUMERIC(12,2) DEFAULT 0 CHECK (deductions >= 0),
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('Annual','Sick','Casual','Unpaid')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  approver_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_date <= to_date)
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  source TEXT DEFAULT 'Direct',
  application_date DATE DEFAULT CURRENT_DATE,
  stage TEXT DEFAULT 'Applied'
    CHECK (stage IN ('Applied','Screening','Interview','Offer','Hired','Rejected')),
  interviewer_id UUID REFERENCES profiles(id),
  interviewer_name TEXT,
  resume_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  goals JSONB DEFAULT '[]',
  review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  salary NUMERIC(12,2) NOT NULL CHECK (salary >= 0),
  bonus NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Processed','Paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- ========================
-- 3. CLIENTS MODULE
-- ========================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'Pending'
    CHECK (status IN ('In Progress','Completed','Pending','Not Started')),
  payment_status TEXT DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Paid','Unpaid','Partial')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  deadline DATE,
  amount NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 4. FINANCE MODULE
-- ========================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed','pending','cancelled')),
  reference TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Sent','Paid','Overdue')),
  items JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('company','individual')),
  requester_id UUID REFERENCES profiles(id),
  requester_name TEXT,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  approver_id UUID REFERENCES profiles(id),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 5. LEADS & CRM MODULE
-- ========================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT DEFAULT 'New'
    CHECK (stage IN ('New','Contacted','Qualified','Proposal','Negotiation','Closed')),
  value NUMERIC(12,2) DEFAULT 0,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  location TEXT,
  last_contact TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 6. PROJECT MANAGEMENT
-- ========================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Planning'
    CHECK (status IN ('Planning','In Progress','On Hold','Completed')),
  priority TEXT DEFAULT 'Medium'
    CHECK (priority IN ('Low','Medium','High','Critical')),
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  assignee_id UUID REFERENCES profiles(id),
  assignee_name TEXT,
  deadline DATE,
  column_name TEXT DEFAULT 'To Do',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Planning' CHECK (status IN ('Planning','Active','Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 7. DOCUMENTATION MODULE
-- ========================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'General',
  type TEXT DEFAULT 'document' CHECK (type IN ('document','wiki','template')),
  owner_id UUID REFERENCES profiles(id),
  owner_name TEXT,
  shared BOOLEAN DEFAULT FALSE,
  shared_with INTEGER DEFAULT 0,
  starred BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 8. SYSTEM TABLES
-- ========================

-- Approval History
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  approver_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('approve','reject')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('approval','assignment','deadline','mention','system')),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chatbot Logs
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  query TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 9. INDEXES FOR PERFORMANCE
-- ========================
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ========================
-- 10. RLS POLICIES
-- ========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (we control access in the app layer for now)
-- You can tighten these later for production
CREATE POLICY "Allow authenticated access" ON profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON employees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON leave_requests FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON candidates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON performance_reviews FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON payroll FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON clients FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON client_projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON invoices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON expenses FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON leads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON lead_stage_history FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON contacts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON project_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON sprints FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON documents FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON document_versions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON document_folders FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON approval_history FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON audit_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON notifications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON chatbot_logs FOR ALL USING (auth.uid() IS NOT NULL);

-- ========================
-- 11. SEED DATA
-- ========================

-- Insert default document folders
INSERT INTO document_folders (name) VALUES
  ('Strategy'), ('Technical'), ('Design'), ('HR'), ('General')
ON CONFLICT (name) DO NOTHING;

-- Done!
-- Now go create your first admin user by signing up in the app,
-- then update their role to 'admin' in the profiles table.


-- FILE: 002_fix_profile_trigger.sql
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


-- FILE: 003_seed_data.sql
-- =============================================================
-- DevelopWork — Seed Data for all modules
-- Run this in Supabase SQL Editor AFTER the schema migration
-- =============================================================

-- ========================
-- EMPLOYEES (HR Module)
-- ========================
INSERT INTO employees (name, role, department, email, phone, location, employment_type, status, join_date, skills, salary, bonus, deductions) VALUES
('Abbas Khan', 'Product Lead', 'Engineering', 'abbas@developwork.com', '+92 300 1234567', 'Islamabad', 'Full-time', 'Active', '2024-01-15', ARRAY['React', 'Node.js', 'MongoDB'], 95000, 5000, 12000),
('Sarah Ahmed', 'UI/UX Designer', 'Design', 'sarah@developwork.com', '+92 300 2345678', 'Lahore', 'Full-time', 'Active', '2024-03-10', ARRAY['Figma', 'Design Systems', 'CSS'], 78000, 3000, 9800),
('Ali Hassan', 'Backend Developer', 'Engineering', 'ali@developwork.com', '+92 300 3456789', 'Karachi', 'Full-time', 'Active', '2024-06-01', ARRAY['Python', 'Django', 'PostgreSQL'], 82000, 4000, 10500),
('Fatima Noor', 'QA Engineer', 'Engineering', 'fatima@developwork.com', '+92 300 4567890', 'Islamabad', 'Part-time', 'On Leave', '2024-09-15', ARRAY['Selenium', 'Jest', 'Cypress'], 45000, 0, 5600),
('Omar Raza', 'Operations Manager', 'Operations', 'omar@developwork.com', '+92 300 5678901', 'Rawalpindi', 'Full-time', 'Active', '2024-02-20', ARRAY['Project Mgmt', 'Agile', 'Scrum'], 88000, 4500, 11200),
('Usman Ali', 'DevOps Engineer', 'Engineering', 'usman@developwork.com', '+92 300 6789012', 'Islamabad', 'Full-time', 'Active', '2024-04-10', ARRAY['AWS', 'Docker', 'Kubernetes'], 85000, 3500, 10800);

-- ========================
-- LEAVE REQUESTS
-- ========================
INSERT INTO leave_requests (employee_id, employee_name, type, from_date, to_date, reason, status) VALUES
((SELECT id FROM employees WHERE name = 'Fatima Noor'), 'Fatima Noor', 'Annual', '2026-04-20', '2026-04-25', 'Family vacation', 'Pending'),
((SELECT id FROM employees WHERE name = 'Ali Hassan'), 'Ali Hassan', 'Sick', '2026-04-18', '2026-04-18', 'Medical appointment', 'Approved'),
((SELECT id FROM employees WHERE name = 'Omar Raza'), 'Omar Raza', 'Annual', '2026-05-01', '2026-05-05', 'Personal travel', 'Pending');

-- ========================
-- CANDIDATES (Recruitment)
-- ========================
INSERT INTO candidates (name, role, source, application_date, stage) VALUES
('Ahmed Ali', 'Frontend Developer', 'LinkedIn', '2026-03-01', 'Interview'),
('Zainab Shah', 'Product Manager', 'Referral', '2026-03-10', 'Screening'),
('Hassan Malik', 'DevOps Engineer', 'Indeed', '2026-02-15', 'Offer'),
('Ayesha Siddiq', 'Data Analyst', 'LinkedIn', '2026-03-20', 'Applied'),
('Bilal Khan', 'UI Designer', 'Direct', '2026-02-28', 'Hired');

-- ========================
-- PERFORMANCE REVIEWS
-- ========================
INSERT INTO performance_reviews (employee_id, employee_name, rating, feedback, goals, review_date) VALUES
((SELECT id FROM employees WHERE name = 'Abbas Khan'), 'Abbas Khan', 5, 'Exceptional leadership. Delivered all Q1 milestones ahead of schedule.', '["Launch v2.0", "Hire 3 engineers", "Improve test coverage to 80%"]'::jsonb, '2026-03-15'),
((SELECT id FROM employees WHERE name = 'Sarah Ahmed'), 'Sarah Ahmed', 4, 'Great design contributions. Design system adoption increased by 60%.', '["Redesign dashboard", "Create component library", "Mentor junior designer"]'::jsonb, '2026-03-15'),
((SELECT id FROM employees WHERE name = 'Ali Hassan'), 'Ali Hassan', 4, 'Strong backend skills. API response times improved by 40%.', '["Migrate to microservices", "Implement caching layer", "Write API documentation"]'::jsonb, '2026-03-15');

-- ========================
-- TRANSACTIONS (Finance)
-- ========================
INSERT INTO transactions (type, category, description, amount, date, status) VALUES
('income', 'Software Sales', 'Enterprise License - Q1', 45000, '2026-03-01', 'completed'),
('income', 'Consulting', 'Cloud Migration - TechCorp', 28000, '2026-03-05', 'completed'),
('expense', 'Salary', 'March Payroll', 380000, '2026-03-25', 'completed'),
('expense', 'Software', 'AWS Monthly', 12500, '2026-03-01', 'completed'),
('expense', 'Travel', 'Client Meeting - Lahore', 15000, '2026-03-10', 'completed'),
('income', 'Software Sales', 'SaaS Subscription - Monthly', 18000, '2026-04-01', 'completed'),
('expense', 'Office', 'Internet & Utilities', 8500, '2026-04-01', 'completed'),
('income', 'Consulting', 'Security Audit - FinBank', 35000, '2026-04-05', 'pending');

-- ========================
-- INVOICES
-- ========================
INSERT INTO invoices (id, client_name, amount, due_date, status, items) VALUES
('INV-001', 'TechCorp Ltd', 45000, '2026-04-15', 'Paid', '[{"description": "Enterprise License", "qty": 1, "rate": 45000}]'::jsonb),
('INV-002', 'Digital Solutions', 28000, '2026-04-30', 'Sent', '[{"description": "Cloud Migration", "qty": 1, "rate": 28000}]'::jsonb),
('INV-003', 'FinBank', 35000, '2026-05-15', 'Draft', '[{"description": "Security Audit", "qty": 1, "rate": 35000}]'::jsonb),
('INV-004', 'StartupXYZ', 15000, '2026-03-30', 'Overdue', '[{"description": "MVP Development", "qty": 1, "rate": 15000}]'::jsonb);

-- ========================
-- EXPENSES (Approval Workflow)
-- ========================
INSERT INTO expenses (type, requester_name, category, amount, date, reason, status) VALUES
('individual', 'Ali Hassan', 'Travel', 15000, '2026-03-10', 'Client meeting in Lahore - flight + hotel', 'Pending'),
('individual', 'Sarah Ahmed', 'Equipment', 25000, '2026-03-15', 'New monitor for design work', 'Approved'),
('company', 'Operations', 'Software', 12500, '2026-03-01', 'AWS monthly infrastructure costs', 'Approved'),
('individual', 'Omar Raza', 'Training', 8000, '2026-04-01', 'Agile certification course', 'Pending');

-- ========================
-- LEADS (CRM)
-- ========================
INSERT INTO leads (name, company, contact_person, email, phone, stage, value, priority, location, last_contact) VALUES
('Enterprise Deal', 'TechCorp Ltd', 'Ahmed Director', 'ahmed@techcorp.com', '+92 300 1112233', 'Proposal', 150000, 'High', 'Islamabad', '2 days ago'),
('SaaS License', 'Digital Solutions', 'Fatima CEO', 'fatima@digitalsol.com', '+92 300 2223344', 'Negotiation', 85000, 'High', 'Lahore', '1 week ago'),
('Startup MVP', 'StartupXYZ', 'Bilal Founder', 'bilal@startupxyz.com', '+92 300 3334455', 'Qualified', 45000, 'Medium', 'Karachi', '3 days ago'),
('Cloud Migration', 'FinBank', 'Hassan CTO', 'hassan@finbank.com', '+92 300 4445566', 'New', 200000, 'High', 'Islamabad', 'Today'),
('Web Redesign', 'MediaHouse', 'Ayesha PM', 'ayesha@mediahouse.com', '+92 300 5556677', 'Contacted', 35000, 'Low', 'Rawalpindi', '5 days ago'),
('Mobile App', 'RetailChain', 'Usman Dir', 'usman@retailchain.com', '+92 300 6667788', 'Closed', 120000, 'Medium', 'Lahore', '2 weeks ago');

-- ========================
-- CONTACTS (CRM)
-- ========================
INSERT INTO contacts (name, role, company, email, phone) VALUES
('Ahmed Director', 'Director of Engineering', 'TechCorp Ltd', 'ahmed@techcorp.com', '+92 300 1112233'),
('Fatima CEO', 'Chief Executive Officer', 'Digital Solutions', 'fatima@digitalsol.com', '+92 300 2223344'),
('Bilal Founder', 'Founder & CEO', 'StartupXYZ', 'bilal@startupxyz.com', '+92 300 3334455'),
('Hassan CTO', 'Chief Technology Officer', 'FinBank', 'hassan@finbank.com', '+92 300 4445566'),
('Ayesha PM', 'Project Manager', 'MediaHouse', 'ayesha@mediahouse.com', '+92 300 5556677');

-- ========================
-- CLIENTS
-- ========================
INSERT INTO clients (name, company, email, phone, address, status, payment_status) VALUES
('TechCorp Ltd', 'TechCorp Ltd', 'info@techcorp.com', '+92 300 1112233', 'Blue Area, Islamabad', 'In Progress', 'Paid'),
('Digital Solutions', 'Digital Solutions', 'info@digitalsol.com', '+92 300 2223344', 'Gulberg III, Lahore', 'In Progress', 'Partial'),
('StartupXYZ', 'StartupXYZ', 'info@startupxyz.com', '+92 300 3334455', 'Clifton, Karachi', 'Pending', 'Unpaid'),
('FinBank', 'FinBank', 'info@finbank.com', '+92 300 4445566', 'F-7, Islamabad', 'Not Started', 'Unpaid'),
('MediaHouse', 'MediaHouse', 'info@mediahouse.com', '+92 300 5556677', 'Saddar, Rawalpindi', 'Completed', 'Paid');

-- ========================
-- DOCUMENTS
-- ========================
INSERT INTO documents (title, content, category, type, owner_name, shared, views) VALUES
('Product Roadmap 2026', '# Product Roadmap\n\n## Q1 Goals\n- Launch v2.0\n- Improve performance by 40%\n\n## Q2 Goals\n- Mobile app release\n- Enterprise features', 'Strategy', 'document', 'Abbas Khan', true, 45),
('API Documentation', '# API Reference\n\n## Authentication\nAll endpoints require Bearer token.\n\n## Endpoints\n- GET /api/users\n- POST /api/projects', 'Technical', 'wiki', 'Ali Hassan', true, 128),
('Design System Guide', '# Design System\n\n## Colors\n- Primary: #579BFC\n- Success: #00C875\n\n## Typography\n- Headings: Inter Bold\n- Body: Inter Regular', 'Design', 'document', 'Sarah Ahmed', true, 67),
('Employee Handbook', '# Employee Handbook\n\n## Working Hours\n9 AM - 6 PM, Monday to Friday\n\n## Leave Policy\n- Annual: 15 days\n- Sick: 10 days', 'HR', 'template', 'Omar Raza', false, 23),
('Sprint Planning Template', '# Sprint Planning\n\n## Sprint Goal\n[Define the sprint goal]\n\n## User Stories\n1. As a user...\n2. As an admin...', 'General', 'template', 'Abbas Khan', true, 89);

-- Done! All modules now have seed data.


-- FILE: 004_project_sprint_schema.sql
-- =============================================================
-- DevelopWork — Project Management & Sprint Dashboard Schema
-- Migration 004: Enhances projects, tasks, sprints from 001
-- Run in Supabase SQL Editor AFTER 001_initial_schema.sql
-- =============================================================

-- ========================
-- 1. ENHANCE PROJECTS TABLE
-- ========================
-- Add missing columns the frontend uses (members count, color, icon, etc.)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#579BFC';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📋';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks_total INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tasks_done INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================
-- 2. ENHANCE TASKS TABLE
-- ========================
-- Add missing columns: sprint link, tags, story points, time tracking, task type
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 0 CHECK (story_points >= 0 AND story_points <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task'
  CHECK (task_type IN ('task','bug','feature','improvement','chore'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_estimated INTEGER DEFAULT 0; -- minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_logged INTEGER DEFAULT 0;    -- minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================
-- 3. ENHANCE SPRINTS TABLE
-- ========================
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS velocity INTEGER DEFAULT 0;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================
-- 4. BOARDS TABLE (Kanban/Table/Timeline config)
-- ========================
-- Boards hold the view configuration for a project's sprint
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  workspace_id UUID,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'project'
    CHECK (type IN ('project','hr','finance','crm','support')),
  default_view TEXT DEFAULT 'kanban'
    CHECK (default_view IN ('table','kanban','timeline','calendar','list')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 5. BOARD COLUMNS (dynamic column definitions per board)
-- ========================
CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','status','person','date','priority','tags','number')),
  width INTEGER DEFAULT 140,
  position INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]',  -- for status/priority: [{label, color}]
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 6. BOARD GROUPS (collapsible sections within a board)
-- ========================
CREATE TABLE IF NOT EXISTS board_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#579BFC',
  position INTEGER DEFAULT 0,
  collapsed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 7. BOARD ITEMS (individual cards/rows on a board)
-- ========================
-- These link to tasks but store board-specific field values
CREATE TABLE IF NOT EXISTS board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES board_groups(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  fields JSONB DEFAULT '{}',  -- {col_id: value, ...}
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 8. TASK COMMENTS (updates/comments thread on tasks)
-- ========================
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT DEFAULT 'comment' CHECK (type IN ('comment','system','mention')),
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}', -- mentioned user IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 9. TASK ATTACHMENTS (files on tasks)
-- ========================
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,       -- bytes
  mime_type TEXT DEFAULT 'application/octet-stream',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 10. TASK ACTIVITY LOG (field change history)
-- ========================
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'created','updated','moved','commented','attached'
  field_name TEXT,      -- which field changed (null for create/comment)
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 11. TASK DEPENDENCIES (blocks / blocked-by)
-- ========================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'blocks' CHECK (type IN ('blocks','blocked_by','related')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on)
);

-- ========================
-- 12. LABELS (reusable tags for tasks)
-- ========================
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#579BFC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- ========================
-- 13. INDEXES
-- ========================
CREATE INDEX IF NOT EXISTS idx_boards_project ON boards(project_id);
CREATE INDEX IF NOT EXISTS idx_boards_sprint ON boards(sprint_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_board ON board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_board_groups_board ON board_groups(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_board ON board_items(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_group ON board_items(group_id);
CREATE INDEX IF NOT EXISTS idx_board_items_task ON board_items(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on);
CREATE INDEX IF NOT EXISTS idx_labels_project ON labels(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);

-- ========================
-- 14. RLS POLICIES
-- ========================
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access" ON boards FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON board_columns FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON board_groups FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON board_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON task_comments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON task_attachments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON task_activity FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON task_dependencies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated access" ON labels FOR ALL USING (auth.uid() IS NOT NULL);

-- ========================
-- 15. HELPER FUNCTIONS
-- ========================

-- Auto-update project task counts when tasks change
CREATE OR REPLACE FUNCTION update_project_task_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET
    tasks_total = (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
    tasks_done  = (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND status = 'Done'),
    progress    = CASE
      WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)) = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND status = 'Done')::NUMERIC /
        (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id))::NUMERIC * 100
      )
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_task_count_insert ON tasks;
CREATE TRIGGER trg_task_count_insert
  AFTER INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_task_counts();

DROP TRIGGER IF EXISTS trg_task_count_update ON tasks;
CREATE TRIGGER trg_task_count_update
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_task_counts();

DROP TRIGGER IF EXISTS trg_task_count_delete ON tasks;
CREATE TRIGGER trg_task_count_delete
  AFTER DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_task_counts();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sprints_updated ON sprints;
CREATE TRIGGER trg_sprints_updated BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_board_items_updated ON board_items;
CREATE TRIGGER trg_board_items_updated BEFORE UPDATE ON board_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ========================
-- 16. SEED DATA
-- ========================

DO $$
DECLARE
  v_project_id UUID;
  v_sprint_id UUID;
  v_board_id UUID;
BEGIN
  -- 1. Ensure at least one project exists
  SELECT id INTO v_project_id FROM projects WHERE name = 'Dashboard Redesign v2.0' LIMIT 1;
  IF v_project_id IS NULL THEN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
  END IF;
  IF v_project_id IS NULL THEN
    INSERT INTO projects (name, description, status, priority, due_date, progress, color, icon)
    VALUES ('Dashboard Redesign v2.0', 'Core dashboard redesign and work management system', 'In Progress', 'Critical', '2026-06-30', 65, '#579BFC', '🚀')
    RETURNING id INTO v_project_id;
  END IF;

  -- 2. Labels
  INSERT INTO labels (project_id, name, color) VALUES
    (v_project_id, 'UI', '#579BFC'),
    (v_project_id, 'Backend', '#FDAB3D'),
    (v_project_id, 'Design', '#A25DDC'),
    (v_project_id, 'Testing', '#00C875'),
    (v_project_id, 'DevOps', '#E2445C'),
    (v_project_id, 'Database', '#037F4C'),
    (v_project_id, 'Frontend', '#FF642E'),
    (v_project_id, 'Meeting', '#CAB641')
  ON CONFLICT (project_id, name) DO NOTHING;

  -- 3. Sprints for project
  INSERT INTO sprints (project_id, name, start_date, end_date, status, goal, velocity) VALUES
    (v_project_id, 'Sprint 24', '2026-05-05', '2026-05-19', 'Active',
     'Complete dashboard widgets and login page redesign', 42),
    (v_project_id, 'Sprint 25', '2026-05-19', '2026-06-02', 'Planning',
     'API integration and testing phase', 0)
  ON CONFLICT DO NOTHING;

  -- 4. Board for Sprint 24
  SELECT id INTO v_sprint_id FROM sprints WHERE name = 'Sprint 24' AND project_id = v_project_id LIMIT 1;

  SELECT id INTO v_board_id FROM boards WHERE name = 'Sprint 24 - Dashboard Redesign' LIMIT 1;
  IF v_board_id IS NULL THEN
    INSERT INTO boards (project_id, sprint_id, name, type, default_view)
    VALUES (v_project_id, v_sprint_id, 'Sprint 24 - Dashboard Redesign', 'project', 'kanban')
    RETURNING id INTO v_board_id;
  END IF;

  -- 5. Board Columns & Groups
  IF v_board_id IS NOT NULL THEN
    INSERT INTO board_columns (board_id, name, type, width, position, options) VALUES
      (v_board_id, 'Task', 'text', 280, 0, '[]'),
      (v_board_id, 'Status', 'status', 140, 1,
       '[{"label":"Not Started","color":"#6C7A96"},{"label":"In Progress","color":"#FDAB3D"},{"label":"In Review","color":"#A25DDC"},{"label":"Done","color":"#00C875"},{"label":"Stuck","color":"#E2445C"}]'::jsonb),
      (v_board_id, 'Assignee', 'person', 140, 2, '[]'),
      (v_board_id, 'Due Date', 'date', 130, 3, '[]'),
      (v_board_id, 'Priority', 'priority', 120, 4,
       '[{"label":"low","color":"#579BFC"},{"label":"medium","color":"#FDAB3D"},{"label":"high","color":"#E2445C"},{"label":"critical","color":"#333"}]'::jsonb),
      (v_board_id, 'Tags', 'tags', 160, 5, '[]')
    ON CONFLICT DO NOTHING;

    INSERT INTO board_groups (board_id, name, color, position) VALUES
      (v_board_id, 'To Do', '#579BFC', 0),
      (v_board_id, 'In Progress', '#FDAB3D', 1),
      (v_board_id, 'Done', '#00C875', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Done!
-- Tables created: boards, board_columns, board_groups, board_items,
--                 task_comments, task_attachments, task_activity,
--                 task_dependencies, labels
-- Enhanced: projects (color, icon, task counts),
--           tasks (sprint_id, tags, story_points, task_type, time tracking),
--           sprints (goal, velocity)


-- FILE: 005_add_manager_name_column.sql
-- Add manager text column to employees table for Org Chart compatibility
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS commission NUMERIC(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT FALSE;

-- Update existing manager_id to manager names (if possible) - but since it's mock/initial, we just add the column
-- For now, we'll just allow the frontend to save the name directly.


-- FILE: 006_add_client_to_projects.sql
-- Add client_id and amount to projects table to link Project Management with Clients
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);


-- FILE: 007_add_profile_job_bio.sql
-- Add job_title and bio columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;


-- FILE: 007_seed_projects_and_tasks.sql
-- =============================================================
-- DevelopWork — Complete Seed Data for Projects & Board System
-- Migration 007: Populates initial project, sprint, board & tasks
-- =============================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_project_id UUID;
  v_sprint_id UUID;
  v_board_id UUID;
  v_group_todo UUID;
  v_group_prog UUID;
  v_group_done UUID;
  v_task1 UUID;
  v_task2 UUID;
  v_task3 UUID;
  v_task4 UUID;
BEGIN
  -- Get first user profile ID as creator/assignee (if exists)
  SELECT id INTO v_admin_id FROM profiles LIMIT 1;
  
  -- Insert Project
  INSERT INTO projects (name, description, status, priority, due_date, progress, color, icon, created_by)
  VALUES ('DevelopWork ERP v1.0', 'Core development of the all-in-one work management platform', 'In Progress', 'Critical', '2026-06-30', 65, '#579BFC', '🚀', v_admin_id)
  RETURNING id INTO v_project_id;

  -- Insert Project Members
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO project_members (project_id, user_id, role) VALUES (v_project_id, v_admin_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Sprint
  INSERT INTO sprints (project_id, name, start_date, end_date, status, goal, velocity)
  VALUES (v_project_id, 'Sprint 1 - Core Release', '2026-05-01', '2026-05-30', 'Active', 'Complete board system and HR integration', 55)
  RETURNING id INTO v_sprint_id;

  -- Insert Board
  INSERT INTO boards (project_id, sprint_id, name, type, default_view, created_by)
  VALUES (v_project_id, v_sprint_id, 'Sprint 1 Kanban Board', 'project', 'kanban', v_admin_id)
  RETURNING id INTO v_board_id;

  -- Insert Board Columns
  INSERT INTO board_columns (board_id, name, type, width, position, options) VALUES
    (v_board_id, 'Task', 'text', 280, 0, '[]'),
    (v_board_id, 'Status', 'status', 140, 1, '[{"label":"Not Started","color":"#6C7A96"},{"label":"In Progress","color":"#FDAB3D"},{"label":"In Review","color":"#A25DDC"},{"label":"Done","color":"#00C875"}]'::jsonb),
    (v_board_id, 'Assignee', 'person', 140, 2, '[]'),
    (v_board_id, 'Due Date', 'date', 130, 3, '[]'),
    (v_board_id, 'Priority', 'priority', 120, 4, '[{"label":"low","color":"#579BFC"},{"label":"medium","color":"#FDAB3D"},{"label":"high","color":"#E2445C"},{"label":"critical","color":"#333"}]'::jsonb);

  -- Insert Board Groups
  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'To Do', '#579BFC', 0) RETURNING id INTO v_group_todo;
  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'In Progress', '#FDAB3D', 1) RETURNING id INTO v_group_prog;
  INSERT INTO board_groups (board_id, name, color, position) VALUES
    (v_board_id, 'Done', '#00C875', 2) RETURNING id INTO v_group_done;

  -- Insert Tasks
  INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, assignee_id, assignee_name, deadline, column_name, sort_order, created_by)
  VALUES (v_project_id, v_sprint_id, 'Design Glassmorphic UI System', 'Create CSS tokens and tokens for dark/light glass mode', 'Done', 'High', v_admin_id, 'Abbas Khan', '2026-05-10', 'Done', 1, v_admin_id) RETURNING id INTO v_task1;

  INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, assignee_id, assignee_name, deadline, column_name, sort_order, created_by)
  VALUES (v_project_id, v_sprint_id, 'Configure Supabase PostgreSQL Schema', 'Set up tables for profiles, tasks, and HR employees', 'Done', 'Critical', v_admin_id, 'Abbas Khan', '2026-05-12', 'Done', 2, v_admin_id) RETURNING id INTO v_task2;

  INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, assignee_id, assignee_name, deadline, column_name, sort_order, created_by)
  VALUES (v_project_id, v_sprint_id, 'Implement Kanban Drag and Drop', 'Add HTML5 drag-and-drop event handlers in React', 'In Progress', 'High', v_admin_id, 'Abbas Khan', '2026-05-20', 'In Progress', 3, v_admin_id) RETURNING id INTO v_task3;

  INSERT INTO tasks (project_id, sprint_id, title, description, status, priority, assignee_id, assignee_name, deadline, column_name, sort_order, created_by)
  VALUES (v_project_id, v_sprint_id, 'Finance & Invoice Charts Integration', 'Integrate revenue vs expense dynamic widgets', 'To Do', 'Medium', v_admin_id, 'Abbas Khan', '2026-05-28', 'To Do', 4, v_admin_id) RETURNING id INTO v_task4;

  -- Insert Board Items
  INSERT INTO board_items (board_id, group_id, task_id, position, fields)
  VALUES (v_board_id, v_group_done, v_task1, 0, '{"Status":"Done","Priority":"high"}'::jsonb);
  INSERT INTO board_items (board_id, group_id, task_id, position, fields)
  VALUES (v_board_id, v_group_done, v_task2, 1, '{"Status":"Done","Priority":"critical"}'::jsonb);
  INSERT INTO board_items (board_id, group_id, task_id, position, fields)
  VALUES (v_board_id, v_group_prog, v_task3, 0, '{"Status":"In Progress","Priority":"high"}'::jsonb);
  INSERT INTO board_items (board_id, group_id, task_id, position, fields)
  VALUES (v_board_id, v_group_todo, v_task4, 0, '{"Status":"Not Started","Priority":"medium"}'::jsonb);

END $$;


-- FILE: 008_set_default_role_admin.sql
-- =============================================================
-- FIX: Change default signup role from employee to admin
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recreate the function with admin as the default role
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin') -- Default is now admin!
  );
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- FILE: 009_add_delete_user_function.sql
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


-- FILE: 010_multi_tenancy.sql
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
-- For profiles: users can see themselves, anyone in the same tenant, or demo profiles
CREATE POLICY "Tenant isolation for profiles" ON profiles
FOR ALL USING (
  tenant_id IS NULL 
  OR tenant_id = get_auth_tenant_id() 
  OR id = auth.uid()
);

-- Ensure user signup trigger can insert new profiles
CREATE POLICY "Allow insert for service" ON profiles
FOR INSERT WITH CHECK (true);

-- For all other tables: allow viewing tenant data as well as global seed data (tenant_id IS NULL)
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
      EXECUTE format('CREATE POLICY "Tenant isolation for %I" ON %I FOR ALL USING (tenant_id IS NULL OR tenant_id = get_auth_tenant_id())', table_name_var, table_name_var);
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
