-- =============================================================
-- Google Calendar integration and durable workspace meetings
-- One Google connection per tenant/workspace.
-- OAuth tokens are encrypted by the Edge Function before storage.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
    tenant_id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    connected_by             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    google_email             TEXT NOT NULL,
    calendar_id              TEXT NOT NULL DEFAULT 'primary',
    encrypted_refresh_token  TEXT NOT NULL,
    token_iv                 TEXT NOT NULL,
    scopes                   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    connected_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at             TIMESTAMPTZ,
    last_error               TEXT
);

CREATE TABLE IF NOT EXISTS public.google_oauth_states (
    state_hash   TEXT PRIMARY KEY,
    tenant_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    return_path  TEXT NOT NULL DEFAULT '/meetings',
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS google_oauth_states_expiry_idx
    ON public.google_oauth_states(expires_at);

-- This module previously relied on localStorage. The table intentionally uses
-- TEXT IDs so existing mtg-* identifiers can be migrated without conversion.
CREATE TABLE IF NOT EXISTS public.meetings (
    id                    TEXT PRIMARY KEY,
    tenant_id             UUID NOT NULL DEFAULT public.get_auth_tenant_id() REFERENCES public.profiles(id) ON DELETE CASCADE,
    title                 TEXT NOT NULL,
    client_id             TEXT,
    client_name           TEXT DEFAULT '',
    client_company        TEXT DEFAULT '',
    client_email          TEXT DEFAULT '',
    client_phone          TEXT DEFAULT '',
    project_id            TEXT,
    project_name          TEXT DEFAULT '',
    type                  TEXT NOT NULL DEFAULT 'Client Discovery',
    status                TEXT NOT NULL DEFAULT 'Scheduled',
    date                  DATE NOT NULL,
    time                  TIME NOT NULL,
    duration              INTEGER NOT NULL DEFAULT 30 CHECK (duration > 0 AND duration <= 1440),
    timezone              TEXT NOT NULL DEFAULT 'Asia/Karachi',
    platform              TEXT NOT NULL DEFAULT 'Google Meet',
    meeting_link          TEXT DEFAULT '',
    location              TEXT DEFAULT 'Online Video Call',
    host                  JSONB NOT NULL DEFAULT '{}'::JSONB,
    attendees             JSONB NOT NULL DEFAULT '[]'::JSONB,
    agenda                JSONB NOT NULL DEFAULT '[]'::JSONB,
    notes                 TEXT DEFAULT '',
    action_items          JSONB NOT NULL DEFAULT '[]'::JSONB,
    google_event_id       TEXT,
    google_calendar_id    TEXT,
    google_event_url      TEXT,
    google_sync_status    TEXT NOT NULL DEFAULT 'not_synced'
        CHECK (google_sync_status IN ('not_synced', 'pending', 'synced', 'failed', 'cancelled')),
    google_sync_error     TEXT,
    created_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meetings_tenant_date_idx
    ON public.meetings(tenant_id, date, time);
CREATE UNIQUE INDEX IF NOT EXISTS meetings_google_event_idx
    ON public.meetings(tenant_id, google_event_id)
    WHERE google_event_id IS NOT NULL;

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- No browser-facing policies are intentionally created for OAuth tokens or
-- states. Only the service-role Google Calendar Edge Function can access them.

DROP POLICY IF EXISTS meetings_tenant_select ON public.meetings;
CREATE POLICY meetings_tenant_select ON public.meetings
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_auth_tenant_id());

DROP POLICY IF EXISTS meetings_tenant_insert ON public.meetings;
CREATE POLICY meetings_tenant_insert ON public.meetings
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = public.get_auth_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles actor
            WHERE actor.id = auth.uid()
              AND (
                  actor.role = 'admin'
                  OR (
                      actor.role = 'manager'
                      AND (
                          actor.assigned_module = 'meetings'
                          OR actor.permissions ? 'meetings'
                          OR actor.permissions ? 'meetings.*'
                      )
                  )
              )
        )
    );

DROP POLICY IF EXISTS meetings_tenant_update ON public.meetings;
CREATE POLICY meetings_tenant_update ON public.meetings
    FOR UPDATE TO authenticated
    USING (
        tenant_id = public.get_auth_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles actor
            WHERE actor.id = auth.uid()
              AND (
                  actor.role = 'admin'
                  OR (
                      actor.role = 'manager'
                      AND (
                          actor.assigned_module = 'meetings'
                          OR actor.permissions ? 'meetings'
                          OR actor.permissions ? 'meetings.*'
                      )
                  )
              )
        )
    )
    WITH CHECK (tenant_id = public.get_auth_tenant_id());

DROP POLICY IF EXISTS meetings_tenant_delete ON public.meetings;
CREATE POLICY meetings_tenant_delete ON public.meetings
    FOR DELETE TO authenticated
    USING (
        tenant_id = public.get_auth_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles actor
            WHERE actor.id = auth.uid()
              AND (
                  actor.role = 'admin'
                  OR (
                      actor.role = 'manager'
                      AND (
                          actor.assigned_module = 'meetings'
                          OR actor.permissions ? 'meetings'
                          OR actor.permissions ? 'meetings.*'
                      )
                  )
              )
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;

COMMENT ON TABLE public.google_calendar_connections IS
    'Workspace-scoped Google Calendar OAuth connections. Tokens are AES-GCM encrypted by the Edge Function.';
COMMENT ON TABLE public.meetings IS
    'Tenant-isolated meetings synchronized with external calendars when configured.';
