-- Add manager text column to employees table for Org Chart compatibility
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS commission NUMERIC(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT FALSE;

-- Update existing manager_id to manager names (if possible) - but since it's mock/initial, we just add the column
-- For now, we'll just allow the frontend to save the name directly.
