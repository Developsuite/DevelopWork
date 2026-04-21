import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    boards: {},
    groups: {},
    items: {},
    activeBoard: null,
    activeView: 'table',
    isLoading: false,
    error: null,
};

const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        setBoardData: (state, action) => {
            const { board, groups, items } = action.payload;
            state.boards[board._id] = board;
            groups.forEach(g => { state.groups[g._id] = g; });
            items.forEach(i => { state.items[i._id] = i; });
        },
        setActiveBoard: (state, action) => {
            state.activeBoard = action.payload;
        },
        setActiveView: (state, action) => {
            state.activeView = action.payload;
        },
        updateItem: (state, action) => {
            const { itemId, updates } = action.payload;
            if (state.items[itemId]) {
                state.items[itemId] = { ...state.items[itemId], ...updates };
            }
        },
        addItem: (state, action) => {
            const item = action.payload;
            state.items[item._id] = item;
        },
        removeItem: (state, action) => {
            delete state.items[action.payload];
        },
        addGroup: (state, action) => {
            const group = action.payload;
            state.groups[group._id] = group;
        },
        updateGroup: (state, action) => {
            const { groupId, updates } = action.payload;
            if (state.groups[groupId]) {
                state.groups[groupId] = { ...state.groups[groupId], ...updates };
            }
        },
        addBoard: (state, action) => {
            const board = action.payload;
            state.boards[board._id] = board;
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
    setBoardData,
    setActiveBoard,
    setActiveView,
    updateItem,
    addItem,
    removeItem,
    addGroup,
    updateGroup,
    addBoard,
    setLoading,
    setError,
} = boardSlice.actions;
export default boardSlice.reducer;
