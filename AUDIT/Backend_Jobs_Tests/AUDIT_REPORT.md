# Backend Jobs & Tests — Audit Report

**Date:** June 24, 2026
**Module:** Backend Jobs & Tests
**Files Audited:** `jobs/deadlineNotifier.ts`, `tests/actionItemsExport.test.ts`

---

## 1. Deadline Notifier Job (`jobs/deadlineNotifier.ts`)

### Purpose
Scheduled background job that checks for action items due within the next 24 hours and creates in-app notifications. Runs every hour.

### Key Functions

| Function | Purpose |
|----------|---------|
| `runDeadlineReminderSweep()` | Main sweep — finds due items, creates notifications |
| `startDeadlineNotifier()` | Initializes the scheduler (called at server start) |
| `createInAppReminderNotifications()` | Core logic — queries, creates notifications, updates reminderSentAt |

### Flow
```
1. Query action items where:
   - Status is 'pending' or 'in_progress'
   - Due date is between now and next 24 hours
   - reminderSentAt is null (not yet notified)
2. For each item:
   a. Create a DEADLINE_REMINDER notification
   b. Update reminderSentAt to now
   c. Log a placeholder for SMTP email if configured
3. Runs every hour via setInterval
```

### ✅ Strengths
1. **Transactional** — Uses `prisma.$transaction` for atomic notification creation + reminder update
2. **Idempotent** — Only processes items with `reminderSentAt: null`
3. **No double-sends** — The `reminderSentAt` flag prevents sending duplicate reminders
4. **Initial sweep on start** — `startDeadlineNotifier()` runs an immediate sweep before scheduling
5. **Graceful error handling** — Errors in the sweep are caught and logged without crashing the scheduler

### ⚠️ Issues Found

1. **No interval cleanup** — The `timer` variable is tracked but there's no mechanism to stop the scheduler (e.g., for graceful shutdown). Add a `stopDeadlineNotifier()` function.

2. **Email notifications are placeholder only** — The SMTP section only logs a message. Actual email delivery is not implemented.

3. **No timezone handling** — Due dates are compared as-is without timezone normalization. A due date of "2026-06-25" in UTC might be "2026-06-24" in the user's local timezone.

4. **`startDeadlineNotifier()` is never called** — The scheduler is not initialized in `index.ts`. This job exists but doesn't run unless manually triggered.

5. **No deduplication for multiple reminders** — If the server restarts, `reminderSentAt` constraints prevent re-sending, which is good.

---

## 2. Action Items Export Test (`tests/actionItemsExport.test.ts`)

### Purpose
Tests the ExcelJS workbook generation logic used by the `GET /meetings/:id/action-items/export` endpoint.

### Test Coverage

| Test | Description | Pass Condition |
|------|-------------|----------------|
| Test 1a | Full data export | Buffer has PK ZIP header (valid .xlsx) |
| Test 1b | Read back data | Worksheet "Tasks" exists with correct row count |
| Test 1c | Header validation | Cell A1 = "Task" |
| Test 1d-f | Data validation | Cells contain expected values |
| Test 2a | Empty rows | Buffer is not empty (valid empty workbook) |
| Test 2b | Empty worksheet | Row count = 0 |

### ✅ Strengths
1. **Comprehensive** — Tests both populated and empty states
2. **End-to-end validation** — Writes buffer, reads it back, validates contents
3. **Self-contained** — No external dependencies beyond ExcelJS
4. **Clear output** — ✅/❌ with per-test labels and summary
5. **Custom test runner** — No Jest/Mocha dependency, runs with `tsx`

### ⚠️ Issues Found
1. **Custom assertion framework** — Using `assert` function instead of a testing framework. This works but doesn't provide standard features like test isolation, reporting, or fixtures.
2. **No test for the actual export route** — Only tests the ExcelJS workbook logic, not the full HTTP endpoint.
3. **No failure case tests** — Tests only happy paths (valid data, empty data).
4. **No boundary testing** — Large datasets, special characters in cell values, etc.

---

## 3. Overall Assessment

**Rating: B (Good)**

| Component | Rating | Key Strength | Key Concern |
|-----------|--------|-------------|-------------|
| Deadline Notifier | B- | Transactional, idempotent | Not wired up in index.ts |
| Export Test | B+ | Comprehensive validation | Custom test runner |

### Recommendations

1. **Wire up `startDeadlineNotifier()` in `index.ts`** — The job does nothing if not started.
2. **Implement actual email sending** for SMTP notifications
3. **Add `stopDeadlineNotifier()`** for graceful shutdown
4. **Consider timezone-aware due date comparisons**
5. **Move export tests to a standard framework** (Jest) for CI integration
