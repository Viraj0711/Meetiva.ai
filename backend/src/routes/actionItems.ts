import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import prisma from '../lib/prisma';

const router = Router();

// Helper to get the appropriate where clause based on user's role
const getActionItemsWhereClause = async (req: AuthRequest): Promise<Prisma.ActionItemWhereInput> => {
  try {
    // For members or users with no team membership, only show their own action items
    if (!req.userTeams || req.userTeams.length === 0) {
      console.log(`[getActionItemsWhereClause] User ${req.userId} has no teams, returning own items only`);
      return { userId: req.userId! };
    }

    // Check if user is MANAGER or LEAD in any team
    const isManagerOrLead = req.userTeams.some(team =>
      team.role === 'MANAGER' || team.role === 'LEAD'
    );

    if (!isManagerOrLead) {
      // User is just a MEMBER, show only their own items
      console.log(`[getActionItemsWhereClause] User ${req.userId} is MEMBER only, returning own items`);
      return { userId: req.userId! };
    }

    // User is MANAGER or LEAD - fetch all team members from their teams
    const teamIds = req.userTeams
      .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
      .map(team => team.teamId);

    if (teamIds.length === 0) {
      console.log(`[getActionItemsWhereClause] User ${req.userId} has no MANAGER/LEAD teams`);
      return { userId: req.userId! };
    }

    console.log(`[getActionItemsWhereClause] User ${req.userId} is MANAGER/LEAD in teams: ${teamIds.join(', ')}`);

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true }
    });

    const memberUserIds = Array.from(new Set([req.userId!, ...teamMembers.map(tm => tm.userId)]));
    console.log(`[getActionItemsWhereClause] Showing items for ${memberUserIds.length} users`);

    return {
      userId: { in: memberUserIds }
    };
  } catch (error) {
    console.error(`[getActionItemsWhereClause] Error: ${error}`);
    console.log(`[getActionItemsWhereClause] Fallback: returning only own items for user ${req.userId}`);
    return { userId: req.userId! };
  }
};

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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

    // Check if user can delete this action item (must be owner)
    if (actionItem.userId !== req.userId!) {
      return res.status(403).json({ message: 'You do not have permission to delete this action item' });
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
