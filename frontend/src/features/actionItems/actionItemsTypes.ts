import { Priority } from '../meetings/meetingsTypes';

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: Priority;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ActionItemsState {
  items: ActionItem[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'pending' | 'completed';
}

export interface CreateActionItemRequest {
  meetingId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
}

export interface UpdateActionItemRequest {
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: Priority;
  status?: ActionItem['status'];
  tags?: string[];
}
