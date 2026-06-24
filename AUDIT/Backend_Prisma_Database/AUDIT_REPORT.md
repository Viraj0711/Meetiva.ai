# Backend Prisma & Database — Audit Report

**Date:** June 24, 2026
**Module:** Prisma Schema & Database
**Files Audited:** `prisma/schema.prisma`, `prisma/seed.ts`

---

## 1. Database Schema Overview

### Provider & Connection
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
- **Provider:** PostgreSQL (via Supabase)
- **Connection Pooling:** PgBouncer-compatible (configured in `lib/prisma.ts`)
- **Client Generator:** `prisma-client-js`

---

## 2. Models

### 2.1 User (`users`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | **Unique** |
| name | String | Required |
| hashedPassword | String | Required |
| isActive | Boolean | Default: true |
| isVerified | Boolean | Default: false |
| createdAt | DateTime | Default: now() |
| updatedAt | DateTime | Auto-updated |

**Relations:** Meetings, ActionItems, TeamMembers (as member + inviter), TeamInvitations, GoogleCalendarAuth, Notifications, TeamChatMessages

### 2.2 Meeting (`meetings`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| title | String | Required |
| description | String? | Optional |
| status | MeetingStatus | Default: uploading |
| priority | MeetingPriority | Default: medium |
| audioUrl | String? | Optional |
| videoUrl | String? | Optional |
| duration | Int? | Optional |
| participants | Json | Default: `[]` |
| processingProgress | Int? | Default: 0 |
| userId | String | FK → User (Cascade) |
| createdAt | DateTime | Default: now() |
| updatedAt | DateTime | Auto-updated |
| completedAt | DateTime? | Optional |

**Index:** `[userId, createdAt]`
**Relations:** MeetingSummary, Transcript, ActionItems

### 2.3 MeetingSummary (`meeting_summaries`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| meetingId | String | **Unique** FK → Meeting (Cascade) |
| executiveSummary | String | Required |
| keyPoints | Json | Default: `[]` |
| decisions | Json | Default: `[]` |
| openQuestions | Json | Default: `[]` |
| sentiment | String | Default: "neutral" |

### 2.4 Transcript (`transcripts`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| meetingId | String | **Unique** FK → Meeting (Cascade) |
| segments | Json | Default: `[]` |
| fullText | String | Required |
| language | String | Default: "en" |

### 2.5 ActionItem (`action_items`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| meetingId | String | FK → Meeting (Cascade) |
| userId | String | FK → User (Cascade) |
| title | String | Required |
| description | String? | Optional |
| assignee | String? | Optional |
| dueDate | DateTime? | Optional |
| priority | MeetingPriority | Default: medium |
| status | ActionItemStatus | Default: pending |
| tags | Json | Default: `[]` |
| reminderSentAt | DateTime? | Optional |

**Indexes:** `[userId, status]`, `[meetingId]`

### 2.6 Team (`teams`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Required |
| description | String? | Optional |
| managerId | String? | Optional |

**Index:** `[managerId]`

### 2.7 TeamMember (`team_members`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | FK → User (Cascade) |
| teamId | String | FK → Team (Cascade) |
| role | TeamRole | Default: MEMBER |
| status | InvitationStatus | Default: ACCEPTED |
| invitedBy | String? | FK → User (SetNull) |

**Unique Constraint:** `[userId, teamId]`
**Indexes:** `[teamId]`, `[userId]`, `[status]`

### 2.8 TeamInvitation (`team_invitations`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | Required |
| teamId | String | FK → Team (Cascade) |
| role | TeamRole | Default: MEMBER |
| status | InvitationStatus | Default: PENDING |
| expiresAt | DateTime | Required |

**Unique Constraint:** `[email, teamId]`

### 2.9 TeamChatMessage (`team_chat_messages`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| teamId | String | FK → Team (Cascade) |
| userId | String | FK → User (Cascade) |
| message | String | Required |

**Indexes:** `[teamId, createdAt]`, `[userId]`

### 2.10 GoogleCalendarAuth (`google_calendar_auth`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | **Unique** FK → User (Cascade) |
| encryptedAccessToken | String | AES-256-GCM encrypted |
| encryptedRefreshToken | String | AES-256-GCM encrypted |
| expiryDate | DateTime? | Optional |

**Index:** `[expiryDate]`

### 2.11 Notification (`notifications`)

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | FK → User (Cascade) |
| actionItemId | String? | FK → ActionItem (SetNull) |
| type | NotificationType | Default: SYSTEM |
| title | String | Required |
| message | String | Required |
| channel | String | Default: "in_app" |
| isRead | Boolean | Default: false |

**Index:** `[userId, isRead, createdAt]`

---

## 3. Enums

| Enum | Values |
|------|--------|
| `MeetingStatus` | pending, uploading, processing, transcribing, analyzing, completed, failed |
| `MeetingPriority` | low, medium, high, urgent |
| `ActionItemStatus` | pending, in_progress, completed, cancelled |
| `TeamRole` | MANAGER, LEAD, MEMBER |
| `InvitationStatus` | PENDING, ACCEPTED, REVOKED, EXPIRED |
| `NotificationType` | DEADLINE_REMINDER, SYSTEM |

---

## 4. Schema Assessment

### ✅ Strengths

1. **Comprehensive model coverage** — All core domain entities are modeled with proper relationships
2. **Cascade deletes** — Most child records are cascade-deleted when parent is removed (clean data management)
3. **UUID primary keys** — Distributed ID generation, no sequential ID exposure
4. **JSON fields for flexible data** — `participants`, `keyPoints`, `decisions`, `tags`, `segments` use JSON for schema-less flexibility
5. **Proper indexes** — Key query patterns are indexed (`userId + createdAt`, `teamId + createdAt`, etc.)
6. **Unique constraints** — `userId` on GoogleCalendarAuth (one auth per user), `userId + teamId` on TeamMember (no duplicates)
7. **Encryption of sensitive tokens** — Google OAuth tokens are stored encrypted (AES-256-GCM)
8. **Soft identifiers** — No raw passwords, only `hashedPassword`

### ⚠️ Issues & Recommendations

1. **`participants` is JSON but should be a relation** — Participants are stored as a JSON string array. This prevents querying participants directly and creates data duplication. Consider a `MeetingParticipant` join table.

2. **`segments` in Transcript is always stored as `[]`** — In `meetings.ts`, the transcript is created with `segments: []`. The Grok analyzer and Whisper service don't produce segment-level data. Consider either removing the field or implementing speaker diarization.

3. **`language` in Transcript is always "en"** — The Whisper transcription doesn't capture detected language. All transcripts are stored as English.

4. **`managerId` in Team is not a formal FK** — It's a plain `String?` without a `@relation` annotation. This means no foreign key constraint and no cascade behavior.

5. **`tags` in ActionItem uses `@default("[]")`** — This is a string default for a JSON field. This works but is inconsistent with other JSON defaults.

6. **No `updatedAt` on MeetingSummary and Transcript** — These records are immutable after creation, so this is acceptable, but adding `updatedAt` would enable better caching strategies.

7. **No soft delete** — All records are hard-deleted. Consider `deletedAt` for critical entities (meetings, action items) if audit trails are needed.

---

## 5. Seed Script Analysis (`seed.ts`)

### Purpose
Creates test data for development/testing:
- 3 users (manager@test.com, lead@test.com, member@test.com)
- 1 team with RBAC assignments
- 3 sample meetings (one per user)
- 3 sample action items

### ✅ Strengths
- Clean cleanup before seeding (deletes existing test data)
- Proper password hashing with bcryptjs
- Uses `upsert` where appropriate
- Clear console output with expectations

### ⚠️ Issues
1. **Hardcoded `require('bcryptjs')`** — Uses CommonJS `require()` in a TypeScript file. This works with tsx but is inconsistent. Import should use ESM `import`.
2. **No `isVerified: true`** — Test users are created without `isVerified`, which might affect features that check verification status.
3. **Team is created without `managerId`** — The `Team` model has `managerId` but it's not set in the seed.

---

## 6. Overall Database Assessment

**Rating: A- (Very Good)**

The database schema is well-designed for the application domain. Key design decisions (UUIDs, cascade deletes, encrypted tokens, JSON for flexible data) are appropriate for this type of application.

### Key Recommendations
1. Create a `MeetingParticipant` relation table instead of JSON `participants`
2. Implement actual speaker diarization for transcript segments
3. Add FK constraint for `managerId` on Team
4. Add `updatedAt` to key models for caching
5. Consider soft deletes for audit trails
