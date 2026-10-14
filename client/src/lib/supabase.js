import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

// Module-level reference used by the retry-fetch wrapper below.
// Set immediately after the client is created (line ~50).
let _supabase = null;
let _refreshPromise = null;

/**
 * Custom fetch that intercepts 401 responses from Supabase PostgREST.
 *
 * When the browser tab is in the background, JS timers are throttled and
 * Supabase's internal autoRefreshToken may fail to renew the JWT in time.
 * If a data query then hits PostgREST with an expired token, it gets a 401.
 *
 * This wrapper catches that 401, shares a single refresh promise across all
 * concurrent failed requests, swaps in the new access token, and retries.
 */
const autoRetryFetch = async (url, options = {}) => {
    let response = await fetch(url, options);

    const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/');
    if (response.status === 401 && !isAuthEndpoint && _supabase) {
        try {
            if (!_refreshPromise) {
                console.warn('[Supabase] 401 detected — refreshing session and retrying…');
                _refreshPromise = _supabase.auth.refreshSession().finally(() => {
                    _refreshPromise = null;
                });
            }

            const { data } = await _refreshPromise;

            if (data?.session) {
                // Clone options and inject the fresh access token
                const retryHeaders = new Headers(options.headers || {});
                retryHeaders.set('Authorization', `Bearer ${data.session.access_token}`);
                retryHeaders.set('apikey', supabaseAnonKey);

                response = await fetch(url, { ...options, headers: retryHeaders });
                console.log('[Supabase] Retry succeeded with fresh token');
            }
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

// Wire up the module-level reference now that the client exists.
_supabase = supabase;
