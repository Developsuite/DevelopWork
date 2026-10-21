-- Track who created each lead.
-- created_by (UUID) already exists; add a denormalised name so the lead
-- detail view can show the creator without an extra profiles lookup.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_name TEXT;
