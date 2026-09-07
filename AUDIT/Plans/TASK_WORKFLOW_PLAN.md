# Plan: Task Workflow Stages (Start → In Progress → QA → Done)

## Current State

Tasks (ActionItems) have 4 statuses defined in `shared/src/enums.ts`:

```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
```

The flow today is simple and flat:
- Created → `pending`
- Someone starts working → `in_progress`
- Finished → `completed`
- Abandoned → `cancelled`

There's **no review/QA step** — a task goes straight from "working on it" to "done." No one verifies the work before it's marked complete.

---

## Proposed Workflow

Replace the current statuses with a **4-stage pipeline**:

```
Start → In Progress → QA/Verification → Done
                ↑           ↓
                └─── (rejected, back to In Progress)
```

| Stage | Old Status | New Status | What happens |
|-------|-----------|------------|--------------|
| **Start** | `pending` | `todo` | Task is created and waiting to be picked up |
| **In Progress** | `in_progress` | `in_progress` | Someone is actively working on it |
| **QA/Verification** | *(new)* | `in_review` | Work is done, needs review before marking complete |
| **Done** | `completed` | `done` | Verified and finalized |

**Additional status:** `cancelled` stays as-is for abandoned tasks.

### Why `todo` instead of `start`?
- `start` reads like a verb/action, not a state
- `todo` is universally understood (Trello, GitHub, Notion all use it)
- Less confusing in code: `status === 'todo'` vs `status === 'start'`

### Allowed Transitions

| From | To | Who can do it |
|------|-----|---------------|
| `todo` → `in_progress` | Task assignee (or manager/lead) |
| `in_progress` → `in_review` | Task assignee |
| `in_review` → `done` | Manager, Lead, or Task Owner (verifier) |
| `in_review` → `in_progress` | Reviewer (rejected — send back with feedback) |
| `*` → `cancelled` | Task Owner, Manager, or Lead |

**Key rule:** Only Managers, Leads, or the original task creator can approve from `in_review` → `done`. Regular Members can't mark their own work as done without review.

---

## Database Changes

### 1. Shared Enum (`shared/src/enums.ts`)

Change:
```typescript
// OLD
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// NEW
type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
```

### 2. ActionItem Model (`backend/src/models/ActionItem.ts`)

Update the status enum in the schema:
```typescript
status: {
  type: String,
  enum: ['todo', 'in_progress', 'in_review', 'done', 'cancelled'],
  default: 'todo',  // was 'pending'
},
```

### 3. Add Review Metadata Fields

```typescript
// New fields on ActionItem
reviewedBy?: Types.ObjectId | null;     // Who approved it
reviewedAt?: Date | null;               // When it was approved
reviewComment?: string | null;          // Feedback on rejection
submittedForReviewAt?: Date | null;     // When it moved to in_review
```

---

## Backend Changes

### 1. Update ActionItem Routes (`backend/src/routes/actionItems.ts`)

**Create task:** Default status becomes `todo` (was `pending`)

**Update task (`PATCH /:id`):** Add transition validation:
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  todo:        ['in_progress', 'cancelled'],
  in_progress: ['in_review', 'cancelled'],
  in_review:   ['done', 'in_progress'],  // in_progress = rejection
  done:        [],                        // terminal state
  cancelled:   ['todo'],                  // can reopen
};

// Validate: status transition must be allowed
// Validate: in_review → done requires Manager/Lead role or task ownership
```

**New endpoint: `POST /:id/submit-for-review`**
```typescript
// Moves task from in_progress → in_review
// Sets submittedForReviewAt timestamp
// Any assignee can submit their own work for review
```

**New endpoint: `POST /:id/approve`**
```typescript
// Moves task from in_review → done
// Only Manager/Lead/TaskCreator can approve
// Sets reviewedBy, reviewedAt
// Returns error if caller doesn't have permission
```

**New endpoint: `POST /:id/reject`**
```typescript
// Moves task from in_review → in_progress
// Sets reviewComment (required — reviewer must explain why)
// Resets submittedForReviewAt
```

**Update `POST /:id/complete`** → Keep as a shortcut that goes `in_progress` → `done` but only for Managers/Leads (bypasses QA). For Members, it should go to `in_review` instead.

### 2. Update Workspace Route (`backend/src/routes/workspace.ts`)

Update task count queries:
```typescript
// OLD: status: 'completed'
// NEW: status: 'done'

// OLD: status: { $in: ['pending', 'in_progress'] }
// NEW: status: { $in: ['todo', 'in_progress', 'in_review'] }
```

### 3. Update Meeting Sync (`backend/src/services/meetingStatus.ts`)

The `syncMeetingStatusFromTasks` function checks if all tasks are completed to update meeting status. Update to check for `done` instead of `completed`.

### 4. Update Validation Schemas (`backend/src/lib/validation.ts`)

```typescript
// updateTaskSchema — add 'in_review', 'done' to allowed statuses
// createTaskSchema — default status is now 'todo'
```

---

## Frontend Changes

### 1. Tasks Page (`frontend/src/pages/Tasks.tsx`)

**Status filter dropdown** — Update options:
```tsx
<option value="todo">To Do</option>
<option value="in_progress">In Progress</option>
<option value="in_review">In Review</option>
<option value="done">Done</option>
```

**Task cards** — Add status-based actions:
- `todo` → Button: "Start" (moves to `in_progress`)
- `in_progress` → Button: "Submit for Review" (moves to `in_review`)
- `in_review` → Buttons: "Approve" (→ `done`) or "Reject" (→ `in_progress`)
- `done` → No action button, maybe a checkmark icon

**Grouped sections** — Update from current grouping:
```tsx
// OLD: overdue, today, upcoming, noDueDate, completed
// NEW: todo, in_progress, in_review, done
// Plus keep overdue as a cross-cutting filter
```

**Stats cards** — Update the 4 stat cards:
| Card | Shows |
|------|-------|
| Total | All tasks |
| To Do | `todo` count |
| In Progress | `in_progress` count |
| In Review | `in_review` count |
| Done | `done` count |

**Reject modal** — New modal when reviewer clicks "Reject":
- Text area for review comment (required)
- "Send Back" button

### 2. Team Report (`frontend/src/pages/TeamReport.tsx`)

Update `getTaskStatusColor`:
```tsx
const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'done':       return 'default';      // green/neutral
    case 'in_progress': return 'secondary';    // blue
    case 'in_review':  return 'outline';       // yellow/orange
    case 'todo':       return 'outline';       // gray
    case 'cancelled':  return 'destructive';   // red
    default:           return 'default';
  }
};
```

### 3. Task Service (`frontend/src/services/task.service.ts`)

Add new API methods:
```typescript
submitForReview: (id: string) => apiClient.post(`/action-items/${id}/submit-for-review`)
approve: (id: string) => apiClient.post(`/action-items/${id}/approve`)
reject: (id: string, comment: string) => apiClient.post(`/action-items/${id}/reject`, { comment })
```

### 4. Dashboard/Workspace Overview

Update task stats to show the 4-stage breakdown instead of the old pending/in_progress/completed split.

---

## Migration Strategy

### Phase 1: Backward-Compatible Deploy

1. Add new statuses to enum (`todo`, `in_review`, `done`) alongside old ones (`pending`, `completed`)
2. Add new fields (`reviewedBy`, `reviewedAt`, etc.) as nullable
3. Backend accepts both old and new status values
4. Frontend shows old statuses as the new equivalents:
   - `pending` → display as "To Do"
   - `completed` → display as "Done"

### Phase 2: Data Migration Script

Run a one-time migration to update existing tasks:
```typescript
// pending → todo
await ActionItem.updateMany({ status: 'pending' }, { $set: { status: 'todo' } });
// completed → done
await ActionItem.updateMany({ status: 'completed' }, { $set: { status: 'done' } });
```

### Phase 3: Enforce New Workflow

1. Remove old status values from enum
2. Require transition validation
3. Enforce review permissions

---

## Files to Modify

| File | Change |
|------|--------|
| `shared/src/enums.ts` | Update `TaskStatus` type |
| `shared/src/user.types.ts` | Add review fields to Task type |
| `backend/src/models/ActionItem.ts` | Update enum, add review fields |
| `backend/src/routes/actionItems.ts` | Add submit/approve/reject endpoints, transition validation |
| `backend/src/routes/workspace.ts` | Update task count queries |
| `backend/src/lib/validation.ts` | Update schemas |
| `backend/src/services/meetingStatus.ts` | Update completed → done check |
| `frontend/src/pages/Tasks.tsx` | New UI: status columns, submit/review/reject buttons |
| `frontend/src/pages/TeamReport.tsx` | Update status colors |
| `frontend/src/services/task.service.ts` | Add submitForReview, approve, reject methods |
| `frontend/src/types/index.ts` | Update Task type |

---

## UI Flow Summary

```
Member creates task → "To Do" column
  ↓ clicks "Start"
Member works on task → "In Progress" column
  ↓ clicks "Submit for Review"
Member submits → "In Review" column (with submitted timestamp)
  ↓ Manager/Lead reviews
  ├─ clicks "Approve" → "Done" column ✅
  └─ clicks "Reject" → back to "In Progress" with comment 💬
```

**Key UX decisions:**
- Members can't skip QA — they MUST submit for review
- Managers/Leads CAN skip QA via a "Quick Complete" option (for trivial tasks)
- Rejection requires a comment — no silent rejections
- Task creator sees a notification when their task is approved or rejected
