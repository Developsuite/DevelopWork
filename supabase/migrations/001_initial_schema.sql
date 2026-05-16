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
