import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import schoolSlice from './slices/schoolSlice';
import studentSlice from './slices/studentSlice';
import teacherSlice from './slices/teacherSlice';
import analyticsSlice from './slices/analyticsSlice';
import notificationSlice from './slices/notificationSlice';
import realtimeSlice from './slices/realtimeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    schools: schoolSlice,
    students: studentSlice,
    teachers: teacherSlice,
    analytics: analyticsSlice,
    notifications: notificationSlice,
    realtime: realtimeSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['realtime/updateStatus'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
