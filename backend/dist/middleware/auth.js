"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const TeamMember_1 = __importDefault(require("../models/TeamMember"));
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
const authenticate = async (req, res, next) => {
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
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded?.userId) {
            res.status(401).json({ message: 'Invalid token payload' });
            return;
        }
        req.userId = decoded.userId;
        // Fetch current team memberships from the database.
        // This guarantees that role changes take effect immediately.
        const teamMembers = await TeamMember_1.default.find({
            userId: decoded.userId,
        })
            .select('teamId role')
            .lean();
        req.userTeams = teamMembers.map(tm => ({
            teamId: tm.teamId.toString(),
            role: tm.role,
        }));
        next();
    }
    catch (error) {
        // JWT errors (expired, malformed) and DB errors are both caught here.
        // Distinguish them for better error reporting.
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Invalid or expired token' });
        }
        else {
            console.error('[authenticate] Unexpected error:', error);
            res.status(500).json({ message: 'Authentication error' });
        }
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map