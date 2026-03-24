import { Response, NextFunction } from 'express';
import { AuthRequest, TeamRole } from './auth';

/**
 * Authorize middleware for role-based access control
 * Checks if user has required role in the specified team
 *
 * @param requiredRoles - Array of roles that are allowed
 * @param getTeamId - Optional function to extract teamId from request (for dynamic team lookup)
 */
export const authorize = (
  requiredRoles: TeamRole[],
  getTeamId?: (req: AuthRequest) => string | undefined
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.userId || !req.userTeams) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // If no specific team is required, just check if user has required role in any team
    if (!getTeamId) {
      const hasRequiredRole = req.userTeams.some(team =>
        requiredRoles.includes(team.role)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
      return;
    }

    // If specific team is required, check if user has required role in that team
    const teamId = getTeamId(req);
    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required' });
    }

    const teamMembership = req.userTeams.find(team => team.teamId === teamId);

    if (!teamMembership || !requiredRoles.includes(teamMembership.role)) {
      return res.status(403).json({ message: 'Insufficient permissions for this team' });
    }

    next();
  };
};

/**
 * Helper to check if user can view another user's data
 * Returns true if:
 * - User is viewing their own data, OR
 * - User is MANAGER or LEAD in a team where the other user is a member
 */
export const canViewUserData = (
  viewingUserId: string,
  targetUserId: string,
  viewingUserTeams: Array<{ teamId: string; role: TeamRole }>
): boolean => {
  // Can always view own data
  if (viewingUserId === targetUserId) {
    return true;
  }

  // Managers and Leads can view team members' data
  return viewingUserTeams.some(team =>
    (team.role === 'MANAGER' || team.role === 'LEAD')
  );
};

/**
 * Helper to get all accessible user IDs for a given user
 * Returns userId list that the user can access
 */
export const getAccessibleUserIds = (
  userId: string,
  teamMembers: Array<{ userId: string; role: TeamRole }>
): string[] => {
  // Get the user's role
  const userTeamRole = teamMembers.find(m => m.userId === userId)?.role;

  // If user is MANAGER or LEAD, they can see all team members
  if (userTeamRole === 'MANAGER' || userTeamRole === 'LEAD') {
    return teamMembers.map(m => m.userId);
  }

  // Regular members can only see themselves
  return [userId];
};
