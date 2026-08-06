import { Response, NextFunction } from 'express';
import { AuthRequest, TeamRole } from './auth';
import TeamMember from '../models/TeamMember';
import { Types } from 'mongoose';

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
 * Check if a user can view another user's data.
 *
 * Returns true if:
 * 1. The user is viewing their own data, OR
 * 2. The user has MANAGER or LEAD role in a team that the target user ALSO belongs to.
 *
 * This prevents cross-team data leakage — a MANAGER in Team A cannot view
 * data of users who only belong to Team B.
 *
 * Makes a single indexed query on team_members (userId + teamId indexes).
 */
export const canViewUserData = async (
  viewingUserId: string,
  targetUserId: string,
  viewingUserTeams: Array<{ teamId: string; role: TeamRole }>
): Promise<boolean> => {
  // Can always view own data
  if (viewingUserId === targetUserId) {
    return true;
  }

  // Find teams where the viewer has MANAGER or LEAD role
  const elevatedTeams = viewingUserTeams.filter(
    team => team.role === 'MANAGER' || team.role === 'LEAD'
  );

  if (elevatedTeams.length === 0) {
    return false; // No elevated role in any team
  }  // Single indexed query: check if the target user shares any of those teams
  const sharedTeam = await TeamMember.findOne({
    userId: new Types.ObjectId(targetUserId),
    teamId: { $in: elevatedTeams.map(t => new Types.ObjectId(t.teamId)) },
  })
    .select('_id')
    .lean();

  return sharedTeam !== null;
}

;


