import { WorkspaceOverview } from '@/types';
import { apiClient } from './api.client';

export const workspaceService = {
  getOverview: async (): Promise<WorkspaceOverview> => {
    const response = await apiClient.get<WorkspaceOverview>('/workspace/overview');
    return response.data;
  },
};
