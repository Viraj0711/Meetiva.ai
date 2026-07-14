import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import TeamMember from '../models/TeamMember';

export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';

export interface TeamInfo {
  teamId: string;
  role: TeamRole;
}

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

/**
 * Authenticate middleware — verifies the JWT access token and attaches
 * the user's identity and current team memberships to the request.
 *
 * Team memberships are fetched from the database on EVERY request rather
 * than relying on JWT-embedded teams. This ensures role changes (promotions,
 * demotions, team removals) take effect immediately, not after the 15-minute
 * JWT expiry window.
 *
 * The trade-off is one extra indexed database query per authenticated request.
 * In a high-traffic scenario this can be mitigated by a short-lived cache
 * (e.g. Redis with 30-second TTL), but for most applications the direct DB
 * query on a PK index is negligible (< 1 ms).
 */
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
      console.error('JWT_SECRET is not configured');
      res.status(500).json({ message: 'Authentication configuration error' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded?.userId) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    req.userId = decoded.userId;

    // Fetch current team memberships from the database.
    // This guarantees that role changes take effect immediately.
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
    // JWT errors (expired, malformed) and DB errors are both caught here.
    // Distinguish them for better error reporting.
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Invalid or expired token' });
    } else {
      console.error('[authenticate] Unexpected error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  }
};
