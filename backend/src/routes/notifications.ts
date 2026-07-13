import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../lib/rateLimiters';
import { validate, notificationQuerySchema } from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import Notification from '../models/Notification';
import { Types } from 'mongoose';

const router = Router();

// Validate all :id route params as MongoDB ObjectId
router.param('id', (req, res, next, value) => {
  if (!Types.ObjectId.isValid(value)) {
    return res.status(400).json({ message: 'Invalid id: must be a valid ObjectId' });
  }
  next();
});

router.get(
  '/',
  apiLimiter,
  authenticate,
  validate(notificationQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit, page } = req.query as unknown as { limit: number; page: number };
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: new Types.ObjectId(req.userId!) })
        .populate('actionItemId', 'title dueDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: new Types.ObjectId(req.userId!) }),
    ]);

    const data = notifications.map((n: any) => ({
      ...n,
      id: n._id.toString(),
      userId: n.userId.toString(),
      actionItemId: n.actionItemId?._id?.toString() || n.actionItemId?.toString() || null,
      actionItem: n.actionItemId || undefined,
    }));

    return res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

router.patch('/:id/read', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const target = await Notification.findOne({
    _id: new Types.ObjectId(req.params.id),
    userId: new Types.ObjectId(req.userId!),
  })
    .select('_id')
    .lean();

  if (!target) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  const updated = await Notification.findByIdAndUpdate(
    target._id,
    { $set: { isRead: true, readAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  return res.json({ data: updated ? { ...updated, id: updated._id.toString() } : null, message: 'Notification marked as read' });
}));

export default router;
