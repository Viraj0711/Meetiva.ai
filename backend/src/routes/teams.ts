import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import prisma from '../lib/prisma';
import { apiLimiter } from '../lib/rateLimiters';
import {
  validate,
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateMemberProfileSchema,
  chatMessageSchema,
} from '../lib/validation';
import { asyncHandler } from '../lib/errors';

const router = Router();

const buildDefaultNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0] || 'Member';
  const normalized = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return 'Team Member';
  }

  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 50);
};

const generateTemporaryPassword = (): string => {
  return `Tm!${crypto.randomBytes(4).toString('hex')}A9`;
};

const getAcceptedMembership = async (teamId: string, userId: string) => {
  return prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });
};

// Create a new team
router.post(
  '/',
  apiLimiter,
  authenticate,
  validate(createTeamSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingMemberships = await prisma.teamMember.findMany({
      where: {
        userId: req.userId!,
        status: 'ACCEPTED',
      },
      select: {
        role: true,
      },
    });

    const canCreateTeam =
      existingMemberships.length === 0 ||
      existingMemberships.some((membership) => membership.role === 'LEAD' || membership.role === 'MANAGER');

    if (!canCreateTeam) {
      return res.status(403).json({
        message: 'Only team leaders can create teams',
      });
    }

    const { name, description } = req.body as z.infer<typeof createTeamSchema>;

    // Create the team with manager
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        managerId: req.userId
      }
    });

    // Add the creator as a MANAGER with ACCEPTED status
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: req.userId!,
        teamId: team.id,
        role: 'LEAD',
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    console.log(`✅ Team created: ${team.id} by manager ${req.userId}`);

    res.status(201).json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString()
      },
      membership: {
        role: teamMember.role,
        status: teamMember.status,
        acceptedAt: teamMember.acceptedAt?.toISOString()
      }
    });
  })
);

// Get all teams for current user
router.get('/', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId: req.userId! },
    include: {
      team: true
    }
  });

  const teams = teamMembers.map(tm => ({
    id: tm.team.id,
    name: tm.team.name,
    description: tm.team.description,
    role: tm.role,
    status: tm.status,
    joinedAt: tm.acceptedAt?.toISOString() || tm.createdAt.toISOString(),
    createdAt: tm.team.createdAt.toISOString(),
    updatedAt: tm.team.updatedAt.toISOString()
  }));

  res.json({ teams });
}));

// Get team follow-up chat statistics for analytics dashboards
router.get('/chat/stats', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const range = (req.query.range as string) || 'month';
  const daysByRange: Record<string, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };
  const days = daysByRange[range] || 30;

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: req.userId!,
      status: 'ACCEPTED',
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const teamIds = memberships.map((membership) => membership.teamId);
  if (teamIds.length === 0) {
    return res.json({
      totalMessages: 0,
      followUpsLast7Days: 0,
      dailyTrend: [],
      teamStats: [],
    });
  }

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);

  const [rangeMessages, lastWeekCount, totalMessagesCount] = await Promise.all([
    prisma.teamChatMessage.findMany({
      where: {
        teamId: { in: teamIds },
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10000,
    }),
    prisma.teamChatMessage.count({
      where: {
        teamId: { in: teamIds },
        createdAt: { gte: lastWeekDate },
      },
    }),
    prisma.teamChatMessage.count({
      where: {
        teamId: { in: teamIds },
      },
    }),
  ]);

  const dailyMap = new Map<string, number>();
  const teamMap = new Map<string, { messageCount: number; lastMessageAt: Date | null; participants: Set<string> }>();

  for (const membership of memberships) {
    teamMap.set(membership.teamId, {
      messageCount: 0,
      lastMessageAt: null,
      participants: new Set<string>(),
    });
  }

  rangeMessages.forEach((message) => {
    const day = message.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);

    const teamStats = teamMap.get(message.teamId);
    if (teamStats) {
      teamStats.messageCount += 1;
      teamStats.participants.add(message.userId);
      if (!teamStats.lastMessageAt || message.createdAt > teamStats.lastMessageAt) {
        teamStats.lastMessageAt = message.createdAt;
      }
    }
  });

  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const teamStats = memberships.map((membership) => {
    const stats = teamMap.get(membership.teamId);
    return {
      teamId: membership.teamId,
      teamName: membership.team.name,
      messageCount: stats?.messageCount || 0,
      activeParticipants: stats?.participants.size || 0,
      lastMessageAt: stats?.lastMessageAt?.toISOString() || null,
    };
  });

  res.json({
    totalMessages: totalMessagesCount,
    followUpsLast7Days: lastWeekCount,
    dailyTrend,
    teamStats,
  });
}));

// Get a specific team for current user
router.get('/:teamId', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.params;

  const membership = await getAcceptedMembership(teamId, req.userId!);
  if (!membership || membership.status !== 'ACCEPTED') {
    return res.status(403).json({ message: 'Not a member of this team' });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  res.json({
    id: team.id,
    name: team.name,
    description: team.description,
    role: membership.role,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    joinedAt: membership.acceptedAt?.toISOString() || membership.createdAt.toISOString(),
  });
}));

// Get team chat messages for follow-up discussion
router.get('/:teamId/chat/messages', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.params;
  const limitInput = parseInt((req.query.limit as string) || '50', 10);
  const limit = Number.isNaN(limitInput) ? 50 : Math.min(Math.max(limitInput, 1), 200);
  const before = req.query.before as string | undefined;

  const membership = await getAcceptedMembership(teamId, req.userId!);
  if (!membership || membership.status !== 'ACCEPTED') {
    return res.status(403).json({ message: 'Not a member of this team' });
  }

  let beforeDate: Date | undefined;
  if (before) {
    beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid before timestamp' });
    }
  }

  const messages = await prisma.teamChatMessage.findMany({
    where: {
      teamId,
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    select: {
      id: true,
      teamId: true,
      userId: true,
      message: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (messages.length === 0) {
    return res.json({ messages: [] });
  }

  const userIds = Array.from(new Set(messages.map((message) => message.userId)));
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  const orderedMessages = messages
    .reverse()
    .map((message) => ({
      id: message.id,
      teamId: message.teamId,
      userId: message.userId,
      userName: userMap.get(message.userId)?.name || 'Unknown member',
      userEmail: userMap.get(message.userId)?.email || '',
      message: message.message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    }));

  res.json({ messages: orderedMessages });
}));

// Post a follow-up message to team chat
router.post(
  '/:teamId/chat/messages',
  apiLimiter,
  authenticate,
  validate(chatMessageSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const membership = await getAcceptedMembership(teamId, req.userId!);
    if (!membership || membership.status !== 'ACCEPTED') {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    const created = await prisma.teamChatMessage.create({
      data: {
        teamId,
        userId: req.userId!,
        message: req.body.message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: {
        id: created.id,
        teamId: created.teamId,
        userId: created.userId,
        userName: created.user.name,
        userEmail: created.user.email,
        message: created.message,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  })
);

// Get team members with hierarchy-aware visibility
router.get(
  '/:teamId/members',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;

    // Check if user is member of this team
    const userMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId
        }
      }
    });

    if (!userMembership) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    // Get all members
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const members = allMembers.map(tm => ({
      userId: tm.userId,
      name: tm.user.name,
      email: tm.user.email,
      role: tm.role,
      status: tm.status,
      joinedAt: tm.acceptedAt?.toISOString() || tm.createdAt.toISOString()
    }));

    res.json({ members });
  })
);

// Leader-only invite: creates MEMBER credentials and membership in one step.
router.post(
  '/:teamId/invite',
  apiLimiter,
  authenticate,
  validate(inviteMemberSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const normalizedEmail = String(req.body.email).toLowerCase();

    // Check if requester is member of this team
    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId
        }
      }
    });

    if (!requesterMembership) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    // Only team leaders can invite members in invite-only mode.
    if (requesterMembership.role !== 'LEAD') {
      return res.status(403).json({ message: 'Only a team leader can invite members' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    let temporaryPassword: string | null = null;

    if (!user) {
      temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: buildDefaultNameFromEmail(normalizedEmail),
          hashedPassword,
        },
      });
    }

    // If user exists and is already a member, error
    if (user) {
      const existingMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId
          }
        }
      });

      if (existingMembership) {
        return res.status(400).json({ message: 'User is already a member of this team' });
      }
    }

    const now = new Date();

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role: 'MEMBER',
        status: 'ACCEPTED',
        invitedBy: req.userId!,
        invitedAt: now,
        acceptedAt: now,
      },
    });

    // Keep invitation table clean when member is provisioned immediately.
    await prisma.teamInvitation.deleteMany({
      where: {
        teamId,
        email: normalizedEmail,
        status: 'PENDING',
      },
    });

    console.log(`✅ Leader ${req.userId} added member ${normalizedEmail} to team ${teamId}`);

    res.status(201).json({
      member: {
        userId: teamMember.userId,
        email: normalizedEmail,
        role: teamMember.role,
        invitedAt: teamMember.invitedAt?.toISOString(),
        joinedAt: teamMember.acceptedAt?.toISOString(),
      },
      // SECURITY: Temporary password is returned here because there is no
      // email delivery system configured for new-member notifications.
      // In production, the password should be sent via email instead of
      // being exposed in the API response body where it could be logged
      // or intercepted by intermediaries.
      temporaryCredentials: temporaryPassword
        ? {
            email: normalizedEmail,
            temporaryPassword,
          }
        : null,
      message: temporaryPassword
        ? 'Member account created. Share credentials securely with the member.'
        : 'Existing user added to the team as member.',
    });
  })
);

// Get pending invitations for current user
router.get('/pending/invitations', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: req.userId! }
  });

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const invitations = await prisma.teamInvitation.findMany({
    where: {
      email: currentUser.email,
      status: 'PENDING',
      expiresAt: { gt: new Date() }
    },
    include: {
      team: true,
      inviter: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  const formattedInvitations = invitations.map(inv => ({
    id: inv.id,
    teamId: inv.team.id,
    teamName: inv.team.name,
    role: inv.role,
    invitedBy: inv.inviter.name,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString()
  }));

  res.json({ invitations: formattedInvitations });
}));

// Accept an invitation
router.post(
  '/invitations/:invitationId/accept',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invitation is no longer valid' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Get current user's email
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId! }
    });

    if (currentUser?.email !== invitation.email) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    // Create team membership
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: req.userId!,
        teamId: invitation.teamId,
        role: invitation.role,
        status: 'ACCEPTED',
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        acceptedAt: new Date()
      }
    });

    // Update invitation to accepted
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' }
    });

    console.log(`✅ User ${req.userId} accepted invitation to team ${invitation.teamId}`);

    res.json({
      teamMember: {
        teamId: teamMember.teamId,
        role: teamMember.role,
        status: teamMember.status,
        acceptedAt: teamMember.acceptedAt?.toISOString()
      }
    });
  })
);

// Change a team member's role (team leaders/managers)
router.patch(
  '/:teamId/members/:userId',
  apiLimiter,
  authenticate,
  validate(updateMemberRoleSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;
    const { role } = req.body as z.infer<typeof updateMemberRoleSchema>;

    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId,
        },
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can update member roles' });
    }

    // Prevent changing manager role
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (teamMember.role === 'MANAGER') {
      return res.status(400).json({ message: 'Cannot change manager role' });
    }

    if (teamMember.userId === req.userId!) {
      return res.status(400).json({ message: 'Cannot change your own role from this endpoint' });
    }

    const updated = await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      },
      data: { role }
    });

    console.log(`✅ User ${userId} role updated to ${role} in team ${teamId}`);

    res.json({
      userId: updated.userId,
      role: updated.role,
      updatedAt: updated.updatedAt.toISOString()
    });
  })
);

// Update member profile details (name/email) for team leaders.
router.patch(
  '/:teamId/members/:userId/profile',
  apiLimiter,
  authenticate,
  validate(updateMemberProfileSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;
    const { name, email } = req.body as z.infer<typeof updateMemberProfileSchema>;

    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId,
        },
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can update member details' });
    }

    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!targetMembership) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    const data: { name?: string; email?: string } = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      data.email = email.toLowerCase().trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile changes provided' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    res.json({
      member: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  })
);

// Reset member credentials and return a one-time temporary password.
router.post(
  '/:teamId/members/:userId/credentials/reset',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;

    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId,
        },
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can reset member credentials' });
    }

    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!targetMembership) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (targetMembership.role !== 'MEMBER') {
      return res.status(400).json({ message: 'Only MEMBER credentials can be reset from this endpoint' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        isActive: true,
      },
      select: {
        email: true,
        name: true,
      },
    });

    // SECURITY: Same password-in-response concern as the invite endpoint.
    // In production, communicate the new password out-of-band (email/SMS).
    res.json({
      credentials: {
        email: updatedUser.email,
        temporaryPassword,
      },
      member: {
        userId,
        name: updatedUser.name,
      },
      message: 'Credentials reset. Share the temporary password securely.',
    });
  })
);

// Remove a member from a team (MANAGER can remove, LEAD can only remove MEMBERS)
router.delete(
  '/:teamId/members/:userId',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;

    // Check if requester is member of this team - always verify from DB instead of JWT
    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId!,
          teamId
        }
      }
    });

    if (!requesterMembership) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    // Only MANAGER and LEAD can remove members, MEMBER cannot
    if (requesterMembership.role === 'MEMBER') {
      return res.status(403).json({ message: 'Only managers and team leads can remove members' });
    }

    // Prevent removing the last manager
    if (requesterMembership.role === 'LEAD') {
      // LEAD can only remove MEMBER role users
      const targetMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: { userId, teamId }
        }
      });

      if (targetMembership?.role !== 'MEMBER') {
        return res.status(403).json({ message: 'LEAD can only remove MEMBER role users' });
      }
    }

    const deleted = await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    console.log(`✅ User ${userId} removed from team ${teamId}`);

    res.json({ message: 'Member removed successfully' });
  })
);

// Delete a team created by the current user or a team leader/manager with access.
router.delete('/:teamId', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.params;

  const requesterMembership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: req.userId!,
        teamId,
      },
    },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, managerId: true },
  });

  if (!team || !requesterMembership) {
    return res.status(404).json({ message: 'Team not found' });
  }

  const canDeleteTeam =
    team.managerId === req.userId ||
    requesterMembership.role === 'MANAGER' ||
    requesterMembership.role === 'LEAD';

  if (!canDeleteTeam) {
    return res.status(403).json({ message: 'Only team owners or leaders can delete a team' });
  }

  await prisma.team.delete({
    where: { id: teamId },
  });

  console.log(`✅ Team deleted: ${teamId} by ${req.userId}`);

  res.json({ message: 'Team deleted successfully' });
}));

export default router;
