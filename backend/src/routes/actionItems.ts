import type { TaskStatus } from '../lib/shared';
import { Router, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import { syncMeetingStatusFromTasks } from '../services/meetingStatus';
import { apiLimiter } from '../lib/rateLimiters';
import {
  validate,
  validateObjectIdParam,
  createTaskSchema,
  updateTaskSchema,
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
router.param('id', validateObjectIdParam('id'));

// Helper to get the appropriate filter based on user's role
const getTasksFilter = async (req: AuthRequest): Promise<Record<string, any>> => {
  try {
    // For members or users with no team membership, only show their own tasks
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

const taskQuerySchema = paginationQuerySchema.merge(statusFilterSchema);

router.get('/',
  apiLimiter,
  authenticate,
  validate(taskQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: TaskStatus;
    };
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = await getTasksFilter(req);

    if (status) {
      filter.status = status;
    }

    const [tasks, total] = await Promise.all([
      ActionItem.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('meetingId', 'title')
        .lean(),
      ActionItem.countDocuments(filter),
    ]);

    res.json({
      data: tasks.map((item: any) => ({
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
  const task = await ActionItem.findById(req.params.id)
    .populate('meetingId')
    .lean() as any;

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Check if user can view this task
  if (!(await canViewUserData(req.userId!, task.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this task' });
  }

  res.json(task);
}));

router.post('/', apiLimiter, authenticate, validate(createTaskSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { meetingId, title, description, assignee, dueDate, priority } = req.body as z.infer<typeof createTaskSchema>;

  const meeting = await Meeting.findOne({
    _id: new Types.ObjectId(meetingId),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  const task = await ActionItem.create({
    meetingId: meeting._id,
    title,
    description,
    assignee,
    dueDate: dueDate ? new Date(dueDate) : null,
    priority: priority || 'medium',
    reminderSentAt: null,
    userId: new Types.ObjectId(req.userId!),
  });

  await syncMeetingStatusFromTasks(meetingId);

  res.status(201).json(task.toObject());
}));

router.patch('/:id', apiLimiter, authenticate, validate(updateTaskSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, assignee, dueDate, priority, status } = req.body as z.infer<typeof updateTaskSchema>;

  const task = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Check if user can modify this task (must be owner)
  if (task.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to modify this task' });
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

  if (status === 'completed' && !task.completedAt) {
    updateData.completedAt = new Date();
  }

  if (status !== undefined && status !== 'completed') {
    updateData.reminderSentAt = null;
  }

  const updated = await ActionItem.findByIdAndUpdate(
    task._id,
    { $set: updateData },
    { returnDocument: 'after' }
  ).lean();

  await syncMeetingStatusFromTasks(task.meetingId.toString());

  res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));

router.delete('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Check if user can delete this task (must be owner)
  if (task.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to delete this task' });
  }

  await ActionItem.findByIdAndDelete(task._id);

  await syncMeetingStatusFromTasks(task.meetingId.toString());

  res.status(204).send();
}));

router.post('/:id/complete', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await ActionItem.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  }).lean();

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const updated = await ActionItem.findByIdAndUpdate(
    task._id,
    { $set: { status: 'completed', completedAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  await syncMeetingStatusFromTasks(task.meetingId.toString());

  res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));

export default router;
