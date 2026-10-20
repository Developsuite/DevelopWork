import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function call(action, body = null, method = 'POST') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No active session. Please log in again.');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/super-admin?action=${action}`, {
        method,
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export const superAdminService = {
    listWorkspaces() {
        return call('list_workspaces', null, 'GET');
    },
    createWorkspace({ name, email, password }) {
        return call('create_workspace', { name, email, password });
    },
    listWorkspaceMembers(adminId) {
        return call('list_workspace_members', { admin_id: adminId });
    },
    resetPassword(userId, password) {
        return call('reset_password', { user_id: userId, password });
    },
    toggleWorkspace(adminId, disabled) {
        return call('toggle_workspace', { admin_id: adminId, disabled });
    },
};
