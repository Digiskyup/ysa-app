import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  fcmToken: string | null;
  isDrawerOpen: boolean;
  permissionGranted: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  isDrawerOpen: false,
  permissionGranted: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    setNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDrawerOpen = action.payload;
    },
  },
});

export const {
  setFCMToken,
  setPermissionGranted,
  addNotification,
  setNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  toggleDrawer,
  setDrawerOpen,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) =>
  state.notification.notifications;
export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.unreadCount;
export const selectIsDrawerOpen = (state: { notification: NotificationState }) =>
  state.notification.isDrawerOpen;
export const selectFCMToken = (state: { notification: NotificationState }) =>
  state.notification.fcmToken;
