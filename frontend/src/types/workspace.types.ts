export interface CalendarConnectionStatus {
  connected: boolean;
  expiryDate: string | null;
  updatedAt: string | null;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
}

export interface WorkspaceProject {
  meetingId: string;
  name: string;
  status: string;
  tasksCompleted: number;
  tasksOpen: number;
}

export interface WorkspaceDeadline {
  id: string;
  title: string;
  dueDate: string;
  assignee?: string | null;
  status: string;
  priority: string;
}

export interface WorkspaceCalendarItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  updatedAt: string;
  status: string;
}

export interface WorkspaceOverview {
  teamSize: number;
  cumulativeVelocity: number;
  ongoingProjects: WorkspaceProject[];
  upcomingDeadlines: WorkspaceDeadline[];
  sharedCalendar: WorkspaceCalendarItem[];
}
