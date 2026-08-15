import { apiClient } from './api.client';

export interface InviteDetails {
  type: string;
  role: string;
  organization: { name: string; slug: string } | null;
  project: { name: string } | null;
  team: { name: string } | null;
  inviter: { name: string } | null;
  email: string | null;
  expiresAt: string;
}

export const inviteService = {
  /**
   * Validate an invite token and get details.
   */
  getInviteDetails: async (token: string): Promise<InviteDetails> => {
    const response = await apiClient.get<InviteDetails>(`/invites/${token}`);
    return response;
  },

  /**
   * Accept an invite (logged-in user).
   */
  acceptInvite: async (token: string): Promise<{ message: string; organization: string; role: string }> => {
    const response = await apiClient.post<{ message: string; organization: string; role: string }>(`/invites/${token}/accept`);
    return response;
  },

  /**
   * Register a new account and accept an invite.
   */
  registerWithInvite: async (token: string, data: { name: string; password: string; email?: string }): Promise<{ message: string; user: { id: string; email: string; name: string } }> => {
    const response = await apiClient.post<{ message: string; user: { id: string; email: string; name: string } }>(`/invites/${token}/register`, data);
    return response;
  },
};
