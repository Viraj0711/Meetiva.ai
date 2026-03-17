"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { page = '1', limit = '10', status } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNumber - 1) * limitNumber;
        const where = { userId: req.userId };
        if (status) {
            where.status = status;
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
                id: req.params.id,
                userId: req.userId
            },
            include: {
                meeting: true
            }
        });
        if (!actionItem) {
            return res.status(404).json({ message: 'Action item not found' });
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
