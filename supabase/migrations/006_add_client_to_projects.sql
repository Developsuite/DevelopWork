-- Add client_id and amount to projects table to link Project Management with Clients
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
