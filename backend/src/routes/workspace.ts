import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: req.userId! },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);

    const teamMembers = teamIds.length
      ? await prisma.teamMember.findMany({
          where: { teamId: { in: teamIds } },
          select: { userId: true },
        })
      : [{ userId: req.userId! }];

    const memberUserIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

    const [projects, deadlines, completedIn14Days, sharedMeetings] = await Promise.all([
      prisma.meeting.findMany({
        where: {
          userId: { in: memberUserIds },
          status: { in: ['processing', 'completed'] },
        },
        include: {
          actionItems: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.actionItem.findMany({
        where: {
          userId: { in: memberUserIds },
          status: { in: ['pending', 'in_progress'] },
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      prisma.actionItem.count({
        where: {
          userId: { in: memberUserIds },
          status: 'completed',
          completedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.meeting.findMany({
        where: {
          userId: { in: memberUserIds },
          status: { in: ['uploading', 'processing', 'completed'] },
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const ongoingProjects = projects.map((meeting) => {
      const tasksCompleted = meeting.actionItems.filter((task) => task.status === 'completed').length;
      const tasksOpen = meeting.actionItems.length - tasksCompleted;

      return {
        meetingId: meeting.id,
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
          id: item.id,
          title: item.title,
          dueDate: item.dueDate,
          assignee: item.assignee,
          status: item.status,
          priority: item.priority,
        })),
        sharedCalendar: sharedMeetings.map((meeting) => ({
          id: meeting.id,
          title: meeting.title,
          description: meeting.description,
          startTime: meeting.createdAt,
          updatedAt: meeting.updatedAt,
          status: meeting.status,
        })),
      },
    });
  } catch (error) {
    console.error('Workspace overview failed:', error);
    return res.status(500).json({ message: 'Failed to load workspace overview' });
  }
});

export default router;
