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

// Guard the Supabase /auth/v1/token endpoint. Supabase JS has its own internal
// auto-refresh timer; if the stored token is broken (e.g. a prior rate-limit left
// bad state), every getSession() call fires another token request, which gets
// another 429, which keeps the session in a dead state and eventually auto-logs
// the user out. We intercept token requests, cap them to one per 2 seconds, and
// after an actual 429 we respect the server's Retry-After for a cooldown window.
let _lastTokenCallAt = 0;
let _tokenCooldownUntil = 0;
const TOKEN_CALL_MIN_INTERVAL_MS = 2_000;
const synth429 = () => new Response(
  JSON.stringify({ error: 'rate_limited', msg: 'Token refresh paused locally to avoid 429 loop.' }),
  { status: 429, headers: { 'Content-Type': 'application/json' } },
);

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
    const urlStr = typeof url === 'string' ? url : url?.toString?.() || '';
    const isTokenEndpoint = urlStr.includes('/auth/v1/token');

    // Pre-flight guard: hard-stop runaway token refreshes BEFORE they leave the browser.
    // These are the ONLY requests that cost us 429s on the auth endpoint.
    if (isTokenEndpoint) {
        const now = Date.now();
        if (now < _tokenCooldownUntil) {
            return synth429();
        }
        if (now - _lastTokenCallAt < TOKEN_CALL_MIN_INTERVAL_MS) {
            return synth429();
        }
        _lastTokenCallAt = now;
    }

    let response = await fetch(url, options);

    // Respect server rate-limit signals so Supabase's internal refresh stops hammering.
    if (isTokenEndpoint && response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 30;
        _tokenCooldownUntil = Date.now() + Math.max(retryAfter * 1000, 15_000);
        console.warn(`[Supabase] Auth token endpoint returned 429 — pausing refreshes for ${Math.round((_tokenCooldownUntil - Date.now()) / 1000)}s`);
    }

    const isAuthEndpoint = urlStr.includes('/auth/');
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
