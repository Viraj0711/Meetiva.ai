import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamsState, Team, TeamMember } from '@/types';

const initialState: TeamsState = {
  teams: [],
  currentTeam: null,
  teamMembers: [],
  isLoading: false,
  error: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
    },
    updateTeam: (state, action: PayloadAction<Team>) => {
      const index = state.teams.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = action.payload;
      }
      if (state.currentTeam?.id === action.payload.id) {
        state.currentTeam = action.payload;
      }
    },
    removeTeam: (state, action: PayloadAction<string>) => {
      state.teams = state.teams.filter((t) => t.id !== action.payload);
      if (state.currentTeam?.id === action.payload) {
        state.currentTeam = null;
      }
    },
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
      state.error = null;
    },
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.teamMembers = action.payload;
    },
    addTeamMember: (state, action: PayloadAction<TeamMember>) => {
      state.teamMembers.push(action.payload);
      // Also update in currentTeam if exists
      if (state.currentTeam) {
        if (!state.currentTeam.members) {
          state.currentTeam.members = [];
        }
        state.currentTeam.members.push(action.payload);
      }
    },
    updateTeamMember: (state, action: PayloadAction<TeamMember>) => {
      const index = state.teamMembers.findIndex(
        (m) => m.userId === action.payload.userId
      );
      if (index !== -1) {
        state.teamMembers[index] = action.payload;
      }
      // Also update in currentTeam if exists
      if (state.currentTeam?.members) {
        const teamMembersIndex = state.currentTeam.members.findIndex(
          (m) => m.userId === action.payload.userId
        );
        if (teamMembersIndex !== -1) {
          state.currentTeam.members[teamMembersIndex] = action.payload;
        }
      }
    },
    removeTeamMember: (state, action: PayloadAction<string>) => {
      state.teamMembers = state.teamMembers.filter(
        (m) => m.userId !== action.payload
      );
      // Also update in currentTeam if exists
      if (state.currentTeam?.members) {
        state.currentTeam.members = state.currentTeam.members.filter(
          (m) => m.userId !== action.payload
        );
      }
    },
    clearCurrentTeam: (state) => {
      state.currentTeam = null;
      state.teamMembers = [];
    },
  },
});

export const {
  setLoading,
  setError,
  setTeams,
  addTeam,
  updateTeam,
  removeTeam,
  setCurrentTeam,
  setTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  clearCurrentTeam,
} = teamsSlice.actions;

export default teamsSlice.reducer;
