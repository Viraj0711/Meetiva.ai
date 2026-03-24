"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
// Helper to get the appropriate where clause based on user's role
const getActionItemsWhereClause = async (req) => {
    try {
        // For members or users with no team membership, only show their own action items
        if (!req.userTeams || req.userTeams.length === 0) {
            console.log(`[getActionItemsWhereClause] User ${req.userId} has no teams, returning own items only`);
            return { userId: req.userId };
        }
        // Check if user is MANAGER or LEAD in any team
        const isManagerOrLead = req.userTeams.some(team => team.role === 'MANAGER' || team.role === 'LEAD');
        if (!isManagerOrLead) {
            // User is just a MEMBER, show only their own items
            console.log(`[getActionItemsWhereClause] User ${req.userId} is MEMBER only, returning own items`);
            return { userId: req.userId };
        }
        // User is MANAGER or LEAD - fetch all team members from their teams
        const teamIds = req.userTeams
            .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
            .map(team => team.teamId);
        if (teamIds.length === 0) {
            console.log(`[getActionItemsWhereClause] User ${req.userId} has no MANAGER/LEAD teams`);
            return { userId: req.userId };
        }
        console.log(`[getActionItemsWhereClause] User ${req.userId} is MANAGER/LEAD in teams: ${teamIds.join(', ')}`);
        const teamMembers = await prisma_1.default.teamMember.findMany({
            where: { teamId: { in: teamIds } },
            select: { userId: true }
        });
        const memberUserIds = Array.from(new Set([req.userId, ...teamMembers.map(tm => tm.userId)]));
        console.log(`[getActionItemsWhereClause] Showing items for ${memberUserIds.length} users`);
        return {
            userId: { in: memberUserIds }
        };
    }
    catch (error) {
        console.error(`[getActionItemsWhereClause] Error: ${error}`);
        console.log(`[getActionItemsWhereClause] Fallback: returning only own items for user ${req.userId}`);
        return { userId: req.userId };
    }
};
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { page = '1', limit = '10', status } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNumber - 1) * limitNumber;
        let where = await getActionItemsWhereClause(req);
        if (status) {
            where = {
                ...where,
                status: status
            };
        }
        const [actionItems, total] = await Promise.all([
            prisma_1.default.actionItem.findMany({
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
            prisma_1.default.actionItem.count({ where })
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
    }
    catch (error) {
        console.error('Error fetching action items:', error);
        res.status(500).json({ message: 'Failed to fetch action items' });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const actionItem = await prisma_1.default.actionItem.findFirst({
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
        if (!(0, authorize_1.canViewUserData)(req.userId, actionItem.userId, req.userTeams || [])) {
            return res.status(403).json({ message: 'You do not have permission to view this action item' });
        }
        res.json(actionItem);
    }
    catch (error) {
        console.error('Error fetching action item:', error);
        res.status(500).json({ message: 'Failed to fetch action item' });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { meetingId, title, description, assignee, dueDate, priority } = req.body;
        const meeting = await prisma_1.default.meeting.findFirst({
            where: {
                id: meetingId,
                userId: req.userId
            }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        const actionItem = await prisma_1.default.actionItem.create({
            data: {
                meetingId,
                title,
                description,
                assignee,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority || 'medium',
                userId: req.userId
            }
        });
        res.status(201).json(actionItem);
    }
    catch (error) {
        console.error('Error creating action item:', error);
        res.status(500).json({ message: 'Failed to create action item' });
    }
});
router.patch('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { title, description, assignee, dueDate, priority, status } = req.body;
        const actionItem = await prisma_1.default.actionItem.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });
        if (!actionItem) {
            return res.status(404).json({ message: 'Action item not found' });
        }
        // Check if user can modify this action item (must be owner)
        if (actionItem.userId !== req.userId) {
            return res.status(403).json({ message: 'You do not have permission to modify this action item' });
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (assignee !== undefined)
            updateData.assignee = assignee;
        if (priority !== undefined)
            updateData.priority = priority;
        if (status !== undefined)
            updateData.status = status;
        if (dueDate !== undefined) {
            updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }
        if (status === 'completed' && !actionItem.completedAt) {
            updateData.completedAt = new Date();
        }
        const updated = await prisma_1.default.actionItem.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating action item:', error);
        res.status(500).json({ message: 'Failed to update action item' });
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const actionItem = await prisma_1.default.actionItem.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });
        if (!actionItem) {
            return res.status(404).json({ message: 'Action item not found' });
        }
        // Check if user can delete this action item (must be owner)
        if (actionItem.userId !== req.userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this action item' });
        }
        await prisma_1.default.actionItem.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting action item:', error);
        res.status(500).json({ message: 'Failed to delete action item' });
    }
});
router.post('/:id/complete', auth_1.authenticate, async (req, res) => {
    try {
        const actionItem = await prisma_1.default.actionItem.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });
        if (!actionItem) {
            return res.status(404).json({ message: 'Action item not found' });
        }
        const updated = await prisma_1.default.actionItem.update({
            where: { id: req.params.id },
            data: {
                status: 'completed',
                completedAt: new Date()
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error completing action item:', error);
        res.status(500).json({ message: 'Failed to complete action item' });
    }
});
exports.default = router;
