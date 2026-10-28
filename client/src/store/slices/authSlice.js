import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { nativePushService } from '../../services/nativePushService';

// ========================
// ASYNC THUNKS
// ========================

export const signInWithEmail = createAsyncThunk(
    'auth/signInWithEmail',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const data = await authService.signInWithEmail(email, password);
            let profile = null;
            try {
                profile = await authService.getProfile(data.user.id);
            } catch (err) {
                console.warn('[Auth] Failed to get profile during sign in, using fallback:', err.message);
            }
            if (!profile) {
                return {
                    id: data.user.id,
                    _id: data.user.id,
                    name: data.user.user_metadata?.name || email.split('@')[0],
                    email: email,
                    role: data.user.user_metadata?.role || 'employee',
                };
            }
            return {
                id: profile.id,
                _id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                assignedModule: profile.assigned_module,
                permissions: profile.permissions || [],
                department: profile.department,
                avatar: profile.avatar_url,
                phone: profile.phone,
                location: profile.location,
                jobTitle: profile.job_title || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-job-title-${profile.id}`) : '') || 'Product Lead',
                bio: profile.bio || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-bio-${profile.id}`) : '') || 'Building the future of work management.',
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signUpWithEmail = createAsyncThunk(
    'auth/signUpWithEmail',
    async ({ email, password, name }, { rejectWithValue }) => {
        try {
            const data = await authService.signUp(email, password, name);
            // If email confirmation is disabled, Supabase returns a session immediately
            if (data.session && data.user) {
                // Wait a moment for the database trigger to create the profile
                await new Promise(resolve => setTimeout(resolve, 1000));
                let profile = null;
                try { profile = await authService.getProfile(data.user.id); } catch { /* ignore */ }
                if (!profile) {
                    return {
                        id: data.user.id,
                        _id: data.user.id,
                        name: name,
                        email: email,
                        role: data.user.user_metadata?.role || 'employee',
                        autoLoggedIn: true,
                    };
                }
                return {
                    id: profile.id,
                    _id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role,
                    assignedModule: profile.assigned_module,
                    permissions: profile.permissions || [],
                    department: profile.department,
                    avatar: profile.avatar_url,
                    phone: profile.phone,
                    location: profile.location,
                    jobTitle: profile.job_title || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-job-title-${profile.id}`) : '') || 'Product Lead',
                    bio: profile.bio || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-bio-${profile.id}`) : '') || 'Building the future of work management.',
                    autoLoggedIn: true,
                };
            }
            // If email confirmation is required, just return success
            return { email, name, autoLoggedIn: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signInWithGoogle = createAsyncThunk(
    'auth/signInWithGoogle',
    async (_, { rejectWithValue }) => {
        try {
            await authService.signInWithGoogle();
            return null; // Redirect happens, no data to return
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const restoreSession = createAsyncThunk(
    'auth/restoreSession',
    async () => {
        try {
            const session = await authService.getSession();
            if (!session) return null;

            // A recovery session is temporary authorization to set a new
            // password, not a normal application sign-in.
            if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
                return null;
            }
            
            let profile = null;
            try {
                profile = await authService.getProfile(session.user.id);
            } catch (err) {
                console.warn('[Auth] Failed to get profile during session restore, using fallback:', err.message);
            }
            if (!profile) {
                return {
                    id: session.user.id,
                    _id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                    email: session.user.email,
                    role: session.user.user_metadata?.role || 'employee',
                };
            }
            return {
                id: profile.id,
                _id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                assignedModule: profile.assigned_module,
                permissions: profile.permissions || [],
                department: profile.department,
                avatar: profile.avatar_url,
                phone: profile.phone,
                location: profile.location,
                jobTitle: profile.job_title || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-job-title-${profile.id}`) : '') || 'Product Lead',
                bio: profile.bio || (typeof window !== 'undefined' ? localStorage.getItem(`dw-profile-bio-${profile.id}`) : '') || 'Building the future of work management.',
            };
        } catch {
            return null;
        }
    }
);

export const signOutUser = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        try {
            await nativePushService.unregisterCurrentDevice();
            await authService.signOut();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ email }, { rejectWithValue }) => {
        try {
            await authService.resetPassword(email);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ========================
// SLICE
// ========================

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        isLoading: true, // true initially while restoring session
        isResettingPassword: false,
        error: null,
        signUpSuccess: false,
        resetSuccess: false,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSignUpSuccess: (state) => {
            state.signUpSuccess = false;
        },
        clearResetSuccess: (state) => {
            state.resetSuccess = false;
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.isLoading = false;
        },
        // Keep these for backward compatibility with existing components
        loginSuccess: (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            // Sign In with Email
            .addCase(signInWithEmail.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signInWithEmail.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(signInWithEmail.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Sign In with Google
            .addCase(signInWithGoogle.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signInWithGoogle.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(signInWithGoogle.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Sign Up
            .addCase(signUpWithEmail.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(signUpWithEmail.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload?.autoLoggedIn) {
                    state.isAuthenticated = true;
                    state.user = action.payload;
                } else {
                    state.signUpSuccess = true;
                }
            })
            .addCase(signUpWithEmail.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Restore Session
            .addCase(restoreSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload) {
                    state.isAuthenticated = true;
                    state.user = action.payload;
                }
            })
            .addCase(restoreSession.rejected, (state) => {
                state.isLoading = false;
            })
            // Sign Out
            .addCase(signOutUser.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.isResettingPassword = true;
                state.error = null;
                state.resetSuccess = false;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.resetSuccess = true;
                state.isResettingPassword = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.error = action.payload;
                state.isResettingPassword = false;
            });
    },
});

export const { clearError, clearSignUpSuccess, clearResetSuccess, setUser, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
