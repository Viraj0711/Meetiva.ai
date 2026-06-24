# Frontend Hooks & Utils — Audit Report

**Date:** June 24, 2026
**Module:** Frontend Custom Hooks & Utility Functions
**Files Audited:** All files in `hooks/` and `utils/` directories

---

## 1. Custom Hooks (`hooks/`)

### 1.1 Auth Hooks (`hooks/useAuth.ts`)

| Hook | Description |
|------|-------------|
| `useLogin()` | Login mutation with Redux dispatch + toast |
| `useRegister()` | Register mutation with Redux dispatch + toast |
| `useLogout()` | Logout mutation, clears React Query cache |
| `useCurrentUser()` | Fetch current user (5min stale time) |
| `useRequestPasswordReset()` | Password reset mutation |

### ✅ Strengths
- Mutations dispatch Redux actions (loginSuccess, logout)
- Toast notifications on success/error
- `useCurrentUser` uses React Query caching
- `useLogout` clears the entire query cache

### ⚠️ Issues
1. **`useLogin` calls `authService.login`** which returns `AuthResponse`, but `loginSuccess` expects `{ user: User; token: string }` — the types match ✅
2. **`useLogout` calls `authService.logout`** which doesn't exist on backend, causing a network error. The `onError` is not handled, so the logout still works client-side.

---

### 1.2 Meeting Hooks (`hooks/useMeetings.ts`)

| Hook | React Query Key |
|------|-----------------|
| `useMeetings(params)` | `['meetings', params]` |
| `useMeeting(id)` | `['meetings', id]` |
| `useCreateMeeting()` | Mutation |
| `useUpdateMeeting()` | Mutation |
| `useDeleteMeeting()` | Mutation |
| `useUploadMeetingFile()` | Mutation |
| `useMeetingSummary(meetingId)` | `['meetings', meetingId, 'summary']` |
| `useMeetingTranscript(meetingId)` | `['meetings', meetingId, 'transcript']` |
| `useMeetingActionItems(meetingId)` | `['meetings', meetingId, 'action-items']` |
| `useMeetingStats()` | `['meetings', 'stats']` |
| `useActionItems(params)` | `['action-items', params]` |
| `useCreateActionItem()` | Mutation |
| `useUpdateActionItem()` | Mutation |
| `useDeleteActionItem()` | Mutation |
| `useCompleteActionItem()` | Mutation |

### ✅ Strengths
- Comprehensive meeting operation hooks
- Consistent query key patterns for cache invalidation
- Mutations invalidate related queries
- Toast notifications on all operations

### ⚠️ Issues
1. **`useUploadMeetingFile` doesn't pass title/description/participants** — The hook calls `meetingService.uploadMeetingFile(file, undefined, undefined, undefined, onProgress)`, passing `undefined` for optional parameters. The meeting title defaults to the filename.
2. **Stale times vary** — 30s for meeting lists, 1min for stats, 5min for integrations. This is reasonable but inconsistent.

---

### 1.3 Integration Hooks (`hooks/useIntegrations.ts`)

| Hook | Description |
|------|-------------|
| `useIntegrations()` | Get all integrations |
| `useIntegration(id)` | Get single integration |
| `useCreateIntegration()` | Create mutation |
| `useUpdateIntegration()` | Update mutation |
| `useDeleteIntegration()` | Delete mutation |
| `useTestIntegration()` | Test connection mutation |
| `useSyncActionItems()` | Sync action items mutation |

### ⚠️ Issues
- All hooks call integrationService methods that hit non-existent backend endpoints.
- These hooks are effectively non-functional.

---

### 1.4 Other Hooks

### `useFormPersistence` (`hooks/useFormPersistence.ts`)
- Persists form data to localStorage to prevent data loss
- Returns `clearPersistedData()` and `loadPersistedData()`
- ✅ Clean implementation

### `hooks/index.ts`
```typescript
export * from './useAuth';
export * from './useMeetings';
export * from './useIntegrations';
```
✅ Re-exports all hooks.

---

## 2. Utility Functions (`utils/`)

### 2.1 Date Utils (`utils/date.utils.ts`)

| Function | Description |
|----------|-------------|
| `formatDate(date, format?)` | Format to readable string (default: PPP) |
| `formatRelativeTime(date)` | "2 hours ago" format |
| `formatDuration(seconds)` | "1h 30m" format |
| `formatTime(seconds)` | "MM:SS" format |
| `getDateDistance(date1, date2)` | Distance between two dates |

✅ Uses date-fns for reliable date formatting. Clean API.

### 2.2 Error Utils (`utils/error.utils.ts`)

| Function | Description |
|----------|-------------|
| `parseApiError(error)` | Extract message from API error |
| `isNetworkError(error)` | Check if network error |
| `isAuthError(error)` | Check if auth error (401) |

✅ Clean error parsing utility.

### 2.3 File Utils (`utils/file.utils.ts`)

| Function | Description |
|----------|-------------|
| `formatFileSize(bytes)` | Human-readable file size |
| `isValidFileType(file, types)` | File type validation |
| `isValidFileSize(file, maxMB)` | File size validation |
| `getFileExtension(filename)` | Extract extension |
| `isAudioFile(file)` | Check audio type |
| `isVideoFile(file)` | Check video type |

### Constants
```typescript
ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', ...]
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', ...]
ALLOWED_FILE_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES]
MAX_FILE_SIZE_MB = 500 // 500MB
```

### ⚠️ Issues
1. **`MAX_FILE_SIZE_MB = 500`** but the backend limits to 25MB (Whisper API limit). The frontend validation allows files up to 500MB that will be rejected by the backend.
2. **File type constants in Upload.tsx duplicate these** — There's an inconsistency in allowed types between `file.utils.ts` and the inline check in Upload.tsx.

### 2.4 Format Utils (`utils/format.utils.ts`)

| Function | Description |
|----------|-------------|
| `getStatusColor(status)` | Returns Tailwind color class |
| `getPriorityColor(priority)` | Returns color (string or hex) |
| `getStatusLabel(status)` | Human-readable status |
| `getPriorityLabel(priority)` | Human-readable priority |

### ⚠️ Issues
1. **`getPriorityColor` returns inconsistent values** — Some return Tailwind classes (`text-gray-600`, `text-orange-600`), others return hex colors (`#335444`). This makes it hard to use consistently.
2. **`getStatusColor` has unused colors** — `PENDING: 'bg-yellow-100...'`, `UPLOADING: 'text-cyan-300'` (same as PROCESSING), etc.

### 2.5 Retry Utils (`utils/retry.utils.ts`)

| Function | Description |
|----------|-------------|
| `retryWithBackoff(fn, options?)` | Exponential backoff retry |
| `debounce(func, wait)` | Standard debounce |
| `isNetworkError(error)` | Network error check |
| `isRetryableError(error)` | 408/429/500-range check |

### ✅ Strengths
- Configurable retry: maxAttempts, initialDelay, maxDelay, backoffFactor
- onRetry callback for logging
- Debounce utility for input handling
- Proper retryable error detection (network + status codes)

### 2.6 Utils Index (`utils/index.ts`)

```typescript
export * from './date.utils';
export * from './file.utils';
export * from './error.utils';
export * from './format.utils';
```

✅ Exports all utilities except `retry.utils.ts` (likely intentional since retry is used directly).

---

## 3. Lib Files

### `lib/supabase.ts`
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

⚠️ **Supabase client is initialized but never used anywhere in the app** — The app uses its own auth API, not Supabase Auth. This file appears to be leftover from a previous iteration.

### `lib/utils.ts`
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
✅ Standard Tailwind CSS class merging utility.

---

## 4. Overall Assessment

**Rating: B+ (Good)**

### ✅ Strengths
- Comprehensive React Query hooks for all data operations
- Good utility coverage (dates, errors, files, formatting, retry)
- Consistent patterns across hooks
- Clean `cn()` utility

### ⚠️ Issues
| # | Issue | Severity |
|---|-------|----------|
| 1 | `MAX_FILE_SIZE_MB = 500` vs backend 25MB limit | 🔴 |
| 2 | `useUploadMeetingFile` doesn't pass title/desc/participants | 🟡 |
| 3 | Integration hooks hit non-existent endpoints | 🔴 |
| 4 | `getPriorityColor` returns inconsistent types (classes vs hex) | 🟢 |
| 5 | Supabase client initialized but unused | 🟢 |
| 6 | `isNetworkError` duplicated in error.utils and retry.utils | 🟢 |

### Recommendations
1. Align frontend file size limit with backend (25MB)
2. Add title/description to upload meeting hook parameters
3. Remove or implement integration hooks
4. Fix `getPriorityColor` for consistent return types
5. Remove unused Supabase client
6. Consolidate duplicate `isNetworkError` functions
