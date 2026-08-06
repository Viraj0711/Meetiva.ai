export enum MeetingStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Priority {
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
  priority: Priority;
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

export interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  summary: MeetingSummary | null;
  transcript: Transcript | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  participants?: string[];
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  priority?: Priority;
}
