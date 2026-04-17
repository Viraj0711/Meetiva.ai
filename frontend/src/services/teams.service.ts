import { apiClient } from './api.client';
import { Team, CreateTeamRequest, AddTeamMemberRequest, UpdateTeamMemberRequest } from '@/types';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'LEAD' | 'MEMBER';
  joinedAt: string;
  userCreatedAt?: string;
}

export interface TeamMemberProfileUpdate {
  name?: string;
  email?: string;
}

export interface TeamMemberCredentialsResetResult {
  credentials: {
    email: string;
    temporaryPassword: string;
  };
  member: {
    userId: string;
    name: string;
  };
  message: string;
}

// Create a new team
export const createTeam = async (data: CreateTeamRequest) => {
  const response = await apiClient.post<{ team: Team; membership: { role: string; status: string; acceptedAt: string } }>('/teams', data);
  return response.data as { team: Team; membership: { role: string; status: string; acceptedAt: string } };
};

// Get all teams for current user
export const getTeams = async () => {
  const response = await apiClient.get<{ teams: Team[] }>('/teams');
  return response.data as { teams: Team[] };
};

// Get a specific team's details
export const getTeam = async (teamId: string) => {
  const response = await apiClient.get<Team>(`/teams/${teamId}`);
  return response.data as Team;
};

// Get team members
export const getTeamMembers = async (teamId: string) => {
  const response = await apiClient.get<{ members: TeamMember[] }>(`/teams/${teamId}/members`);
  return response.data as { members: TeamMember[] };
};

// Add a member to a team
export const addTeamMember = async (
  teamId: string,
  data: AddTeamMemberRequest
) => {
  const response = await apiClient.post<TeamMember>(`/teams/${teamId}/members`, data);
  return response.data as TeamMember;
};

// Update team member role
export const updateTeamMember = async (
  teamId: string,
  userId: string,
  data: UpdateTeamMemberRequest
) => {
  const response = await apiClient.patch<{ userId: string; role: string; updatedAt: string }>(
    `/teams/${teamId}/members/${userId}`,
    data
  );
  return response.data as { userId: string; role: string; updatedAt: string };
};

// Update team member profile details (name/email)
export const updateTeamMemberProfile = async (
  teamId: string,
  userId: string,
  data: TeamMemberProfileUpdate
) => {
  const response = await apiClient.patch<{ member: TeamMember }>(
    `/teams/${teamId}/members/${userId}/profile`,
    data
  );
  return response.data as { member: TeamMember };
};

// Reset team member credentials and return one-time temporary password
export const resetTeamMemberCredentials = async (
  teamId: string,
  userId: string
) => {
  const response = await apiClient.post<TeamMemberCredentialsResetResult>(
    `/teams/${teamId}/members/${userId}/credentials/reset`,
    {}
  );
  return response.data as TeamMemberCredentialsResetResult;
};

// Remove team member
export const removeTeamMember = async (
  teamId: string,
  userId: string
) => {
  const response = await apiClient.delete<{ message: string }>(`/teams/${teamId}/members/${userId}`);
  return response.data as { message: string };
};

// Invite a member to a team
export interface InviteRequest {
  email: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'LEAD' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  teamId?: string;
  teamName?: string;
  invitedBy?: string;
  createdAt?: string;
}

export interface InvitedMemberResult {
  member: {
    userId: string;
    email: string;
    role: 'MEMBER';
    invitedAt?: string;
    joinedAt?: string;
  };
  temporaryCredentials: {
    email: string;
    temporaryPassword: string;
  } | null;
  message: string;
}

export interface TeamChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamChatStats {
  totalMessages: number;
  followUpsLast7Days: number;
  dailyTrend: Array<{ date: string; count: number }>;
  teamStats: Array<{
    teamId: string;
    teamName: string;
    messageCount: number;
    activeParticipants: number;
    lastMessageAt: string | null;
  }>;
}

export const inviteTeamMember = async (
  teamId: string,
  data: InviteRequest
) => {
  const response = await apiClient.post<InvitedMemberResult>(
    `/teams/${teamId}/invite`,
    data
  );
  return response.data as InvitedMemberResult;
};

// Get pending invitations for current user
export const getPendingInvitations = async () => {
  const response = await apiClient.get<{ invitations: TeamInvitation[] }>(
    '/teams/pending/invitations'
  );
  return response.data as { invitations: TeamInvitation[] };
};

// Accept an invitation
export const acceptInvitation = async (invitationId: string) => {
  const response = await apiClient.post<{ teamMember: { teamId: string; role: string; status: string; acceptedAt: string } }>(
    `/teams/invitations/${invitationId}/accept`,
    {}
  );
  return response.data as { teamMember: { teamId: string; role: string; status: string; acceptedAt: string } };
};

// Get team chat messages
export const getTeamChatMessages = async (
  teamId: string,
  params?: { limit?: number; before?: string }
) => {
  const response = await apiClient.get<{ messages: TeamChatMessage[] }>(
    `/teams/${teamId}/chat/messages`,
    { params }
  );
  return response.data as { messages: TeamChatMessage[] };
};

// Post team follow-up message
export const postTeamChatMessage = async (teamId: string, message: string) => {
  const response = await apiClient.post<{ message: TeamChatMessage }>(
    `/teams/${teamId}/chat/messages`,
    { message }
  );
  return response.data as { message: TeamChatMessage };
};

// Aggregate team follow-up chat stats for analytics
export const getTeamChatStats = async (
  range: 'week' | 'month' | 'quarter' | 'year'
) => {
  const response = await apiClient.get<TeamChatStats>('/teams/chat/stats', {
    params: { range },
  });
  return response.data as TeamChatStats;
};
