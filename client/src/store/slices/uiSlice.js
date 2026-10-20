import { createSlice } from '@reduxjs/toolkit';

// Read saved theme from localStorage, default to 'light'
const getSavedTheme = () => {
    try {
        return localStorage.getItem('dw-theme') || 'light';
    } catch {
        return 'light';
    }
};

// Read saved currency from localStorage, default to 'PKR'
const getSavedCurrency = () => {
    try {
        return localStorage.getItem('dw-currency') || 'PKR';
    } catch {
        return 'PKR';
    }
};

// On phones/tablets the sidebar is an overlay drawer, so it must start closed
// (otherwise it covers the whole screen on first load). On desktop it starts open.
const getInitialSidebarOpen = () => {
    try {
        return window.innerWidth > 768;
    } catch {
        return true;
    }
};

const initialState = {
    theme: getSavedTheme(),
    currency: getSavedCurrency(),
    sidebarOpen: getInitialSidebarOpen(),
    itemDrawerOpen: false,
    activeItemId: null,
    searchOpen: false,
    searchQuery: '',
    toasts: [],
    modals: {
        createBoard: false,
        createWorkspace: false,
        inviteMember: false,
        addTask: false,
        generateReport: false,
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
        setCurrency: (state, action) => {
            state.currency = action.payload; // 'PKR' or 'USD'
            try { localStorage.setItem('dw-currency', state.currency); } catch { }
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
    setCurrency,
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
