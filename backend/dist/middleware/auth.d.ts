import { Request, Response, NextFunction } from 'express';
export type { TeamRole, TeamInfo };
export interface AuthRequest extends Request {
    userId?: string;
    userTeams?: TeamInfo[];
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
//# sourceMappingURL=auth.d.ts.map