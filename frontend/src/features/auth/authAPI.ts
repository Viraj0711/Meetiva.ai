import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User } from './authTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log('Registration API call - URL:', `${API_URL}/auth/register`);
    console.log('Registration API call - Data:', data);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      console.log('Registration success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  logout: async (token: string): Promise<void> => {
    await axios.post(
      `${API_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};
