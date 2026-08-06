import { RootState } from '../index';

/**
 * Select user's teams
 */
export const selectUserTeams = (state: RootState) => state.auth.user?.teams || [];

/**
 * Check if user is a MANAGER or LEAD in any team
 */
export const selectIsManagerOrLead = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user || !user.teams) return false;
  return user.teams.some(team => team.role === 'MANAGER' || team.role === 'LEAD');
};

/**
 * Check if user is a MANAGER in any team
 */
export const selectIsManager = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user || !user.teams) return false;
  return user.teams.some(team => team.role === 'MANAGER');
};

/**
 * Check if user is a LEAD in any team
 */
export const selectIsLead = (state: RootState): boolean => {
  const user = state.auth.user;
  if (!user || !user.teams) return false;
  return user.teams.some(team => team.role === 'LEAD');
};
