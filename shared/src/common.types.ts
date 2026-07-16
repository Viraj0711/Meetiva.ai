// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: BackendPagination;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  actionItemId?: string | null;
  type: 'DEADLINE_REMINDER' | 'SYSTEM';
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

// ─── Misc ───────────────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
