import { createClient } from '@supabase/supabase-js';
import { capturePasswordRecoveryIntent, markPasswordRecoveryReady } from './passwordRecovery';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

// Capture the recovery URL before Supabase consumes and cleans its hash parameters.
capturePasswordRecoveryIntent();

// Module-level reference used by the retry-fetch wrapper below.
// Set immediately after the client is created (line ~50).
let _supabase = null;
let _refreshPromise = null;
let _lastRefreshAt = 0;
const REFRESH_COOLDOWN_MS = 10_000; // never fire more than one refresh per 10s

/**
 * Custom fetch that intercepts 401 responses from Supabase PostgREST.
 *
 * When the browser tab is in the background, JS timers are throttled and
 * Supabase's internal autoRefreshToken may fail to renew the JWT in time.
 * If a data query then hits PostgREST with an expired token, it gets a 401.
 *
 * This wrapper catches that 401, shares a single refresh promise across all
 * concurrent failed requests, swaps in the new access token, and retries.
 * A hard cooldown prevents a stream of 401s from spamming the refresh_token
 * endpoint and getting the user rate-limited (429) and signed out.
 */
const autoRetryFetch = async (url, options = {}) => {
    let response = await fetch(url, options);

    const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/');
    if (response.status === 401 && !isAuthEndpoint && _supabase) {
        const now = Date.now();
        const inCooldown = now - _lastRefreshAt < REFRESH_COOLDOWN_MS;

        if (inCooldown && !_refreshPromise) {
            // We just refreshed and this request is STILL 401. Another refresh will not
            // help and will eventually trigger a 429. Return the 401 and let the caller
            // decide. This prevents the auto-logout loop.
            return response;
        }

        try {
            if (!_refreshPromise) {
                console.warn('[Supabase] 401 detected — refreshing session and retrying…');
                _lastRefreshAt = now;
                _refreshPromise = _supabase.auth.refreshSession().finally(() => {
                    _refreshPromise = null;
                });
            }

            const { data, error } = await _refreshPromise;
            if (error || !data?.session) {
                // Refresh itself failed. Do not retry — further requests will keep failing
                // and firing new refreshes. The user will be prompted to log in on the next
                // guard check instead.
                return response;
            }

            // Clone options and inject the fresh access token
            const retryHeaders = new Headers(options.headers || {});
            retryHeaders.set('Authorization', `Bearer ${data.session.access_token}`);
            retryHeaders.set('apikey', supabaseAnonKey);

            response = await fetch(url, { ...options, headers: retryHeaders });
        } catch (err) {
            console.error('[Supabase] Session refresh during retry failed:', err);
        }
    }

    return response;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    global: {
        fetch: autoRetryFetch,
    },
});

// Keep a small, session-scoped proof that this browser received a genuine
// Supabase password-recovery session. The reset page will not accept an
// ordinary logged-in session as authority to change a password.
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        markPasswordRecoveryReady(session?.user?.id);
    }
});

// Wire up the module-level reference now that the client exists.
_supabase = supabase;
