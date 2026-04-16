import { apiClient } from './api.client';
import {
  Integration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
} from '@/types';

export const integrationService = {
  /**
   * Get all integrations
   */
  getIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get<Integration[]>('/integrations');
    return response.data;
  },

  /**
   * Get integration by ID
   */
  getIntegrationById: async (id: string): Promise<Integration> => {
    const response = await apiClient.get<Integration>(`/integrations/${id}`);
    return response.data;
  },

  /**
   * Create integration
   */
  createIntegration: async (data: CreateIntegrationRequest): Promise<Integration> => {
    const response = await apiClient.post<Integration>('/integrations', data);
    return response.data;
  },

  /**
   * Update integration
   */
  updateIntegration: async (id: string, data: UpdateIntegrationRequest): Promise<Integration> => {
    const response = await apiClient.patch<Integration>(`/integrations/${id}`, data);
    return response.data;
  },

  /**
   * Delete integration
   */
  deleteIntegration: async (id: string): Promise<void> => {
    await apiClient.delete(`/integrations/${id}`);
  },

  /**
   * Test integration connection
   */
  testIntegration: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/integrations/${id}/test`
    );
    return response.data;
  },

  /**
   * Sync action items to integration
   */
  syncActionItems: async (
    integrationId: string,
    actionItemIds: string[]
  ): Promise<{ synced: number; failed: number }> => {
    const response = await apiClient.post<{ synced: number; failed: number }>(
      `/integrations/${integrationId}/sync`,
      { actionItemIds }
    );
    return response.data;
  },

  /**
   * Get Google Calendar status
   */
  getGoogleCalendarStatus: async (): Promise<{
    provider: 'GOOGLE';
    isConnected: boolean;
    connectedAt: string | null;
  }> => {
    const response = await apiClient.get<{ connected: boolean; updatedAt: string | null }>('/calendar/status');
    return {
      provider: 'GOOGLE',
      isConnected: response.data.connected,
      connectedAt: response.data.updatedAt,
    };
  },

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl: async (_teamId: string): Promise<{ authUrl: string }> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const rootBase = apiBase.replace(/\/api\/v1\/?$/, '');
    return {
      authUrl: `${rootBase}/auth/google?token=${encodeURIComponent(token)}`,
    };
  },

  /**
   * Disconnect Google Calendar
   */
  disconnectGoogleCalendar: async (): Promise<void> => {
    await apiClient.post('/calendar/disconnect');
  },

  /**
   * Get upcoming calendar events
   */
  getUpcomingEvents: async (maxResults?: number): Promise<any[]> => {
    const response = await apiClient.get<any>('/calendar/events', {
      params: { maxResults: maxResults || 10 },
    });
    return response.data as any[];
  },

  /**
   * Sync meeting to Google Calendar
   */
  syncMeetingToCalendar: async (meetingId: string): Promise<void> => {
    await apiClient.post(`/calendar/create-event`, {
      title: `Meeting ${meetingId}`,
      description: `Synced from meeting ${meetingId}`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  },
};
