import { apiClient } from './api.client';
import {
  Meeting,
  MeetingSummary,
  Transcript,
  ActionItem,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  MeetingStats,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from '@/types';

export interface DuplicateMeetingInfo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface UploadDuplicateError extends Error {
  code: 'MEETING_DUPLICATE';
  existingMeeting: DuplicateMeetingInfo;
}

export const meetingService = {
  /**
   * Get all meetings with pagination and filters
   */
  getMeetings: async (
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<Meeting>> => {
    const response = await apiClient.get<PaginatedResponse<Meeting>>('/meetings', {
      params,
    });
    return response;
  },

  /**
   * Get meeting by ID
   */
  getMeetingById: async (id: string): Promise<Meeting> => {
    const response = await apiClient.get<Meeting>(`/meetings/${id}`);
    return response;
  },

  /**
   * Create new meeting
   */
  createMeeting: async (data: CreateMeetingRequest): Promise<Meeting> => {
    const response = await apiClient.post<Meeting>('/meetings', data);
    return response;
  },

  /**
   * Upload meeting file with metadata
   */
  uploadMeetingFile: async (
    file: File,
    title?: string,
    description?: string,
    participants?: string[],
    onProgress?: (progress: number) => void
  ): Promise<{ data: Meeting; actionItemsExportUrl: string }> => {
    if (onProgress) onProgress(0); // Initialize progress
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (participants) formData.append('participants', JSON.stringify(participants));

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    const response = await fetch(`${API_BASE_URL}/meetings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      if (response.status === 409 && errorData.code === 'MEETING_DUPLICATE' && errorData.existingMeeting) {
        const duplicateError = new Error(errorData.message || 'Meeting already exists') as UploadDuplicateError;
        duplicateError.code = 'MEETING_DUPLICATE';
        duplicateError.existingMeeting = errorData.existingMeeting as DuplicateMeetingInfo;
        throw duplicateError;
      }

      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    return { data: result.data, actionItemsExportUrl: result.actionItemsExportUrl || '' };
  },

  /**
   * Update meeting
   */
  updateMeeting: async (id: string, data: UpdateMeetingRequest): Promise<Meeting> => {
    const response = await apiClient.patch<Meeting>(`/meetings/${id}`, data);
    return response;
  },

  /**
   * Delete meeting
   */
  deleteMeeting: async (id: string): Promise<void> => {
    await apiClient.delete(`/meetings/${id}`);
  },

  /**
   * Get meeting summary
   */
  getMeetingSummary: async (meetingId: string): Promise<MeetingSummary> => {
    const response = await apiClient.get<MeetingSummary>(`/meetings/${meetingId}/summary`);
    return response;
  },

  /**
   * Get meeting transcript
   */
  getMeetingTranscript: async (meetingId: string): Promise<Transcript> => {
    const response = await apiClient.get<Transcript>(`/meetings/${meetingId}/transcript`);
    return response;
  },

  /**
   * Get meeting action items
   */
  getMeetingActionItems: async (meetingId: string): Promise<ActionItem[]> => {
    const response = await apiClient.get<ActionItem[]>(`/meetings/${meetingId}/action-items`);
    return response;
  },

  /**
   * Get meeting stats
   */
  getMeetingStats: async (): Promise<MeetingStats> => {
    const response = await apiClient.get<MeetingStats>('/meetings/stats');
    return response;
  },
};

export const actionItemService = {
  /**
   * Get all action items
   */
  getActionItems: async (
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<ActionItem>> => {
    const response = await apiClient.get<PaginatedResponse<ActionItem>>('/action-items', {
      params,
    });
    return response;
  },

  /**
   * Get action item by ID
   */
  getActionItemById: async (id: string): Promise<ActionItem> => {
    const response = await apiClient.get<ActionItem>(`/action-items/${id}`);
    return response;
  },

  /**
   * Create action item
   */
  createActionItem: async (data: CreateActionItemRequest): Promise<ActionItem> => {
    const response = await apiClient.post<ActionItem>('/action-items', data);
    return response;
  },

  /**
   * Update action item
   */
  updateActionItem: async (id: string, data: UpdateActionItemRequest): Promise<ActionItem> => {
    const response = await apiClient.patch<ActionItem>(`/action-items/${id}`, data);
    return response;
  },

  /**
   * Delete action item
   */
  deleteActionItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/action-items/${id}`);
  },

  /**
   * Mark action item as completed
   */
  completeActionItem: async (id: string): Promise<ActionItem> => {
    const response = await apiClient.post<ActionItem>(`/action-items/${id}/complete`);
    return response;
  },
};
