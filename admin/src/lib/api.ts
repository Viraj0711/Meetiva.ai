const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function getToken(): string | null {
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

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  me: () =>
    request<{ id: string; email: string; name: string; createdAt: string }>("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  subscription: () =>
    request<{ tier: string; meetingCountThisMonth: number; monthlyLimit: number; meetingsRemaining: number; isSubscribed: boolean }>("/auth/subscription"),
};

// Meetings
export const meetingsApi = {
  stats: () =>
    request<{
      totalMeetings: number;
      completedMeetings: number;
      processingMeetings: number;
      totalDuration: number;
      avgDuration: number;
      avgTasks: number;
      trends: { date: string; count: number }[];
      topParticipants: { name: string; count: number }[];
    }>("/meetings/stats"),
  list: (page = 1, limit = 20) =>
    request<{ data: unknown[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/meetings?page=${page}&limit=${limit}`
    ),
  get: (id: string) => request<unknown>(`/meetings/${id}`),
  summary: (id: string) => request<unknown>(`/meetings/${id}/summary`),
  transcript: (id: string) => request<unknown>(`/meetings/${id}/transcript`),
};

// Teams
export const teamsApi = {
  list: () => request<{ teams: unknown[] }>("/teams"),
  get: (id: string) => request<unknown>(`/teams/${id}`),
  members: (id: string) => request<unknown[]>(`/teams/${id}/members`),
  stats: (range = "month") => request<unknown>(`/teams/chat/stats?range=${range}`),
};

// Action Items
export const actionItemsApi = {
  list: (page = 1, limit = 20, status?: string) =>
    request<{ data: unknown[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/action-items?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`
    ),
};

// Notifications
export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    request<{ data: unknown[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/notifications?page=${page}&limit=${limit}`
    ),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: "PATCH" }),
};

// Workspace
export const workspaceApi = {
  overview: () =>
    request<{
      teamSize: number;
      cumulativeVelocity: number;
      ongoingProjects: number;
      upcomingDeadlines: number;
      sharedCalendar: unknown;
    }>("/workspace/overview"),
};
