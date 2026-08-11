const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `API error ${res.status}`);
  }

  return data;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MeUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  _id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  duration: number | null;
  participants: string[];
  processingProgress: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface MeetingsStats {
  totalMeetings: number;
  completedMeetings: number;
  processingMeetings: number;
  totalDuration: number;
  avgDuration: number;
  avgTasks: number;
  trends: { month: string; count: number }[];
  topParticipants: { name: string; meetingCount: number }[];
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  role: string;
  status: string;
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface Notification {
  id: string;
  _id: string;
  userId: string;
  taskId: string | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  task?: { title: string; dueDate: string | null; status: string };
}

export interface ActionItem {
  id: string;
  _id: string;
  meetingId: string;
  userId: string;
  title: string;
  description: string | null;
  assignee: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  meeting?: { title: string; status: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Subscription {
  tier: string;
  meetingCountThisMonth: number;
  monthlyLimit: number;
  meetingsRemaining: number;
  subscriptionExpiresAt: string | null;
  isSubscribed: boolean;
}

export interface WorkspaceOverview {
  teamSize: number;
  cumulativeVelocity: number;
  ongoingProjects: {
    meetingId: string;
    name: string;
    status: string;
    tasksCompleted: number;
    tasksOpen: number;
  }[];
  upcomingDeadlines: {
    id: string;
    title: string;
    dueDate: string;
    assignee: string | null;
    status: string;
    priority: string;
  }[];
  sharedCalendar: {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    updatedAt: string;
    status: string;
  }[];
}

// ── API Functions ──────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: MeUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  me: () => request<MeUser>("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  subscription: () => request<Subscription>("/auth/subscription"),
};

export const meetingsApi = {
  stats: () => request<MeetingsStats>("/meetings/stats"),
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<Meeting>>(`/meetings?page=${page}&limit=${limit}`),
  get: (id: string) => request<Meeting>(`/meetings/${id}`),
  summary: (id: string) => request<unknown>(`/meetings/${id}/summary`),
  transcript: (id: string) => request<unknown>(`/meetings/${id}/transcript`),
};

export const teamsApi = {
  list: () => request<{ teams: Team[] }>("/teams"),
  get: (id: string) => request<Team>(`/teams/${id}`),
  members: (id: string) => request<{ members: TeamMember[] }>(`/teams/${id}/members`),
};

export const actionItemsApi = {
  list: (page = 1, limit = 20, status?: string) =>
    request<PaginatedResponse<ActionItem>>(
      `/action-items?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`
    ),
};

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<Notification>>(`/notifications?page=${page}&limit=${limit}`),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: "PATCH" }),
};

export const workspaceApi = {
  overview: () => request<{ data: WorkspaceOverview }>("/workspace/overview"),
};
