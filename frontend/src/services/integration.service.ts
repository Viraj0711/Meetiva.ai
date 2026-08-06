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
};
