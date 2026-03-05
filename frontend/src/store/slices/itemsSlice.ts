import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../../types';

interface ItemsState {
  byId: Record<string, Item>;
  allIds: string[];
}

const initialState: ItemsState = {
  byId: {},
  allIds: [],
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItemsData: (state, action: PayloadAction<{ items: Item[] }>) => {
      const { items } = action.payload;
      state.byId = {};
      state.allIds = [];
      
      items.forEach((item) => {
        state.byId[item.id] = item;
        state.allIds.push(item.id);
      });
    },
    addItem: (state, action: PayloadAction<Item>) => {
      const item = action.payload;
      state.byId[item.id] = item;
      state.allIds.push(item.id);
    },
    updateItem: (state, action: PayloadAction<Partial<Item> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = { ...state.byId[id], ...updates };
      }
    },
    updateItemField: (
      state,
      action: PayloadAction<{ itemId: string; field: string; value: any }>
    ) => {
      const { itemId, field, value } = action.payload;
      if (state.byId[itemId]) {
        state.byId[itemId].fields[field] = value;
        state.byId[itemId].updatedAt = new Date();
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      delete state.byId[itemId];
      state.allIds = state.allIds.filter((id) => id !== itemId);
    },
    batchUpdateItems: (
      state,
      action: PayloadAction<Array<Partial<Item> & { id: string }>>
    ) => {
      action.payload.forEach((update) => {
        const { id, ...updates } = update;
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates };
        }
      });
    },
  },
});

export const {
  setItemsData,
  addItem,
  updateItem,
  updateItemField,
  removeItem,
  batchUpdateItems,
} = itemsSlice.actions;

export default itemsSlice.reducer;
