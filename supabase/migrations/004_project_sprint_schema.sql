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

-- Labels
INSERT INTO labels (project_id, name, color) VALUES
  ((SELECT id FROM projects LIMIT 1), 'UI', '#579BFC'),
  ((SELECT id FROM projects LIMIT 1), 'Backend', '#FDAB3D'),
  ((SELECT id FROM projects LIMIT 1), 'Design', '#A25DDC'),
  ((SELECT id FROM projects LIMIT 1), 'Testing', '#00C875'),
  ((SELECT id FROM projects LIMIT 1), 'DevOps', '#E2445C'),
  ((SELECT id FROM projects LIMIT 1), 'Database', '#037F4C'),
  ((SELECT id FROM projects LIMIT 1), 'Frontend', '#FF642E'),
  ((SELECT id FROM projects LIMIT 1), 'Meeting', '#CAB641')
ON CONFLICT (project_id, name) DO NOTHING;

-- Sprint for the first project
INSERT INTO sprints (project_id, name, start_date, end_date, status, goal, velocity) VALUES
  ((SELECT id FROM projects WHERE name = 'Dashboard Redesign v2.0' LIMIT 1),
   'Sprint 24', '2026-05-05', '2026-05-19', 'Active',
   'Complete dashboard widgets and login page redesign', 42),
  ((SELECT id FROM projects WHERE name = 'Dashboard Redesign v2.0' LIMIT 1),
   'Sprint 25', '2026-05-19', '2026-06-02', 'Planning',
   'API integration and testing phase', 0)
ON CONFLICT DO NOTHING;

-- Board for Sprint 24
INSERT INTO boards (project_id, sprint_id, name, type, default_view) VALUES
  ((SELECT id FROM projects WHERE name = 'Dashboard Redesign v2.0' LIMIT 1),
   (SELECT id FROM sprints WHERE name = 'Sprint 24' LIMIT 1),
   'Sprint 24 - Dashboard Redesign', 'project', 'kanban')
ON CONFLICT DO NOTHING;

-- Board Columns (matching mockData structure)
DO $$
DECLARE
  v_board_id UUID;
BEGIN
  SELECT id INTO v_board_id FROM boards WHERE name = 'Sprint 24 - Dashboard Redesign' LIMIT 1;
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

    -- Board Groups
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
