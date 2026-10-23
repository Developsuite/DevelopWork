import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { permissionsService } from './permissionsService';

// Build an ephemeral Supabase client used for the signUp call ONLY.
// signUp on the main client would swap the admin's active session over to the
// newly created user, firing SIGNED_IN in App.jsx and flashing the admin into
// the employee dashboard. This client never persists its session.
const makeSignupClient = () => createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'dw-signup-ephemeral',
        },
    },
);

// ========================
// MANAGER SERVICE
// Handles manager invitations, assignments, and module access
// ========================

export const managerService = {
    // Get all managers from profiles
    async getManagers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'manager')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Get all employees from profiles
    async getEmployees() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'employee')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Get all users (for admin view)
    async getAllUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Invite a new manager — signs up on the ephemeral client so the admin's
    // active session isn't swapped out.
    async inviteManager({ name, email, password, assignedModule }) {
        let tenantId = null;
        try {
            const { data: { session: adminSession } } = await supabase.auth.getSession();
            if (adminSession) {
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', adminSession.user.id).maybeSingle();
                tenantId = profile?.tenant_id || null;
            }
        } catch (err) {
            console.warn('[RBAC] Could not fetch tenant_id for manager invite:', err);
        }

        const signupClient = makeSignupClient();
        const { data: authData, error: authError } = await signupClient.auth.signUp({
            email,
            password,
            options: { data: { name, tenant_id: tenantId, role: 'manager' } },
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to create user account.');

        await new Promise(resolve => setTimeout(resolve, 1200));

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'manager',
                assigned_module: assignedModule,
                name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        if (profileError) throw profileError;

        return { userId, email, name, assignedModule };
    },

    // Invite a new employee with optional granular permissions
    async inviteEmployee({ name, email, password, permissions = [] }) {
        return this.createEmployeeAccount({ name, email, password, role: 'employee', permissions });
    },

    // Create a new employee or manager user account with login credentials & permissions.
    //
    // We signUp through a SEPARATE, ephemeral Supabase client with NO persistence. Using
    // the main `supabase` client swaps its session over to the newly created user — this
    // fires SIGNED_IN in App.jsx, which briefly flashes the admin into the employee
    // dashboard before setSession() restores them. The dedicated client keeps the admin's
    // session completely untouched.
    async createEmployeeAccount({ name, email, password, role = 'employee', permissions = [] }) {
        // Admin's tenant for the new row
        let tenantId = null;
        try {
            const { data: { session: adminSession } } = await supabase.auth.getSession();
            if (adminSession) {
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', adminSession.user.id).maybeSingle();
                tenantId = profile?.tenant_id || null;
            }
        } catch (err) {
            console.warn('[RBAC] Could not fetch tenant_id, continuing:', err);
        }

        const signupClient = makeSignupClient();
        const { data: authData, error: authError } = await signupClient.auth.signUp({
            email,
            password,
            options: { data: { name, tenant_id: tenantId, role } },
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to create user account.');

        // Give the handle_new_user trigger a moment to insert the profile row.
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Patch the role/name on the profile row — the trigger forces role='employee',
        // so for a 'manager' role invite we need to override it here. Use the admin
        // client (the main `supabase`) since the admin's RLS permissions cover this.
        try {
            await supabase
                .from('profiles')
                .update({ role, name, updated_at: new Date().toISOString() })
                .eq('id', userId);
        } catch (err) {
            console.warn('[RBAC] Profile update warning:', err);
        }

        // Save permissions ONLY when the caller explicitly provided some. For a bare
        // invite with no permissions, we must leave the user with zero module access
        // so the admin can grant modules manually afterwards.
        if (permissions && permissions.length > 0) {
            await permissionsService.saveUserPermissions(userId, permissions, { email, name });
        }

        return { userId, email, name, role, permissions };
    },

    // Update a manager's assigned module
    async updateManagerModule(managerId, assignedModule) {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                assigned_module: assignedModule,
                updated_at: new Date().toISOString(),
            })
            .eq('id', managerId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Promote an existing user to manager
    async promoteToManager(userId, assignedModule) {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                role: 'manager',
                assigned_module: assignedModule,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Revoke manager access (demote to employee, preserving granular permissions)
    async revokeManager(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                role: 'employee',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Delete a user entirely from the system (requires Admin)
    async removeUser(userId) {
        try {
            const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
            if (error) throw error;
        } catch (rpcErr) {
            console.warn('[ManagerService] RPC delete_user failed, executing direct profile removal:', rpcErr);
            const { error: delErr } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);
            if (delErr) throw delErr;
        }
        permissionsService.clearLocalPermissions(userId);
    },
};
