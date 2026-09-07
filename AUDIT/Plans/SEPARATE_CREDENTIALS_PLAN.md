# Plan: Separate Login Credentials for Meetiva Website vs Admin Panel

## Current State (The Problem)

Both the **Meetiva website** (`localhost:5173`) and the **Admin Panel** (`localhost:3000`) share:

- The **same** `POST /auth/login` endpoint in `backend/src/routes/auth.ts`
- The **same** `User` model with a single `hashedPassword` field
- The **same** password hash — so credentials work on both platforms interchangeably

**What this means today:**
- An Admin provisioned via Super Admin gets ONE set of credentials
- Those credentials work on **both** the Admin Panel and the Meetiva website
- There is no way for an Admin to have a *different* password for each platform
- A regular user who happens to have an `admin` orgRole can log into the Admin Panel with their website password

**Why this is a problem:**
1. Security — Admin Panel access should be strictly controlled; shared credentials weaken that
2. An Admin might want a strong, complex password for Admin Panel and a simpler one for daily website use
3. If a website account is compromised (e.g., shared device), Admin Panel access is also compromised
4. Super Admin generates a temp password for the Admin — that same password becomes the website password too

---

## Decisions (Resolved)

| # | Question | Answer |
|---|----------|--------|
| 1 | Should Google Sign-In bypass platform separation? | **No.** Admin Panel has no Google Sign-In and won't need it. Keep platforms fully separate. |
| 2 | Should password reset be platform-specific? | **Yes.** Resetting the website password does NOT affect the Admin Panel password and vice versa. They are different accounts in practice. |
| 3 | Should "Use same password for both" be a convenience option? | **No.** Website and Admin Panel are different — no shortcut. Each platform gets its own independent password. |

---

## Proposed Solution

Add **platform-specific password hashing** to the existing `User` model. Each user can have up to two password hashes: one for the Meetiva website and one for the Admin Panel.

### Why this approach (not alternatives)?

| Alternative | Why rejected |
|-------------|-------------|
| Separate `AdminUser` collection | Duplicates all user fields (email, name, etc.), complex syncing |
| Completely separate accounts | Admin would need two emails or two logins — bad UX |
| JWT-based platform restriction only | Doesn't solve the credential sharing problem — same password still works on both |
| Separate `passwordHash` per platform on User model | ✅ Minimal changes, clean, backward-compatible |

---

## Database Changes

### User Model (`backend/src/models/User.ts`)

**Add new fields:**

```typescript
// Platform-specific password hashes (new)
websitePasswordHash?: string | null;   // Password for Meetiva website (meetiva.ai)
websitePasswordSalt?: string | null;   // Salt for website password
adminPasswordHash?: string | null;     // Password for Admin Panel (admin.meetiva.ai)
adminPasswordSalt?: string | null;     // Salt for admin panel password

// Migration flag
passwordMigrated?: boolean;           // true = platform-specific passwords are set
```

**Keep existing fields for backward compatibility:**

```typescript
// These stay but are deprecated — used as fallback during migration
hashedPassword?: string | null;        // DEPRECATED — fallback for unmigrated users
passwordSalt?: string;                 // DEPRECATED — fallback for unmigrated users
```

**Migration logic (in login handler):**

```typescript
// On login, check platform-specific first, fall back to legacy
if (platform === 'meetiva') {
  passwordValid = await verifyPassword(password, user.websitePasswordHash || user.hashedPassword);
} else if (platform === 'admin') {
  passwordValid = await verifyPassword(password, user.adminPasswordHash || user.hashedPassword);
}
```

---

## Backend Changes

### 1. Modify Login Endpoint (`POST /auth/login`)

**File:** `backend/src/routes/auth.ts`

Add a `platform` parameter to the login request body:

```typescript
// Request body becomes:
{ email: string; password: string; platform: 'meetiva' | 'admin' }
```

The login handler changes to:
1. Look up the user by email
2. Check the **platform-specific** password hash first
3. If not set (legacy/unmigrated user), fall back to the **old** `hashedPassword`
4. If platform-specific password is set AND the legacy hash doesn't match → reject
5. On successful login, include `platform` in the JWT access token

### 2. New Endpoint: `POST /auth/admin/login`

**File:** `backend/src/routes/auth.ts`

A dedicated admin login endpoint that:
- Only accepts `platform: 'admin'`
- Validates `adminPasswordHash` specifically
- Returns a JWT with `platform: 'admin'` claim
- Sets a different cookie name (e.g., `admin_refresh_token`) so sessions don't collide

### 3. New Endpoint: `POST /auth/change-password-platform`

**File:** `backend/src/routes/auth.ts`

Lets a user change password for a specific platform independently:

```typescript
POST /auth/change-password-platform
Body: {
  platform: 'meetiva' | 'admin',
  currentPassword: string,    // required if changing existing platform password
  newPassword: string
}
```

### 4. New Endpoint: `POST /auth/set-platform-password`

**File:** `backend/src/routes/auth.ts`

For users who don't have a platform-specific password yet (legacy users):

```typescript
POST /auth/set-platform-password
Body: {
  platform: 'meetiva' | 'admin',
  newPassword: string
}
```

### 5. Modify Refresh Token Flow

**File:** `backend/src/routes/auth.ts`

- Refresh token cookie should include platform info (or use separate cookie names)
- `POST /auth/refresh` should validate that the refresh token matches the expected platform

### 6. Modify JWT Claims

**File:** `backend/src/routes/auth.ts`

Add `platform` to the JWT payload:

```typescript
{
  userId,
  email,
  teams,
  orgRole,
  organizationId,
  tokenVersion,
  platform: 'meetiva' | 'admin',  // NEW
}
```

### 7. Auth Middleware Update

**File:** `backend/src/middleware/auth.ts`

Enforce platform restrictions on routes:
- Admin Panel routes require `platform: 'admin'` in JWT
- Website routes require `platform: 'meetiva'` in JWT

### 8. Modify Admin Provisioning

**File:** `backend/src/routes/organizations.ts`

When Super Admin provisions an Admin:
- Generate a temp password → store as `adminPasswordHash` (not `hashedPassword`)
- The Admin can later set a separate website password if they also use Meetiva

---

## Frontend Changes

### 1. Admin Panel Login (`admin/src/pages/LoginPage.tsx`)

Add `platform: 'admin'` to the login request:

```typescript
authApi.login(email, password, 'admin')
```

### 2. Admin Panel API Client (`admin/src/lib/api.ts`)

Update `authApi.login` to send platform:

```typescript
login: (email: string, password: string, platform = 'admin') =>
  request<{ token: string; user: MeUser }>(`/auth/${platform}/login`, {
    method: "POST",
    body: { email, password },
  }),
```

### 3. Meetiva Website Login (`frontend/src/pages/auth/Login.tsx`)

Add `platform: 'meetiva'` to the login request (or default it on the backend).

### 4. Profile Page — Password Section (`frontend/src/pages/Profile.tsx`)

Split the "Change Password" section into two tabs:
- **Website Password** — for the Meetiva website
- **Admin Panel Password** — for the Admin Panel (only visible if user has `orgRole: 'admin'` or `'super_admin'`)

### 5. Admin Panel Profile

Add a similar password management section for the Admin Panel specifically.

---

## Migration Strategy

### Phase 1: Backward-Compatible (Deploy First)

1. Add `websitePasswordHash`, `adminPasswordHash` fields to User model (nullable)
2. Modify login to check platform-specific first, fall back to legacy `hashedPassword`
3. All existing users continue working — no migration needed yet
4. New provisions (Admin accounts) get passwords stored in `adminPasswordHash`

### Phase 2: Migrate Existing Users (Optional)

1. When a user logs into the website, if `websitePasswordHash` is null, copy `hashedPassword` → `websitePasswordHash`
2. When an Admin logs into the Admin Panel, if `adminPasswordHash` is null, copy `hashedPassword` → `adminPasswordHash`
3. Set `passwordMigrated: true` once both are populated

### Phase 3: Enforce Separation

1. Remove the fallback to `hashedPassword`
2. Require platform-specific passwords
3. Users who haven't set a platform password get prompted to create one

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/models/User.ts` | Add `websitePasswordHash`, `adminPasswordHash` fields |
| `backend/src/routes/auth.ts` | Modify login, add platform-specific endpoints, update JWT |
| `backend/src/routes/organizations.ts` | Provision admin with `adminPasswordHash` |
| `backend/src/middleware/auth.ts` | Enforce platform on routes |
| `admin/src/pages/LoginPage.tsx` | Send `platform: 'admin'` on login |
| `admin/src/lib/api.ts` | Update `authApi.login` to include platform |
| `frontend/src/pages/auth/Login.tsx` | Send `platform: 'meetiva'` on login |
| `frontend/src/pages/Profile.tsx` | Split password section into website/admin |
| `frontend/src/services/auth.service.ts` | Update login to include platform |
| `shared/src/user.types.ts` | Add new field types |

---

## Security Considerations

1. **Cookie separation** — Use `refresh_token` for website, `admin_refresh_token` for Admin Panel. Prevents session cross-contamination.
2. **JWT platform claim** — Middleware enforces that Admin Panel routes only accept `platform: 'admin'` tokens.
3. **Rate limiting** — Admin login endpoint has its own rate limiter to prevent brute-force.
4. **Audit logging** — Log which platform a login came from for security audits.
5. **Backward compatibility** — Legacy `hashedPassword` fallback ensures zero downtime during migration.
