import { WorkspaceOverview } from '@/types';
import { apiClient } from './api.client';

export const workspaceService = {
  getOverview: async (): Promise<WorkspaceOverview> => {
    const response = await apiClient.get<{ data: WorkspaceOverview }>('/workspace/overview');
    return response.data;
  },
};
