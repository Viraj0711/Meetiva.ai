import { apiClient } from './api.client';

export interface Notification {
  id: string;
  userId: string;
  type: 'DEADLINE_REMINDER' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  taskId?: string;
  task?: {
    title: string;
    dueDate?: string;
    status?: string;
  };
  createdAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationService = {
  /**
   * Fetch notifications for the current user
   */
  getNotifications: async (page = 1, limit = 10): Promise<NotificationResponse> => {
    const response = await apiClient.get<NotificationResponse>(
      `/notifications?page=${page}&limit=${limit}`
    );
    return response;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<NotificationResponse>(
      '/notifications?page=1&limit=1'
    );
    return response.pagination.total;
  },
};
