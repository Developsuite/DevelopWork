import { createSlice } from '@reduxjs/toolkit';

// Read saved theme from localStorage, default to 'light'
const getSavedTheme = () => {
    try {
        return localStorage.getItem('dw-theme') || 'light';
    } catch {
        return 'light';
    }
};

const initialState = {
    theme: getSavedTheme(),
    sidebarOpen: true,
    itemDrawerOpen: false,
    activeItemId: null,
    searchOpen: false,
    searchQuery: '',
    toasts: [],
    modals: {
        createBoard: false,
        createWorkspace: false,
        inviteMember: false,
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            try { localStorage.setItem('dw-theme', state.theme); } catch { }
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
            try { localStorage.setItem('dw-theme', state.theme); } catch { }
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        openItemDrawer: (state, action) => {
            state.itemDrawerOpen = true;
            state.activeItemId = action.payload;
        },
        closeItemDrawer: (state) => {
            state.itemDrawerOpen = false;
            state.activeItemId = null;
        },
        toggleSearch: (state) => {
            state.searchOpen = !state.searchOpen;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        addToast: (state, action) => {
            state.toasts.push({
                id: Date.now(),
                ...action.payload,
            });
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
        openModal: (state, action) => {
            state.modals[action.payload] = true;
        },
        closeModal: (state, action) => {
            state.modals[action.payload] = false;
        },
    },
});

export const {
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarOpen,
    openItemDrawer,
    closeItemDrawer,
    toggleSearch,
    setSearchQuery,
    addToast,
    removeToast,
    openModal,
    closeModal,
} = uiSlice.actions;
export default uiSlice.reducer;
