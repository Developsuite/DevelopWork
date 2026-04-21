import { createSlice } from '@reduxjs/toolkit';

// Mock access data — which managers are assigned to which modules
const initialState = {
    // Active modules the admin has enabled
    activeModules: ['projects', 'hr', 'finance', 'leads', 'support', 'docs'],

    // Access assignments: module -> list of managers with access
    accessList: [
        {
            id: 'access-1',
            moduleKey: 'projects',
            userId: 'user-2',
            userName: 'Sarah Ahmed',
            userEmail: 'sarah@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-15T10:00:00Z',
            status: 'active',
        },
        {
            id: 'access-2',
            moduleKey: 'hr',
            userId: 'user-5',
            userName: 'Omar Raza',
            userEmail: 'omar@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-10T14:30:00Z',
            status: 'active',
        },
        {
            id: 'access-3',
            moduleKey: 'finance',
            userId: 'user-3',
            userName: 'Ali Hassan',
            userEmail: 'ali@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-12T09:00:00Z',
            status: 'active',
        },
        {
            id: 'access-4',
            moduleKey: 'leads',
            userId: 'user-4',
            userName: 'Fatima Noor',
            userEmail: 'fatima@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-18T11:00:00Z',
            status: 'active',
        },
        {
            id: 'access-5',
            moduleKey: 'support',
            userId: 'user-2',
            userName: 'Sarah Ahmed',
            userEmail: 'sarah@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-20T08:00:00Z',
            status: 'active',
        },
        {
            id: 'access-6',
            moduleKey: 'docs',
            userId: 'user-5',
            userName: 'Omar Raza',
            userEmail: 'omar@developwork.com',
            role: 'manager',
            assignedAt: '2026-03-22T16:00:00Z',
            status: 'active',
        },
    ],

    // Pending invitations
    pendingInvites: [
        {
            id: 'invite-1',
            moduleKey: 'finance',
            email: 'newmanager@company.com',
            sentAt: '2026-04-01T10:00:00Z',
            status: 'pending',
        },
    ],

    // Currently selected module in the hub for access management
    selectedModuleForAccess: null,

    // Access manager modal state
    accessManagerOpen: false,
    inviteModalOpen: false,
};

const accessSlice = createSlice({
    name: 'access',
    initialState,
    reducers: {
        toggleModule: (state, action) => {
            const moduleKey = action.payload;
            if (state.activeModules.includes(moduleKey)) {
                state.activeModules = state.activeModules.filter(m => m !== moduleKey);
            } else {
                state.activeModules.push(moduleKey);
            }
        },
        setActiveModules: (state, action) => {
            state.activeModules = action.payload;
        },
        addAccess: (state, action) => {
            state.accessList.push({
                id: `access-${Date.now()}`,
                assignedAt: new Date().toISOString(),
                status: 'active',
                ...action.payload,
            });
        },
        removeAccess: (state, action) => {
            state.accessList = state.accessList.filter(a => a.id !== action.payload);
        },
        addInvite: (state, action) => {
            state.pendingInvites.push({
                id: `invite-${Date.now()}`,
                sentAt: new Date().toISOString(),
                status: 'pending',
                ...action.payload,
            });
        },
        removeInvite: (state, action) => {
            state.pendingInvites = state.pendingInvites.filter(i => i.id !== action.payload);
        },
        setSelectedModuleForAccess: (state, action) => {
            state.selectedModuleForAccess = action.payload;
        },
        toggleAccessManager: (state) => {
            state.accessManagerOpen = !state.accessManagerOpen;
        },
        setAccessManagerOpen: (state, action) => {
            state.accessManagerOpen = action.payload;
        },
        toggleInviteModal: (state) => {
            state.inviteModalOpen = !state.inviteModalOpen;
        },
        setInviteModalOpen: (state, action) => {
            state.inviteModalOpen = action.payload;
        },
    },
});

export const {
    toggleModule,
    setActiveModules,
    addAccess,
    removeAccess,
    addInvite,
    removeInvite,
    setSelectedModuleForAccess,
    toggleAccessManager,
    setAccessManagerOpen,
    toggleInviteModal,
    setInviteModalOpen,
} = accessSlice.actions;
export default accessSlice.reducer;
