import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService, taskService } from '@/services';
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
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';

/**
 * Hook to get all meetings
 */
export const useMeetings = (params?: PaginationParams & FilterParams) => {
  return useQuery<PaginatedResponse<Meeting>, Error>({
    queryKey: ['meetings', params],
    queryFn: () => meetingService.getMeetings(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get meeting by ID
 */
export const useMeeting = (id: string) => {
  return useQuery<Meeting, Error>({
    queryKey: ['meetings', id],
    queryFn: () => meetingService.getMeetingById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create meeting
 */
export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: CreateMeetingRequest) => meetingService.createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'Meeting created successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to update meeting
 */
export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingRequest }) =>
      meetingService.updateMeeting(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', variables.id] });
      dispatch(addToast({ type: 'success', message: 'Meeting updated successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to delete meeting
 */
export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (id: string) => meetingService.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'Meeting deleted successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to upload meeting file
 */
export const useUploadMeetingFile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => meetingService.uploadMeetingFile(file, undefined, undefined, undefined, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'File uploaded successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to get meeting summary
 */
export const useMeetingSummary = (meetingId: string) => {
  return useQuery<MeetingSummary, Error>({
    queryKey: ['meetings', meetingId, 'summary'],
    queryFn: () => meetingService.getMeetingSummary(meetingId),
    enabled: !!meetingId,
  });
};

/**
 * Hook to get meeting transcript
 */
export const useMeetingTranscript = (meetingId: string) => {
  return useQuery<Transcript, Error>({
    queryKey: ['meetings', meetingId, 'transcript'],
    queryFn: () => meetingService.getMeetingTranscript(meetingId),
    enabled: !!meetingId,
  });
};

/**
 * Hook to get meeting tasks
 */
export const useMeetingTasks = (meetingId: string) => {
  return useQuery<Task[], Error>({
    queryKey: ['meetings', meetingId, 'tasks'],
    queryFn: () => meetingService.getMeetingTasks(meetingId),
    enabled: !!meetingId,
  });
};

/**
 * Hook to get meeting stats
 */
export const useMeetingStats = () => {
  return useQuery<MeetingStats, Error>({
    queryKey: ['meetings', 'stats'],
    queryFn: () => meetingService.getMeetingStats(),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get all tasks
 */
export const useTasks = (params?: PaginationParams & FilterParams) => {
  return useQuery<PaginatedResponse<Task>, Error>({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getTasks(params),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to create task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskService.createTask(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId, 'tasks'] });
      dispatch(addToast({ type: 'success', message: 'Task created successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to update task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'Task updated successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to delete task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'Task deleted successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to complete task
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (id: string) => taskService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      dispatch(addToast({ type: 'success', message: 'Task completed!' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};
