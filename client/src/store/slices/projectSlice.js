import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    projects: [
        {
            id: 1,
            name: 'Dashboard Redesign v2.0',
            description: 'Complete overhaul of the admin dashboard with new analytics widgets.',
            status: 'In Progress',
            priority: 'High',
            progress: 65,
            dueDate: '2026-05-15',
            members: ['Abbas Khan', 'Sarah Ahmed', 'Ali Hassan'],
            tasksTotal: 24,
            tasksDone: 16,
        },
        {
            id: 2,
            name: 'Mobile App Development',
            description: 'React Native cross-platform mobile application for iOS and Android.',
            status: 'In Progress',
            priority: 'Critical',
            progress: 42,
            dueDate: '2026-06-30',
            members: ['Omar Raza', 'Fatima Noor'],
            tasksTotal: 48,
            tasksDone: 20,
        },
        {
            id: 3,
            name: 'API Gateway Migration',
            description: 'Migrate legacy REST APIs to new GraphQL-based gateway architecture.',
            status: 'Planning',
            priority: 'Medium',
            progress: 15,
            dueDate: '2026-07-01',
            members: ['Ali Hassan', 'Abbas Khan'],
            tasksTotal: 12,
            tasksDone: 2,
        },
        {
            id: 4,
            name: 'Customer Onboarding Flow',
            description: 'Redesign the onboarding experience for new enterprise customers.',
            status: 'Completed',
            priority: 'High',
            progress: 100,
            dueDate: '2026-03-20',
            members: ['Sarah Ahmed', 'Fatima Noor', 'Omar Raza'],
            tasksTotal: 18,
            tasksDone: 18,
        },
        {
            id: 5,
            name: 'Performance Optimization',
            description: 'Improve application load times and reduce database query latency.',
            status: 'In Progress',
            priority: 'High',
            progress: 78,
            dueDate: '2026-04-28',
            members: ['Abbas Khan'],
            tasksTotal: 12,
            tasksDone: 9,
        },
    ],
    isCreateModalOpen: false,
};

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        addProject: (state, action) => {
            state.projects.unshift(action.payload);
        },
        updateProject: (state, action) => {
            const index = state.projects.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.projects[index] = { ...state.projects[index], ...action.payload };
            }
        },
        deleteProject: (state, action) => {
            state.projects = state.projects.filter(p => p.id !== action.payload);
        },
        setCreateModalOpen: (state, action) => {
            state.isCreateModalOpen = action.payload;
        },
        assignMember: (state, action) => {
            const { projectId, memberName } = action.payload;
            const project = state.projects.find(p => p.id === projectId);
            if (project && !project.members.includes(memberName)) {
                project.members.push(memberName);
            }
        },
        removeMember: (state, action) => {
            const { projectId, memberName } = action.payload;
            const project = state.projects.find(p => p.id === projectId);
            if (project) {
                project.members = project.members.filter(m => m !== memberName);
            }
        },
    },
});

export const { addProject, updateProject, deleteProject, setCreateModalOpen, assignMember, removeMember } = projectSlice.actions;
export default projectSlice.reducer;
