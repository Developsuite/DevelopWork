-- Native push registrations for the Capacitor Android and iOS clients.

CREATE TABLE IF NOT EXISTS public.push_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
    provider TEXT NOT NULL CHECK (provider IN ('fcm', 'apns')),
    app_version TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_devices_user_enabled_idx
    ON public.push_devices(user_id, enabled);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_devices_select_own"
    ON public.push_devices FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "push_devices_delete_own"
    ON public.push_devices FOR DELETE TO authenticated
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.register_push_device(
    p_token TEXT,
    p_platform TEXT,
    p_provider TEXT,
    p_app_version TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF p_platform NOT IN ('android', 'ios') OR p_provider NOT IN ('fcm', 'apns') THEN
        RAISE EXCEPTION 'Unsupported push platform or provider';
    END IF;

    INSERT INTO public.push_devices (user_id, token, platform, provider, app_version)
    VALUES (auth.uid(), p_token, p_platform, p_provider, p_app_version)
    ON CONFLICT (token) DO UPDATE SET
        user_id = auth.uid(),
        platform = EXCLUDED.platform,
        provider = EXCLUDED.provider,
        app_version = EXCLUDED.app_version,
        enabled = TRUE,
        last_seen_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.unregister_push_device(p_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.push_devices
    WHERE token = p_token AND user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.register_push_device(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unregister_push_device(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_push_device(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_push_device(TEXT) TO authenticated;

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::JSONB;
