import { Router, Response } from 'express';
import crypto from 'crypto';
import { hashPassword } from '../lib/password';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { apiLimiter } from '../lib/rateLimiters';
import { createLogger } from '../lib/logger';
import {
  validate,
  validateObjectIdParam,
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateMemberProfileSchema,
  chatMessageSchema,
} from '../lib/validation';
import type { NotificationType } from '../lib/shared';
import { asyncHandler } from '../lib/errors';
import { requireSubscription } from '../lib/subscription';
import User from '../models/User';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import TeamInvitation from '../models/TeamInvitation';
import TeamChatMessage from '../models/TeamChatMessage';
import Notification from '../models/Notification';
import { Types } from 'mongoose';

const log = createLogger('meetiva:teams');

const router = Router();

// Validate all route params as MongoDB ObjectId
router.param('teamId', validateObjectIdParam('teamId'));
router.param('userId', validateObjectIdParam('userId'));
router.param('invitationId', validateObjectIdParam('invitationId'));

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

const generateInviteCode = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

const getAcceptedMembership = async (teamId: string, userId: string) => {
  return TeamMember.findOne({
    userId: new Types.ObjectId(userId),
    teamId: new Types.ObjectId(teamId),
  }).lean();
};

// Create a new team — requires an active subscription
router.post(
  '/',
  apiLimiter,
  authenticate,
  validate(createTeamSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Only subscribed users can create teams
    await requireSubscription(req.userId!);

    const existingMemberships = await TeamMember.find({
      userId: new Types.ObjectId(req.userId!),
      status: 'ACCEPTED',
    })
      .select('role')
      .lean();

    const canCreateTeam =
      existingMemberships.length === 0 ||
      existingMemberships.some((membership) => membership.role === 'LEAD' || membership.role === 'MANAGER');

    if (!canCreateTeam) {
      return res.status(403).json({
        message: 'Only team leaders can create teams',
      });
    }

    const { name, description } = req.body as z.infer<typeof createTeamSchema>;

    // Generate a unique 128-bit cryptographically random invite code
    let inviteCode: string;
    let codeExists = true;
    do {
      inviteCode = generateInviteCode();
      codeExists = !!(await Team.findOne({ inviteCode }).lean());
    } while (codeExists);

    // Create the team
    const team = await Team.create({
      name,
      description: description || null,
      inviteCode,
    });

    // Add the creator as LEAD with ACCEPTED status
    const teamMember = await TeamMember.create({
      userId: new Types.ObjectId(req.userId!),
      teamId: team._id,
      role: 'LEAD',
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });

    log.info('Team created', { teamId: String(team._id), userId: req.userId });

    res.status(201).json({
      team: {
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
      membership: {
        role: teamMember.role,
        status: teamMember.status,
        acceptedAt: teamMember.acceptedAt?.toISOString(),
      },
    });
  })
);

// Get all teams for current user
router.get('/', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const teamMembers = await TeamMember.find({ userId: new Types.ObjectId(req.userId!) })
    .populate('teamId')
    .lean() as any[];

  const teams = teamMembers.map(tm => ({
    id: (tm.teamId as any)._id?.toString() || tm.teamId.toString(),
    name: (tm.teamId as any).name || '',
    description: (tm.teamId as any).description || null,
    inviteCode: (tm.teamId as any).inviteCode || '',
    role: tm.role,
    status: tm.status,
    joinedAt: tm.acceptedAt?.toISOString() || tm.createdAt.toISOString(),
    createdAt: (tm.teamId as any).createdAt?.toISOString?.(),
    updatedAt: (tm.teamId as any).updatedAt?.toISOString?.(),
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

  const memberships = await TeamMember.find({
    userId: new Types.ObjectId(req.userId!),
    status: 'ACCEPTED',
  })
    .populate('teamId', 'name')
    .lean() as any[];

  const teamIds = memberships.map((membership) => (membership.teamId as any)._id || membership.teamId);
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
    TeamChatMessage.find({
      teamId: { $in: teamIds },
      createdAt: { $gte: sinceDate },
    })
      .select('teamId userId createdAt')
      .sort({ createdAt: 1 })
      .limit(10000)
      .lean(),
    TeamChatMessage.countDocuments({
      teamId: { $in: teamIds },
      createdAt: { $gte: lastWeekDate },
    }),
    TeamChatMessage.countDocuments({
      teamId: { $in: teamIds },
    }),
  ]);

  const dailyMap = new Map<string, number>();
  const teamMap = new Map<string, { messageCount: number; lastMessageAt: Date | null; participants: Set<string> }>();

  for (const membership of memberships) {
    const teamIdStr = (membership.teamId as any)._id?.toString() || membership.teamId.toString();
    teamMap.set(teamIdStr, {
      messageCount: 0,
      lastMessageAt: null,
      participants: new Set<string>(),
    });
  }

  rangeMessages.forEach((message) => {
    const day = message.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);

    const teamIdStr = message.teamId.toString();
    const teamStats = teamMap.get(teamIdStr);
    if (teamStats) {
      teamStats.messageCount += 1;
      teamStats.participants.add(message.userId.toString());
      if (!teamStats.lastMessageAt || message.createdAt > teamStats.lastMessageAt) {
        teamStats.lastMessageAt = message.createdAt;
      }
    }
  });

  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const teamStats = memberships.map((membership) => {
    const teamIdStr = (membership.teamId as any)._id?.toString() || membership.teamId.toString();
    const stats = teamMap.get(teamIdStr);
    return {
      teamId: teamIdStr,
      teamName: (membership.teamId as any).name || 'Unknown',
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

  const team = await Team.findById(teamId).lean();

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  res.json({
    id: team._id.toString(),
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

  const messages = await TeamChatMessage.find({
    teamId: new Types.ObjectId(teamId),
    ...(beforeDate ? { createdAt: { $lt: beforeDate } } : {}),
  })
    .select('teamId userId message createdAt updatedAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (messages.length === 0) {
    return res.json({ messages: [] });
  }

  const userIds = Array.from(new Set(messages.map((message) => message.userId.toString())));
  const users = await User.find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
    .select('name email')
    .lean();

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  const orderedMessages = messages
    .reverse()
    .map((message) => ({
      id: message._id.toString(),
      teamId: message.teamId.toString(),
      userId: message.userId.toString(),
      userName: userMap.get(message.userId.toString())?.name || 'Unknown member',
      userEmail: userMap.get(message.userId.toString())?.email || '',
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

    const created = await TeamChatMessage.create({
      teamId: new Types.ObjectId(teamId),
      userId: new Types.ObjectId(req.userId!),
      message: req.body.message,
    });

    const user = await User.findById(req.userId!)
      .select('name email')
      .lean();

    res.status(201).json({
      message: {
        id: created._id.toString(),
        teamId: created.teamId.toString(),
        userId: created.userId.toString(),
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
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
    const userMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!userMembership) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    // Get all members
    const allMembers = await TeamMember.find({ teamId: new Types.ObjectId(teamId) })
      .populate('userId', 'name email')
      .lean() as any[];

    const members = allMembers.map(tm => ({
      userId: tm.userId._id?.toString() || tm.userId.toString(),
      name: tm.userId.name || '',
      email: tm.userId.email || '',
      role: tm.role,
      status: tm.status,
      joinedAt: tm.acceptedAt?.toISOString() || tm.createdAt.toISOString(),
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
    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }

    // Only team leaders can invite members in invite-only mode.
    if (requesterMembership.role !== 'LEAD') {
      return res.status(403).json({ message: 'Only a team leader can invite members' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail }).lean();

    let temporaryPassword: string | null = null;

    if (!user) {
      temporaryPassword = generateTemporaryPassword();
      const { salt, hashedPassword } = await hashPassword(temporaryPassword);
      user = await User.create({
        email: normalizedEmail,
        name: buildDefaultNameFromEmail(normalizedEmail),
        hashedPassword,
        passwordSalt: salt,
      });
    }

    // If user exists and is already a member, error
    if (user) {
      const existingMembership = await TeamMember.findOne({
        userId: user._id,
        teamId: new Types.ObjectId(teamId),
      }).lean();

      if (existingMembership) {
        return res.status(400).json({ message: 'User is already a member of this team' });
      }
    }

    // Create a PENDING team invitation instead of auto-adding
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Remove any existing pending invitations for this email + team
    await TeamInvitation.deleteMany({
      teamId: new Types.ObjectId(teamId),
      email: normalizedEmail,
      status: 'PENDING',
    });

    const invitation = await TeamInvitation.create({
      email: normalizedEmail,
      teamId: new Types.ObjectId(teamId),
      role: 'MEMBER',
      invitedBy: new Types.ObjectId(req.userId!),
      status: 'PENDING',
      expiresAt,
    });

    log.info('LEAD invited member', { userId: req.userId, email: normalizedEmail, teamId });

    res.status(201).json({
      invitation: {
        id: invitation._id.toString(),
        email: normalizedEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      message: temporaryPassword
        ? 'Account created. User can sign in and accept the invitation (subscription required).'
        : `Invitation sent to ${normalizedEmail}. They must accept and be approved by a team lead.`,
      ...(temporaryPassword
        ? {
            temporaryCredentials: {
              email: normalizedEmail,
              temporaryPassword,
            },
          }
        : {}),
    });
  })
);

// Get pending invitations for current user
router.get('/pending/invitations', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = await User.findById(req.userId!).lean();

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const invitations = await TeamInvitation.find({
    email: currentUser.email,
    status: 'PENDING',
    expiresAt: { $gt: new Date() },
  })
    .populate('teamId', 'name')
    .populate('invitedBy', 'name email')
    .lean() as any[];

  const formattedInvitations = invitations.map(inv => ({
    id: inv._id.toString(),
    teamId: (inv.teamId as any)._id?.toString() || inv.teamId.toString(),
    teamName: (inv.teamId as any).name || '',
    role: inv.role,
    invitedBy: (inv.invitedBy as any).name || '',
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
  }));

  res.json({ invitations: formattedInvitations });
}));

// Accept an invitation — requires an active subscription
// After user accepts, membership is created in PENDING status awaiting LEAD approval.
router.post(
  '/invitations/:invitationId/accept',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;

    const invitation = await TeamInvitation.findById(invitationId).lean();

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
    const currentUser = await User.findById(req.userId!).lean();

    if (!currentUser || currentUser.email !== invitation.email) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    // Require active subscription to accept team invitations
    await requireSubscription(req.userId!);

    // Create team membership in PENDING status (awaiting LEAD approval)
    const teamMember = await TeamMember.create({
      userId: new Types.ObjectId(req.userId!),
      teamId: invitation.teamId,
      role: invitation.role,
      status: 'PENDING',
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
    });

    // Update invitation to reflect acceptance
    await TeamInvitation.findByIdAndUpdate(invitationId, { $set: { status: 'ACCEPTED' } });

    log.info('User accepted invitation', { userId: req.userId, teamId: String(invitation.teamId) });

    // Notify the LEAD about the pending approval
    const leadMembers = await TeamMember.find({
      teamId: invitation.teamId,
      role: 'LEAD',
      status: 'ACCEPTED',
    })
      .select('userId')
      .lean();

    if (leadMembers.length > 0) {
      await Notification.insertMany(
        leadMembers.map((lead) => ({
          userId: lead.userId,
          type: 'SYSTEM' as const satisfies NotificationType,
          title: 'Pending member approval',
          message: `${currentUser.name} (${currentUser.email}) accepted their invitation to join your team and is awaiting your approval.`,
        }))
      );
    }

    res.json({
      teamMember: {
        teamId: teamMember.teamId.toString(),
        role: teamMember.role,
        status: 'PENDING',
        message: 'Your request has been sent to the team lead for approval.',
      },
    });
  })
);

// LEAD approves a pending member — membership becomes ACCEPTED
router.post(
  '/:teamId/members/:userId/approve',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;

    // Check requester is a LEAD of this team
    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || requesterMembership.role !== 'LEAD') {
      return res.status(403).json({ message: 'Only team leads can approve members' });
    }

    // Find the pending membership
    const pendingMember = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!pendingMember || pendingMember.status !== 'PENDING') {
      return res.status(404).json({ message: 'Pending membership not found' });
    }

    // Approve the member
    const updated = await TeamMember.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), teamId: new Types.ObjectId(teamId) },
      { $set: { status: 'ACCEPTED', acceptedAt: new Date() } },
      { returnDocument: 'after' }
    ).lean();

    // Notify the approved user
    const team = await Team.findById(teamId).select('name').lean();

    await Notification.create({
      userId: new Types.ObjectId(userId),
      type: 'SYSTEM' as const,
      title: 'Team membership approved',
      message: `You have been approved as a member of ${team?.name || 'the team'}.`,
    });

    log.info('LEAD approved user', { userId: req.userId, approvedUserId: userId, teamId });

    res.json({
      member: {
        userId: updated?.userId.toString(),
        role: updated?.role,
        status: updated?.status,
        acceptedAt: updated?.acceptedAt?.toISOString(),
      },
    });
  })
);

// LEAD rejects a pending member — membership is deleted
router.post(
  '/:teamId/members/:userId/reject',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, userId } = req.params;

    // Check requester is a LEAD of this team
    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || requesterMembership.role !== 'LEAD') {
      return res.status(403).json({ message: 'Only team leads can reject members' });
    }

    // Find the pending membership
    const pendingMember = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!pendingMember || pendingMember.status !== 'PENDING') {
      return res.status(404).json({ message: 'Pending membership not found' });
    }

    // Delete the pending membership (reject)
    await TeamMember.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    });

    // Notify the rejected user
    const team = await Team.findById(teamId).select('name').lean();

    await Notification.create({
      userId: new Types.ObjectId(userId),
      type: 'SYSTEM' as const,
      title: 'Team membership declined',
      message: `Your request to join ${team?.name || 'the team'} was declined by the team lead.`,
    });

    log.info('LEAD rejected user', { userId: req.userId, rejectedUserId: userId, teamId });

    res.json({ message: 'Member rejected' });
  })
);

// Get pending members for a team (LEAD-only)
router.get(
  '/:teamId/pending-members',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;

    // Check requester is a LEAD of this team
    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || requesterMembership.role !== 'LEAD') {
      return res.status(403).json({ message: 'Only team leads can view pending members' });
    }

    const pendingMembers = await TeamMember.find({
      teamId: new Types.ObjectId(teamId),
      status: 'PENDING',
    })
      .populate('userId', 'name email')
      .lean() as any[];

    res.json({
      pendingMembers: pendingMembers.map((pm) => ({
        userId: pm.userId._id?.toString() || pm.userId.toString(),
        name: pm.userId.name || '',
        email: pm.userId.email || '',
        role: pm.role,
        invitedAt: pm.invitedAt?.toISOString(),
      })),
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

    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can update member roles' });
    }

    // Prevent changing manager role
    const teamMember = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (teamMember.role === 'MANAGER') {
      return res.status(400).json({ message: 'Cannot change manager role' });
    }

    if (teamMember.userId.toString() === req.userId!) {
      return res.status(400).json({ message: 'Cannot change your own role from this endpoint' });
    }

    const updated = await TeamMember.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), teamId: new Types.ObjectId(teamId) },
      { $set: { role } },
      { returnDocument: 'after' }
    ).lean();

    log.info('User role updated', { userId, role, teamId });

    res.json({
      userId: updated?.userId.toString(),
      role: updated?.role,
      updatedAt: updated?.updatedAt.toISOString(),
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

    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can update member details' });
    }

    const targetMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!targetMembership) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    const data: Record<string, string> = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      data.email = email.toLowerCase().trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile changes provided' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: data }, { returnDocument: 'after' })
      .select('name email updatedAt')
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      member: {
        userId: updatedUser._id.toString(),
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

    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!requesterMembership || (requesterMembership.role !== 'LEAD' && requesterMembership.role !== 'MANAGER')) {
      return res.status(403).json({ message: 'Only team leaders can reset member credentials' });
    }

    const targetMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    }).lean();

    if (!targetMembership) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (targetMembership.role !== 'MEMBER') {
      return res.status(400).json({ message: 'Only MEMBER credentials can be reset from this endpoint' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const { salt, hashedPassword } = await hashPassword(temporaryPassword);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { hashedPassword, passwordSalt: salt, isActive: true } },
      { returnDocument: 'after' }
    )
      .select('email name')
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    const requesterMembership = await TeamMember.findOne({
      userId: new Types.ObjectId(req.userId!),
      teamId: new Types.ObjectId(teamId),
    }).lean();

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
      const targetMembership = await TeamMember.findOne({
        userId: new Types.ObjectId(userId),
        teamId: new Types.ObjectId(teamId),
      }).lean();

      if (targetMembership?.role !== 'MEMBER') {
        return res.status(403).json({ message: 'LEAD can only remove MEMBER role users' });
      }
    }

    await TeamMember.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    });

    log.info('User removed from team', { userId, teamId });

    res.json({ message: 'Member removed successfully' });
  })
);

// Delete a team created by the current user or a team leader/manager with access.
router.delete('/:teamId', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId } = req.params;

  const requesterMembership = await TeamMember.findOne({
    userId: new Types.ObjectId(req.userId!),
    teamId: new Types.ObjectId(teamId),
  }).lean();

  const team = await Team.findById(teamId).select('projectId').lean();

  if (!team || !requesterMembership) {
    return res.status(404).json({ message: 'Team not found' });
  }

  const canDeleteTeam =
    requesterMembership.role === 'MANAGER' ||
    requesterMembership.role === 'LEAD';

  if (!canDeleteTeam) {
    return res.status(403).json({ message: 'Only team owners or leaders can delete a team' });
  }

  await Team.findByIdAndDelete(teamId);

  log.info('Team deleted', { teamId, userId: req.userId });

  res.json({ message: 'Team deleted successfully' });
}));

export default router;
