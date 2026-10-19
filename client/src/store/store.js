import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import boardReducer from './slices/boardSlice';
import uiReducer from './slices/uiSlice';
import accessReducer from './slices/accessSlice';
import projectReducer from './slices/projectSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    board: boardReducer,
    ui: uiReducer,
    access: accessReducer,
    project: projectReducer,
    notifications: notificationsReducer,
  },
});

export default store;
