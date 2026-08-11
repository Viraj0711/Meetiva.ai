import { Router, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireOrgRole, requireOrgAccess, canManageProject } from '../middleware/authorizeOrg';
import { apiLimiter } from '../lib/rateLimiters';
import { validate } from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import { createLogger } from '../lib/logger';
import Project from '../models/Project';
import Team from '../models/Team';
import Organization from '../models/Organization';
import User from '../models/User';
import { Types } from 'mongoose';

const log = createLogger('meetiva:projects');

const router = Router();

// ── Validation schemas ─────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  organizationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organizationId'),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

const assignManagerSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid userId'),
});

// ── Create project ─────────────────────────────────────────────────────────

router.post(
  '/',
  apiLimiter,
  authenticate,
  requireOrgRole('admin', 'manager'),
  validate(createProjectSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, organizationId } = req.body as z.infer<typeof createProjectSchema>;

    // Verify org exists and user belongs to it
    const org = await Organization.findById(organizationId).lean();
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    if (req.userOrg!.orgRole !== 'super_admin' && req.userOrg!.organizationId !== organizationId) {
      return res.status(403).json({ message: 'Access denied: different organization' });
    }

    // Manager can only create projects in their org
    if (req.userOrg!.orgRole === 'manager') {
      const isAssigned = await Project.findOne({
        organizationId: new Types.ObjectId(organizationId),
        managerUserId: new Types.ObjectId(req.userId!),
      }).lean();
      if (!isAssigned) {
        return res.status(403).json({ message: 'Managers can only create projects they are assigned to' });
      }
    }

    const project = await Project.create({
      name,
      description: description || null,
      organizationId: new Types.ObjectId(organizationId),
      managerUserId: new Types.ObjectId(req.userId!),
    });

    log.info('Project created', { projectId: String(project._id), orgId: organizationId });

    res.status(201).json({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      organizationId: project.organizationId.toString(),
      managerUserId: project.managerUserId.toString(),
      createdAt: project.createdAt.toISOString(),
    });
  })
);

// ── List projects ──────────────────────────────────────────────────────────

router.get(
  '/',
  apiLimiter,
  authenticate,
  requireOrgRole('admin', 'manager'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const query: any = {};

    if (req.userOrg!.orgRole === 'super_admin') {
      // Super admin sees all
      if (req.query.organizationId) {
        query.organizationId = new Types.ObjectId(req.query.organizationId as string);
      }
    } else if (req.userOrg!.orgRole === 'admin') {
      // Admin sees all in their org
      query.organizationId = new Types.ObjectId(req.userOrg!.organizationId!);
    } else if (req.userOrg!.orgRole === 'manager') {
      // Manager sees only assigned projects
      query.managerUserId = new Types.ObjectId(req.userId!);
    }

    const projects = await Project.find(query)
      .populate('managerUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      projects: projects.map(p => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        organizationId: p.organizationId.toString(),
        manager: {
          id: (p.managerUserId as any)._id?.toString() || p.managerUserId.toString(),
          name: (p.managerUserId as any).name || '',
          email: (p.managerUserId as any).email || '',
        },
        createdAt: p.createdAt.toISOString(),
      })),
    });
  })
);

// ── Get project details ────────────────────────────────────────────────────

router.get(
  '/:id',
  apiLimiter,
  authenticate,
  requireOrgRole('admin', 'manager'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findById(req.params.id)
      .populate('managerUserId', 'name email')
      .lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access check
    const hasAccess = await canManageProject(
      req.userId!,
      req.params.id,
      req.userOrg!
    );
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    res.json({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      organizationId: project.organizationId.toString(),
      manager: {
        id: (project.managerUserId as any)._id?.toString() || project.managerUserId.toString(),
        name: (project.managerUserId as any).name || '',
        email: (project.managerUserId as any).email || '',
      },
      createdAt: project.createdAt.toISOString(),
    });
  })
);

// ── Update project ─────────────────────────────────────────────────────────

router.patch(
  '/:id',
  apiLimiter,
  authenticate,
  requireOrgRole('admin', 'manager'),
  validate(updateProjectSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = await canManageProject(req.userId!, req.params.id, req.userOrg!);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const { name, description } = req.body as z.infer<typeof updateProjectSchema>;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }) },
      { returnDocument: 'after' }
    ).lean();

    res.json({
      id: updated!._id.toString(),
      name: updated!.name,
      description: updated!.description,
    });
  })
);

// ── Assign manager to project ──────────────────────────────────────────────

router.post(
  '/:id/assign-manager',
  apiLimiter,
  authenticate,
  requireOrgRole('admin'),
  validate(assignManagerSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body as z.infer<typeof assignManagerSchema>;

    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify the user is in the same org and is a manager
    const user = await User.findOne({
      _id: new Types.ObjectId(userId),
      organizationId: project.organizationId,
      orgRole: 'manager',
      isRemoved: false,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found or not a manager in this organization' });
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { managerUserId: new Types.ObjectId(userId) },
      { returnDocument: 'after' }
    ).lean();

    log.info('Project manager reassigned', { projectId: req.params.id, newManagerId: userId });

    res.json({
      id: updated!._id.toString(),
      name: updated!.name,
      managerUserId: updated!.managerUserId.toString(),
    });
  })
);

// ── List teams in project ──────────────────────────────────────────────────

router.get(
  '/:id/teams',
  apiLimiter,
  authenticate,
  requireOrgRole('admin', 'manager'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = await canManageProject(req.userId!, req.params.id, req.userOrg!);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const teams = await Team.find({ projectId: new Types.ObjectId(req.params.id) })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      teams: teams.map(t => ({
        id: t._id.toString(),
        name: t.name,
        description: t.description,
        inviteCode: t.inviteCode,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  })
);

export default router;
