import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import TeamMember from '../models/TeamMember';
import type { TeamRole, TeamInfo } from '../lib/shared';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:auth');

export type { TeamRole, TeamInfo };

export interface AuthRequest extends Request {
  userId?: string;
  userTeams?: TeamInfo[];
}

interface JwtPayload {
  userId: string;
  email: string;
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

    req.userId = decoded.userId;

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
