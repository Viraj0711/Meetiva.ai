import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/v1';

console.log('🔧 Auth Service - API_BASE_URL:', API_BASE_URL);
console.log('🔧 Auth Service - Environment:', import.meta.env);

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('🚀 Logging in user with URL:', `${API_BASE_URL}/auth/login`);
    console.log('📝 Login credentials email:', credentials.email);
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Register new team leader
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log('🚀 Registering leader with URL:', `${API_BASE_URL}/auth/register-leader`);
    console.log('📝 Registration data:', data);
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register-leader`, data);
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      throw error;
    }
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
   * Refresh access token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/refresh`);
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
