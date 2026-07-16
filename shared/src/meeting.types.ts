import type { MeetingStatus, MeetingPriority, Sentiment } from './enums.js';

// ─── Meeting ────────────────────────────────────────────────────────────────

export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  status: MeetingStatus;
  priority: MeetingPriority;
  audioUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  participants: string[];
  processingProgress?: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
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

// ─── Meeting Summary ────────────────────────────────────────────────────────

export interface MeetingSummary {
  id: string;
  meetingId: string;
  executiveSummary: string;
  fullSummary?: string;
  minutesContent?: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: Sentiment;
  createdAt: string;
}

// ─── Transcript ─────────────────────────────────────────────────────────────

export interface Transcript {
  id: string;
  meetingId: string;
  segments: TranscriptSegment[];
  fullText: string;
  language: string;
  createdAt: string;
}

export interface TranscriptSegment {
  id?: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

// ─── Meeting Stats ──────────────────────────────────────────────────────────

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
