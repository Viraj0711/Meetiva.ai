import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import TeamMember from '../models/TeamMember';
import User from '../models/User';
import type { TeamRole, TeamInfo, OrgRole } from '../lib/shared';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:auth');

export type { TeamRole, TeamInfo, OrgRole };

export interface AuthRequest extends Request {
  userId?: string;
  userTeams?: TeamInfo[];
  userOrg?: {
    orgRole: OrgRole;
    organizationId: string | null;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  teams?: TeamInfo[];
  orgRole?: OrgRole | null;
  organizationId?: string | null;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      log.error('JWT_SECRET is not configured');
      res.status(500).json({ message: 'Authentication configuration error' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded?.userId) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    // Check tokenVersion for instant revocation
    const user = await User.findById(decoded.userId)
      .select('tokenVersion orgRole organizationId isActive isRemoved')
      .lean();

    if (!user || !user.isActive || user.isRemoved) {
      res.status(401).json({ message: 'Account is inactive or removed' });
      return;
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      res.status(401).json({ message: 'Session revoked! Please log in again.' });
      return;
    }

    req.userId = decoded.userId;

    // Attach org context if present
    if (user.orgRole) {
      req.userOrg = {
        orgRole: user.orgRole,
        organizationId: user.organizationId?.toString() ?? null,
      };
    }

    const teamMembers = await TeamMember.find({
      userId: decoded.userId as any,
    })
      .select('teamId role')
      .lean();

    req.userTeams = teamMembers.map(tm => ({
      teamId: tm.teamId.toString(),
      role: tm.role as TeamRole,
    }));

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Invalid or expired token' });
    } else {
      log.error('Unexpected authentication error', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: 'Authentication error' });
    }
  }
};
