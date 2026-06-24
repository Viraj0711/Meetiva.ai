import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

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
  teams?: TeamInfo[];
  iat?: number;
  exp?: number;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Authentication configuration error' });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded?.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.userId = decoded.userId;
    req.userTeams = decoded.teams || [];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
