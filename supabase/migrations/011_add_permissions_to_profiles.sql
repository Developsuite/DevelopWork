-- Migration 011: Add permissions column to profiles table for granular RBAC
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.permissions IS 'Array of granted RBAC permission keys and module wildcards';
