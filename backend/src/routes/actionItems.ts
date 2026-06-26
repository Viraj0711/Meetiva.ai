import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import prisma from '../lib/prisma';
import { syncMeetingStatusFromActionItems } from '../services/meetingStatus';
import { apiLimiter } from '../lib/rateLimiters';
import { validate, createActionItemSchema, updateActionItemSchema } from '../lib/validation';
import { asyncHandler } from '../lib/errors';

const router = Router();

// Helper to get the appropriate where clause based on user's role
const getActionItemsWhereClause = async (req: AuthRequest): Promise<Prisma.ActionItemWhereInput> => {
  try {
    // For members or users with no team membership, only show their own action items
    if (!req.userTeams || req.userTeams.length === 0) {
      return { userId: req.userId! };
    }

    // Check if user is MANAGER or LEAD in any team
    const isManagerOrLead = req.userTeams.some(team =>
      team.role === 'MANAGER' || team.role === 'LEAD'
    );

    if (!isManagerOrLead) {
      return { userId: req.userId! };
    }

    // User is MANAGER or LEAD - fetch all team members from their teams
    const teamIds = req.userTeams
      .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
      .map(team => team.teamId);

    if (teamIds.length === 0) {
      return { userId: req.userId! };
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true }
    });

    const memberUserIds = Array.from(new Set([req.userId!, ...teamMembers.map(tm => tm.userId)]));

    return {
      userId: { in: memberUserIds }
    };
  } catch {
    return { userId: req.userId! };
  }
};

router.get('/', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status } = req.query;
  const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  let where: Prisma.ActionItemWhereInput = await getActionItemsWhereClause(req);

  if (status) {
    where = {
      ...where,
      status: status as Prisma.EnumActionItemStatusFilter['equals']
    };
  }

  const [actionItems, total] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        meetingId: true,
        userId: true,
        title: true,
        description: true,
        assignee: true,
        dueDate: true,
        priority: true,
        status: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.actionItem.count({ where })
  ]);

  res.json({
    data: actionItems,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  });
}));

router.get('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await prisma.actionItem.findFirst({
    where: {
      id: req.params.id
    },
    include: {
      meeting: true
    }
  });

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can view this action item
  if (!canViewUserData(req.userId!, actionItem.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to view this action item' });
  }

  res.json(actionItem);
}));

router.post('/', apiLimiter, authenticate, validate(createActionItemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { meetingId, title, description, assignee, dueDate, priority } = req.body as z.infer<typeof createActionItemSchema>;

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      userId: req.userId!
    }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  const actionItem = await prisma.actionItem.create({
    data: {
      meetingId,
      title,
      description,
      assignee,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
      reminderSentAt: null,
      userId: req.userId!
    }
  });

  await syncMeetingStatusFromActionItems(meetingId);

  res.status(201).json(actionItem);
}));

router.patch('/:id', apiLimiter, authenticate, validate(updateActionItemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, assignee, dueDate, priority, status } = req.body as z.infer<typeof updateActionItemSchema>;

  const actionItem = await prisma.actionItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId!
    }
  });

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can modify this action item (must be owner)
  if (actionItem.userId !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to modify this action item' });
  }

  const updateData: Prisma.ActionItemUpdateInput = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) updateData.status = status;

  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
    updateData.reminderSentAt = null;
  }

  if (status === 'completed' && !actionItem.completedAt) {
    updateData.completedAt = new Date();
  }

  if (status !== undefined && status !== 'completed') {
    updateData.reminderSentAt = null;
  }

  const updated = await prisma.actionItem.update({
    where: { id: req.params.id },
    data: updateData
  });

  await syncMeetingStatusFromActionItems(actionItem.meetingId);

  res.json(updated);
}));

router.delete('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await prisma.actionItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId!
    }
  });

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can delete this action item (must be owner)
  if (actionItem.userId !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to delete this action item' });
  }

  await prisma.actionItem.delete({
    where: { id: req.params.id }
  });

  await syncMeetingStatusFromActionItems(actionItem.meetingId);

  res.status(204).send();
}));

router.post('/:id/complete', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await prisma.actionItem.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId!
    }
  });

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  const updated = await prisma.actionItem.update({
    where: { id: req.params.id },
    data: {
      status: 'completed',
      completedAt: new Date()
    }
  });

  await syncMeetingStatusFromActionItems(actionItem.meetingId);

  res.json(updated);
}));

export default router;
