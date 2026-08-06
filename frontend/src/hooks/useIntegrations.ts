import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '@/services';
import { Integration, CreateIntegrationRequest, UpdateIntegrationRequest } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';

/**
 * Hook to get all integrations
 */
export const useIntegrations = () => {
  return useQuery<Integration[], Error>({
    queryKey: ['integrations'],
    queryFn: () => integrationService.getIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get integration by ID
 */
export const useIntegration = (id: string) => {
  return useQuery<Integration, Error>({
    queryKey: ['integrations', id],
    queryFn: () => integrationService.getIntegrationById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create integration
 */
export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: CreateIntegrationRequest) => integrationService.createIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      dispatch(addToast({ type: 'success', message: 'Integration created successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to update integration
 */
export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIntegrationRequest }) =>
      integrationService.updateIntegration(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integrations', variables.id] });
      dispatch(addToast({ type: 'success', message: 'Integration updated successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to delete integration
 */
export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (id: string) => integrationService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      dispatch(addToast({ type: 'success', message: 'Integration deleted successfully' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to test integration
 */
export const useTestIntegration = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (id: string) => integrationService.testIntegration(id),
    onSuccess: (data) => {
      dispatch(
        addToast({
          type: data.success ? 'success' : 'error',
          message: data.message,
        })
      );
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to sync action items
 */
export const useSyncActionItems = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ integrationId, actionItemIds }: { integrationId: string; actionItemIds: string[] }) =>
      integrationService.syncActionItems(integrationId, actionItemIds),
    onSuccess: (data) => {
      dispatch(
        addToast({
          type: 'success',
          message: `Synced ${data.synced} action items. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
        })
      );
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};
