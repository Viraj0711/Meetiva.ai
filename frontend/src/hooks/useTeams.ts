import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTeam,
  getTeams,
  getTeam,
  getTeamMembers,
  inviteTeamMember,
  deleteTeam as apiDeleteTeam,
  updateTeamMemberProfile,
  resetTeamMemberCredentials,
  updateTeamMember as apiUpdateTeamMember,
  removeTeamMember as apiRemoveTeamMember,
} from '@/services/teams.service';
import { Team, CreateTeamRequest } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import type { AppDispatch } from '@/store';
import type { QueryClient } from '@tanstack/react-query';

// ── Helpers ────────────────────────────────────────────────────────────────

type Ctx = { queryClient: QueryClient; dispatch: AppDispatch };

interface MutationOpts<TData, TVariables> {
  successMessage?: string;
  errorMessage?: string;
  invalidateKeys?: string[][];
  onSuccess?: (data: TData, vars: TVariables, ctx: Ctx) => void;
}

/**
 * Factory that wraps useMutation with standard toast + cache invalidation.
 * Eliminates the repeated onSuccess/onError boilerplate.
 */
function useTeamMutation<TData, TVariables = void>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  opts?: MutationOpts<TData, TVariables>,
) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, vars) => {
      if (opts?.invalidateKeys) {
        for (const key of opts.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      opts?.onSuccess?.(data, vars, { queryClient, dispatch });
      if (opts?.successMessage) {
        dispatch(addToast({ type: 'success', message: opts.successMessage, duration: 3000 }));
      }
    },
    onError: (error: Error) => {
      dispatch(addToast({
        type: 'error',
        message: opts?.errorMessage || error.message || 'An error occurred',
        duration: 3000,
      }));
    },
  });
}

// ── Query hooks ────────────────────────────────────────────────────────────

/** Get all teams for the current user */
export const useTeams = () =>
  useQuery<Team[], Error>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await getTeams();
      return response?.teams ?? [];
    },
    staleTime: 30_000,
  });

/** Get a specific team */
export const useTeam = (teamId: string | undefined) =>
  useQuery<Team, Error>({
    queryKey: ['teams', teamId],
    queryFn: () => getTeam(teamId!),
    enabled: !!teamId,
  });

/** Get team members */
export const useTeamMembers = (teamId: string | undefined) =>
  useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: async () => {
      const response = await getTeamMembers(teamId!);
      return response?.members ?? [];
    },
    enabled: !!teamId,
    staleTime: 15_000,
  });

// ── Mutation hooks ─────────────────────────────────────────────────────────

/** Create a new team */
export const useCreateTeam = () =>
  useTeamMutation(
    (data: CreateTeamRequest) => createTeam(data),
    { successMessage: 'Team created successfully!', invalidateKeys: [['teams']] },
  );

/** Invite a member to a team */
export const useInviteTeamMember = () =>
  useTeamMutation(
    ({ teamId, email }: { teamId: string; email: string }) => inviteTeamMember(teamId, { email }),
    {
      invalidateKeys: [['teams']],
      onSuccess: (_, { teamId }, { queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      },
    },
  );

/** Update a team member's role */
export const useUpdateTeamMemberRole = () =>
  useTeamMutation(
    ({ teamId, userId, role }: { teamId: string; userId: string; role: 'LEAD' | 'MEMBER' }) =>
      apiUpdateTeamMember(teamId, userId, { role }),
    {
      successMessage: 'Member role updated',
      invalidateKeys: [['teams']],
      onSuccess: (_, { teamId }, { queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      },
    },
  );

/** Update a team member's profile */
export const useUpdateTeamMemberProfile = () =>
  useTeamMutation(
    ({ teamId, userId, name, email }: { teamId: string; userId: string; name?: string; email?: string }) =>
      updateTeamMemberProfile(teamId, userId, { name, email }),
    {
      successMessage: 'Member profile updated',
      invalidateKeys: [['teams']],
      onSuccess: (_, { teamId }, { queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      },
    },
  );

/** Reset team member credentials — shows temporary password in the toast */
export const useResetTeamMemberCredentials = () =>
  useTeamMutation(
    ({ teamId, userId }: { teamId: string; userId: string }) =>
      resetTeamMemberCredentials(teamId, userId),
    {
      onSuccess: (response, _, { dispatch }) => {
        dispatch(addToast({
          type: 'success',
          message: `Credentials reset: ${response.credentials.email} / ${response.credentials.temporaryPassword}`,
          duration: 8000,
        }));
      },
    },
  );

/** Remove a team member */
export const useRemoveTeamMember = () =>
  useTeamMutation(
    ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiRemoveTeamMember(teamId, userId),
    {
      successMessage: 'Member removed from team',
      invalidateKeys: [['teams']],
      onSuccess: (_, { teamId }, { queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      },
    },
  );

/** Delete a team */
export const useDeleteTeam = () =>
  useTeamMutation(
    (teamId: string) => apiDeleteTeam(teamId),
    { successMessage: 'Team deleted successfully', invalidateKeys: [['teams']] },
  );
