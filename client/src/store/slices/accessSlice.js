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

    // Full manager profiles with credentials and teams
    managers: [
        {
            id: 'mgr-1',
            userId: 'user-2',
            name: 'Sarah Ahmed',
            email: 'sarah@developwork.com',
            password: 'manager123',
            assignedModule: 'projects',
            teams: [
                {
                    id: 'team-mgr-1',
                    name: 'Frontend Team',
                    members: [
                        { id: 'mem-1', name: 'Usman Ali', email: 'usman@developwork.com', role: 'Developer', joinedAt: '2026-03-16T10:00:00Z' },
                        { id: 'mem-2', name: 'Hina Tariq', email: 'hina@developwork.com', role: 'Designer', joinedAt: '2026-03-17T10:00:00Z' },
                    ],
                },
            ],
            createdAt: '2026-03-15T10:00:00Z',
        },
        {
            id: 'mgr-2',
            userId: 'user-5',
            name: 'Omar Raza',
            email: 'omar@developwork.com',
            password: 'manager123',
            assignedModule: 'hr',
            teams: [
                {
                    id: 'team-mgr-2',
                    name: 'Recruitment Cell',
                    members: [
                        { id: 'mem-3', name: 'Zara Sheikh', email: 'zara@developwork.com', role: 'Recruiter', joinedAt: '2026-03-11T10:00:00Z' },
                    ],
                },
            ],
            createdAt: '2026-03-10T14:30:00Z',
        },
        {
            id: 'mgr-3',
            userId: 'user-3',
            name: 'Ali Hassan',
            email: 'ali@developwork.com',
            password: 'manager123',
            assignedModule: 'finance',
            teams: [],
            createdAt: '2026-03-12T09:00:00Z',
        },
        {
            id: 'mgr-4',
            userId: 'user-4',
            name: 'Fatima Noor',
            email: 'fatima@developwork.com',
            password: 'manager123',
            assignedModule: 'leads',
            teams: [],
            createdAt: '2026-03-18T11:00:00Z',
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

    // Credentials modal state
    credentialsModal: {
        open: false,
        manager: null,
    },

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

        // Manager CRUD
        addManager: (state, action) => {
            const { userId, name, email, moduleKey } = action.payload;
            const newManager = {
                id: `mgr-${Date.now()}`,
                userId,
                name,
                email,
                password: 'manager123',
                assignedModule: moduleKey,
                teams: [],
                createdAt: new Date().toISOString(),
            };
            state.managers.push(newManager);
            // Open the credentials modal
            state.credentialsModal = {
                open: true,
                manager: newManager,
            };
        },
        removeManager: (state, action) => {
            state.managers = state.managers.filter(m => m.id !== action.payload);
        },
        closeCredentialsModal: (state) => {
            state.credentialsModal = { open: false, manager: null };
        },

        // Team management within a manager's module
        addTeamToModule: (state, action) => {
            const { managerId, teamName } = action.payload;
            const manager = state.managers.find(m => m.id === managerId);
            if (manager) {
                manager.teams.push({
                    id: `team-${Date.now()}`,
                    name: teamName,
                    members: [],
                });
            }
        },
        removeTeamFromModule: (state, action) => {
            const { managerId, teamId } = action.payload;
            const manager = state.managers.find(m => m.id === managerId);
            if (manager) {
                manager.teams = manager.teams.filter(t => t.id !== teamId);
            }
        },
        renameTeam: (state, action) => {
            const { managerId, teamId, newName } = action.payload;
            const manager = state.managers.find(m => m.id === managerId);
            if (manager) {
                const team = manager.teams.find(t => t.id === teamId);
                if (team) team.name = newName;
            }
        },

        // Team member management
        addTeamMember: (state, action) => {
            const { managerId, teamId, member } = action.payload;
            const manager = state.managers.find(m => m.id === managerId);
            if (manager) {
                const team = manager.teams.find(t => t.id === teamId);
                if (team) {
                    team.members.push({
                        id: `mem-${Date.now()}`,
                        joinedAt: new Date().toISOString(),
                        ...member,
                    });
                }
            }
        },
        removeTeamMember: (state, action) => {
            const { managerId, teamId, memberId } = action.payload;
            const manager = state.managers.find(m => m.id === managerId);
            if (manager) {
                const team = manager.teams.find(t => t.id === teamId);
                if (team) {
                    team.members = team.members.filter(m => m.id !== memberId);
                }
            }
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
    addManager,
    removeManager,
    closeCredentialsModal,
    addTeamToModule,
    removeTeamFromModule,
    renameTeam,
    addTeamMember,
    removeTeamMember,
    setSelectedModuleForAccess,
    toggleAccessManager,
    setAccessManagerOpen,
    toggleInviteModal,
    setInviteModalOpen,
} = accessSlice.actions;
export default accessSlice.reducer;
