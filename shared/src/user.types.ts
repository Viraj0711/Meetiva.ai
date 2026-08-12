import type { SubscriptionTier, TeamRole, AccountType, OrgRole } from './enums.js';

// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teams?: TeamInfo[];
  isActive: boolean;
  isVerified: boolean;
  /** Whether the account has a password set (false for Google-only users). */
  hasPassword?: boolean;
  subscriptionTier: SubscriptionTier;
  meetingCountThisMonth: number;
  meetingCountResetAt: string | null;
  subscriptionExpiresAt: string | null;
  // Enterprise fields
  accountType?: AccountType;
  orgRole?: OrgRole | null;
  organizationId?: string | null;
  createdByUserId?: string | null;
  forcePasswordChange?: boolean;
  isRemoved?: boolean;
  tokenVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInfo {
  teamId: string;
  role: TeamRole;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}
