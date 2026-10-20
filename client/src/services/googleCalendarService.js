import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function invoke(action, payload = {}) {
    if (!SUPABASE_URL) throw new Error('Supabase is not configured.');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No active session. Please log in again.');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Google Calendar request failed (${response.status})`);
    return result;
}

export const googleCalendarService = {
    getStatus() {
        return invoke('status');
    },

    async connect(returnPath = '/meetings') {
        const result = await invoke('connect', { return_path: returnPath });
        if (!result.auth_url) throw new Error('Google authorization URL was not returned.');
        return result;
    },

    disconnect() {
        return invoke('disconnect');
    },

    createEvent(event) {
        return invoke('create_event', { event });
    },

    getEvent(eventId, meetingId) {
        return invoke('get_event', { event: { event_id: eventId, meeting_id: meetingId } });
    },

    updateEvent(event) {
        return invoke('update_event', { event });
    },

    deleteEvent(eventId, meetingId) {
        return invoke('delete_event', { event: { event_id: eventId, meeting_id: meetingId } });
    },
};
