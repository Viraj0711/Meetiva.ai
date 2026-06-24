import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../lib/rateLimiters';
import { validate, notificationQuerySchema } from '../lib/validation';

const router = Router();

router.get(
  '/',
  apiLimiter,
  authenticate,
  validate(notificationQuerySchema, 'query'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit } = req.query as unknown as { limit: number };

      const notifications = await prisma.notification.findMany({
        where: { userId: req.userId! },
        include: {
          actionItem: {
            select: { id: true, title: true, dueDate: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return res.json({ data: notifications });
    } catch (error) {
      console.error('Fetch notifications failed:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }
);

router.patch('/:id/read', apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Mark notification as read failed:', error);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
});

export default router;
