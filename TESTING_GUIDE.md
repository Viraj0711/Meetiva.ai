# Team RBAC E2E Testing Guide

This guide walks you through testing the complete Team Role-Based Access Control (RBAC) implementation.

## Prerequisites

✅ Backend is running (`npm run dev`)
✅ Frontend is running (or will be for UI testing)
✅ Database has the Team and TeamMember tables (migration completed)

## Step 1: Apply Database Migration

First, ensure the Prisma migration is applied:

```bash
cd backend
npm run prisma:migrate
```

**Expected Output:**
```
Datasource "db": PostgreSQL database "..." at "..."
Database client was not connected at the time this script was executed.
Migrations to apply:
  migrations/[timestamp]_add_team_and_role_support/migration.sql
```

## Step 2: Seed Test Data

Create test users and team assignments:

```bash
npm run prisma:seed
```

**Expected Output:**
```
🌱 Starting database seed...

👥 Creating test users...
✅ Created users:
   - Manager (uuid): manager@test.com
   - Lead (uuid): lead@test.com
   - Member (uuid): member@test.com

🏢 Creating team...
✅ Created team: Test Team (uuid)

🎯 Assigning users to team with roles...
✅ Team assignments:
   - Test Manager: MANAGER
   - Test Lead: LEAD
   - Test Member: MEMBER

✅ Created meetings:
   - Manager: Q1 Planning Session
   - Lead: Team Standup
   - Member: 1-on-1 Sync

✅ Seed completed!
```

## Step 3: Run E2E Tests

Execute the comprehensive test suite:

```bash
npm run test:e2e
```

The test will:
1. ✅ Register test users if they don't exist
2. ✅ Verify JWT tokens contain team information
3. ✅ Test meeting creation and listing
4. ✅ Test action item creation and listing
5. ✅ Verify permission checks
6. ✅ Validate stats aggregation

**Expected Output:**
```
🚀 Starting E2E Team RBAC Tests
================================

📝 Test 1: User Registration and Role Assignment
================================================
✅ Users registered:
   - Manager: manager@test.com
   - Lead: lead@test.com
   - Member: member@test.com

...

✅ All tests completed!

📝 NEXT STEPS:
   1. Create team via database seed or admin panel
   2. Assign users to team with roles (MANAGER, LEAD, MEMBER)
   3. Rerun tests - Manager/Lead should now see Member's data
   4. Verify frontend toggles show team data for managers/leads
```

## Step 4: Test Backend API Manually

### Login as Different Users

Test users created by seed:
- **manager@test.com** / Test123!@
- **lead@test.com** / Test123!@
- **member@test.com** / Test123!@

### 1. Manager Login & View Team Data

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"Test123!@"}'

# Response includes JWT with teams array:
{
  "user": {
    "id": "uuid",
    "email": "manager@test.com",
    "teams": [
      {
        "teamId": "uuid",
        "role": "MANAGER"
      }
    ]
  },
  "token": "eyJhbGc..."
}

# Get all meetings (should include own + team members')
curl http://localhost:3001/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 3 meetings total (own + lead's + member's)
```

### 2. Lead Login & View Team Data

```bash
# Login as lead
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lead@test.com","password":"Test123!@"}'

# Get meetings (should see all team members' meetings)
curl http://localhost:3001/api/meetings \
  -H "Authorization: Bearer LEAD_JWT_TOKEN"

# Expected: 3 meetings total (can see manager's, member's, and own)
```

### 3. Member Login & View Only Own Data

```bash
# Login as member
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@test.com","password":"Test123!@"}'

# Get meetings (should see only own)
curl http://localhost:3001/api/meetings \
  -H "Authorization: Bearer MEMBER_JWT_TOKEN"

# Expected: 1 meeting (only the member's own meeting)
```

### 4. Test Permission Denied

```bash
# Member tries to view manager's meeting
curl http://localhost:3001/api/meetings/MANAGER_MEETING_ID \
  -H "Authorization: Bearer MEMBER_JWT_TOKEN"

# Expected: 403 or 404 error (permission denied)
```

## Step 5: Test Frontend UI

### Manager Login Path

1. Open http://localhost:3000
2. Login with: **manager@test.com** / Test123!@
3. Navigate to **Meetings**
   - ✅ Should see toggle: "My Meetings" / "Team Meetings"
   - ✅ "My Meetings" shows only manager's meetings
   - ✅ "Team Meetings" shows all team members' meetings

4. Navigate to **Action Items**
   - ✅ Should see toggle: "My Items" / "Team Items"
   - ✅ Filtering works correctly

5. Navigate to **Analytics**
   - ✅ Should see toggle: "My Analytics" / "Team Analytics"
   - ✅ Stats aggregate across team when viewing team analytics

6. Navigate to **Team Report** (sidebar)
   - ✅ Shows team statistics
   - ✅ Lists all team members with their performance metrics
   - ✅ Shows completion rates, tasks, meetings

### Member Login Path

1. Logout from manager account
2. Login with: **member@test.com** / Test123!@
3. Navigate to **Meetings**
   - ✅ Should see ONLY "My Meetings" (toggle not visible)
   - ✅ Displays only member's meeting

4. Navigate to **Team Report** (sidebar)
   - ❌ Link should NOT appear (only for managers/leads)
   - Or if accessed directly, should show permission error

## Verification Checklist

### Backend Role-Based Filtering
- [ ] ✅ MANAGER sees own + all team members' meetings
- [ ] ✅ LEAD sees own + all team members' meetings
- [ ] ✅ MEMBER sees only own meetings
- [ ] ✅ JWT token contains teams array with role information
- [ ] ✅ Permission denied (403) when member tries to access other's data
- [ ] ✅ Only owner can modify/delete their own meetings

### Frontend Conditional Rendering
- [ ] ✅ Managers/leads see "My" / "Team" toggles
- [ ] ✅ Members don't see toggle (only "My" view always)
- [ ] ✅ Team Report page only accessible to managers/leads
- [ ] ✅ Analytics toggle appears for managers/leads
- [ ] ✅ Sidebar shows "Team Report" link for managers/leads only

### Data Isolation
- [ ] ✅ Members cannot view others' meetings in list (pre-team assignment)
- [ ] ✅ Members cannot view/modify/delete others' action items
- [ ] ✅ Managers can see everything in their teams
- [ ] ✅ Leads can see everything in their teams
- [ ] ✅ Users in different teams don't see each other's data

## Common Issues & Troubleshooting

### Issue: "permission denied" even for manager/lead

**Cause:** User not assigned to team or wrong role in TeamMember

**Fix:**
```bash
# Check team members in DB
SELECT u.email, t.name, tm.role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id;

# Should show:
# manager@test.com | Test Team | MANAGER
# lead@test.com    | Test Team | LEAD
# member@test.com  | Test Team | MEMBER
```

### Issue: JWT token doesn't include teams array

**Cause:** User doesn't exist in TeamMember table OR auth middleware not extracting teams

**Fix:**
1. Verify `backend/src/middleware/auth.ts` has teams extraction
2. Run seed script again: `npm run prisma:seed`
3. Re-login to get new token with teams

### Issue: Frontend toggles not showing

**Cause:** Redux selector not working or user data not loaded

**Fix:**
1. Open browser DevTools → Redux tab
2. Check `auth.user.teams` contains team information
3. Check `selectIsManagerOrLead()` selector returns true
4. If false, user doesn't have MANAGER/LEAD role

## Next Steps

1. ✅ Backend E2E tests pass
2. ✅ Frontend UI components work correctly
3. ✅ Role-based filtering verified
4. ✅ Permission checks validated ← **You are here**

5. 📝 Ready to demonstrate to stakeholders
6. 🚀 Deploy to staging/production

## Support

For issues or questions:
1. Check backend logs: `npm run dev`
2. Check browser console for errors
3. Verify test data with seed script
4. Manually test API endpoints with curl
