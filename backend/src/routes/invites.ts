import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireOrgAccess, requireOrgRole } from '../middleware/authorizeOrg';
import { apiLimiter } from '../lib/rateLimiters';
import { validate } from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import { normalizeEmail, emailQueryFilter } from '../lib/email';
import { hashPassword } from '../lib/password';
import { createLogger } from '../lib/logger';
import InviteToken from '../models/InviteToken';
import User from '../models/User';
import Organization from '../models/Organization';
import Project from '../models/Project';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import { Types } from 'mongoose';

const log = createLogger('meetiva:invites');

const router = Router();

// ── Validation schemas ─────────────────────────────────────────────────────

const createProjectInviteSchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid projectId'),
  email: z.string().email().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

const createTeamInviteSchema = z.object({
  teamId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid teamId'),
  role: z.enum(['team_leader', 'member']),
  email: z.string().email().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

const acceptInviteSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(2).max(50),
});

// ── Helper: generate invite token ──────────────────────────────────────────

const generateInviteToken = (): string =>
  crypto.randomBytes(32).toString('hex');

// ── Admin/Manager: create project invite ────────────────────────────────────

router.post(
  '/project',
  apiLimiter,
  authenticate,
  validate(createProjectInviteSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { projectId, email, expiresInDays } = req.body as z.infer<typeof createProjectInviteSchema>;
    const userId = req.userId!;

    const user = await User.findById(userId)
      .select('orgRole organizationId')
      .lean();

    if (!user?.orgRole || !['super_admin', 'admin', 'manager'].includes(user.orgRole)) {
      return res.status(403).json({ message: 'Only admins and managers can create project invites' });
    }

    // Verify the project exists and belongs to the user's org (or user is super_admin)
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (user.orgRole !== 'super_admin' && project.organizationId.toString() !== user.organizationId?.toString()) {
      return res.status(403).json({ message: 'Access denied: different organization' });
    }

    // Managers can only invite for their own projects
    if (user.orgRole === 'manager' && project.managerUserId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only create invites for your own projects' });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await InviteToken.create({
      token,
      type: 'project_manager',
      organizationId: project.organizationId,
      projectId: project._id,
      role: 'manager',
      invitedBy: new Types.ObjectId(userId),
      email: email ? normalizeEmail(email) : null,
      expiresAt,
    });

    log.info('Project invite created', { projectId, invitedBy: userId, token: token.slice(0, 8) + '...' });

    const frontendUrl = process.env.FRONTEND_APP_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/${invite.token}`;

    res.status(201).json({
      token: invite.token,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
      type: 'project_manager',
      role: 'manager',
    });
  })
);

// ── Manager/Team Leader: create team invite ────────────────────────────────

router.post(
  '/team',
  apiLimiter,
  authenticate,
  validate(createTeamInviteSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, role, email, expiresInDays } = req.body as z.infer<typeof createTeamInviteSchema>;
    const userId = req.userId!;

    const user = await User.findById(userId)
      .select('orgRole organizationId')
      .lean();

    if (!user?.orgRole || !['super_admin', 'admin', 'manager', 'team_leader'].includes(user.orgRole)) {
      return res.status(403).json({ message: 'Insufficient permissions to create team invites' });
    }

    // Verify the team exists
    const team = await Team.findById(teamId).lean();
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify the team belongs to the user's org (or user is super_admin)
    if (user.orgRole !== 'super_admin' && user.organizationId) {
      if (team.projectId) {
        const project = await Project.findById(team.projectId).lean();
        if (project && project.organizationId.toString() !== user.organizationId.toString()) {
          return res.status(403).json({ message: 'Access denied: team is in a different organization' });
        }
      }
    }

    // Role hierarchy check
    const canInviteAs: Record<string, string[]> = {
      super_admin: ['team_leader', 'member'],
      admin: ['team_leader', 'member'],
      manager: ['team_leader', 'member'],
      team_leader: ['member'],
    };

    if (!canInviteAs[user.orgRole]?.includes(role)) {
      return res.status(403).json({ message: `A ${user.orgRole} cannot invite as ${role}` });
    }

    // Team leaders can only invite to their own teams
    if (user.orgRole === 'team_leader') {
      const membership = await TeamMember.findOne({
        userId: new Types.ObjectId(userId),
        teamId: new Types.ObjectId(teamId),
        role: 'LEAD',
        status: 'ACCEPTED',
      }).lean();

      if (!membership) {
        return res.status(403).json({ message: 'You are not a leader of this team' });
      }
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const inviteType = role === 'team_leader' ? 'team_leader' : 'team_member';

    const invite = await InviteToken.create({
      token,
      type: inviteType,
      organizationId: team.projectId ? (await Project.findById(team.projectId).lean())?.organizationId! : user.organizationId!,
      teamId: team._id,
      role,
      invitedBy: new Types.ObjectId(userId),
      email: email ? normalizeEmail(email) : null,
      expiresAt,
    });

    log.info('Team invite created', { teamId, role, invitedBy: userId, token: token.slice(0, 8) + '...' });

    const frontendUrl = process.env.FRONTEND_APP_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/${invite.token}`;

    res.status(201).json({
      token: invite.token,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
      type: inviteType,
      role,
    });
  })
);

// ── Validate invite token (public) ─────────────────────────────────────────

router.get(
  '/:token',
  apiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const invite = await InviteToken.findOne({ token })
      .populate('organizationId', 'name slug')
      .populate('projectId', 'name')
      .populate('teamId', 'name')
      .populate('invitedBy', 'name email')
      .lean();

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite link' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite link has expired' });
    }

    if (invite.usedBy) {
      return res.status(410).json({ message: 'This invite link has already been used' });
    }

    // Check email restriction
    const recipientEmail = req.query.email as string | undefined;
    if (invite.email && recipientEmail && invite.email !== normalizeEmail(recipientEmail)) {
      return res.status(403).json({ message: 'This invite is intended for a different email address' });
    }

    const org = invite.organizationId as any;
    const project = invite.projectId as any;
    const team = invite.teamId as any;
    const inviter = invite.invitedBy as any;

    res.json({
      type: invite.type,
      role: invite.role,
      organization: org ? { name: org.name, slug: org.slug } : null,
      project: project ? { name: project.name } : null,
      team: team ? { name: team.name } : null,
      inviter: inviter ? { name: inviter.name } : null,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
    });
  })
);

// ── Accept invite (logged-in user) ─────────────────────────────────────────

router.post(
  '/:token/accept',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.params;
    const userId = req.userId!;

    const invite = await InviteToken.findOne({ token }).lean();
    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite link' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite link has expired' });
    }

    if (invite.usedBy) {
      return res.status(410).json({ message: 'This invite link has already been used' });
    }

    // Check email restriction
    if (invite.email) {
      const currentUser = await User.findById(userId).select('email').lean();
      if (!currentUser || normalizeEmail(currentUser.email) !== invite.email) {
        return res.status(403).json({ message: 'This invite is intended for a different email address' });
      }
    }

    // Check seat limit
    const org = await Organization.findById(invite.organizationId).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (org.seatsUsed >= org.seatLimit) {
      return res.status(403).json({
        message: `Organization has reached its ${org.seatLimit} seat limit.`,
        code: 'SEAT_LIMIT_REACHED',
      });
    }

    // Check if user already belongs to this org
    const existingUser = await User.findById(userId)
      .select('organizationId orgRole hasEnterpriseProfile')
      .lean();

    if (existingUser?.organizationId?.toString() === invite.organizationId.toString()) {
      return res.status(400).json({ message: 'You are already a member of this organization' });
    }

    // Update the user: set enterprise profile fields
    await User.findByIdAndUpdate(userId, {
      organizationId: invite.organizationId,
      orgRole: invite.role,
      accountType: 'corporate',
      hasEnterpriseProfile: true,
      activeProfile: 'corporate',
      subscriptionTier: 'ENTERPRISE',
    });

    // If the invite has a teamId, add the user to the team
    if (invite.teamId) {
      const existingMember = await TeamMember.findOne({
        userId: new Types.ObjectId(userId),
        teamId: invite.teamId,
      }).lean();

      if (!existingMember) {
        await TeamMember.create({
          userId: new Types.ObjectId(userId),
          teamId: invite.teamId,
          role: invite.role === 'team_leader' ? 'LEAD' : 'MEMBER',
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        });
      }
    }

    // Mark invite as used
    await InviteToken.findByIdAndUpdate(invite._id, {
      usedBy: new Types.ObjectId(userId),
      usedAt: new Date(),
    });

    // Increment seats
    await Organization.findByIdAndUpdate(invite.organizationId, { $inc: { seatsUsed: 1 } });

    log.info('Invite accepted', { inviteType: invite.type, role: invite.role, userId, orgId: String(invite.organizationId) });

    res.json({
      message: 'Invite accepted successfully',
      organization: org.name,
      role: invite.role,
    });
  })
);

// ── Register and accept invite (new user) ──────────────────────────────────

router.post(
  '/:token/register',
  apiLimiter,
  validate(acceptInviteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password, name } = req.body as z.infer<typeof acceptInviteSchema>;

    const invite = await InviteToken.findOne({ token }).lean();
    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite link' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite link has expired' });
    }

    if (invite.usedBy) {
      return res.status(410).json({ message: 'This invite link has already been used' });
    }

    // Check seat limit
    const org = await Organization.findById(invite.organizationId).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (org.seatsUsed >= org.seatLimit) {
      return res.status(403).json({
        message: `Organization has reached its ${org.seatLimit} seat limit.`,
        code: 'SEAT_LIMIT_REACHED',
      });
    }

    // Use email from invite if restricted, otherwise require it
    const email = invite.email || (req.body as any).email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await User.findOne(emailQueryFilter(email)).lean();
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in and accept the invite.' });
    }

    // Create the user with enterprise profile
    const { salt, hashedPassword } = await hashPassword(password);

    const user = await User.create({
      email: normalizedEmail,
      name,
      hashedPassword,
      passwordSalt: salt,
      accountType: 'corporate',
      orgRole: invite.role,
      organizationId: invite.organizationId,
      hasEnterpriseProfile: true,
      activeProfile: 'corporate',
      subscriptionTier: 'ENTERPRISE',
      isVerified: true, // Invite-based registration skips email verification
      isActive: true,
    });

    // If the invite has a teamId, add the user to the team
    if (invite.teamId) {
      await TeamMember.create({
        userId: user._id,
        teamId: invite.teamId,
        role: invite.role === 'team_leader' ? 'LEAD' : 'MEMBER',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      });
    }

    // Mark invite as used
    await InviteToken.findByIdAndUpdate(invite._id, {
      usedBy: user._id,
      usedAt: new Date(),
    });

    // Increment seats
    await Organization.findByIdAndUpdate(invite.organizationId, { $inc: { seatsUsed: 1 } });

    log.info('User registered via invite', { inviteType: invite.type, role: invite.role, userId: String(user._id), orgId: String(invite.organizationId) });

    res.status(201).json({
      message: 'Account created and invite accepted',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  })
);

// ── List invites for a project (admin/manager only) ────────────────────────

router.get(
  '/project/:projectId',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId!;

    const user = await User.findById(userId)
      .select('orgRole organizationId')
      .lean();

    if (!user?.orgRole || !['super_admin', 'admin', 'manager'].includes(user.orgRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const invites = await InviteToken.find({
      projectId: new Types.ObjectId(projectId),
      usedBy: null,
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      invites: invites.map(i => ({
        id: i._id.toString(),
        type: i.type,
        role: i.role,
        email: i.email,
        inviteLink: `${process.env.FRONTEND_APP_URL || 'http://localhost:5173'}/invite/${i.token}`,
        expiresAt: i.expiresAt.toISOString(),
        invitedBy: (i.invitedBy as any)?.name || 'Unknown',
        createdAt: i.createdAt.toISOString(),
      })),
    });
  })
);

export default router;
