import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WorkspaceType = 'individual' | 'team';

interface WorkspaceState {
  /** null = Individual view, string = team ID */
  activeTeamId: string | null;
  activeTeamName: string;
  type: WorkspaceType;
}

const initialState: WorkspaceState = {
  activeTeamId: null,
  activeTeamName: 'Individual',
  type: 'individual',
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveTeam: (state, action: PayloadAction<{ teamId: string; teamName: string }>) => {
      state.activeTeamId = action.payload.teamId;
      state.activeTeamName = action.payload.teamName;
      state.type = 'team';
    },
    setIndividual: (state) => {
      state.activeTeamId = null;
      state.activeTeamName = 'Individual';
      state.type = 'individual';
    },
  },
});

export const { setActiveTeam, setIndividual } = workspaceSlice.actions;
export default workspaceSlice.reducer;
