import type { MeetingPriority, TaskStatus } from './enums.js';

// ─── Task ────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  meetingId: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: string | null;
  priority: MeetingPriority;
  status: TaskStatus;
  tags: string[];
  reminderSentAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface CreateTaskRequest {
  meetingId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: MeetingPriority;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: MeetingPriority;
  status?: TaskStatus;
  tags?: string[];
}
