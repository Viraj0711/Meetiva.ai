# Backend Middleware — Audit Report

**Date:** June 24, 2026
**Module:** Backend Middleware
**Files Audited:** `middleware/auth.ts`, `middleware/authorize.ts`

---

## 1. Auth Middleware (`middleware/auth.ts`)

### Purpose
JWT authentication middleware that extracts and verifies Bearer tokens, attaching user identity and team memberships to the request object.

### Implementation

```typescript
export interface AuthRequest extends Request {
  userId?: string;
  userTeams?: TeamInfo[];
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  // Extracts Bearer token, verifies JWT, decodes payload
  // Attaches userId and userTeams to request
};
```

### ✅ Strengths
1. **Standard Bearer token extraction** — Properly handles `Authorization: Bearer <token>` header
2. **Type-safe extension** — `AuthRequest` interface extends Express `Request` with optional fields
3. **Clear error responses** — Returns specific HTTP status codes:
   - 401 for missing token
   - 401 for invalid/expired token
   - 401 for missing userId in payload
   - 500 for missing JWT_SECRET config
4. **Team information in JWT** — Decodes `teams` array with `teamId` and `role` for downstream authorization
5. **Error handling** — Catches all JWT verification errors

### ⚠️ Issues Found

1. **JWT payload contains `teams` array** — This is embedded in the token at login time. If a user's team membership changes (added/removed from a team), the JWT will still contain stale team data until the user logs in again. **Token revocation/refresh is not handled.**
   - **Impact:** A user removed from a team could still access team resources until their token expires (7 days).
   - **Mitigation:** Reduce token expiry, or implement token blacklisting, or fetch teams from DB on each request.

2. **No token expiry check beyond JWT library** — The `jsonwebtoken.verify()` method handles expiry, but there's no additional check for early revocation.

3. **`process.env.JWT_SECRET` checked inline** — The middleware checks if the secret exists rather than relying on the startup validation. This is defensive but redundant given `env.ts` validates it at startup.

4. **No refresh token rotation** — Once a JWT is compromised, it's valid for 7 days.

---

## 2. Authorization Middleware (`middleware/authorize.ts`)

### Purpose
Role-Based Access Control (RBAC) middleware that checks if a user has the required role(s) in a team.

### Exports

| Function | Purpose |
|----------|---------|
| `authorize(requiredRoles, getTeamId?)` | Middleware factory — checks role requirements |
| `canViewUserData(viewingUserId, targetUserId, viewingUserTeams)` | Data-level access check |
| `getAccessibleUserIds(userId, teamMembers)` | Returns accessible user IDs based on role |

### Authorize Middleware Flow

```
1. Check user is authenticated (userId and userTeams exist)
2. If no getTeamId — check if user has required role in ANY team
3. If getTeamId provided — check if user has required role in SPECIFIC team
4. Return 401 if not authenticated, 400 if teamId missing, 403 if insufficient permissions
```

### ✅ Strengths
1. **Flexible role checking** — Supports both "any team" and "specific team" modes
2. **Clear separation of concerns** — `authorize()` handles route-level access, `canViewUserData()` handles data-level access
3. **Helper functions** — `canViewUserData()` and `getAccessibleUserIds()` are reused across routes and selectors
4. **Team-based scoping** — Not just global roles, but per-team role assignments
5. **Type safety** — Uses `TeamRole` type from auth middleware

### ⚠️ Issues Found

1. **`canViewUserData()` is permissive** — It allows MANAGER and LEAD roles to view ANY user's data if they hold that role in ANY team. In a multi-tenant scenario, a manager from Team A could view data from users who aren't in Team A.
   - **Impact:** Data leakage across teams.
   - **Current context:** This is acceptable since the data queries (meetings, action items) are scoped by team membership before reaching the data-access check. But it's worth noting as a defense-in-depth concern.

2. **`getAccessibleUserIds()` only checks within a single `teamMembers` array** — It doesn't consider cross-team membership. The function signature expects only one team's members.

3. **`authorize()` with `getTeamId` only checks if the teamId exists in `req.userTeams`** — But `req.userTeams` comes from the JWT, which may be stale (see auth middleware issue #1).

---

## 3. Role Hierarchy

| Role | Can View | Can Create Teams | Can Invite | Can Modify | Can Delete Team |
|------|----------|-----------------|------------|------------|-----------------|
| MANAGER | All in team | Yes | Yes | All members | Yes |
| LEAD | All in team | Yes | Yes (MEMBER only) | MEMBER role only | Yes |
| MEMBER | Self only | No | No | No | No |

✅ Well-designed hierarchy with clear separation of privileges.

---

## 4. Overall Middleware Assessment

**Rating: A (Excellent)**

The authentication and authorization system is well-designed with:
- Clean JWT-based auth
- Flexible team-based RBAC
- Extensible middleware pattern
- Good separation of authentication (who you are) and authorization (what you can do)

### Recommended Improvements

1. **Shorten JWT expiry** from 7 days to a shorter window (e.g., 24 hours) and implement refresh tokens
2. **Fetch team membership from DB on each request** instead of relying on JWT-stored teams, OR invalidate JWT on team changes
3. **Scope `canViewUserData()` to specific teams** for defense-in-depth
4. **Add more granular roles** if needed (e.g., `VIEWER` for read-only access)
