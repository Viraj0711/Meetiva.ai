import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Toast } from '@/types';

interface UIState {
  toasts: Toast[];
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: UIState = {
  toasts: [],
  isSidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const { addToast, removeToast, toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;

export default uiSlice.reducer;
