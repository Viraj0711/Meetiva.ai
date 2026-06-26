import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';
import { API_BASE_URL } from './api.config';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
  },

  /**
   * Register new team leader
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register-leader`, data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: { name?: string; email?: string }): Promise<AuthResponse> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch<AuthResponse>(`${API_BASE_URL}/auth/me`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/password-reset`, { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/password-reset/confirm`, { token, password: newPassword });
  },
};
