import { supabase } from '../lib/supabase';

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
        // Step 1: Save current admin session
        const { data: { session: adminSession } } = await supabase.auth.getSession();

        // Step 2: Create auth user via Supabase signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
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

    // Invite a new employee
    async inviteEmployee({ name, email, password }) {
        const { data: { session: adminSession } } = await supabase.auth.getSession();

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to create user account.');

        await new Promise(resolve => setTimeout(resolve, 2500));

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'employee',
                name: name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        if (profileError) throw profileError;

        if (adminSession) {
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });
        }

        return { userId, email, name };
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

    // Revoke manager access (demote to employee)
    async revokeManager(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                role: 'employee',
                assigned_module: null,
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
        const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
        if (error) throw error;
    },
};
