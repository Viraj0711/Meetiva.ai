import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';
import { setAccessToken } from '@/services/api.client';

// No longer reads from localStorage — token comes from login/register/refresh.
// On a fresh page load, the app must call /auth/refresh (which reads the
// httpOnly cookie) to restore the session.
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      // Token is stored in-memory via the apiClient module variable —
      // NOT in localStorage (prevents XSS/inspect theft).
      setAccessToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      setAccessToken(null);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginSuccess, logout, setUser, clearError } = authSlice.actions;

export default authSlice.reducer;
