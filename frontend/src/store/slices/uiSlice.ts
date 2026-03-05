import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewType } from '../../types';

interface UIState {
  sidebarCollapsed: boolean;
  aiPanelVisible: boolean;
  activeBoard: string | null;
  activeBoardView: ViewType;
  itemDrawerOpen: boolean;
  selectedItemId: string | null;
  selectedItems: string[];
  loading: boolean;
  error: string | null;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  aiPanelVisible: false,
  activeBoard: null,
  activeBoardView: 'table',
  itemDrawerOpen: false,
  selectedItemId: null,
  selectedItems: [],
  loading: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleAIPanel: (state) => {
      state.aiPanelVisible = !state.aiPanelVisible;
    },
    setActiveBoard: (state, action: PayloadAction<string | null>) => {
      state.activeBoard = action.payload;
    },
    setActiveBoardView: (state, action: PayloadAction<ViewType>) => {
      state.activeBoardView = action.payload;
    },
    openItemDrawer: (state, action: PayloadAction<string>) => {
      state.itemDrawerOpen = true;
      state.selectedItemId = action.payload;
    },
    closeItemDrawer: (state) => {
      state.itemDrawerOpen = false;
      state.selectedItemId = null;
    },
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const index = state.selectedItems.indexOf(itemId);
      if (index > -1) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(itemId);
      }
    },
    clearItemSelection: (state) => {
      state.selectedItems = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleAIPanel,
  setActiveBoard,
  setActiveBoardView,
  openItemDrawer,
  closeItemDrawer,
  toggleItemSelection,
  clearItemSelection,
  setLoading,
  setError,
} = uiSlice.actions;

export default uiSlice.reducer;
