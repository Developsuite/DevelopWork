import { supabase } from '../lib/supabase';
import { subscribeToAuthStateChanges } from '../lib/authStateSubscription';

// ========================
// AUTH SERVICE
// ========================

export const authService = {
    // Sign in with email + password
    async signInWithEmail(email, password) {
        console.log('[Auth] Attempting sign in with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('[Auth] Sign in result:', { data, error });
        if (error) throw error;
        return data;
    },

    // Sign in with Google OAuth
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/modules',
            },
        });
        if (error) throw error;
        return data;
    },

    // Sign up with email + password
    async signUp(email, password, name) {
        console.log('[Auth] Attempting sign up with:', email, name);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });
        console.log('[Auth] Sign up result:', { data, error });
        if (error) throw error;
        return data;
    },

    // Sign out
    async signOut(scope = 'global') {
        const { error } = await supabase.auth.signOut({ scope });
        if (error) throw error;
    },

    // Reset password (sends email)
    async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: new URL('/reset-password', window.location.origin).toString(),
        });
        if (error) throw error;
    },

    // Get current session
    async getSession() {
        console.log('[Auth] Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Auth] Session result:', { session: session ? 'exists' : 'null', error });
        if (error) throw error;
        return session;
    },

    // Get user profile from profiles table. Retries once with a short delay to tolerate
    // cold-start blips and the race where the signup trigger hasn't materialised the row yet.
    async getProfile(userId) {
        const fetchOnce = async () => supabase.from('profiles').select('*').eq('id', userId).single();
        let { data, error } = await fetchOnce();
        if (error) {
            await new Promise((r) => setTimeout(r, 600));
            ({ data, error } = await fetchOnce());
        }
        if (error) throw error;
        return data;
    },

    // Update user profile
    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Update user password
    async updatePassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    },

    // Listen for auth state changes (deferred execution to prevent lock deadlocks)
    onAuthStateChange(callback) {
        return subscribeToAuthStateChanges(supabase.auth, callback);
    },
};
