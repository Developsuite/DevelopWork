-- =============================================================
-- Migration: 013_notifications.sql
-- In-app notification system for task completion events.
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- Drop existing table if it has a different schema, then recreate cleanly
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name  TEXT,
    type         TEXT NOT NULL DEFAULT 'task_completed',
    title        TEXT NOT NULL,
    message      TEXT NOT NULL,
    task_id      UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    task_title   TEXT,
    read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX notifications_recipient_id_idx
    ON public.notifications(recipient_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "notifications_update"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_delete"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (recipient_id = auth.uid());

-- Enable realtime (skip if publication is already FOR ALL TABLES)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime' AND puballtables = FALSE
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
