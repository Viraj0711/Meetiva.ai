import axios from 'axios';
import {
  Meeting,
  MeetingSummary,
  Transcript,
  CreateMeetingRequest,
  UpdateMeetingRequest,
} from './meetingsTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const meetingsAPI = {
  getMeetings: async (token: string): Promise<Meeting[]> => {
    const response = await axios.get(`${API_URL}/meetings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  getMeetingById: async (id: string, token: string): Promise<Meeting> => {
    const response = await axios.get(`${API_URL}/meetings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  createMeeting: async (data: CreateMeetingRequest, token: string): Promise<Meeting> => {
    const response = await axios.post(`${API_URL}/meetings`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  updateMeeting: async (
    id: string,
    data: UpdateMeetingRequest,
    token: string
  ): Promise<Meeting> => {
    const response = await axios.patch(`${API_URL}/meetings/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  deleteMeeting: async (id: string, token: string): Promise<void> => {
    await axios.delete(`${API_URL}/meetings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  uploadFile: async (
    meetingId: string,
    file: File,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<Meeting> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/meetings/${meetingId}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data;
  },

  getSummary: async (meetingId: string, token: string): Promise<MeetingSummary> => {
    const response = await axios.get(`${API_URL}/meetings/${meetingId}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  getTranscript: async (meetingId: string, token: string): Promise<Transcript> => {
    const response = await axios.get(`${API_URL}/meetings/${meetingId}/transcript`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};
