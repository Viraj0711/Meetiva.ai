import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../lib/rateLimiters';
import { validate, notificationQuerySchema } from '../lib/validation';
import { asyncHandler } from '../lib/errors';

const router = Router();

router.get(
  '/',
  apiLimiter,
  authenticate,
  validate(notificationQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit, page } = req.query as unknown as { limit: number; page: number };
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId! },
        select: {
          id: true,
          userId: true,
          actionItemId: true,
          type: true,
          title: true,
          message: true,
          channel: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          actionItem: {
            select: { id: true, title: true, dueDate: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.userId! } }),
    ]);

    return res.json({
      data: notifications,
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
  const target = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  const updated = await prisma.notification.update({
    where: { id: target.id },
    data: { isRead: true, readAt: new Date() },
  });

  return res.json({ data: updated, message: 'Notification marked as read' });
}));

export default router;
