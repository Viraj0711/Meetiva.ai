import { apiClient, setAccessToken } from './api.client';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';
import { API_BASE_URL } from './api.config';

export const authService = {
  /**
   * Login user — stores access token in-memory (via apiClient).
   * Refresh token is set as an httpOnly cookie by the server.
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.token) {
      setAccessToken(response.token);
    }
    return { token: response.token, user: response.user };
  },

  /**
   * Register new user — stores access token in-memory.
   * All users start on the FREE tier (5 meetings/month).
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.token) {
      setAccessToken(response.token);
    }
    return { token: response.token, user: response.user };
  },

  /**
   * Redirect the browser to the backend Google Sign-In endpoint.
   * A full-page navigation (not fetch) is required so the OAuth flow and its
   * cookies work normally; the backend bounces back to /dashboard on success.
   */
  googleLoginRedirect: (): void => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  },

  /**
   * Get current user's subscription info and meeting credits.
   */
  getSubscription: async (): Promise<{
    tier: string;
    meetingCountThisMonth: number;
    monthlyLimit: number;
    meetingsRemaining: number;
    subscriptionExpiresAt: string | null;
    isSubscribed: boolean;
  }> => {
    const response = await apiClient.get<{
      tier: string;
      meetingCountThisMonth: number;
      monthlyLimit: number;
      meetingsRemaining: number;
      subscriptionExpiresAt: string | null;
      isSubscribed: boolean;
    }>('/auth/subscription');
    return response;
  },

  /**
   * Logout — tells the server to clear the refresh token cookie.
   * Also clears the in-memory access token.
   */
  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send the httpOnly refresh cookie
      });
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Get current user profile (uses in-memory token via apiClient).
   */
  getCurrentUser: async (): Promise<User> => {
    // /auth/me returns { id, email, name, ... } directly
    const response = await apiClient.get<User>('/auth/me');
    return response;
  },

  /**
   * Update current user profile — returns new access token + rotated refresh cookie.
   */
  updateProfile: async (data: { name?: string; email?: string }): Promise<AuthResponse> => {
    const response = await apiClient.patch<AuthResponse>('/auth/me', data);
    if (response.token) {
      setAccessToken(response.token);
    }
    return { token: response.token, user: response.user };
  },

  /**
   * Refresh access token using the httpOnly refresh cookie.
   * Used during app initialization to restore a session.
   */
  refreshToken: async (): Promise<{ token: string; user?: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = await response.json() as { token: string; user?: User };
    if (data.token) {
      setAccessToken(data.token);
    }
    return data;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    // input-safety-ok: email validated server-side by passwordResetSchema
    await apiClient.post('/auth/password-reset', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    // input-safety-ok: token/password validated server-side by passwordResetConfirmSchema
    await apiClient.post('/auth/password-reset/confirm', { token, password: newPassword });
  },

  /**
   * Change password (authenticated user).
   * currentPassword is omitted for accounts that have no password yet
   * (Google Sign-In users setting their first password) — the server only
   * requires it when the account already has a password.
   */
  changePassword: async (currentPassword: string | undefined, newPassword: string): Promise<void> => {
    // input-safety-ok: validated server-side by changePasswordSchema
    const body: { currentPassword?: string; newPassword: string } = { newPassword };
    if (currentPassword) {
      body.currentPassword = currentPassword;
    }
    await apiClient.post('/auth/change-password', body);
  },

  /**
   * Verify email with OTP code
   */
  verifyOtp: async (email: string, otp: string): Promise<void> => {
    // input-safety-ok: validated server-side by verifyOtpSchema
    await apiClient.post('/auth/verify-otp', { email, otp });
  },

  /**
   * Resend verification OTP
   */
  resendOtp: async (email: string): Promise<void> => {
    // input-safety-ok: email validated server-side by resendOtpSchema
    await apiClient.post('/auth/verify-otp/resend', { email });
  },

  /**
   * Upgrade the authenticated user's subscription tier.
   * Gated by ADMIN_EMAIL on the server — only the configured admin user can self-upgrade.
   */
  upgradeToPro: async (tier: string): Promise<{ user: { id: string; email: string; name: string; subscriptionTier: string; subscriptionExpiresAt: string | null } }> => {
    const response = await apiClient.post<{ user: { id: string; email: string; name: string; subscriptionTier: string; subscriptionExpiresAt: string | null } }>('/auth/admin/set-tier', { tier });
    return response;
  },
};
