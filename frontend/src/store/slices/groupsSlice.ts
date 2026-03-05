import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '../../types';

interface GroupsState {
  byId: Record<string, Group>;
  allIds: string[];
}

const initialState: GroupsState = {
  byId: {},
  allIds: [],
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroupsData: (state, action: PayloadAction<{ groups: Group[] }>) => {
      const { groups } = action.payload;
      state.byId = {};
      state.allIds = [];
      
      groups.forEach((group) => {
        state.byId[group.id] = group;
        state.allIds.push(group.id);
      });
    },
    addGroup: (state, action: PayloadAction<Group>) => {
      const group = action.payload;
      state.byId[group.id] = group;
      state.allIds.push(group.id);
    },
    updateGroup: (state, action: PayloadAction<Partial<Group> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = { ...state.byId[id], ...updates };
      }
    },
    toggleGroupCollapse: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      if (state.byId[groupId]) {
        state.byId[groupId].collapsed = !state.byId[groupId].collapsed;
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      delete state.byId[groupId];
      state.allIds = state.allIds.filter((id) => id !== groupId);
    },
  },
});

export const {
  setGroupsData,
  addGroup,
  updateGroup,
  toggleGroupCollapse,
  removeGroup,
} = groupsSlice.actions;

export default groupsSlice.reducer;
