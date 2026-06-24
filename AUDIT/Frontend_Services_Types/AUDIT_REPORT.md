# Frontend Services & Types — Audit Report

**Date:** June 24, 2026
**Module:** Frontend API Services & Type Definitions
**Files Audited:** All files in `services/` and `types/` directories

---

## 1. API Client (`services/api.client.ts`)

### Architecture
```typescript
class ApiClient {
  private client: AxiosInstance;

  // Methods: get, post, put, patch, delete, upload
  // Interceptors: auth token injection, error handling
}
```

### ✅ Strengths
1. **Centralized Axios instance** — Single client with base URL, headers, timeout
2. **Auth interceptor** — Auto-injects Bearer token from localStorage
3. **Error interceptor** — Normalizes errors into `ApiError` type
4. **Auto-redirect on 401** — Clears auth state and redirects to /login
5. **upload method** — Handles FormData + progress tracking

### ⚠️ Issues
1. **30390ms timeout** is a magic number — Should be configurable
2. **`upload` method hardcodes `'file'` as form field name** — Some endpoints may use different field names
3. **401 redirect uses `window.location.href`** — Hard redirect, not React Router navigation. Loses app state.

---

## 2. API Config (`services/api.config.ts`)

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

✅ Simple, clean configuration.

---

## 3. Auth Service (`services/auth.service.ts`)

| Method | Path | Description |
|--------|------|-------------|
| `login` | POST /auth/login | Login |
| `register` | POST /auth/register-leader | Leader registration |
| `logout` | POST /auth/logout | **Doesn't exist on backend** |
| `getCurrentUser` | GET /auth/me | Get profile |
| `updateProfile` | PATCH /auth/me | Update profile |
| `refreshToken` | POST /auth/refresh | **Doesn't exist on backend** |
| `requestPasswordReset` | POST /auth/password-reset | **Doesn't exist on backend** |
| `resetPassword` | POST /auth/password-reset/confirm | **Doesn't exist on backend** |

### ⚠️ Issues
- **4 of 8 endpoints don't have backend implementations** (logout, refreshToken, requestPasswordReset, resetPassword)
- Uses Axios directly instead of `apiClient` for some methods (inconsistent)
- `getCurrentUser` returns `User` type but backend returns `{ id, email, name, ... }` which matches ✅

---

## 4. Meeting Service (`services/meeting.service.ts`)

| Method | Path |
|--------|------|
| `getMeetings` | GET /meetings |
| `getMeetingById` | GET /meetings/:id |
| `createMeeting` | POST /meetings |
| `uploadMeetingFile` | POST /meetings/upload |
| `updateMeeting` | PATCH /meetings/:id |
| `deleteMeeting` | DELETE /meetings/:id |
| `getMeetingSummary` | GET /meetings/:id/summary |
| `getMeetingTranscript` | GET /meetings/:id/transcript |
| `getMeetingActionItems` | GET /meetings/:id/action-items |
| `getMeetingStats` | GET /meetings/stats |

### Action Item Service (same file)
| Method | Path |
|--------|------|
| `getActionItems` | GET /action-items |
| `getActionItemById` | GET /action-items/:id |
| `createActionItem` | POST /action-items |
| `updateActionItem` | PATCH /action-items/:id |
| `deleteActionItem` | DELETE /action-items/:id |
| `completeActionItem` | POST /action-items/:id/complete |

✅ **Strengths:**
- Comprehensive meeting + action item API coverage
- `UploadDuplicateError` interface for duplicate detection
- Proper use of apiClient for all methods
- Progress callback for uploads

---

## 5. Calendar Service (`services/calendar.service.ts`)

| Method | Path |
|--------|------|
| `getGoogleConnectUrl` | Generates OAuth URL |
| `getConnectionStatus` | GET /calendar/status |
| `createEvent` | POST /calendar/create-event |
| `getUpcomingEvents` | GET /calendar/events |

✅ Good integration with Google Calendar API routes.
⚠️ `getGoogleConnectUrl` manually strips `/api/v1` from the base URL — fragile.

---

## 6. Integration Service (`services/integration.service.ts`)

| Method | Path |
|--------|------|
| `getIntegrations` | GET /integrations |
| `getIntegrationById` | GET /integrations/:id |
| `createIntegration` | POST /integrations |
| `updateIntegration` | PATCH /integrations/:id |
| `deleteIntegration` | DELETE /integrations/:id |
| `testIntegration` | POST /integrations/:id/test |
| `syncActionItems` | POST /integrations/:id/sync |
| `getGoogleCalendarStatus` | GET /calendar/status |
| `getGoogleAuthUrl` | Generates OAuth URL |
| `disconnectGoogleCalendar` | POST /calendar/disconnect |
| `getUpcomingEvents` | GET /calendar/events |
| `syncMeetingToCalendar` | POST /calendar/create-event |

### ⚠️ Issues
1. **No backend `/integrations` routes exist** — The `getIntegrations`, `createIntegration`, `updateIntegration`, `deleteIntegration`, `testIntegration`, and `syncActionItems` methods all call non-existent endpoints. These will all return 404.
2. **Google Calendar methods duplicate calendar.service.ts** — `getGoogleCalendarStatus`, `getUpcomingEvents`, `syncMeetingToCalendar` duplicate functionality from `calendar.service.ts`.
3. **`getGoogleAuthUrl` takes a `_teamId` parameter** that's never used.

---

## 7. Teams Service (`services/teams.service.ts`) — 210 lines

| Method | Path |
|--------|------|
| `createTeam` | POST /teams |
| `getTeams` | GET /teams |
| `getTeam` | GET /teams/:teamId |
| `getTeamMembers` | GET /teams/:teamId/members |
| `addTeamMember` | POST /teams/:teamId/members |
| `updateTeamMember` | PATCH /teams/:teamId/members/:userId |
| `updateTeamMemberProfile` | PATCH /teams/:teamId/members/:userId/profile |
| `resetTeamMemberCredentials` | POST /teams/:teamId/members/:userId/credentials/reset |
| `removeTeamMember` | DELETE /teams/:teamId/members/:userId |
| `deleteTeam` | DELETE /teams/:teamId |
| `inviteTeamMember` | POST /teams/:teamId/invite |
| `getPendingInvitations` | GET /teams/pending/invitations |
| `acceptInvitation` | POST /teams/invitations/:invitationId/accept |
| `getTeamChatMessages` | GET /teams/:teamId/chat/messages |
| `postTeamChatMessage` | POST /teams/:teamId/chat/messages |
| `getTeamChatStats` | GET /teams/chat/stats |

✅ **Strengths:**
- Comprehensive coverage of all team endpoints
- Good TypeScript interfaces for complex responses

### ⚠️ Issues
1. **`addTeamMember` calls `/teams/:teamId/members`** but the backend route is `/teams/:teamId/invite` — This will fail.
2. **Response type for `getTeam`** — The frontend expects `Team` type, but the backend returns a different shape (without `members`).

---

## 8. Workspace Service (`services/workspace.service.ts`)

```typescript
getOverview: async (): Promise<WorkspaceOverview> => {
  const response = await apiClient.get<WorkspaceOverview>('/workspace/overview');
  return response.data;
}
```

✅ Clean, minimal service.

---

## 9. Type Definitions (`types/`)

### Structure
```
types/
├── index.ts              # Re-exports all types
├── auth.types.ts         # User, AuthState, LoginCredentials, RegisterData, AuthResponse, TeamInfo
├── common.types.ts       # ApiError, ApiResponse, PaginatedResponse, Toast, etc.
├── meeting.types.ts      # Meeting, MeetingSummary, Transcript, ActionItem, MeetingStats, etc.
├── integration.types.ts  # Integration, IntegrationType, CalendarConfig
├── teams.types.ts        # Team, TeamMember, TeamRole, TeamsState
└── workspace.types.ts    # WorkspaceOverview, CalendarEvent, CalendarConnectionStatus
```

### ✅ Strengths
1. Comprehensive type coverage for all domain models
2. Proper enums for statuses and priorities
3. Re-exported from `index.ts` for clean imports
4. Type-safe API responses and request payloads

### ⚠️ Issues
1. **`MeetingStats` has duplicate fields** — `total` and `avgDuration` vs `averageDuration`. The API returns `totalMeetings` and `avgDuration`, but the type also has `total` and `averageDuration`.
2. **`ActionItem.status` uses string union** instead of importing from enums — `'pending' | 'in_progress' | 'completed' | 'cancelled'` is hardcoded.
3. **`Transcript.segments` uses `TranscriptSegment[]`** but backend always returns `[]`.
4. **`Team` type doesn't match API response** — Frontend expects a `role` field, but the `/teams` endpoint returns a list with role inside each item (the role is in the wrapper).

---

## 10. Overall Assessment

**Rating: B (Good)**

### ✅ Strengths
- Well-organized service layer with apiClient abstraction
- Comprehensive type coverage
- Calendar and team services are thorough

### ⚠️ Critical Issues
1. **Integration service calls non-existent backend endpoints** — `/integrations/*` routes don't exist on backend
2. **Auth service calls non-existent endpoints** — logout, refresh, password-reset
3. **`addTeamMember` hits wrong endpoint** — Should be `/invite`, not `/members`
4. **Type mismatches** between frontend expectations and backend responses

### Recommendations
1. Remove or implement missing integration endpoints on backend
2. Implement missing auth endpoints (or remove from frontend service)
3. Fix `addTeamMember` to call correct invite endpoint
4. Align frontend types with actual API responses
5. Consolidate Google Calendar methods into one service
