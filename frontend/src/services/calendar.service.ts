import { CalendarConnectionStatus, CalendarEvent, CreateCalendarEventRequest } from '@/types';
import { apiClient } from './api.client';

export const calendarService = {
  getGoogleConnectUrl: async (forceReconnect = false): Promise<string> => {
    const params = forceReconnect ? '?force=1' : '';
    const response = await apiClient.post<{ authUrl: string }>(`/auth/google/init${params}`);
    return response.data.authUrl;
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
