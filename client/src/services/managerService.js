import { supabase } from '../lib/supabase';

import { permissionsService } from './permissionsService';

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

    // Invite a new manager:
    // 1. Save admin's current session
    // 2. Create auth user via signUp
    // 3. Update their profile to role=manager with assigned_module
    // 4. Restore admin session
    async inviteManager({ name, email, password, assignedModule }) {
        // Step 1: Save current admin session and get tenant_id
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        let tenantId = null;
        if (adminSession) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', adminSession.user.id).single();
            tenantId = profile?.tenant_id;
        }

        // Step 2: Create auth user via Supabase signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, tenant_id: tenantId, role: 'manager' },
            },
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to create user account.');

        // Step 3: Wait for the profile trigger to fire (Supabase triggers can take a moment)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Step 4: Update profile to manager role with assigned module
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'manager',
                assigned_module: assignedModule,
                name: name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        if (profileError) throw profileError;

        // Step 5: Restore admin session
        if (adminSession) {
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });
        }

        return { userId, email, name, assignedModule };
    },

    // Invite a new employee with optional granular permissions
    async inviteEmployee({ name, email, password, permissions = [] }) {
        return this.createEmployeeAccount({ name, email, password, role: 'employee', permissions });
    },

    // Create a new employee or manager user account with login credentials & permissions
    async createEmployeeAccount({ name, email, password, role = 'employee', permissions = [] }) {
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        let tenantId = null;
        if (adminSession) {
            try {
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', adminSession.user.id).single();
                tenantId = profile?.tenant_id;
            } catch (err) {
                console.warn('[RBAC] Could not fetch tenant_id, continuing:', err);
            }
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, tenant_id: tenantId, role } },
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to create user account.');

        // Wait a moment for the profile trigger to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await supabase
                .from('profiles')
                .update({
                    role: role,
                    name: name,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);
        } catch (err) {
            console.warn('[RBAC] Profile update warning (trigger may have set role already):', err);
        }

        // Save granular permissions for this user
        if (permissions && permissions.length > 0) {
            await permissionsService.saveUserPermissions(userId, permissions, { email, name });
        }

        // Restore admin session so admin stays logged in seamlessly
        if (adminSession) {
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });
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
