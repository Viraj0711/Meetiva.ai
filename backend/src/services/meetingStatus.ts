import Meeting from '../models/Meeting';
import Task from '../models/ActionItem';
import { Types } from 'mongoose';

export const syncMeetingStatusFromTasks = async (meetingId: string): Promise<void> => {
  const [meeting, totalTasks, incompleteTasks] = await Promise.all([
    Meeting.findById(meetingId)
      .select('completedAt')
      .lean(),
    Task.countDocuments({ meetingId: new Types.ObjectId(meetingId) }),
    Task.countDocuments({
      meetingId: new Types.ObjectId(meetingId),
      status: { $ne: 'completed' },
    }),
  ]);

  if (!meeting) {
    return;
  }

  const shouldBeCompleted = totalTasks > 0 && incompleteTasks === 0;

  await Meeting.findByIdAndUpdate(meetingId, {
    $set: {
      status: shouldBeCompleted ? 'completed' : 'pending',
      completedAt: shouldBeCompleted ? (meeting.completedAt ?? new Date()) : null,
    },
  });
};
