import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', status } = req.query;
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ActionItemWhereInput = { userId: req.userId! };
    if (status) {
      where.status = status as Prisma.EnumActionItemStatusFilter['equals'];
    }

    const [actionItems, total] = await Promise.all([
      prisma.actionItem.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          meeting: {
            select: {
              id: true,
              title: true
            }
          }
        }
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
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({ message: 'Failed to fetch action items' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const actionItem = await prisma.actionItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      include: {
        meeting: true
      }
    });

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    res.json(actionItem);
  } catch (error) {
    console.error('Error fetching action item:', error);
    res.status(500).json({ message: 'Failed to fetch action item' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId, title, description, assignee, dueDate, priority } = req.body;

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
        userId: req.userId!
      }
    });

    res.status(201).json(actionItem);
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({ message: 'Failed to create action item' });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assignee, dueDate, priority, status } = req.body;

    const actionItem = await prisma.actionItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    const updateData: Prisma.ActionItemUpdateInput = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (status === 'completed' && !actionItem.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.actionItem.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating action item:', error);
    res.status(500).json({ message: 'Failed to update action item' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const actionItem = await prisma.actionItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    await prisma.actionItem.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting action item:', error);
    res.status(500).json({ message: 'Failed to delete action item' });
  }
});

router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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

    res.json(updated);
  } catch (error) {
    console.error('Error completing action item:', error);
    res.status(500).json({ message: 'Failed to complete action item' });
  }
});

export default router;
