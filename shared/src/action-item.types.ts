import type { MeetingPriority, ActionItemStatus } from './enums.js';

// ─── Action Item ────────────────────────────────────────────────────────────

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: string | null;
  priority: MeetingPriority;
  status: ActionItemStatus;
  tags: string[];
  reminderSentAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface CreateActionItemRequest {
  meetingId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: MeetingPriority;
  tags?: string[];
}

export interface UpdateActionItemRequest {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: MeetingPriority;
  status?: ActionItemStatus;
  tags?: string[];
}
