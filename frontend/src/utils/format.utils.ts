import { MeetingStatus, MeetingPriority } from '@/types';

/**
 * Get status color for badges
 */
export const getStatusColor = (status: MeetingStatus): string => {
  const colors: Record<MeetingStatus, string> = {
    [MeetingStatus.PENDING]: 'bg-yellow-100 text-amber-800',
    [MeetingStatus.UPLOADING]: 'text-cyan-300',
    [MeetingStatus.PROCESSING]: 'text-cyan-300',
    [MeetingStatus.TRANSCRIBING]: 'bg-purple-100 text-purple-800',
    [MeetingStatus.ANALYZING]: 'bg-indigo-100 text-indigo-800',
    [MeetingStatus.COMPLETED]: 'bg-white/[0.06] text-cyan-300',
    [MeetingStatus.FAILED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: MeetingPriority): string => {
  const colors: Record<MeetingPriority, string> = {
    [MeetingPriority.LOW]: 'text-gray-600',
    [MeetingPriority.MEDIUM]: '#335444',
    [MeetingPriority.HIGH]: 'text-orange-600',
    [MeetingPriority.URGENT]: 'text-red-600',
  };
  return colors[priority] || 'text-gray-600';
};

/**
 * Get status label
 */
export const getStatusLabel = (status: MeetingStatus): string => {
  const labels: Record<MeetingStatus, string> = {
    [MeetingStatus.PENDING]: 'Pending',
    [MeetingStatus.UPLOADING]: 'Uploading',
    [MeetingStatus.PROCESSING]: 'Processing',
    [MeetingStatus.TRANSCRIBING]: 'Transcribing',
    [MeetingStatus.ANALYZING]: 'Analyzing',
    [MeetingStatus.COMPLETED]: 'Completed',
    [MeetingStatus.FAILED]: 'Failed',
  };
  return labels[status] || status;
};

/**
 * Get priority label
 */
export const getPriorityLabel = (priority: MeetingPriority): string => {
  const labels: Record<MeetingPriority, string> = {
    [MeetingPriority.LOW]: 'Low',
    [MeetingPriority.MEDIUM]: 'Medium',
    [MeetingPriority.HIGH]: 'High',
    [MeetingPriority.URGENT]: 'Urgent',
  };
  return labels[priority] || priority;
};


