import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    workspaces: [],
    activeWorkspace: null,
    members: [],
    isLoading: false,
    error: null,
};

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload;
        },
        setActiveWorkspace: (state, action) => {
            state.activeWorkspace = action.payload;
        },
        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);
        },
        updateWorkspace: (state, action) => {
            const index = state.workspaces.findIndex(w => w._id === action.payload._id);
            if (index !== -1) state.workspaces[index] = action.payload;
        },
        setMembers: (state, action) => {
            state.members = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setWorkspaces,
    setActiveWorkspace,
    addWorkspace,
    updateWorkspace,
    setMembers,
    setLoading,
    setError,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
