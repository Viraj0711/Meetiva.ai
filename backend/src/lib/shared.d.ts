/**
 * Shared type re-exports for the backend (declaration-only — no runtime code).
 *
 * Being a .d.ts file, it has no module format (neither CJS nor ESM), so
 * importing from the ESM `@meetiva/shared-types` package does not trigger
 * TS1479 even with `moduleResolution: Node16`.
 *
 * All exports are type-only — they are erased at compile time.
 */
export type {
  // ── Enums ───────────────────────────────────────────────────────────
  TeamRole,
  InvitationStatus,
  SubscriptionTier,
  Sentiment,
  NotificationType,
  ActionItemStatus as TaskStatus,
  MeetingStatus,
  MeetingPriority,
  IntegrationType,

  // ── User types ──────────────────────────────────────────────────────
  TeamInfo,
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,

  // ── Meeting types ───────────────────────────────────────────────────
  Meeting,
  MeetingSummary,
  Transcript,
  TranscriptSegment,
  MeetingStats,
  CreateMeetingRequest,
  UpdateMeetingRequest,

  // ── Task types ─────────────────────────────────────────────────────
  ActionItem as Task,
  CreateActionItemRequest as CreateTaskRequest,
  UpdateActionItemRequest as UpdateTaskRequest,

  // ── Team types ──────────────────────────────────────────────────────
  Team,
  TeamMember,
  TeamInvitation,
  TeamChatMessage,
  CreateTeamRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRequest,
  TeamMemberProfileUpdate,
  TeamMemberCredentialsResetResult,
  InviteRequest,

  // ── Common types ────────────────────────────────────────────────────
  ApiError,
  BackendPagination,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  Notification,

  // ── Workspace / Calendar types ──────────────────────────────────────
  CalendarConnectionStatus,
  CalendarEvent,
  CreateCalendarEventRequest,
  WorkspaceOverview,
  WorkspaceProject,
  WorkspaceDeadline,
  WorkspaceCalendarItem,

  // ── Integration types ───────────────────────────────────────────────
  Integration,
  CalendarConfig,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
} from '@meetiva/shared-types';
