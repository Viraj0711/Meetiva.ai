# Meetiva Role System — Implementation Plan (v2)

## Role Hierarchy

```
Super Admin (us — Meetiva team)
  └── Admin (client — one per org, pays subscription)
        └── Manager (assigned per project by Admin)
              └── Team Leader (assigned per team by Manager)
                    └── Team Member (invited by Team Leader)
```

| Role | Admin Panel | Meetiva Website | Subscription |
|------|-------------|-----------------|--------------|
| **Super Admin** | ✅ Full access — all orgs | ✅ | N/A (platform owner) |
| **Admin** | ✅ Own org only | ✅ | Owns the org subscription (monthly/yearly) |
| **Manager** | ❌ | ✅ | Enterprise (auto-upgraded) |
| **Team Leader** | ❌ | ✅ | Enterprise (auto-upgraded) |
| **Team Member** | ❌ | ✅ | Enterprise (auto-upgraded) |

---

## The Dual Profile System

Every user on Meetiva has **one account** (one email + password) but **two profiles**:

### 1. Individual Profile
- Account type: `self`
- Subscription tier: Whatever they pay for (Free / Team / Enterprise)
- Sees: Personal meetings, personal tasks, personal analytics
- This is their default view when they sign up normally
- Free tier users get the same 5 meetings/month, etc.

### 2. Enterprise Profile
- Account type: `corporate`
- Subscription tier: **Enterprise** (auto-assigned when they join an org via invite link)
- Sees: Org projects, team meetings, team tasks, team analytics
- Activity is visible to their Team Leader and Admin dashboards
- Meetings uploaded here count toward the org's enterprise plan

### Switching Between Profiles
- A **workspace switcher button** in the Navbar (top-left corner) lets the user toggle between their Individual and Enterprise profiles
- This **changes `accountType` in the database** — it's a real switch, not just a view toggle
- The switcher only appears if the user has both profiles (i.e., they're linked to an org AND have a personal account)
- When on Enterprise profile → they see org-related content, uploads appear in team leader + admin dashboards
- When on Individual profile → they see only personal content, standard free/team tier limits apply

---

## What the Enterprise Profile Includes

When someone joins an org via invite link, their Enterprise profile gets:

| Feature | Enterprise Profile | Individual Profile (Free) |
|---------|-------------------|--------------------------|
| Meeting uploads | Unlimited | 5/month |
| AI summaries | ✅ | ✅ |
| Minutes extraction | ✅ | ✅ |
| Minutes PDF | ✅ | ✅ |
| Team collaboration | ✅ | ❌ |
| Analytics dashboard | ✅ | ❌ |
| Calendar sync | ✅ | ❌ |
| Priority support | ✅ | ❌ |

### Activity Logging
When a user uploads a meeting on their Enterprise profile:
- The meeting appears in **their own** Enterprise dashboard
- The meeting also appears in their **Team Leader's** dashboard
- The meeting also rolls up to the **Admin's** dashboard
- Each level sees: who uploaded what, when, status (processing/completed)

---

## Org Subscription & Billing

- The **Admin** (org owner) pays for the org subscription — monthly or yearly
- The org subscription covers **all members** of the org (Enterprise tier for everyone)
- Individual members don't pay — the Admin's subscription covers them
- If a member also uses their Individual profile on a paid plan (e.g., Team), that's their separate subscription
- The org subscription tier determines what's available across the org (Enterprise = everything)

---

## Flow 1: Organization Creation

1. **User** (normal self account) sends an organization request via the public form (`/register` → Enterprise step)
2. **Super Admin** reviews the request in the Admin Panel
3. **Super Admin approves** → system generates a secure temporary password for the admin's email
4. **Admin receives credentials** (email notification with email + temporary password)
5. **Admin logs into Admin Panel** using those credentials
6. Admin can only see/manage their own organization — nothing else
7. Admin's Individual profile remains unchanged (they keep their personal account)

---

## Flow 2: Project → Manager Invitation

1. **Admin** creates a new project within their org in the Admin Panel
2. **Admin** sends an invitation link to a person they want as **Manager**
   - The link is emailed to the recipient AND can be copied to clipboard
3. **Recipient** opens the link:
   - **If they have an existing account** → they log in. Their Enterprise profile is auto-created and linked to the org as Manager of that project.
   - **If they don't have an account** → they go to `/register`, create an account, then join the org as Manager of that project.
4. The recipient now has two profiles:
   - **Individual** — their original personal profile (unchanged)
   - **Enterprise** — linked to the org, Manager role, Enterprise tier benefits
5. Activity on Enterprise profile flows up: Manager → Admin dashboard

---

## Flow 3: Project Division → Team Leader Invitation

1. **Manager** divides the project into teams
2. **Manager** sends an invitation link to a person they want as **Team Leader** for a specific team
   - Email + copy link
3. **Recipient** opens the link:
   - **If they have an existing account** → they log in, Enterprise profile created/linked as Team Leader of that team
   - **If they don't have an account** → they register via `/register`, then join as Team Leader
4. Team Leader now has two profiles (Individual + Enterprise)
5. Activity on Enterprise profile flows up: Team Leader → Manager → Admin dashboards

---

## Flow 4: Team → Team Member Invitation

1. **Team Leader** invites people to their team
   - Email + copy link
2. **Recipient** opens the link:
   - **If they have an existing account** → they log in, Enterprise profile created/linked as Team Member
   - **If they don't have an account** → they register via `/register`, then join as Team Member
3. Team Member now has two profiles (Individual + Enterprise)
4. Activity on Enterprise profile flows up: Member → Team Leader → Manager → Admin dashboards

---

## Flow 5: Account Type Switching (Workspace Switcher)

- A **workspace switcher button** in the Navbar (top-left) lets users toggle between profiles
- Only appears if the user has both profiles (linked to an org)
- **Actual switch** — changes `accountType` in the database
- **Enterprise → Individual**: Sees personal meetings, free tier limits apply
- **Individual → Enterprise**: Sees org projects, unlimited uploads, activity visible to team leader + admin

---

## Admin Panel Access Rules

| Who | Admin Panel |
|-----|-------------|
| **Super Admin** | ✅ All organizations, all users, approve/reject org requests, manage any org |
| **Admin** | ✅ Own organization only — projects, managers, team structure, settings |
| **Manager, Team Leader, Team Member** | ❌ No access — redirect to `/dashboard` if they try to visit `/admin` |

---

## Data Model

### User Model
```
User {
  email, name, hashedPassword, ...

  // Individual profile
  accountType: 'self' | 'corporate'     // current active profile
  subscriptionTier: 'FREE' | 'TEAM' | 'ENTERPRISE'

  // Enterprise profile (populated when they join an org)
  organizationId?: string                // linked org
  orgRole?: 'super_admin' | 'admin' | 'manager' | 'team_leader' | 'member'

  // Profile switching
  hasEnterpriseProfile: boolean          // true if linked to an org
  activeProfile: 'self' | 'corporate'   // which profile is currently active
}
```

### Project Model
```
Project {
  organizationId: string
  name: string
  description?: string
  createdBy: string (userId)            // admin who created it
  managers: string[] (userIds)
  createdAt, updatedAt
}
```

### Team Model (enhanced)
```
Team {
  projectId: string
  organizationId: string
  name: string
  teamLeaderId: string
  members: string[] (userIds)
  inviteCode: string
}
```

### Organization Model (existing, enhance)
```
Organization {
  name: string
  slug: string
  status: 'pending' | 'active' | 'suspended'
  subscriptionPlan: 'monthly' | 'yearly'
  subscriptionStatus: 'active' | 'past_due' | 'cancelled'
  adminUserId: string
  requestedBy: string
  memberCount: number
}
```

### Invite Token Model (new)
```
InviteToken {
  token: string (random, unique)
  type: 'project_manager' | 'team_leader' | 'team_member'
  organizationId: string
  projectId?: string
  teamId?: string
  role: 'manager' | 'team_leader' | 'member'
  invitedBy: string (userId)
  email?: string                       // optional: restrict to specific email
  expiresAt: Date                      // 7-day TTL
  usedBy?: string (userId)            // set when accepted
  createdAt
}
```

---

## Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orgs/request` | User submits org creation request |
| POST | `/orgs/:id/approve` | Super Admin approves org, generates admin credentials |
| POST | `/projects` | Admin creates a project |
| POST | `/invites/project` | Admin/Manager creates a project manager invite |
| POST | `/invites/team` | Manager/Team Leader creates a team invite |
| GET | `/invites/:token` | Validate invite token, return details |
| POST | `/invites/:token/accept` | Logged-in user accepts invite |
| POST | `/invites/:token/register` | New user registers + accepts invite |
| POST | `/profile/switch` | Switch between Individual ↔ Enterprise profile |

---

## Frontend Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/invite/:token` | Invite landing — shows org/project/team info | Public |
| `/invite/:token/register` | Registration form for new users | Public |
| `/dashboard` | Main dashboard (context-aware based on active profile) | All users |
| `/admin` | Admin Panel | Super Admin + Admin only |

---

## Activity Log Flow

When a user uploads a meeting on their Enterprise profile:

```
User uploads meeting
  ├── Appears in: User's Enterprise dashboard
  ├── Rolled up to: Team Leader's dashboard (with "who uploaded" info)
  ├── Rolled up to: Manager's dashboard (per team summary)
  └── Rolled up to: Admin's dashboard (org-wide summary)
```

Each dashboard level shows:
- **Admin**: All meetings across all projects, filtered by team/manager/member
- **Manager**: Meetings across their projects, filtered by team/member
- **Team Leader**: Meetings for their specific team, with individual member details

---

## Implementation Phases

### Phase 1: Core Role & Profile System
- [ ] Extend User model: `hasEnterpriseProfile`, `activeProfile` fields
- [ ] Extend Organization model: `subscriptionPlan`, `subscriptionStatus`
- [ ] Backend endpoint: `/profile/switch` — real accountType switch
- [ ] Workspace switcher button in Navbar (top-left)
- [ ] Admin Panel access restriction: Super Admin + Admin only
- [ ] Admin approval flow with credential generation

### Phase 2: Invite Link System
- [ ] InviteToken model + database
- [ ] Backend: generate invite tokens with project/team context
- [ ] Backend: validate invite tokens (check expiry, email match)
- [ ] Backend: accept invite (create Enterprise profile, link to org)
- [ ] Frontend: `/invite/:token` landing page (shows info, login/register buttons)
- [ ] Email delivery for invite links + copy-to-clipboard
- [ ] Auto-upgrade to Enterprise tier when joining org

### Phase 3: Project & Team Management
- [ ] Admin creates projects in Admin Panel
- [ ] Admin invites Managers via project invite links
- [ ] Manager divides project into teams (frontend)
- [ ] Manager invites Team Leaders via team invite links
- [ ] Team Leader invites Team Members via team invite links
- [ ] All invitees auto-get Enterprise profile + Enterprise tier

### Phase 4: Activity Logging & Dashboards
- [ ] Meeting uploads on Enterprise profile log to team leader dashboard
- [ ] Team leader dashboard shows member-level activity
- [ ] Manager dashboard shows team-level summaries
- [ ] Admin dashboard shows org-wide summaries
- [ ] Filter/search across dashboard levels

### Phase 5: Billing & Polish
- [ ] Org subscription management (monthly/yearly)
- [ ] Admin billing portal
- [ ] Invite expiry handling (7-day TTL)
- [ ] Revoke/expire invites
- [ ] Reassign managers/team leaders
- [ ] Audit logging for role changes
- [ ] Suspension handling (if org subscription lapses)
