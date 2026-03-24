# Quick Start: Run E2E Tests

## TL;DR

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Setup database and test data, then run tests
cd backend
npm run db:setup           # Apply migrations + seed test data
npm run test:e2e           # Run comprehensive E2E test suite
```

## What Gets Tested

✅ **User Registration** - Create manager, lead, member users
✅ **Team Assignment** - Assign users to team with roles
✅ **Meeting Access** - Manager/Lead see team meetings, Member sees own only
✅ **Action Items** - Role-based filtering of action items
✅ **Permissions** - Members can't view/modify others' data
✅ **Stats** - Team aggregation for managers/leads
✅ **JWT Validation** - Tokens include team information

## Test Results Overview

After running `npm run test:e2e`, you'll see:

```
✅ Test 1: User Registration and Role Assignment
✅ Test 2: Team Creation and Member Assignment
✅ Test 3: Manager Can View Own Meetings
✅ Test 4: Member Can View Own Meetings
✅ Test 5: Manager Cannot View Member Meetings (Pre-Team)
✅ Test 6: Action Items - Create and View
✅ Test 7: Meeting Stats Endpoint
✅ Test 8: JWT Token Contains Team Information
✅ Test 9: Permission Check on Meeting Details
✅ Test 10: Modification Permissions (Owner Only)
```

## Frontend Testing

After backend tests pass:

```bash
# Terminal 3: Start frontend
cd frontend
npm run dev
```

Then:
1. Login as **manager@test.com** / Test123!@
2. Go to **Meetings** → Toggle "My Meetings" vs "Team Meetings"
3. Go to **Action Items** → Toggle "My Items" vs "Team Items"
4. Go to **Analytics** → Toggle "My Analytics" vs "Team Analytics"
5. Go to **Team Report** → See team performance dashboard

## Test Data

| User | Email | Password | Role | Can See |
|------|-------|----------|------|---------|
| Manager | manager@test.com | Test123!@ | MANAGER | All team data |
| Lead | lead@test.com | Test123!@ | LEAD | All team data |
| Member | member@test.com | Test123!@ | MEMBER | Own data only |

## Troubleshooting

**Tests fail at login?**
- Backend must be running on port 3001
- Check `.env` has correct DATABASE_URL

**Permission denied errors?**
- Run seed again: `npm run prisma:seed`
- Check database has team assignments

**Frontend shows no toggle?**
- Redux needs to reload user data
- Logout and login again after seed

See `TESTING_GUIDE.md` for detailed instructions.
