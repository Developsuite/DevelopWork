-- =============================================================
-- Migration: 013_notifications.sql
-- In-app notification system for task completion events.
-- Run this in your Supabase SQL Editor.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON public.notifications(recipient_id, created_at DESC);

-- RLS: users can only see/update their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (recipient_id = auth.uid());

-- Enable realtime for live push to TopBar bell
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
