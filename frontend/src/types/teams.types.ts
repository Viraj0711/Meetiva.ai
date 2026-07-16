// Re-export shared team types
export type {
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
} from '@meetiva/shared-types';

// Re-export shared enums
export type { TeamRole, InvitationStatus } from '@meetiva/shared-types';

import type { Team, TeamMember } from '@meetiva/shared-types';

// ─── Frontend-only State Types ──────────────────────────────────────────────

export interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
}
