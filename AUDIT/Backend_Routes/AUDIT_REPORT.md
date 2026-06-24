# Backend Routes — Audit Report

**Date:** June 24, 2026
**Module:** Backend API Routes
**Files Audited:** `routes/auth.ts`, `routes/meetings.ts`, `routes/actionItems.ts`, `routes/teams.ts`, `routes/calendar.ts`, `routes/ai.ts`, `routes/notifications.ts`, `routes/workspace.ts`

---

## 1. Auth Routes (`routes/auth.ts`) — 273 lines

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None (blocked) | Invite-only: returns 403 |
| POST | `/auth/register-leader` | None | Team leader registration (validated) |
| POST | `/auth/login` | None | User login with email + password |
| GET | `/auth/me` | JWT | Get current user profile |
| PATCH | `/auth/me` | JWT | Update profile (name, email) |
| GET | `/auth/google` | JWT (query) | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Cookie | OAuth callback handler |

### ✅ Strengths
- Invite-only registration prevents public signups
- Input validation via `express-validator` on register and login
- Password hashing with bcryptjs (10 rounds)
- OAuth state parameter for CSRF protection
- HTTP-only cookies for OAuth state
- JWT token refresh on profile update
- User deactivation check during login

### ⚠️ Issues Found
1. **No refresh token endpoint** — The `auth.service.ts` client calls `/auth/refresh` but the route doesn't exist. This will cause 404 errors.
2. **No logout endpoint** — The frontend calls `/auth/logout` which doesn't exist (returns 404). The frontend just clears localStorage.
3. **No password change endpoint** — Profile page has password change UI but no backend route.
4. **No password reset flow** — The frontend service has `requestPasswordReset` and `resetPassword` methods but no backend routes exist.
5. **OAuth state cookie not marked `Secure` in dev** — Uses `secure: process.env.NODE_ENV === 'production'` which is correct.
6. **Token in query string for OAuth** — The JWT is passed as a query parameter (`?token=...`), which could be logged by proxies/servers. Consider using a session cookie instead.

---

## 2. Meetings Routes (`routes/meetings.ts`) — 460 lines

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/meetings` | JWT | List meetings (paginated, role-aware) |
| GET | `/meetings/stats` | JWT | Aggregate statistics |
| GET | `/meetings/:id` | JWT | Get single meeting |
| POST | `/meetings/upload` | JWT + Multer | Upload file (audio/video/txt) |
| POST | `/meetings` | JWT | Create meeting manually |
| PATCH | `/meetings/:id` | JWT | Update meeting (owner only) |
| DELETE | `/meetings/:id` | JWT | Delete meeting (owner only) |
| GET | `/meetings/:id/summary` | JWT | Get AI summary |
| GET | `/meetings/:id/transcript` | JWT | Get transcript |
| GET | `/meetings/:id/action-items` | JWT | Get action items for a meeting |
| GET | `/meetings/:id/action-items/export` | JWT | Export action items as .xlsx |

### ✅ Strengths
- **Duplicate meeting detection** by normalized transcript comparison (prevents duplicate uploads)
- **Role-aware data visibility** — Managers/Leads see team members' meetings; Members see only their own
- **Atomic transactions** for creating transcript, summary, and action items
- **ExcelJS export** with proper content-type headers
- **Multer memory storage** with Whisper's 25MB hard limit
- **Graceful Whisper error surfacing** (413 for oversized files)
- Pagination support

### ⚠️ Issues Found
1. **Route order matters** — `POST /meetings/upload` is registered after `GET /meetings/:id`. Express matches routes in order, so this is okay since POST and GET are different methods. But `POST /meetings` (the manual create) after the upload route means Express needs to differentiate by method — which it does correctly.
2. **`POST /meetings/upload` path** — The frontend calls `/meetings/upload` but `POST /meetings` also exists for manual creation. The path `/meetings/upload` is correct.
3. **No file type validation** in the route — File type validation is done in `whisperTranscriber.ts` but only for audio/video. Text files are accepted without content validation.
4. **The `jsonArrayToStringArray`** helper is duplicated in meetings.ts and actionItems.ts. Should be extracted to a shared utility.
5. **No request size limit for non-file requests** — The `POST /meetings` (manual create) and `PATCH /meetings/:id` endpoints lack body size limits.

---

## 3. Action Items Routes (`routes/actionItems.ts`) — 256 lines

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/action-items` | JWT | List action items (paginated) |
| GET | `/action-items/:id` | JWT | Get single item |
| POST | `/action-items` | JWT | Create action item |
| PATCH | `/action-items/:id` | JWT | Update item (owner only) |
| DELETE | `/action-items/:id` | JWT | Delete item (owner only) |
| POST | `/action-items/:id/complete` | JWT | Mark as completed |

### ✅ Strengths
- Role-aware data visibility (same pattern as meetings)
- Ownership enforcement for modifications
- `syncMeetingStatusFromActionItems()` called on all mutations
- Complete endpoint sets `completedAt` timestamp
- Paginated list endpoint

### ⚠️ Issues
1. **`POST /action-items`** creates an item but uses `findFirst` to check meeting ownership. This only checks if the user created the meeting, not if they're a team member with access.
2. **Owner-only modifications** — Managers/Leads cannot reassign or edit team members' action items. This may be intentional but limits management capabilities.
3. **`jsonArrayToStringArray`** is duplicated from meetings.ts. Refactor to shared utility.

---

## 4. Teams Routes (`routes/teams.ts`) — 685 lines (largest route file)

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/teams` | JWT | Create team |
| GET | `/teams` | JWT | List user's teams |
| GET | `/teams/chat/stats` | JWT | Chat analytics |
| GET | `/teams/pending/invitations` | JWT | Pending invites |
| GET | `/teams/:teamId` | JWT | Get team details |
| GET | `/teams/:teamId/chat/messages` | JWT | Get chat messages |
| POST | `/teams/:teamId/chat/messages` | JWT | Post chat message |
| GET | `/teams/:teamId/members` | JWT | List members |
| POST | `/teams/:teamId/invite` | JWT | Invite/Add member |
| POST | `/teams/invitations/:invitationId/accept` | JWT | Accept invitation |
| PATCH | `/teams/:teamId/members/:userId` | JWT | Change role |
| PATCH | `/teams/:teamId/members/:userId/profile` | JWT | Edit member details |
| POST | `/teams/:teamId/members/:userId/credentials/reset` | JWT | Reset password |
| DELETE | `/teams/:teamId/members/:userId` | JWT | Remove member |
| DELETE | `/teams/:teamId` | JWT | Delete team |

### ✅ Strengths
- **Comprehensive RBAC** — Three-tier role system (MANAGER > LEAD > MEMBER)
- **Self-creating member accounts** — Leaders can invite via email; if the user doesn't exist, an account is auto-created with a temporary password
- **Credential management** — Reset passwords, update profiles, change roles
- **Team chat** — Full messaging system with pagination and user enrichment
- **Chat analytics** — Daily trends, per-team stats, activity tracking
- **Invitation system** — Accept/expire/revoke workflows
- **Atomic operations** — Clean up related invitations when adding existing users

### ⚠️ Issues Found
1. **`getTeam` response format mismatch** — The frontend `getTeam()` expects `Team` type, but the backend returns a different shape (without `members`). This could cause runtime errors.
2. **`getTeamMembers` response** — The frontend expects `{ members: TeamMember[] }` but the backend returns with correct structure. ✅
3. **No validation on `resetTeamMemberCredentials`** — No rate limiting on credential resets. A malicious LEAD could repeatedly reset passwords.
4. **`LEAD` role is used inconsistently** — Created as `LEAD` in routes, but `Prisma` schema has `.LEAD` in the enum. This is consistent but the naming is confusing — `LEAD` vs `LEADER` vs `MANAGER`. Documentation could clarify hierarchy.
5. **No pagination on team members list** — For large teams, returning all members at once could be a performance issue.
6. **Visible `temporaryPassword` in API response** — The password is sent in plaintext in the response. This is a necessary trade-off, but ensure the response is only served over HTTPS.

---

## 5. Calendar Routes (`routes/calendar.ts`) — 126 lines

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/calendar/status` | JWT | Connection status |
| GET | `/calendar/events` | JWT | List events |
| GET | `/calendar/events/upcoming` | JWT | Upcoming events |
| POST | `/calendar/create-event` | JWT | Create event |
| POST | `/calendar/disconnect` | JWT | Disconnect Google Calendar |

### ✅ Strengths
- Input validation with express-validator
- Error status code differentiation (403 for "not connected" vs 500)
- Proper ISO8601 validation for dates

### ⚠️ Issues
1. **`getUpcomingEvents` in frontend** calls `/calendar/events` with a `maxResults` param, but the backend only respects `maxResults` on the `/calendar/events` endpoint (not `/calendar/events/upcoming` which is hardcoded to 10).
2. **No event pagination** — This is acceptable for calendar events since they're typically limited.

---

## 6. AI Routes (`routes/ai.ts`) — 69 lines

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/grok` | None | Proxy to Grok API |

### ⚠️ Issues
1. **No authentication** — This endpoint is publicly accessible. Anyone with the server URL can call the Grok API through this proxy, potentially running up costs.
2. **No rate limiting** — Could be abused for DoS or cost exhaustion.
3. **No input sanitization** — The prompt/messages are forwarded as-is.
4. **Should require authentication** at minimum, and ideally a per-user rate limit.

---

## 7. Notifications Routes (`routes/notifications.ts`) — 60 lines

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | List notifications |
| PATCH | `/notifications/:id/read` | JWT | Mark as read |

✅ Clean, minimal implementation. No issues.

---

## 8. Workspace Routes (`routes/workspace.ts`) — 93 lines

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspace/overview` | JWT | Dashboard data |

✅ Aggregates meetings, deadlines, and stats for the workspace dashboard. Well-structured.

---

## 9. Route-Level Issues Summary

### 🔴 Critical
1. **`POST /ai/grok` has no auth or rate limiting** — Public AI proxy endpoint
2. **Missing route implementations** — `/auth/refresh`, `/auth/logout`, `/auth/password-reset/*` are called by frontend but don't exist

### 🟡 Moderate
3. **JWT in OAuth query string** — Token exposure risk
4. **No API-level rate limiting** — Only the catch-all wildcard has rate limiting
5. **Duplicated `jsonArrayToStringArray` utility** — Across multiple route files
6. **No request body size limits** on POST/PATCH endpoints

### 🟢 Minor
7. **OAuth state cookie marked `Secure` only in production** — Correct but note for local testing
8. **No file upload progress feedback from backend** — Frontend simulates progress locally

---

## 10. Overall Route Assessment

**Rating: A- (Very Good)**

The route layer is comprehensive and well-implemented. The RBAC system is particularly well-designed with team hierarchies. The main concerns are the unauthenticated AI proxy and missing frontend-called endpoints.

**Key Improvements:**
1. Add auth middleware to `/ai/grok`
2. Implement missing auth endpoints (refresh, password reset, logout)
3. Extract `jsonArrayToStringArray` to shared utility
4. Add per-endpoint rate limiting
