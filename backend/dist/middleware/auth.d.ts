import { Request, Response, NextFunction } from 'express';
export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';
export interface TeamInfo {
    teamId: string;
    role: TeamRole;
}
export interface AuthRequest extends Request {
    userId?: string;
    userTeams?: TeamInfo[];
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
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map