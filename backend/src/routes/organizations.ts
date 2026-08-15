import { Router, Request, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireOrgRole, requireSuperAdmin, requireOrgAccess } from '../middleware/authorizeOrg';
import { apiLimiter } from '../lib/rateLimiters';
import { validate } from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import { hashPassword } from '../lib/password';
import { normalizeEmail, emailQueryFilter } from '../lib/email';
import { createLogger } from '../lib/logger';
import Organization from '../models/Organization';
import User from '../models/User';
import Project from '../models/Project';
import TeamMember from '../models/TeamMember';
import Team from '../models/Team';
import Meeting from '../models/Meeting';
import ActionItem from '../models/ActionItem';
import { removeUser, getDisposedContent } from '../services/userRemoval';
import { Types } from 'mongoose';

const log = createLogger('meetiva:organizations');

const router = Router();

// ── Validation schemas ─────────────────────────────────────────────────────

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

const provisionUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(50),
  role: z.enum(['admin', 'manager', 'team_leader', 'member']),
});

const assignManagerSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid userId'),
});

// ── Helper: generate temp password ─────────────────────────────────────────

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%';
  let pw = '';
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += specials[Math.floor(Math.random() * specials.length)];
  pw += Math.floor(Math.random() * 90 + 10).toString();
  // Shuffle
  return pw.split('').sort(() => Math.random() - 0.5).join('');
};

// ── Helper: slugify ────────────────────────────────────────────────────────

const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Organization CRUD ──────────────────────────────────────────────────────

// Public: Enterprise request (no auth required)
const enterpriseRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  contactEmail: z.string().email(),
});

router.post(
  '/request',
  apiLimiter,
  validate(enterpriseRequestSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, contactEmail } = req.body as z.infer<typeof enterpriseRequestSchema>;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug }).lean()) {
      slug = `${baseSlug}-${counter++}`;
    }

    const org = await Organization.create({
      name,
      slug,
      contactEmail,
      status: 'pending',
    });

    log.info('Enterprise request submitted', { orgId: String(org._id), contactEmail });

    res.status(201).json({
      message: 'Request submitted. Our team will review and contact you with Admin credentials.',
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        status: org.status,
      },
    });
  })
);

// Create organization (any authenticated user can request; goes to pending status)
router.post(
  '/',
  apiLimiter,
  authenticate,
  validate(createOrganizationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug } = req.body as z.infer<typeof createOrganizationSchema>;

    const existing = await Organization.findOne({ slug }).lean();
    if (existing) {
      return res.status(409).json({ message: 'Organization slug already taken' });
    }

    const org = await Organization.create({
      name,
      slug,
      adminUserId: new Types.ObjectId(req.userId!),
      status: 'pending',
    });

    log.info('Organization created (pending)', { orgId: String(org._id), userId: req.userId });

    res.status(201).json({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      status: org.status,
      message: 'Organization request submitted. Our team will review and provision Admin credentials.',
    });
  })
);

// Get organization details (Admin of own org, or Super Admin)
router.get(
  '/:id',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const org = await Organization.findById(req.params.id).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      status: org.status,
      seatLimit: org.seatLimit,
      seatsUsed: org.seatsUsed,
      adminUserId: org.adminUserId.toString(),
      subscriptionExpiresAt: org.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    });
  })
);

// Update organization (Admin only)
router.patch(
  '/:id',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin'),
  validate(updateOrganizationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body as z.infer<typeof updateOrganizationSchema>;

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }) },
      { returnDocument: 'after' }
    ).lean();

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      status: org.status,
    });
  })
);

// List all users in organization (Admin/Manager)
router.get(
  '/:id/users',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin', 'manager'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await User.find({
      organizationId: new Types.ObjectId(req.params.id),
      isRemoved: false,
    })
      .select('email name orgRole isActive isVerified createdAt')
      .lean();

    res.json({
      users: users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        orgRole: u.orgRole,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  })
);

// Provision a new user in the organization
router.post(
  '/:id/users/provision',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  validate(provisionUserSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email: rawEmail, name, role } = req.body as z.infer<typeof provisionUserSchema>;
    const email = normalizeEmail(rawEmail);
    const orgId = req.params.id;
    const creatorOrgRole = req.userOrg!.orgRole;

    // Role hierarchy check: who can create whom
    const canCreate: Record<string, string[]> = {
      super_admin: ['admin', 'manager', 'team_leader', 'member'],
      admin: ['manager'],
      manager: ['team_leader'],
      team_leader: ['member'],
    };

    if (!canCreate[creatorOrgRole]?.includes(role)) {
      return res.status(403).json({
        message: `A ${creatorOrgRole} cannot create a ${role}`,
      });
    }

    // Check seat limit
    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (org.seatsUsed >= org.seatLimit) {
      return res.status(403).json({
        message: `Organization has reached its ${org.seatLimit} seat limit. Request more seats or remove existing users.`,
        code: 'SEAT_LIMIT_REACHED',
      });
    }

    // Check email not already taken
    const existing = await User.findOne(emailQueryFilter(rawEmail)).lean();
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create user
    const tempPassword = generateTempPassword();
    const { salt, hashedPassword } = await hashPassword(tempPassword);

    const user = await User.create({
      email,
      name,
      hashedPassword,
      passwordSalt: salt,
      accountType: 'corporate',
      orgRole: role,
      organizationId: new Types.ObjectId(orgId),
      createdByUserId: new Types.ObjectId(req.userId!),
      forcePasswordChange: true,
      isActive: true,
      isVerified: true,
    });

    // Increment seats
    await Organization.findByIdAndUpdate(orgId, { $inc: { seatsUsed: 1 } });

    log.info('User provisioned', { orgId, userId: String(user._id), role, createdBy: req.userId });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        orgRole: user.orgRole,
        tempPassword,
      },
      message: 'Share these credentials with the user. They will be forced to change their password on first login.',
    });
  })
);

// Get seat usage
router.get(
  '/:id/seats',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const org = await Organization.findById(req.params.id)
      .select('seatLimit seatsUsed name')
      .lean();

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      seatLimit: org.seatLimit,
      seatsUsed: org.seatsUsed,
      seatsAvailable: org.seatLimit - org.seatsUsed,
    });
  })
);

// Recount seats (admin safety valve)
router.post(
  '/:id/seats/recount',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.params.id;
    const actualCount = await User.countDocuments({
      organizationId: new Types.ObjectId(orgId),
      accountType: 'corporate',
      isRemoved: false,
    });

    const org = await Organization.findByIdAndUpdate(
      orgId,
      { seatsUsed: actualCount },
      { returnDocument: 'after' }
    ).lean();

    res.json({
      seatsUsed: org!.seatsUsed,
      seatLimit: org!.seatLimit,
      message: `Seat count reconciled to ${actualCount}`,
    });
  })
);

// Request more seats (stub)
router.post(
  '/:id/seats/request',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Seat increase request submitted. Our team will review and contact you.' });
  })
);

// ── Super Admin: list all organizations ─────────────────────────────────────

router.get(
  '/',
  apiLimiter,
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgs = await Organization.find()
      .select('name slug contactEmail status seatLimit seatsUsed adminUserId createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      organizations: orgs.map(o => ({
        id: o._id.toString(),
        name: o.name,
        slug: o.slug,
        contactEmail: o.contactEmail ?? null,
        status: o.status,
        seatLimit: o.seatLimit,
        seatsUsed: o.seatsUsed,
        adminUserId: o.adminUserId?.toString() ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  })
);

// ── Super Admin: activate/suspend org ───────────────────────────────────────

router.patch(
  '/:id/status',
  apiLimiter,
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body as { status?: string };
    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or suspended' });
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    ).lean();

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    log.info('Organization status changed', { orgId: String(org._id), status, by: req.userId });

    res.json({
      id: org._id.toString(),
      name: org.name,
      status: org.status,
    });
  })
);

// ── Super Admin: add/replace admin for any org ─────────────────────────────

const addAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(50),
});

router.post(
  '/:id/add-admin',
  apiLimiter,
  authenticate,
  requireSuperAdmin,
  validate(addAdminSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email: rawEmail, name } = req.body as z.infer<typeof addAdminSchema>;
    const email = normalizeEmail(rawEmail);
    const orgId = req.params.id;

    const org = await Organization.findById(orgId).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check email not already taken
    const existing = await User.findOne(emailQueryFilter(rawEmail)).lean();
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const tempPassword = generateTempPassword();
    const { salt, hashedPassword } = await hashPassword(tempPassword);

    // If org already has an admin, deactivate the old one's admin role
    if (org.adminUserId) {
      await User.findByIdAndUpdate(org.adminUserId, {
        orgRole: 'manager',
      });
      log.info('Previous admin demoted to manager', { orgId: orgId, prevAdminId: String(org.adminUserId) });
    }

    // Create new admin user
    const adminUser = await User.create({
      email,
      name,
      hashedPassword,
      passwordSalt: salt,
      accountType: 'corporate',
      orgRole: 'admin',
      organizationId: new Types.ObjectId(orgId),
      createdByUserId: new Types.ObjectId(req.userId!),
      forcePasswordChange: true,
      isActive: true,
      isVerified: true,
    });

    // Set as org admin and ensure org is active
    await Organization.findByIdAndUpdate(orgId, {
      adminUserId: adminUser._id,
      status: 'active',
    });

    // Increment seats if there's room
    await Organization.findByIdAndUpdate(orgId, { $inc: { seatsUsed: 1 } });

    log.info('Admin added to organization', { orgId, adminUserId: String(adminUser._id), by: req.userId });

    res.status(201).json({
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        name: adminUser.name,
        orgRole: adminUser.orgRole,
        isActive: adminUser.isActive,
        createdAt: adminUser.createdAt.toISOString(),
        tempPassword,
      },
      message: 'Admin account created. Share credentials securely. They will be forced to change their password on first login.',
    });
  })
);

// ── Super Admin: provision admin credentials for pending org ─────────────────

router.post(
  '/:id/provision-admin',
  apiLimiter,
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const org = await Organization.findById(req.params.id).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    if (org.status !== 'pending') {
      return res.status(400).json({ message: 'Organization is not in pending status' });
    }

    const { email: rawEmail, name } = req.body as { email?: string; name?: string };
    if (!rawEmail || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }
    const email = normalizeEmail(rawEmail);

    const existing = await User.findOne(emailQueryFilter(rawEmail)).lean();
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const tempPassword = generateTempPassword();
    const { salt, hashedPassword } = await hashPassword(tempPassword);

    const adminUser = await User.create({
      email,
      name,
      hashedPassword,
      passwordSalt: salt,
      accountType: 'corporate',
      orgRole: 'admin',
      organizationId: org._id,
      createdByUserId: new Types.ObjectId(req.userId!),
      forcePasswordChange: true,
      isActive: true,
      isVerified: true,
    });

    // Activate org and set admin
    await Organization.findByIdAndUpdate(org._id, {
      status: 'active',
      adminUserId: adminUser._id,
    });

    // Set the admin's enterprise profile flag
    await User.findByIdAndUpdate(adminUser._id, {
      hasEnterpriseProfile: true,
      activeProfile: 'corporate',
    });

    log.info('Admin provisioned for pending org', { orgId: String(org._id), adminUserId: String(adminUser._id) });

    res.status(201).json({
      admin: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        name: adminUser.name,
        tempPassword,
      },
      message: 'Admin credentials created. Share with the customer. Org is now active.',
    });
  })
);

// ── Remove user from organization (replacement-before-removal) ──────────────

const removeUserSchema = z.object({
  replacementUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid userId').optional(),
});

// Admin removes a manager
router.delete(
  '/:id/managers/:userId',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin'),
  validate(removeUserSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { replacementUserId } = req.body as z.infer<typeof removeUserSchema>;

    const user = await User.findOne({
      _id: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(req.params.id),
      orgRole: 'manager',
      isRemoved: false,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: 'Manager not found in this organization' });
    }

    // Replacement-before-removal: require a replacement
    if (!replacementUserId) {
      return res.status(400).json({
        message: 'A replacementUserId is required. Assign a replacement manager before removing.',
        code: 'REPLACEMENT_REQUIRED',
      });
    }

    // Verify replacement is a manager in the same org
    const replacement = await User.findOne({
      _id: new Types.ObjectId(replacementUserId),
      organizationId: new Types.ObjectId(req.params.id),
      orgRole: 'manager',
      isRemoved: false,
    }).lean();

    if (!replacement) {
      return res.status(404).json({ message: 'Replacement user not found or not a manager' });
    }

    // Reassign projects from old manager to replacement
    await Project.updateMany(
      { managerUserId: new Types.ObjectId(userId) },
      { managerUserId: new Types.ObjectId(replacementUserId) }
    );

    // Remove the old manager
    await removeUser(userId);

    log.info('Manager removed and projects reassigned', {
      orgId: req.params.id,
      removedUserId: userId,
      replacementUserId,
    });

    res.json({ message: 'Manager removed. Projects reassigned to replacement.' });
  })
);

// Admin/Manager removes a team leader
router.delete(
  '/:id/projects/:projectId/leaders/:userId',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin', 'manager'),
  validate(removeUserSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { replacementUserId } = req.body as z.infer<typeof removeUserSchema>;

    const user = await User.findOne({
      _id: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(req.params.id),
      orgRole: 'team_leader',
      isRemoved: false,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: 'Team leader not found in this organization' });
    }

    // Replacement-before-removal
    if (!replacementUserId) {
      return res.status(400).json({
        message: 'A replacementUserId is required. Assign a replacement team leader before removing.',
        code: 'REPLACEMENT_REQUIRED',
      });
    }

    // Verify replacement is in the same org
    const replacement = await User.findOne({
      _id: new Types.ObjectId(replacementUserId),
      organizationId: new Types.ObjectId(req.params.id),
      orgRole: { $in: ['team_leader', 'member'] },
      isRemoved: false,
    }).lean();

    if (!replacement) {
      return res.status(404).json({ message: 'Replacement user not found' });
    }

    // Reassign team leadership

    // Find teams where this user is LEAD
    const leaderships = await TeamMember.find({
      userId: new Types.ObjectId(userId),
      role: 'LEAD',
      status: 'ACCEPTED',
    }).lean();

    for (const leadership of leaderships) {
      // Remove old leader's LEAD role
      await TeamMember.deleteOne({ _id: leadership._id });

      // Add replacement as LEAD (or update existing membership)
      const existingMembership = await TeamMember.findOne({
        userId: new Types.ObjectId(replacementUserId),
        teamId: leadership.teamId,
      }).lean();

      if (existingMembership) {
        await TeamMember.findByIdAndUpdate(existingMembership._id, { role: 'LEAD' });
      } else {
        await TeamMember.create({
          userId: new Types.ObjectId(replacementUserId),
          teamId: leadership.teamId,
          role: 'LEAD',
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        });
      }
    }

    // Remove the old team leader
    await removeUser(userId);

    log.info('Team leader removed and teams reassigned', {
      orgId: req.params.id,
      removedUserId: userId,
      replacementUserId,
    });

    res.json({ message: 'Team leader removed. Teams reassigned to replacement.' });
  })
);

// ── Disposition: list content from removed user ─────────────────────────────

router.get(
  '/:id/disposition',
  apiLimiter,
  authenticate,
  requireOrgAccess((req) => req.params.id),
  requireOrgRole('admin', 'manager', 'team_leader'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const removedUserId = req.query.removedUserId as string;
    if (!removedUserId) {
      return res.status(400).json({ message: 'removedUserId query param required' });
    }

    const content = await getDisposedContent(removedUserId);

    res.json({
      meetings: content.meetings.map((m: any) => ({
        id: m._id.toString(),
        title: m.title,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      })),
      tasks: content.tasks.map((t: any) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  })
);

// ── Reassign meeting ownership ──────────────────────────────────────────────

router.patch(
  '/meetings/:meetingId/reassign',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newUserId } = req.body as { newUserId?: string };

    if (!newUserId) {
      return res.status(400).json({ message: 'newUserId is required' });
    }

    const meeting = await Meeting.findById(req.params.meetingId).lean();
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await Meeting.findByIdAndUpdate(req.params.meetingId, { userId: newUserId });

    res.json({ message: 'Meeting reassigned' });
  })
);

// ── Reassign task ownership ─────────────────────────────────────────────────

router.patch(
  '/action-items/:taskId/reassign',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newUserId } = req.body as { newUserId?: string };

    if (!newUserId) {
      return res.status(400).json({ message: 'newUserId is required' });
    }

    const task = await ActionItem.findById(req.params.taskId).lean();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await ActionItem.findByIdAndUpdate(req.params.taskId, { userId: newUserId });

    res.json({ message: 'Task reassigned' });
  })
);

export default router;
