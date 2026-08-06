import { Request, Response, NextFunction } from 'express';
import 'multer';
export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';
export interface TeamInfo {
    teamId: string;
    role: TeamRole;
}
export interface AuthRequest extends Request {
    userId?: string;
    userTeams?: TeamInfo[];
    file?: Express.Multer.File;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
//# sourceMappingURL=auth.d.ts.map