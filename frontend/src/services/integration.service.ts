import { CalendarConnectionStatus, CalendarEvent, CreateCalendarEventRequest } from '@/types';
import { toLocalIsoString } from '@/utils';
import { apiClient } from './api.client';

export const integrationService = {
  /** Get Google Calendar status (legacy format) */
  getGoogleCalendarStatus: async (): Promise<{
    provider: 'GOOGLE';
    isConnected: boolean;
    connectedAt: string | null;
  }> => {
    const response = await apiClient.get<{ data: { connected: boolean; updatedAt: string | null } }>('/calendar/status');
    return {
      provider: 'GOOGLE',
      isConnected: response.data.connected,
      connectedAt: response.data.updatedAt,
    };
  },

  /** Get raw calendar connection status */
  getConnectionStatus: async (): Promise<CalendarConnectionStatus> => {
    const response = await apiClient.get<{ data: CalendarConnectionStatus }>('/calendar/status');
    return response.data;
  },

  /** Get Google OAuth authorization URL */
  getGoogleAuthUrl: async (_teamId?: string, forceReconnect = false): Promise<{ authUrl: string }> => {
    const params = forceReconnect ? '?force=1' : '';
    const response = await apiClient.post<{ authUrl: string }>(`/auth/google/init${params}`);
    return response;
  },

  /** Get Google OAuth authorization URL — returns just the URL string */
  getGoogleConnectUrl: async (forceReconnect = false): Promise<string> => {
    const params = forceReconnect ? '?force=1' : '';
    const response = await apiClient.post<{ authUrl: string }>(`/auth/google/init${params}`);
    return response.authUrl;
  },

  /** Disconnect Google Calendar */
  disconnectGoogleCalendar: async (): Promise<void> => {
    await apiClient.post('/calendar/disconnect');
  },

  /** Get upcoming calendar events */
  getUpcomingEvents: async (maxResults = 20): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<{ data: CalendarEvent[] }>('/calendar/events', {
      params: { maxResults },
    });
    return response.data;
  },

  /** Create a calendar event */
  createEvent: async (payload: CreateCalendarEventRequest): Promise<CalendarEvent> => {
    // The backend contract requires full ISO-8601 datetimes (with offset). The
    // form submits local datetime-local values ("YYYY-MM-DDTHH:mm"), so
    // normalise here — at the API boundary — preserving the user's local
    // timezone. Timezone defaults to the browser's local zone when omitted.
    const timeZone =
      payload.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const response = await apiClient.post<{ data: CalendarEvent }>('/calendar/create-event', {
      ...payload,
      startTime: toLocalIsoString(payload.startTime),
      endTime: toLocalIsoString(payload.endTime),
      timeZone,
    });
    return response.data;
  },

  /** Sync meeting to Google Calendar */
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
