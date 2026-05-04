import prisma from '../lib/prisma';

export const syncMeetingStatusFromActionItems = async (meetingId: string): Promise<void> => {
  const [meeting, totalActionItems, incompleteActionItems] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, completedAt: true }
    }),
    prisma.actionItem.count({ where: { meetingId } }),
    prisma.actionItem.count({
      where: {
        meetingId,
        status: { not: 'completed' }
      }
    })
  ]);

  if (!meeting) {
    return;
  }

  const shouldBeCompleted = totalActionItems > 0 && incompleteActionItems === 0;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: shouldBeCompleted ? 'completed' : 'pending',
      completedAt: shouldBeCompleted ? meeting.completedAt ?? new Date() : null
    }
  });
};