import type { TeamRole, InvitationStatus } from './enums.js';

// ─── Team ───────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  description: string | null;
  role?: TeamRole;
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
  joinedAt?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

// ─── Team Member ────────────────────────────────────────────────────────────

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  userCreatedAt?: string;
}

export interface AddTeamMemberRequest {
  email: string;
  role: 'LEAD' | 'MEMBER';
}

export interface UpdateTeamMemberRequest {
  role: 'LEAD' | 'MEMBER';
}

export interface TeamMemberProfileUpdate {
  name?: string;
  email?: string;
}

export interface TeamMemberCredentialsResetResult {
  temporaryPassword: string;
}

// ─── Team Invitation ────────────────────────────────────────────────────────

export interface TeamInvitation {
  id: string;
  email: string;
  teamId: string;
  role: TeamRole;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface InviteRequest {
  email: string;
  role: 'LEAD' | 'MEMBER';
}

// ─── Team Chat Message ──────────────────────────────────────────────────────

export interface TeamChatMessage {
  id: string;
  teamId: string;
  userId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}
