# Invitation-Gated Hierarchy System Setup Guide

## Overview
This document describes the Google Workspace-style invitation-gated hierarchy system that has been implemented. The system allows a Manager to invite Team Leads, and Team Leads to invite Members, with strict visibility controls based on role and invitation status.

## What Has Been Implemented

### ✅ Database Layer
- **Prisma Schema Updated** (`backend/prisma/schema.prisma`):
  - Added `InvitationStatus` enum: `PENDING, ACCEPTED, REVOKED, EXPIRED`
  - Updated `TeamMember` model with fields:
    - `status`: Invitation status (default: `ACCEPTED` for backward compatibility)
    - `invitedBy`: User ID of who sent the invitation
    - `invitedAt`: When the invitation was sent
    - `acceptedAt`: When the invitation was accepted
  - Added `Team.managerId` field to track team creator
  - Created new `TeamInvitation` model for pending invitations  
  - Added `User.invitedByRelations` and `User.sentInvitations` for tracking

- **Migration File Created** (`backend/prisma/migrations/1_add_invitations/migration.sql`):
  - Contains all SQL commands needed to apply the schema changes
  - **NOT YET APPLIED** to the database

### ✅ Backend API Routes Updated (`backend/src/routes/teams.ts`)
- **POST `/teams`** - Create team (sets `managerId`)
- **GET `/teams`** - List user's teams (includes status info)
- **GET `/teams/:teamId/members`** - Get team members with hierarchy-aware visibility:
  - `MANAGER`: Sees all members
  - `LEAD`: Sees members under them (excludes peer leads)
  - `MEMBER`: Sees only manager/leads
  
- **POST `/teams/:teamId/invite`** - Send invitation (replaces direct member add):
  - Only `MANAGER` and `LEAD` can invite
  - `LEAD` can only invite `MEMBER` role
  - Creates `TeamInvitation` record with 30-day expiry
  - Can resend/update existing invitations via `upsert`

- **GET `/teams/pending/invitations`** - Get pending invitations for current user:
  - Filters expired invitations
  - Returns detailed invitation info (sender, team, role, expiry date)

-  **POST `/teams/invitations/:invitationId/accept`** - Accept an invitation:
  - Validates invitation ownership (by email)
  - Creates `TeamMember` entry with `status: ACCEPTED`
  - Updates invite record to `ACCEPTED`
  - Can be called after login to complete onboarding

- **PATCH `/teams/:teamId/members/:userId`** - Update member role (unchanged)
- **DELETE `/teams/:teamId/members/:userId`** - Remove member (unchanged)

### ✅ Frontend Components & Services

- **TeamsAdmin Component** (`frontend/src/pages/TeamsAdmin.tsx`):
  - Create Team modal (unchanged)
  - **Updated**: "Invite Member" button and flow
  - Modal now collects email + role and sends invitation
  - Shows "Pending Invitations" section with status badges
  - Displays expiry dates for pending invites

- **Teams Service** (`frontend/src/services/teams.service.ts`):
  - `inviteTeamMember()` - Send invitation  
  - `getPendingInvitations()` - Fetch user's pending invites
  - `acceptInvitation()` - Accept an invite by ID
  - Existing methods updated with invitation-aware fields

- **Redux State** (`frontend/src/store/slices/teamsSlice.ts`):
  - Unchanged (existing structure supports invitation fields)

- **Styling** (`frontend/src/pages/TeamsAdmin.css`):
  - Added pending invitations UI styling
  - Responsive design maintained

## Next Steps to Complete Implementation

### Step 1: Apply Database Migration
```bash
cd backend
npm run db:setup
```

This will:
- Apply the migration to PostgreSQL
- Add new columns to `team_members` table
- Create new `team_invitations` table
- Update `teams` and `users` tables

After migration, regenerate Prisma Client:
```bash
npx prisma generate
```

### Step 2: Update Backend Auth Routes
**File**: `backend/src/routes/auth.ts`

Add invite-gating to signup/login flow:

```typescript
// In signup endpoint - check if user has valid pending invitation
// before allowing LEAD/MEMBER role signup
// Only MANAGER can create accounts freely

// In login endpoint - no changes needed (existing flow works)
```

### Step 3: Create Invite Acceptance Page (Frontend)
**New Files**: 
- `frontend/src/pages/PendingInvitations.tsx`
- `frontend/src/pages/PendingInvitations.css`

This page should:
- Show pending invitations for logged-in user
- Display sender name, team name, offered role
- Provide "Accept" and "Decline" buttons
- Auto-refresh after accepting (redirect to dashboard)

Add route: `dashboard/pending-invitations`

### Step 4: Test End-to-End Flow

#### Scenario 1: Manager Creates Team & Invites Lead
1. Login as Manager (user role = MANAGER)
2. Create Team
3. Invite lead@example.com as LEAD
4. Verify invitation appears in pending-invitations list (backend: `GET /teams/pending/invitations`)

#### Scenario 2: Lead Accepts Invitation & Invites Member
1. Login as lead@example.com (or signup if needed)
2. Go to pending invitations page
3. Accept invitation for the team
4. Go to Teams Admin for that team
5. Invite member@example.com as MEMBER

#### Scenario 3: Verify Hierarchical Visibility
1. As Manager: Can see all members in all teams
2. As Lead: Can only see members and manager in their team
3. As Member: Can only see lead/manager, not other members

#### Scenario 4: Verify Invitations Expire
1. Create invitation
2. Wait for expiry (30 days in code) or modify for testing
3. Try to accept expired invite → Should fail with "Invitation has expired"

## File Changes Summary

### Modified Files
- ✅ `backend/src/routes/teams.ts` - Updated with invitation endpoints
- ✅ `backend/prisma/schema.prisma` - Added invitation fields/models
- ✅ `frontend/src/pages/TeamsAdmin.tsx` - Updated to use invitations
- ✅ `frontend/src/pages/TeamsAdmin.css` - Added pending invitations styling
- ✅ `frontend/src/services/teams.service.ts` - Added invitation API methods

### Created Files  
- ✅ `backend/prisma/migrations/1_add_invitations/migration.sql` - Database migration
- ⏳ `frontend/src/pages/PendingInvitations.tsx` - TO DO
- ⏳ `frontend/src/pages/PendingInvitations.css` - TO DO

### Type Definitions (No changes needed)
- Uses existing `Team`, `TeamMember`, `User` types
- New `TeamInvitation` interface in `teams.service.ts`
- No updates needed to `frontend/src/types/` yet

## Database Changes Applied By Migration

```sql
-- Add InvitationStatus enum
ALTER TABLE "TeamMember" ADD COLUMN "status" status DEFAULT 'ACCEPTED';
ALTER TABLE "TeamMember" ADD COLUMN "invitedBy" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN "invitedAt" TIMESTAMP(3);
ALTER TABLE "TeamMember" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- Add managerId to teams
ALTER TABLE "Team" ADD COLUMN "managerId" TEXT;

-- Create invitations table
CREATE TABLE "TeamInvitation" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "role" role NOT NULL, -- 'LEAD' or 'MEMBER'
  "status" status NOT NULL DEFAULT 'PENDING',
  "invitedBy" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id")
);

-- Create unique constraint for pending invites
CREATE UNIQUE INDEX "TeamInvitation_email_teamId_key" 
  ON "TeamInvitation"("email", "teamId") 
  WHERE status = 'PENDING';

-- Add foreign key relationship
ALTER TABLE "Team" ADD FOREIGN KEY ("managerId") REFERENCES "User"("id");
```

## How It Works: Flow Diagrams

### Invitation Flow
```
Manager creates team
    ↓
Manager invites lead@example.com as LEAD
    ↓ (creates TeamInvitation with status=PENDING)
EmailInvite sent to lead@example.com
    ↓
Lead signs up / logs in
    ↓
Lead views pending invitations
    ↓
Lead clicks "Accept"
    ↓ (calls POST /teams/invitations/:id/accept)
TeamMember entry created with status=ACCEPTED
    ↓
Lead can now access team & invite members
```

### Visibility Enforcement
```
GET /teams/:teamId/members
    ↓
Check requester's role
    ├─ MANAGER: Return all members
    ├─ LEAD: Return only members (no peer leads) + manager
    └─ MEMBER: Return only manager/leads (not peers)
```

## Backward Compatibility

- Existing team members have `status: ACCEPTED` by default
- Existing teams have `managerId` set during first load
- No breaking changes to existing endpoints
- Old "Add Member" button replaced with "Invite Member"

## Gotchas & Important Notes

1. **Database Migration is Critical**: Code won't compile without it
2. **30-Day Expiry**: Hardcoded in `backend/src/routes/teams.ts` line 264
3. **Email Must Match**: User email must match invitation email for acceptance
4. **Upsert on Invite**: Resending invite to same email updates existing record
5. **Status Field**: Now part of TeamMember responses in all endpoints

## Questions?

Refer to Prisma types after migration for field details:
```bash
cat node_modules/.prisma/client/index.d.ts | grep -A 20 "interface TeamMember"
```

For API testing, use the backend test file: `backend/tests/e2e-team-rbac.test.ts`
