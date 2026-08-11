# Meetiva Enterprise Role & Access Control — Implementation Plan

## 1. How the Spec Maps to Our Current Codebase

### Current State Summary

| What exists | What the spec needs | Gap |
|---|---|---|
| **User model** — `subscriptionTier` (FREE/PRO/TEAM), no role, no org | Add `accountType` (self/corporate), `orgRole` (super_admin/admin/manager/team_leader/member), `organizationId`, `createdByUserId`, `forcePasswordChange`, `isRemoved`. **Subscription tiers become `FREE \| TEAM \| ENTERPRISE`** (PRO is removed). | Significant — 6 new fields + enum change |
| **Team model** — `managerId` field (points to creator) | Remove `managerId`, add `projectId`. Management derived through Project→Manager | Moderate — replace 1 field, add 1 |
| **TeamMember model** — roles: MANAGER/LEAD/MEMBER | Keep as-is for self users. Enterprise users get roles through org role system, not TeamMember | No change needed |
| **No Organization model** | Create `Organization` — the Enterprise tenant entity | New model |
| **No Project model** | Create `Project` — belongs to Org, has exactly 1 Manager | New model |
| **Auth middleware** — checks JWT, attaches `userTeams` | Add `userOrg` (org role + org ID) to JWT and request. Add `authorizeOrg()` middleware | Moderate |
| **Register endpoint** — creates FREE user | Add `accountType` param. For corporate: create in pending state, don't auto-grant Admin | Moderate |
| **No credential provisioning** | Add temp-password generation, force-change-on-first-login, admin-creates-user flow | New feature |
| **No seat limit logic** | Add org seat counting + enforcement at creation time | New feature |
| **Admin panel** — no role checks, shows everything | Add role-based scoping (Super Admin / Admin / Manager) enforced at API level | Significant |
| **Frontend sidebar** — flat nav, no context switcher | Add workspace switcher dropdown (personal vs org contexts) | New UI component |

---

## 2. Two Account Types — The Core Split

This is the most important architectural decision. The two systems coexist on the same User model but operate independently:

```
User
├── accountType: "self"
│   ├── subscriptionTier: FREE | TEAM
│   ├── orgRole: null
│   ├── organizationId: null
│   └── Uses existing Team system (MANAGER/LEAD/MEMBER via TeamMember)
│
└── accountType: "corporate"
    ├── orgRole: super_admin | admin | manager | team_leader | member
    ├── organizationId: ObjectId (ref Organization)
    ├── subscriptionTier: ENTERPRISE
    └── Uses Organization → Project → Team hierarchy
```

**A single User cannot be both.** If you're part of an org, your accountType is "corporate". Your personal teams (if any) from before joining an org remain accessible but are separate.

---

## 3. New Data Models

### 3a. Organization (new model)

```ts
{
  name: string,                     // e.g. "Acme Corp"
  slug: string,                     // URL-safe, unique
  adminUserId: ObjectId → User,     // the Admin who owns this org
  status: "pending" | "active" | "suspended",
  seatLimit: number,                // default 20
  seatsUsed: number,                // computed or cached
  subscriptionTier: "ENTERPRISE",
  subscriptionExpiresAt: Date | null,
  createdAt, updatedAt
}
```

**Key:** `status: "pending"` is the state after signup/payment but before our team manually provisions the Admin. Only when status = "active" can the Admin log in to the admin panel.

### 3b. Project (new model)

```ts
{
  name: string,
  organizationId: ObjectId → Organization,
  managerUserId: ObjectId → User,   // exactly 1 Manager per Project
  description: string | null,
  createdAt, updatedAt
}
```

**Constraint:** One Manager per Project. One Manager can have multiple Projects.

### 3c. Team (modify existing)

```diff
  {
    name: string,
    description: string | null,
-   managerId: ObjectId → User,
+   projectId: ObjectId → Project,     // Team belongs to a Project
    inviteCode: string,
    createdAt, updatedAt
  }
```

**Deriving the Manager:** To find who manages a Team, go `Team → Project → Project.managerUserId`. No redundant `managerId` on Team.

### 3d. User (modify existing — 7 new fields)

```diff
  {
    email, name, hashedPassword, isActive, isVerified,
    subscriptionTier,                   // add "ENTERPRISE" to enum
    meetingCountThisMonth, meetingCountResetAt, subscriptionExpiresAt,
+   accountType: "self" | "corporate",  // default "self"
+   orgRole: "super_admin" | "admin" | "manager" | "team_leader" | "member" | null,
+   organizationId: ObjectId → Organization | null,
+   createdByUserId: ObjectId → User | null,
+   forcePasswordChange: boolean,       // default false
+   isRemoved: boolean,                 // default false (soft delete for seat freeing)
+   tokenVersion: number,               // default 0 — incremented on removal/role-change for instant JWT revocation
    createdAt, updatedAt
  }
```

**Cascade delete change:** The current `pre('findOneAndDelete')` hook hard-deletes all related data. For Enterprise users, we need **soft delete** instead — set `isRemoved: true`, free the seat, but keep the record and all content. The `owner_active` / `owner_removed_pending_reassignment` pattern from the spec applies to meetings/tasks owned by removed users.

---

## 4. Backend Changes — Phase by Phase

### Phase 1: Schema & Shared Types

**Files to modify:**
- `shared/src/enums.ts` — add `AccountType`, `OrgRole`, `OrganizationStatus` types; change `SubscriptionTier` from `FREE | PRO | TEAM` to `FREE | TEAM | ENTERPRISE` (remove PRO, add ENTERPRISE)
- `shared/src/user.types.ts` — add new fields to `User` interface
- `backend/src/models/User.ts` — add 6 new fields to schema, change cascade delete to soft-delete for corporate users
- `backend/src/models/Team.ts` — replace `managerId` with `projectId`
- `backend/src/lib/shared.d.ts` — re-export new types

**New files:**
- `backend/src/models/Organization.ts`
- `backend/src/models/Project.ts`
- `backend/src/services/userRemoval.ts` — single `removeUser(userId)` function (see §12 for details)

### Phase 2: Auth & Middleware

**Files to modify:**
- `backend/src/middleware/auth.ts` — `authenticate` middleware now also fetches `orgRole` + `organizationId` + `tokenVersion` from User and attaches to `req.userOrg`. **Critical:** after decoding the JWT, compare `decoded.tokenVersion` with the user's current `tokenVersion` from DB. If mismatch, reject with 401 immediately (instant revocation).
- `backend/src/lib/schemas.ts` — add `createOrganizationSchema`, `createProjectSchema`, `provisionUserSchema` (for admin creating Manager/Team Leader/Member)
- `backend/src/routes/auth.ts` — register endpoint accepts optional `accountType: "corporate"` + `organizationId` (for pending org signup); login endpoint returns `orgRole` + `organizationId` in JWT

**New files:**
- `backend/src/middleware/authorizeOrg.ts` — new middleware:
  - `requireOrgRole(...roles)` — checks `req.userOrg.orgRole` is in allowed list
  - `requireOrgAccess()` — for Admin: verifies `user.organizationId` matches requested org; for Manager: verifies the requested Project is assigned to them; for Team Leader: verifies the requested Team is one they lead
  - `requireSuperAdmin()` — bypasses all org scoping
- `backend/src/lib/credentialProvisioning.ts` — temp password generation, `provisionUser()` function that creates user + sends credentials

### Phase 3: Organization, Project, Team Routes

**New files:**
- `backend/src/routes/organizations.ts` — Admin endpoints:
  - `GET /organizations/:id` — get org details (Admin only)
  - `PATCH /organizations/:id` — update org settings (Admin only)
  - `GET /organizations/:id/users` — list all users in org (Admin/Manager)
  - `POST /organizations/:id/users/provision` — create a new user (Admin creates Manager, Manager creates Team Leader, etc.) — enforces role hierarchy + seat limit
  - `GET /organizations/:id/seats` — seat usage info
  - `POST /organizations/:id/seats/request` — request more seats (stub for now)

- `backend/src/routes/projects.ts` — Manager/Admin endpoints:
  - `POST /projects` — create project (Admin or Manager)
  - `GET /projects` — list projects (scoped by role)
  - `PATCH /projects/:id` — update project (Admin or assigned Manager)
  - `POST /projects/:id/assign-manager` — assign/reassign Manager (Admin only)
  - `GET /projects/:id/teams` — list teams in project

- Modify `backend/src/routes/teams.ts`:
  - Team creation now requires `projectId` (for corporate users)
  - Team listing scoped by org role
  - `managerId` references removed/ignored

### Phase 4: Seat Limit & Removal Logic

**In `backend/src/routes/organizations.ts`:**
- `provisionUser()` checks `org.seatsUsed < org.seatLimit` before creating
- On user creation: increment `org.seatsUsed`
- On user removal: call `removeUser(userId)` — the ONLY sanctioned way to remove a user (see §12)
- `POST /organizations/:id/seats/recount` — recomputes `seatsUsed` by counting active non-removed users. Safety valve for cache drift.

**Replacement-before-removal enforcement:**
- `DELETE /organizations/:id/managers/:userId` — requires `replacementUserId` in body. Validates replacement is a valid Manager or new person. Only then calls `removeUser()`.
- `DELETE /projects/:id/teams/:teamId/leaders/:userId` — requires `replacementUserId`. Same pattern.

**Content handoff on removal:**
- See §12 for the complete inventory of all 8 direct + 2 indirect content types
- `GET /organizations/:id/disposition?removedUserId=...` — lists all content needing reassignment
- `PATCH /meetings/:id/reassign` — changes meeting ownership
- `PATCH /action-items/:id/reassign` — changes task ownership
- `DELETE /meetings/:id` — deletes meeting (cascades to summary/transcript)
- Notifications, auth records, team memberships, pending invitations — auto-cleaned by `removeUser()`

### Phase 5: Super Admin

**For our team (Meetiva internal) only — this is the ADMIN PANEL role, separate from the frontend demo account:**

- `orgRole: "super_admin"` is reserved exclusively for Meetiva's own team members
- This is for the **admin panel** (port 5174) — not the main website (port 5173)
- The demo account on the frontend (`admin@meetiva.com` / `admin123`) is just a regular FREE/PRO user used for demos — it is **not** a Super Admin and has nothing to do with this role
- `super_admin` can only be set directly in the database (MongoDB) or through a separate internal-only mechanism — **not creatable through any customer-facing API**
- `super_admin` users have `organizationId: null` — they are not tied to any customer org
- JWT includes `{ role: "super_admin" }` which bypasses all org checks
- Can list all Organizations, all Users across all orgs
- Can provision Admin credentials for pending orgs (this is our internal workflow for onboarding Enterprise customers)
- Admin panel shows platform-wide dashboard

---

## 5. Frontend Changes

### 5a. Signup Flow

**Modify `frontend/src/pages/auth/RegisterEnhanced.tsx`:**
- Add account type selection step: "Individual" vs "Organization"
- If "Organization": collect org name, create a pending Organization record, show "Your organization is being reviewed. We'll contact you with Admin credentials."
- If "Individual": existing flow unchanged

### 5b. Enterprise Upgrade

**New page or modal in Settings:**
- "Upgrade to Enterprise" button
- Collects org name, billing info (stub for now)
- Creates pending Organization
- Shows confirmation: "Your Enterprise request is being reviewed"

### 5c. Sidebar Workspace Switcher

**Modify `frontend/src/components/layout/Sidebar.tsx`:**
- Add dropdown at top of sidebar
- If user is `accountType: "self"` → shows personal account name
- If user is `accountType: "corporate"` → shows current Org/Project/Team context
- Lists all accessible contexts (user might be Manager on multiple Projects)
- Switching context changes what data is loaded

### 5d. First Login Password Change

**New component:**
- After login, if `user.forcePasswordChange === true`, show a modal blocking access until password is changed
- Calls `POST /auth/change-password` then sets `forcePasswordChange = false`

---

## 6. Admin Panel Changes

### 6a. Role-Based Access

**Modify `admin/src/components/Layout.tsx`:**
- Fetch current user's `orgRole` + `organizationId` on mount
- Conditionally show/hide nav items based on role:
  - Super Admin: all nav items + "Organizations" management
  - Admin: all nav items scoped to own org
  - Manager: Dashboard (scoped), Projects, Teams (scoped), Logs (scoped)
  - Others: no admin panel access → redirect to website

**Modify `admin/src/App.tsx`:**
- Check `orgRole` on login
- If `null` or `member` or `team_leader` → redirect to main website (no panel access)

### 6b. API-Level Scoping

**Modify `admin/src/lib/api.ts`:**
- All API calls automatically include org context
- New endpoints: `organizationsApi`, `projectsApi`

**New admin pages or sections:**
- Organizations page: Super Admin sees all orgs, Admin sees own org details
- Projects page: Admin sees all projects in org, Manager sees only assigned projects
- User provisioning: Admin/Manager can create users with temp credentials shown on screen

### 6c. Super Admin Dashboard

- Platform-wide stats (total orgs, total users, pending orgs)
- List of all Organizations with status (pending/active/suspended)
- Action: provision Admin credentials for pending orgs
- Action: suspend/activate orgs

---

## 7. JWT Changes & Instant Revocation

Current JWT payload: `{ userId, email, teams }`

New JWT payload: `{ userId, email, teams, orgRole, organizationId, tokenVersion }`

The `orgRole` and `organizationId` are included so middleware can make fast decisions without a DB lookup on every request.

### Instant Revocation (fixes stale JWT security risk)

**Problem:** If an Admin removes a Manager for cause (security concern), that Manager's JWT remains valid for up to 15 minutes. This is unacceptable for security-sensitive actions.

**Solution:** Add `tokenVersion` field to User (default 0). The JWT includes the `tokenVersion` at time of issuance. The `authenticate` middleware does a lightweight check: if `decoded.tokenVersion !== user.tokenVersion`, reject the token immediately with 401.

- On **user removal** (soft delete): increment `user.tokenVersion` → all existing JWTs instantly invalid
- On **role change** (e.g. demotion): increment `user.tokenVersion` → forces re-login with new permissions
- On **password change**: increment `user.tokenVersion` → invalidates all sessions (security best practice)

**Performance:** This adds one indexed field lookup per request (`User.findById(userId).select('tokenVersion')`). The `tokenVersion` field is a small integer, fits in memory/cache easily. For high-traffic scenarios, cache `tokenVersion` in Redis with the userId as key, invalidate on change.

**What gets revoked:**
- Access token (JWT) — rejected by middleware on next request
- Refresh tokens — all deleted from DB for that user on removal (existing `RefreshToken.deleteMany({ userId })` in cascade)
- Session cookie — cleared on next frontend logout

The flow on removal:
1. Admin removes user → `user.tokenVersion++`, `user.isRemoved = true`, `org.seatsUsed--`
2. User's next API call → middleware sees `tokenVersion` mismatch → 401
3. Frontend receives 401 → clears local state → shows login page
4. User cannot log in again (account is removed/inactive)

---

## 8. Access Matrix

| Role | Who gets this role | Admin Panel Access | Website Access | Scope |
|---|---|---|---|---|
| Super Admin | Meetiva team only (set in DB, not provisionable via API) | Full (platform-wide) | Full | Every organization, every user, on the whole platform |
| Admin | Created when Enterprise org is provisioned by Super Admin | Full (own org only) | Full | All projects/teams in own org, no other org |
| Manager | Created by Admin | Scoped | Full | Assigned project(s)/team(s) — can span multiple projects |
| Team Leader | Created by Manager | None | Full | Only team(s) they lead |
| Member | Created by Team Leader | None | Full | Only team(s) they belong to |

---

## 9. Credential Provisioning Flow

For every role below Admin, follow this pattern:

1. The higher role fills in basic info for the new user (name, email, role assignment/scope).
2. System generates login credentials (temp password).
3. Credentials are shown to the creator on-screen with a copy button — **no auto-email for now**. The creator manually shares the credentials with the new user however they like.
4. New user logs in and is forced to set their own password on first login (`forcePasswordChange: true`).
5. Keep the email-sending step abstracted behind a single function/service so it can be swapped for auto-email later without restructuring the flow.

**Note:** Super Admin is excluded from this flow — it cannot be provisioned through any customer-facing endpoint. Super Admin accounts are created only by Meetiva's internal team, directly in the database.

---

## 10. Seat Limits

- Each Enterprise package purchase includes a hard cap of **20 total users**, counting Managers + Team Leaders + Members combined, **across the entire organization** — not per-project, not per-manager. The Admin (the purchaser) does **not** count toward this limit.
- **One Manager per Project** (strict), but one Manager can be assigned to multiple Projects.
- Enforce at the point of credential creation — block creation and show a clear error once the org hits 20.
- Track remaining seats visible to the Admin (and ideally Managers, scoped to their own usage) in the Admin Panel.
- Once an org hits 20, adding more people requires a request up to the org's Admin (stub pricing/payment hook for now).
- **Cache drift mitigation:** add `POST /organizations/:id/seats/recount` endpoint that recomputes `seatsUsed` by counting `User.countDocuments({ organizationId, accountType: 'corporate', isRemoved: false })`. Expose as "Recount Seats" button in Admin Panel. Consider a weekly cron audit for safety.

---

## 11. Replacement-Before-Removal Rule

- **Team Leader removal:** the Manager picks a replacement first — either promoting an existing member of that team or assigning someone else — before the old Team Leader is removed.
- **Manager removal:** the Admin picks a replacement first — either a specific person, an existing Manager who takes on this project in addition to their current one(s) — before the old Manager is removed. **No promotion-in-place** (a Team Leader does not get promoted to Manager for their own former team).

---

## 12. Content Handoff on Removal — Complete Inventory & Safe Deletion Pattern

### The Problem: Mongoose Delete Hooks Don't Fire on All Delete Methods

The current `User.ts` has a `pre('findOneAndDelete')` hook that cascade-deletes related data. But Mongoose has several delete methods:
- `.findOneAndDelete()` — hook fires ✓
- `.deleteOne()` — hook does NOT fire ✗
- `.findByIdAndDelete()` — hook does NOT fire ✗
- `.deleteMany()` — hook does NOT fire ✗

If a future developer, bulk script, or admin action calls any of the non-hook methods, the user gets hard-deleted with none of the safety logic running. No seat freed, no content handoff, no token revocation.

### The Solution: Service Function + Safety Net Hooks

**Layer 1: `removeUser()` service function (primary path)**

Create `backend/src/services/userRemoval.ts` with a single `removeUser(userId)` function. This is the **only sanctioned way** to remove a user anywhere in the codebase. No route handler, script, or admin action is allowed to call `User.deleteOne()`, `User.findByIdAndDelete()`, etc. directly — they must all go through `removeUser()`.

```ts
// backend/src/services/userRemoval.ts
export async function removeUser(userId: string): Promise<void> {
  // 1. Soft-delete: set isRemoved = true (for corporate users)
  await User.findByIdAndUpdate(userId, {
    isRemoved: true,
    isActive: false,
    $inc: { tokenVersion: 1 },  // instant JWT revocation
  });

  // 2. Free the seat on the organization
  const user = await User.findById(userId).select('organizationId').lean();
  if (user?.organizationId) {
    await Organization.findByIdAndUpdate(user.organizationId, {
      $inc: { seatsUsed: -1 },
    });
  }

  // 3. Delete refresh tokens (all sessions invalidated)
  await RefreshToken.deleteMany({ userId });

  // 4. Delete Google Calendar OAuth tokens
  await GoogleCalendarAuth.deleteOne({ userId });

  // 5. Remove team memberships
  await TeamMember.deleteMany({ userId });

  // 6. Delete pending invitations sent by this user
  await TeamInvitation.deleteMany({ invitedBy: userId });

  // 7. Delete notifications (user-specific, no reassignment needed)
  await Notification.deleteMany({ userId });

  // 8. Content (meetings, tasks, chat messages) stays intact
  //    — flagged for disposition, NOT deleted
  //    Team Leader/Manager handles reassignment via disposition endpoints
}
```

**Layer 2: Mongoose hooks as safety net (belt-and-suspenders)**

In addition to the service function, register the same safety logic on ALL delete methods in `User.ts` so that if someone accidentally calls a raw delete method, the hook still fires as a backstop:

```ts
// In User.ts — register on ALL delete methods, not just findOneAndDelete
userSchema.pre('findOneAndDelete', async function () { /* soft-delete logic */ });
userSchema.pre('deleteOne', { document: true }, async function () { /* soft-delete logic */ });
userSchema.pre('deleteMany', async function () { /* soft-delete logic */ });
```

**Why both layers:**
- The service function is the **intended path** — easy to find, reason about, and audit
- The Mongoose hooks are a **safety net** in case someone bypasses the service function by mistake
- Code review checklist: verify all user removal goes through `removeUser()`, never raw `deleteOne`/`findByIdAndDelete`

### All Ownable Content Types (verified against codebase)

**Direct ownership (`userId` field):**

| Content Type | Model | Ownership Field | Disposition Action |
|---|---|---|---|
| Meeting (upload/recording) | `Meeting` | `userId` | Reassign to new user or delete |
| Action Item / Task | `ActionItem` | `userId` | Reassign to new user or delete |
| Notification | `Notification` | `userId` | Delete (user-specific, no reassignment needed) |
| Team Chat Message | `TeamChatMessage` | `userId` | Keep as historical record (author stays attributed) |
| Team Membership | `TeamMember` | `userId` | Remove membership record (handled by `removeUser()`) |
| Refresh Token | `RefreshToken` | `userId` | Delete (handled by `removeUser()`) |
| Google Calendar Auth | `GoogleCalendarAuth` | `userId` | Delete + revoke OAuth (handled by `removeUser()`) |
| Team Invitation (sent) | `TeamInvitation` | `invitedBy` | Delete pending invitations (handled by `removeUser()`) |

**Indirect ownership (cascade through parent Meeting):**

| Content Type | Model | Link | Disposition |
|---|---|---|---|
| Meeting Summary | `MeetingSummary` | `meetingId` → Meeting | Follows parent Meeting (reassign or delete with meeting) |
| Transcript | `Transcript` | `meetingId` → Meeting | Follows parent Meeting (reassign or delete with meeting) |

**Not user-owned (no action needed):**

| Content Type | Model | Reason |
|---|---|---|
| Team | `Team` | Belongs to Project, not individual user |
| Organization | `Organization` | Tenant entity, not user-owned |
| Project | `Project` | Belongs to Organization |

### Content Disposition Endpoints

```
GET  /organizations/:id/disposition?removedUserId=...   — list content needing reassignment
PATCH /meetings/:id/reassign                             — change meeting ownership
PATCH /action-items/:id/reassign                         — change task ownership
DELETE /meetings/:id                                     — delete meeting (cascades to summary/transcript)
DELETE /action-items/:id                                 — delete task
```

### Disposition Rules

- **Meetings + Summary + Transcript:** Reassign or delete as a unit. Summary and Transcript follow the parent Meeting.
- **Tasks:** Reassign individually. Tasks can go to any user in the same team/org.
- **Chat messages:** Keep as-is with original author attribution. Historical record, not reassignable.
- **Notifications:** Delete. They're user-specific and meaningless after removal.
- **Auth records (RefreshToken, GoogleCalendarAuth):** Auto-deleted by `removeUser()`. No disposition needed.
- **Team membership:** Auto-removed by `removeUser()`. No disposition needed.
- **Pending invitations sent by user:** Auto-deleted by `removeUser()`. Invitations from a removed user should not be claimable.

### What the Disposition UI Shows

The Team Leader/Manager sees a "Content from removed user [Name]" panel listing:
- Meetings owned by removed user (with summary preview)
- Tasks owned by removed user (with status)
- Each item has actions: "Reassign to..." (dropdown of team members) or "Delete"

Nothing is auto-deleted or auto-orphaned. Content sits owned-but-unassigned until acted on.

---

## 13. Migration Strategy

**Existing users are unaffected.** All existing users get `accountType: "self"` (default) and `orgRole: null`. The self team system continues working exactly as before. Enterprise is additive.

**Database migration:**
- Add new fields to User schema with defaults (no data loss)
- Change `subscriptionTier` enum from `FREE | PRO | TEAM` to `FREE | TEAM | ENTERPRISE`. Existing users with `PRO` tier need to be migrated — map `PRO` → `TEAM` (since TEAM is the new mid-tier). This is a one-time migration script.
- Add `projectId` to Team schema (optional, default null — existing teams without projects continue working for self users)
- Create Organization and Project collections
- No destructive changes to any existing collection

---

## 14. Implementation Order

| Phase | What | Estimated complexity |
|---|---|---|
| 1 | Schema changes (User, Team, new Organization + Project models) + shared types | Medium |
| 2 | Auth middleware updates + `authorizeOrg` middleware | Medium |
| 3 | Organization + Project CRUD routes | Medium |
| 4 | Credential provisioning flow (provision user, temp password, force change) | Medium |
| 5 | Seat limit enforcement + replacement-before-removal | Medium |
| 6 | Content handoff on user removal | Medium |
| 7 | Admin panel role-based access + Super Admin view | High |
| 8 | Frontend signup/upgrade flow changes | Low-Medium |
| 9 | Frontend sidebar context switcher | Low-Medium |
| 10 | First-login password change gate | Low |

---

## 15. Assumptions & Risk Mitigations

1. **`seatsUsed` on Organization** — maintained as a cached counter (incremented/decremented on user create/remove) rather than computing it live every time. **Risk:** cached counters can drift if any code path modifies users without going through the increment/decrement logic (e.g. a future bulk-admin action, a script, a failed transaction). **Mitigation:** add a `POST /organizations/:id/seats/recount` admin endpoint that recomputes `seatsUsed` by counting active non-removed users. Expose this as a "Recount Seats" button in the Admin Panel. Additionally, run a weekly cron job (or on-demand) that audits seat counts and logs discrepancies.

2. **JWT revocation on removal/role-change** — Handled via `tokenVersion` field (see §7). On removal, `tokenVersion` is incremented, instantly invalidating all existing JWTs. No 15-minute stale window.

3. **Self users who join an org** — If an existing self user gets invited to an org (as a Manager, Team Leader, or Member), their `accountType` changes to "corporate" and they get `orgRole` + `organizationId` set. Their personal teams remain accessible.

4. **Multiple orgs per user** — The spec says "keep `Organization.admin_user_id` capable of pointing to a user who owns more than one org" but "don't build multi-org-per-admin logic now." The field supports it but single-org is enforced for now. **This is a conscious deferral** — the schema is ready for multi-org, but the UI, middleware, and seat logic all assume one org per Admin. Revisit when a customer actually needs it.

5. **The `orgRole` + `role` coexistence — explicit permissions matrix:**

   A corporate user has TWO independent role axes:
   - **`orgRole`** on the User document — controls org-level and admin panel access
   - **`role`** on TeamMember — controls team-level operations on the website

   These operate at different scopes and are checked by different middleware. Here is the combined permissions matrix:

   | orgRole | TeamMember role | Can create Teams? | Can create Projects? | Can manage Team Members? | Can access Admin Panel? | Can see other orgs' data? |
   |---|---|---|---|---|---|---|
   | `admin` | (none or any) | Via Manager | Yes | No (delegates to Manager) | Yes — full org scope | No |
   | `admin` | `MANAGER` | Yes (as team creator) | N/A | Yes (team-level) | Yes — full org scope | No |
   | `manager` | (none) | No (needs TeamMember role) | No | No | Yes — scoped to assigned projects | No |
   | `manager` | `MANAGER` | Yes (in assigned projects) | No | Yes (team-level, assigned teams only) | Yes — scoped to assigned projects | No |
   | `team_leader` | `LEAD` | Yes (in their teams) | No | Yes (own team only) | No | No |
   | `team_leader` | `MEMBER` | No | No | No | No | No |
   | `member` | `MEMBER` | No | No | No | No | No |
   | null (self user) | `MANAGER` | Yes (personal teams) | No | Yes (personal teams) | No | No |
   | null (self user) | `LEAD` | Yes (personal teams) | No | Yes (own team) | No | No |
   | null (self user) | `MEMBER` | No | No | No | No | No |

   **Note:** `super_admin` is intentionally excluded from this table — it is Meetiva-internal only, not provisionable through any customer-facing API, and has unrestricted access to everything.

   **Key rules for middleware implementation:**
   - Admin Panel access: check `orgRole` — only `super_admin`, `admin`, and `manager` get access
   - Admin Panel scoping: `super_admin` sees all; `admin` sees own org; `manager` sees only assigned projects
   - Team creation on website: check TeamMember role (`MANAGER` or `LEAD`), not `orgRole`
   - Team member management: check TeamMember role, not `orgRole`
   - Project creation: check `orgRole === 'admin'` only
   - User provisioning (creating Managers/Team Leaders/Members): check `orgRole` hierarchy (admin creates managers, managers create team leaders, team leaders create members)
   - Org-level data access: check `organizationId` match, not TeamMember role

6. **User removal safety** — The `removeUser()` service function in `backend/src/services/userRemoval.ts` is the single sanctioned way to remove users. It handles soft-delete, seat decrement, token revocation, and cleanup in one place. Mongoose hooks on `findOneAndDelete`, `deleteOne`, and `deleteMany` serve as a safety net. No route handler, script, or admin action should call raw delete methods directly — they must go through `removeUser()`. This is enforced by code review and can be reinforced with a lint rule.
