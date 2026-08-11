import { apiClient, getAccessToken } from './api.client';
import { API_BASE_URL } from './api.config';
import {
  Meeting,
  MeetingSummary,
  Transcript,
  Task,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
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
    onProgress?: (progress: number) => void,
    summaryMode?: string
  ): Promise<{ data: Meeting }> => {
    if (onProgress) onProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (participants) formData.append('participants', JSON.stringify(participants));
    if (summaryMode) formData.append('summaryMode', summaryMode);

    const token = getAccessToken();

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

      // Preserve the backend error code (e.g. MEETING_LIMIT_REACHED) and HTTP
      // status so callers can branch on them instead of parsing message text.
      const uploadError = new Error(errorData.message || 'Upload failed') as Error & {
        code?: string;
        status?: number;
      };
      uploadError.code = errorData.code;
      uploadError.status = response.status;
      throw uploadError;
    }

    const result = await response.json();
    return { data: result.data };
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
   * Get meeting tasks
   * Backend returns { data: Task[], pagination: ... } — extract the array.
   */
  getMeetingTasks: async (meetingId: string): Promise<Task[]> => {
    const response = await apiClient.get<{ data: Task[] }>(`/meetings/${meetingId}/action-items`);
    return response.data;
  },

  /**
   * Get meeting stats
   */
  getMeetingStats: async (): Promise<MeetingStats> => {
    const response = await apiClient.get<MeetingStats>('/meetings/stats');
    return response;
  },
};

export const taskService = {
  /**
   * Get all tasks
   */
  getTasks: async (
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/action-items', {
      params,
    });
    return response;
  },

  /**
   * Get task by ID
   */
  getTaskById: async (id: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/action-items/${id}`);
    return response;
  },

  /**
   * Create task
   */
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<Task>('/action-items', data);
    return response;
  },

  /**
   * Update task
   */
  updateTask: async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/action-items/${id}`, data);
    return response;
  },

  /**
   * Delete task
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/action-items/${id}`);
  },

  /**
   * Mark task as completed
   */
  completeTask: async (id: string): Promise<Task> => {
    const response = await apiClient.post<Task>(`/action-items/${id}/complete`);
    return response;
  },
};
