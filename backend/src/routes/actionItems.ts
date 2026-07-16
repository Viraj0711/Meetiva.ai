import type { ActionItemStatus } from '../lib/shared';
import { Router, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import { syncMeetingStatusFromActionItems } from '../services/meetingStatus';
import { apiLimiter } from '../lib/rateLimiters';
import {
  validate,
  createActionItemSchema,
  updateActionItemSchema,
  paginationQuerySchema,
  statusFilterSchema,
} from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import ActionItem from '../models/ActionItem';
import Meeting from '../models/Meeting';
import TeamMember from '../models/TeamMember';
import { Types } from 'mongoose';

const router = Router();

// Validate all :id route params as MongoDB ObjectId
router.param('id', (req, res, next, value) => {
  if (!Types.ObjectId.isValid(value)) {
    return res.status(400).json({ message: 'Invalid id: must be a valid ObjectId' });
  }
  next();
});

// Helper to get the appropriate filter based on user's role
const getActionItemsFilter = async (req: AuthRequest): Promise<Record<string, any>> => {
  try {
    // For members or users with no team membership, only show their own action items
    if (!req.userTeams || req.userTeams.length === 0) {
      return { userId: new Types.ObjectId(req.userId!) };
    }

    // Check if user is MANAGER or LEAD in any team
    const isManagerOrLead = req.userTeams.some(team =>
      team.role === 'MANAGER' || team.role === 'LEAD'
    );

    if (!isManagerOrLead) {
      return { userId: new Types.ObjectId(req.userId!) };
    }

    // User is MANAGER or LEAD - fetch all team members from their teams
    const teamIds = req.userTeams
      .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
      .map(team => new Types.ObjectId(team.teamId));

    if (teamIds.length === 0) {
      return { userId: new Types.ObjectId(req.userId!) };
    }

    const teamMembers = await TeamMember.find({ teamId: { $in: teamIds } })
      .select('userId')
      .lean();

    const memberUserIds = Array.from(new Set([
      new Types.ObjectId(req.userId!),
      ...teamMembers.map(tm => tm.userId),
    ]));

    return { userId: { $in: memberUserIds } };
  } catch {
    return { userId: new Types.ObjectId(req.userId!) };
  }
};

const actionItemQuerySchema = paginationQuerySchema.merge(statusFilterSchema);

router.get('/',
  apiLimiter,
  authenticate,
  validate(actionItemQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: ActionItemStatus;
    };
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = await getActionItemsFilter(req);

    if (status) {
      filter.status = status;
    }

    const [actionItems, total] = await Promise.all([
      ActionItem.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('meetingId', 'title')
        .lean(),
      ActionItem.countDocuments(filter),
    ]);

    res.json({
      data: actionItems.map((item: any) => ({
        ...item,
        id: item._id.toString(),
        meeting: item.meetingId ? { id: item.meetingId._id.toString(), title: item.meetingId.title } : undefined,
        meetingId: item.meetingId?._id?.toString() || item.meetingId?.toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }));

router.get('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await ActionItem.findById(req.params.id)
    .populate('meetingId')
    .lean() as any;

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can view this action item
  if (!(await canViewUserData(req.userId!, actionItem.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this action item' });
  }

  res.json(actionItem);
}));

router.post('/', apiLimiter, authenticate, validate(createActionItemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { meetingId, title, description, assignee, dueDate, priority } = req.body as z.infer<typeof createActionItemSchema>;

  const meeting = await Meeting.findOne({
    _id: new Types.ObjectId(meetingId),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  const actionItem = await ActionItem.create({
    meetingId: meeting._id,
    title,
    description,
    assignee,
    dueDate: dueDate ? new Date(dueDate) : null,
    priority: priority || 'medium',
    reminderSentAt: null,
    userId: new Types.ObjectId(req.userId!),
  });

  await syncMeetingStatusFromActionItems(meetingId);

  res.status(201).json(actionItem.toObject());
}));

router.patch('/:id', apiLimiter, authenticate, validate(updateActionItemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, assignee, dueDate, priority, status } = req.body as z.infer<typeof updateActionItemSchema>;

  const actionItem = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can modify this action item (must be owner)
  if (actionItem.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to modify this action item' });
  }

  const updateData: Record<string, any> = {};

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

  const updated = await ActionItem.findByIdAndUpdate(
    actionItem._id,
    { $set: updateData },
    { returnDocument: 'after' }
  ).lean();

  await syncMeetingStatusFromActionItems(actionItem.meetingId.toString());

  res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));

router.delete('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  // Check if user can delete this action item (must be owner)
  if (actionItem.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to delete this action item' });
  }

  await ActionItem.findByIdAndDelete(actionItem._id);

  await syncMeetingStatusFromActionItems(actionItem.meetingId.toString());

  res.status(204).send();
}));

router.post('/:id/complete', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const actionItem = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!actionItem) {
    return res.status(404).json({ message: 'Action item not found' });
  }

  const updated = await ActionItem.findByIdAndUpdate(
    actionItem._id,
    { $set: { status: 'completed', completedAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  await syncMeetingStatusFromActionItems(actionItem.meetingId.toString());

  res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));

export default router;
