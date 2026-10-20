import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callTelegram(action, method = 'POST') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No active session. Please log in again.');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-webhook?action=${action}`, {
        method,
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({}) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
}

export const integrationsService = {
    async getTelegramStatus() {
        return callTelegram('status');
    },

    async connectTelegram() {
        return callTelegram('connect');
    },
};
