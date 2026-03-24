import { RootState } from '../index';
import { TeamRole } from '@/types';

/**
 * Select the current user
 */
export const selectUser = (state: RootState) => state.auth.user;

/**
 * Select the auth token
 */
export const selectToken = (state: RootState) => state.auth.token;

/**
 * Select authentication status
 */
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

/**
 * Select loading state
 */
export const selectIsLoading = (state: RootState) => state.auth.isLoading;

/**
 * Select error
 */
export const selectError = (state: RootState) => state.auth.error;

/**
 * Select user's teams
 */
export const selectUserTeams = (state: RootState) => state.auth.user?.teams || [];

/**
 * Check if user is a MANAGER or LEAD in any team
 */
export const selectIsManagerOrLead = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user?.teams) return false;
  return user.teams.some(team => team.role === 'MANAGER' || team.role === 'LEAD');
};

/**
 * Check if user is a MANAGER in any team
 */
export const selectIsManager = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user?.teams) return false;
  return user.teams.some(team => team.role === 'MANAGER');
};

/**
 * Check if user is a LEAD in any team
 */
export const selectIsLead = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user?.teams) return false;
  return user.teams.some(team => team.role === 'LEAD');
};

/**
 * Get user's role in a specific team
 */
export const selectUserRoleInTeam = (teamId: string) => (state: RootState): TeamRole | null => {
  const user = state.auth.user;
  if (!user?.teams) return null;
  const team = user.teams.find(t => t.teamId === teamId);
  return team?.role || null;
};

/**
 * Check if user is a MANAGER or LEAD in a specific team
 */
export const selectIsManagerOrLeadInTeam = (teamId: string) => (state: RootState): boolean => {
  const role = selectUserRoleInTeam(teamId)(state);
  return role === 'MANAGER' || role === 'LEAD';
};

/**
 * Get team IDs where user is MANAGER or LEAD
 */
export const selectManagedTeamIds = (state: RootState): string[] => {
  const user = state.auth.user;
  if (!user?.teams) return [];
  return user.teams
    .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
    .map(team => team.teamId);
};

/**
 * Check if user has access to view another user's data
 * (either owner or MANAGER/LEAD in any team)
 */
export const selectCanViewUserData = (targetUserId: string) => (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user) return false;

  // Can view own data
  if (user.id === targetUserId) return true;

  // Can view if MANAGER or LEAD in any team
  return user.teams?.some(team => team.role === 'MANAGER' || team.role === 'LEAD') ?? false;
};
