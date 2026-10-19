import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (userId) => notificationService.getForUser(userId)
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markRead',
    async (id) => { await notificationService.markRead(id); return id; }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (userId) => { await notificationService.markAllRead(userId); return userId; }
);

export const deleteNotification = createAsyncThunk(
    'notifications/delete',
    async (id) => { await notificationService.deleteOne(id); return id; }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        loading: false,
    },
    reducers: {
        prependNotification(state, action) {
            // Used by realtime subscription to push new items in
            state.items.unshift(action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const n = state.items.find(i => i.id === action.payload);
                if (n) n.read = true;
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach(n => { n.read = true; });
            })
            .addCase(deleteNotification.fulfilled, (state, action) => {
                state.items = state.items.filter(i => i.id !== action.payload);
            });
    },
});

export const { prependNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
