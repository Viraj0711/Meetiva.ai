import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import prisma from '../lib/prisma';

const router = Router();

// Utility: Get all team members a user can see based on hierarchy
const getVisibleTeamIds = async (userId: string): Promise<string[]> => {
  const teamMembers = await prisma.teamMember.findMany({
    where: { 
      userId,
      status: 'ACCEPTED'
    },
    select: { teamId: true }
  });
  return teamMembers.map(tm => tm.teamId);
};

// Utility: Get all members visible to a user in their teams
const getVisibleUserIds = async (userId: string, userRole: string): Promise<string[]> => {
  if (userRole === 'MEMBER') {
    // Members only see themselves
    return [userId];
  }

  // Get all teams this user is MANAGER or LEAD in
  const teamMemberships = await prisma.teamMember.findMany({
    where: { 
      userId,
      status: 'ACCEPTED'
    },
    select: { teamId: true, role: true }
  });

  if (userRole === 'LEAD') {
    // LEAD can see members in their teams
    const teamIds = teamMemberships
      .filter(tm => tm.role === 'LEAD')
      .map(tm => tm.teamId);

    if (teamIds.length === 0) return [userId];

    const teamMembersInLedTeams = await prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIds },
        role: 'MEMBER',
        status: 'ACCEPTED'
      },
      select: { userId: true }
    });

    return [userId, ...teamMembersInLedTeams.map(tm => tm.userId)];
  }

  if (userRole === 'MANAGER') {
    // MANAGER can see everyone in their teams
    const teamIds = teamMemberships.map(tm => tm.teamId);

    if (teamIds.length === 0) return [userId];

    const allTeamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIds },
        status: 'ACCEPTED'
      },
      select: { userId: true }
    });

    return [userId, ...allTeamMembers.map(tm => tm.userId)];
  }

  return [userId];
};

// Create a new team
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { name, description } = req.body;

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
          role: 'MANAGER',
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
    } catch (error) {
      console.error('❌ Error creating team:', error);
      res.status(500).json({ message: 'Failed to create team' });
    }
  }
);

// Get all teams for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get team members with hierarchy-aware visibility
router.get(
  '/:teamId/members',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
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

      // Filter based on user role
      let visibleMembers = allMembers;

      if (userMembership.role === 'MEMBER') {
        // Members can only see the manager/leads
        visibleMembers = allMembers.filter(m => m.role !== 'MEMBER' || m.userId === req.userId);
      } else if (userMembership.role === 'LEAD') {
        // Leads can see members and manager, but not peer leads
        visibleMembers = allMembers.filter(m => 
          m.role === 'MANAGER' || m.role === 'MEMBER' || m.userId === req.userId
        );
      }
      // MANAGER can see everyone

      const members = visibleMembers.map(tm => ({
        userId: tm.userId,
        name: tm.user.name,
        email: tm.user.email,
        role: tm.role,
        status: tm.status,
        joinedAt: tm.acceptedAt?.toISOString() || tm.createdAt.toISOString()
      }));

      res.json({ members });
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  }
);

// Invite a member to a team (MANAGER/LEAD can invite based on role)
router.post(
  '/:teamId/invite',
  authenticate,
  [
    body('email').isEmail(),
    body('role').isIn(['LEAD', 'MEMBER'])
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { teamId } = req.params;
      const { email, role } = req.body;

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

      // LEAD can only invite MEMBER role
      if (requesterMembership.role === 'LEAD' && role !== 'MEMBER') {
        return res.status(403).json({ message: 'Team leads can only invite members' });
      }

      // MEMBER cannot invite
      if (requesterMembership.role === 'MEMBER') {
        return res.status(403).json({ message: 'Members cannot invite' });
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30-day invite expiry

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

      // Create or update invitation
      const invitation = await prisma.teamInvitation.upsert({
        where: {
          email_teamId: {
            email: email.toLowerCase(),
            teamId
          }
        },
        update: {
          role,
          invitedBy: req.userId!,
          status: 'PENDING',
          expiresAt
        },
        create: {
          email: email.toLowerCase(),
          teamId,
          role,
          invitedBy: req.userId!,
          expiresAt
        }
      });

      console.log(`✅ Invitation sent to ${email} for team ${teamId} as ${role}`);

      res.status(201).json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt.toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  }
);

// Get pending invitations for current user
router.get('/pending/invitations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
});

// Accept an invitation
router.post(
  '/invitations/:invitationId/accept',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
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
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      res.status(500).json({ message: 'Failed to accept invitation' });
    }
  }
);

// Change a team member's role (only MANAGER can do this)
router.patch(
  '/:teamId/members/:userId',
  authenticate,
  authorize(['MANAGER'], (req) => req.params.teamId),
  [
    body('role').isIn(['LEAD', 'MEMBER'])
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { teamId, userId } = req.params;
      const { role } = req.body;

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
    } catch (error) {
      console.error('❌ Error updating team member role:', error);
      res.status(500).json({ message: 'Failed to update team member role' });
    }
  }
);

// Remove a member from a team (MANAGER can remove, LEAD can only remove MEMBERS)
router.delete(
  '/:teamId/members/:userId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId, userId } = req.params;

      // Check if requester is MANAGER or LEAD
      const requesterMembership = req.userTeams?.find(t => t.teamId === teamId);
      if (!requesterMembership) {
        return res.status(403).json({ message: 'Not a member of this team' });
      }

      if (requesterMembership.role === 'MEMBER') {
        return res.status(403).json({ message: 'Only MANAGER or LEAD can remove members' });
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
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      if ((error as any).code === 'P2025') {
        return res.status(404).json({ message: 'Team member not found' });
      }
      res.status(500).json({ message: 'Failed to remove team member' });
    }
  }
);

export default router;
