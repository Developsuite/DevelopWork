import { createSlice } from '@reduxjs/toolkit';

// Restore auth from localStorage
const getSavedAuth = () => {
    try {
        const saved = localStorage.getItem('dw-auth');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                user: parsed.user || null,
                isAuthenticated: !!parsed.user,
                isLoading: false,
                error: null,
            };
        }
    } catch { }
    return null;
};

const savedAuth = getSavedAuth();

const initialState = savedAuth || {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const persistAuth = (state) => {
    try {
        localStorage.setItem('dw-auth', JSON.stringify({
            user: state.user,
        }));
    } catch { }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
            state.error = null;
            persistAuth(state);
        },
        loginFailure: (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
            try { localStorage.removeItem('dw-auth'); } catch { }
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            persistAuth(state);
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
