import { apiClient, setAccessToken } from './api.client';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';
import { API_BASE_URL } from './api.config';
import axios from 'axios';

export const authService = {
  /**
   * Login user — stores access token in-memory (via apiClient).
   * Refresh token is set as an httpOnly cookie by the server.
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Register new team leader — stores access token in-memory.
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register-leader', data);
    if (response.data.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Logout — tells the server to clear the refresh token cookie.
   * Also clears the in-memory access token.
   */
  logout: async (): Promise<void> => {
    try {
      // Use axios directly so we don't need an auth header for logout
      await axios.post(`${API_BASE_URL}/auth/logout`, null, {
        withCredentials: true,
      });
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Get current user profile (uses in-memory token via apiClient interceptor).
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Update current user profile — returns new access token + rotated refresh cookie.
   */
  updateProfile: async (data: { name?: string; email?: string }): Promise<AuthResponse> => {
    const response = await apiClient.patch<AuthResponse>('/auth/me', data);
    if (response.data.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Refresh access token using the httpOnly refresh cookie.
   * Used during app initialization to restore a session.
   */
  refreshToken: async (): Promise<{ token: string; user?: User }> => {
    const response = await axios.post<{ token: string; user?: User }>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      { withCredentials: true }
    );
    if (response.data.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password-reset', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/confirm', { token, password: newPassword });
  },
};
