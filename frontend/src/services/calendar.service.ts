import { CalendarConnectionStatus, CalendarEvent, CreateCalendarEventRequest } from '@/types';
import { apiClient } from './api.client';

export const calendarService = {
  getGoogleConnectUrl: (): string => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Authentication required. Please sign in first.');
    }

    const rootBase = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${rootBase}/auth/google?token=${encodeURIComponent(token)}`;
  },

  getConnectionStatus: async (): Promise<CalendarConnectionStatus> => {
    const response = await apiClient.get<CalendarConnectionStatus>('/calendar/status');
    return response.data;
  },

  createEvent: async (payload: CreateCalendarEventRequest): Promise<CalendarEvent> => {
    const response = await apiClient.post<CalendarEvent>('/calendar/create-event', payload);
    return response.data;
  },

  getUpcomingEvents: async (maxResults = 20): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>('/calendar/events', {
      params: { maxResults },
    });
    return response.data;
  },
};
