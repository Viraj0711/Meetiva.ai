export enum MeetingStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum MeetingPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  status: MeetingStatus;
  priority: MeetingPriority;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  processingProgress?: number;
  userId: string;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

export interface Transcript {
  id: string;
  meetingId: string;
  segments: TranscriptSegment[];
  fullText: string;
  language: string;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: MeetingPriority;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  userId?: string;
}

export interface MeetingStats {
  total?: number;
  totalMeetings: number;
  completedMeetings: number;
  processingMeetings: number;
  totalDuration: number;
  averageDuration?: number;
  avgDuration?: number;
  avgActionItems?: number;
  upcoming?: number;
  trends?: { month: string; count: number }[];
  weeklyActivity?: { name: string; meetings: number; actions: number }[];
  topParticipants?: { name: string; meetingCount: number }[];
}

export interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  summary: MeetingSummary | null;
  transcript: Transcript | null;
  actionItems: ActionItem[];
  stats: MeetingStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  participants?: string[];
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  priority?: MeetingPriority;
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
  status?: ActionItem['status'];
  tags?: string[];
}
