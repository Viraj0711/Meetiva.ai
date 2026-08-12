import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import type { OrgRole } from '../lib/shared';
import Project from '../models/Project';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import { Types } from 'mongoose';

/**
 * Require the user to have one of the specified org-level roles.
 * Must be used after `authenticate`.
 */
export const requireOrgRole = (...roles: OrgRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userOrg) {
      res.status(403).json({ message: 'Organization role required' });
      return;
    }
    if (!roles.includes(req.userOrg.orgRole)) {
      res.status(403).json({ message: 'Insufficient organization permissions' });
      return;
    }
    next();
  };

/**
 * Require Super Admin role. Bypasses all org scoping.
 */
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.userOrg || req.userOrg.orgRole !== 'super_admin') {
    res.status(403).json({ message: 'Super Admin access required' });
    return;
  }
  next();
};

/**
 * Require the user to belong to an organization (any org role).
 */
export const requireOrganization = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.userOrg) {
    res.status(403).json({ message: 'Organization membership required' });
    return;
  }
  next();
};

/**
 * Check org access for a specific organization.
 * - super_admin: full access to everything
 * - admin: full access to own org only
 * - manager: access to assigned projects only (checked separately per route)
 * - team_leader/member: no org-level access
 */
export const requireOrgAccess = (getOrgId?: (req: AuthRequest) => string | undefined) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId || !req.userOrg) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { orgRole, organizationId } = req.userOrg;

    // Super admin bypasses all checks
    if (orgRole === 'super_admin') {
      next();
      return;
    }

    // Admin has full access to own org
    if (orgRole === 'admin') {
      const targetOrgId = getOrgId?.(req);
      if (targetOrgId && targetOrgId !== organizationId) {
        res.status(403).json({ message: 'Access denied: different organization' });
        return;
      }
      next();
      return;
    }

    // Manager: access is scoped to assigned projects (check done at route level)
    if (orgRole === 'manager') {
      next();
      return;
    }

    // team_leader and member: no org-level access
    res.status(403).json({ message: 'Insufficient permissions for organization access' });
  };

/**
 * Check if a user can manage a specific project.
 * - super_admin: yes
 * - admin: yes (owns the org)
 * - manager: only if assigned to this project
 */
export const canManageProject = async (
  userId: string,
  projectId: string,
  userOrg: { orgRole: OrgRole; organizationId: string | null }
): Promise<boolean> => {
  if (userOrg.orgRole === 'super_admin') return true;
  if (userOrg.orgRole === 'admin') return true;

  if (userOrg.orgRole === 'manager') {
    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      managerUserId: new Types.ObjectId(userId),
    }).select('_id').lean();
    return project !== null;
  }

  return false;
};

/**
 * Check if a user can manage a specific team.
 * - super_admin: yes
 * - admin: yes (owns the org)
 * - manager: only if the team belongs to one of their assigned projects
 * - team_leader: only if they are a leader of this team
 */
export const canManageTeam = async (
  userId: string,
  teamId: string,
  userOrg: { orgRole: OrgRole; organizationId: string | null }
): Promise<boolean> => {
  if (userOrg.orgRole === 'super_admin') return true;
  if (userOrg.orgRole === 'admin') return true;

  if (userOrg.orgRole === 'manager') {
    const team = await Team.findById(teamId).select('projectId').lean();
    if (!team?.projectId) return false;
    const project = await Project.findOne({
      _id: team.projectId,
      managerUserId: new Types.ObjectId(userId),
    }).select('_id').lean();
    return project !== null;
  }

  if (userOrg.orgRole === 'team_leader') {
    const membership = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
      role: 'LEAD',
      status: 'ACCEPTED',
    }).lean();
    return membership !== null;
  }

  return false;
};
