import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../lib/rateLimiters';
import { asyncHandler } from '../lib/errors';
import Meeting from '../models/Meeting';
import Task from '../models/ActionItem';
import TeamMember from '../models/TeamMember';
import { Types } from 'mongoose';

const router = Router();

router.get('/overview', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberships = await TeamMember.find({ userId: new Types.ObjectId(req.userId!) })
    .select('teamId')
    .lean();

  const teamIds = memberships.map((m) => m.teamId);

  const teamMembers = teamIds.length
    ? await TeamMember.find({ teamId: { $in: teamIds } })
        .select('userId')
        .lean()
    : [{ userId: new Types.ObjectId(req.userId!) }];

  const memberUserIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

  const [projects, deadlines, completedIn14Days, sharedMeetings] = await Promise.all([
    Meeting.find({
      userId: { $in: memberUserIds },
      status: { $in: ['processing', 'completed'] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Task.find({
      userId: { $in: memberUserIds },
      status: { $in: ['pending', 'in_progress'] },
      dueDate: { $gte: new Date() },
    })
      .sort({ dueDate: 1 })
      .limit(20)
      .select('title dueDate assignee status priority')
      .lean(),
    Task.countDocuments({
      userId: { $in: memberUserIds },
      status: 'completed',
      completedAt: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    Meeting.find({
      userId: { $in: memberUserIds },
      status: { $in: ['uploading', 'processing', 'completed'] },
    })
      .sort({ createdAt: -1 })
      .limit(15)
      .select('title description createdAt updatedAt status')
      .lean(),
  ]);

  // Compute task counts per meeting for projects
  const meetingIds = projects.map((p) => p._id);
  const tasksByMeeting = await Task.aggregate([
    { $match: { meetingId: { $in: meetingIds } } },
    { $group: { _id: '$meetingId', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
  ]);

  const taskMap = new Map(tasksByMeeting.map((a: any) => [a._id.toString(), a]));

  const ongoingProjects = projects.map((meeting) => {
    const stats = taskMap.get(meeting._id.toString());
    const tasksCompleted = stats?.completed || 0;
    const tasksOpen = (stats?.total || 0) - tasksCompleted;

    return {
      meetingId: meeting._id.toString(),
      name: meeting.title,
      status: meeting.status,
      tasksCompleted,
      tasksOpen,
    };
  });

  return res.json({
    data: {
      teamSize: memberUserIds.length,
      cumulativeVelocity: Number((completedIn14Days / 2).toFixed(1)),
      ongoingProjects,
      upcomingDeadlines: deadlines.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        dueDate: item.dueDate,
        assignee: item.assignee,
        status: item.status,
        priority: item.priority,
      })),
      sharedCalendar: sharedMeetings.map((meeting) => ({
        id: meeting._id.toString(),
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        status: meeting.status,
      })),
    },
  });
}));

export default router;
