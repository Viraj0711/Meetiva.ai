export type TeamRole = 'MANAGER' | 'LEAD' | 'MEMBER';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  userCreatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  role?: TeamRole; // User's role in this team
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
  joinedAt?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  email: string;
  role: 'LEAD' | 'MEMBER';
}

export interface UpdateTeamMemberRequest {
  role: 'LEAD' | 'MEMBER';
}

export interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
}
