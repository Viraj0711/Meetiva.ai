import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import meetingsReducer from '@/features/meetings/meetingsSlice';
import actionItemsReducer from '@/features/actionItems/actionItemsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
    actionItems: actionItemsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['meetings/setUploadProgress'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
