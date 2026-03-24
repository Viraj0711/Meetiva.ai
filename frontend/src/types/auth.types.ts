export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';

export interface TeamInfo {
  teamId: string;
  role: TeamRole;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teams?: TeamInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
