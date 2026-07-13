import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActionItemsState, ActionItem } from './actionItemsTypes';

const initialState: ActionItemsState = {
  items: [],
  isLoading: false,
  error: null,
  filter: 'all',
};

const actionItemsSlice = createSlice({
  name: 'actionItems',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setActionItems: (state, action: PayloadAction<ActionItem[]>) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addActionItem: (state, action: PayloadAction<ActionItem>) => {
      state.items.push(action.payload);
    },
    updateActionItem: (state, action: PayloadAction<ActionItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeActionItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setFilter: (state, action: PayloadAction<'all' | 'pending' | 'completed'>) => {
      state.filter = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setActionItems,
  addActionItem,
  updateActionItem,
  removeActionItem,
  setFilter,
} = actionItemsSlice.actions;

export default actionItemsSlice.reducer;
