import axios from 'axios';
import { ActionItem, CreateActionItemRequest, UpdateActionItemRequest } from './actionItemsTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const actionItemsAPI = {
  getActionItems: async (token: string): Promise<ActionItem[]> => {
    const response = await axios.get(`${API_URL}/action-items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  getActionItemById: async (id: string, token: string): Promise<ActionItem> => {
    const response = await axios.get(`${API_URL}/action-items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  createActionItem: async (
    data: CreateActionItemRequest,
    token: string
  ): Promise<ActionItem> => {
    const response = await axios.post(`${API_URL}/action-items`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  updateActionItem: async (
    id: string,
    data: UpdateActionItemRequest,
    token: string
  ): Promise<ActionItem> => {
    const response = await axios.patch(`${API_URL}/action-items/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  deleteActionItem: async (id: string, token: string): Promise<void> => {
    await axios.delete(`${API_URL}/action-items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  completeActionItem: async (id: string, token: string): Promise<ActionItem> => {
    const response = await axios.post(
      `${API_URL}/action-items/${id}/complete`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },
};
