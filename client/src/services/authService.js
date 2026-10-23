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

    // Get user profile from profiles table.
    // Uses maybeSingle() so a missing row returns null instead of a 406 error — essential
    // during the signup-trigger race and when RLS has not yet seen the fresh JWT. Retries
    // once after a short delay to tolerate cold-start blips, but never spams the API.
    async getProfile(userId) {
        const fetchOnce = async () => supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        let { data, error } = await fetchOnce();
        if (!data && !error) {
            await new Promise((r) => setTimeout(r, 600));
            ({ data, error } = await fetchOnce());
        } else if (error) {
            await new Promise((r) => setTimeout(r, 600));
            ({ data, error } = await fetchOnce());
        }
        if (error) throw error;
        return data; // may be null — caller must handle that
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
