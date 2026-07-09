import Meeting from '../models/Meeting';
import ActionItem from '../models/ActionItem';
import { Types } from 'mongoose';

export const syncMeetingStatusFromActionItems = async (meetingId: string): Promise<void> => {
  const [meeting, totalActionItems, incompleteActionItems] = await Promise.all([
    Meeting.findById(meetingId)
      .select('completedAt')
      .lean(),
    ActionItem.countDocuments({ meetingId: new Types.ObjectId(meetingId) }),
    ActionItem.countDocuments({
      meetingId: new Types.ObjectId(meetingId),
      status: { $ne: 'completed' },
    }),
  ]);

  if (!meeting) {
    return;
  }

  const shouldBeCompleted = totalActionItems > 0 && incompleteActionItems === 0;

  await Meeting.findByIdAndUpdate(meetingId, {
    $set: {
      status: shouldBeCompleted ? 'completed' : 'pending',
      completedAt: shouldBeCompleted ? (meeting.completedAt ?? new Date()) : null,
    },
  });
};
