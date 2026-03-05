import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import boardsReducer from './slices/boardsSlice';
import groupsReducer from './slices/groupsSlice';
import itemsReducer from './slices/itemsSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    boards: boardsReducer,
    groups: groupsReducer,
    items: itemsReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['boards/setBoardData'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
        // Ignore these paths in the state
        ignoredPaths: ['boards.entities', 'groups.entities', 'items.entities'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
