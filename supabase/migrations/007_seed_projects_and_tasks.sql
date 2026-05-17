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
