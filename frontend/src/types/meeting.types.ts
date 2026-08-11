// Re-export shared meeting types
export type {
  Meeting,
  MeetingSummary,
  Transcript,
  TranscriptSegment,
  MeetingStats,
  CreateMeetingRequest,
  UpdateMeetingRequest,
} from '@meetiva/shared-types';

// Re-export enums from shared (type-only — these are type aliases, not runtime enums)
export type { MeetingStatus, MeetingPriority } from '@meetiva/shared-types';

// Re-export shared task types
export type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@meetiva/shared-types';

import type { Meeting, MeetingSummary, Transcript, Task, MeetingStats } from '@meetiva/shared-types';

// ─── Frontend-only State Types ──────────────────────────────────────────────

export interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  summary: MeetingSummary | null;
  transcript: Transcript | null;
  tasks: Task[];
  stats: MeetingStats | null;
  isLoading: boolean;
  error: string | null;
}
