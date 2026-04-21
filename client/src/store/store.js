import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import boardReducer from './slices/boardSlice';
import uiReducer from './slices/uiSlice';
import accessReducer from './slices/accessSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    board: boardReducer,
    ui: uiReducer,
    access: accessReducer,
  },
});

export default store;
