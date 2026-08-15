// ─── Meeting Enums ───────────────────────────────────────────────────────────

// Converted from TypeScript `enum` to type alias so the backend can
// import them through the .d.ts barrel file (enums are opaque when
// type-exported from a declaration file).
export type MeetingStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'failed';

export type MeetingPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

// ─── Task Enums ──────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// ─── Team Enums ─────────────────────────────────────────────────────────────

export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

// ─── User Enums ─────────────────────────────────────────────────────────────

export type SubscriptionTier = 'FREE' | 'TEAM' | 'ENTERPRISE';

// ─── Account Type ──────────────────────────────────────────────────────────

export type AccountType = 'self' | 'corporate';

// ─── Org Role ──────────────────────────────────────────────────────────────

export type OrgRole = 'super_admin' | 'admin' | 'manager' | 'team_leader' | 'member';

// ─── Organization Status ───────────────────────────────────────────────────

export type OrganizationStatus = 'pending' | 'active' | 'suspended';

// ─── Sentiment ──────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'neutral' | 'negative';

// ─── Notification Enums ─────────────────────────────────────────────────────

export type NotificationType = 'DEADLINE_REMINDER' | 'SYSTEM';// ─── Integration Enums ──────────────────────────────────────────────────────
export type IntegrationType = 'google-calendar';

// ─── Subscription Plan ────────────────────────────────────────────────────
export type SubscriptionPlan = 'monthly' | 'yearly';

// ─── Invite Token ─────────────────────────────────────────────────────────
export type InviteType = 'project_manager' | 'team_leader' | 'team_member';
