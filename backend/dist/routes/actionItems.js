"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const meetingStatus_1 = require("../services/meetingStatus");
const rateLimiters_1 = require("../lib/rateLimiters");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const ActionItem_1 = __importDefault(require("../models/ActionItem"));
const Meeting_1 = __importDefault(require("../models/Meeting"));
const TeamMember_1 = __importDefault(require("../models/TeamMember"));
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
// Validate all :id route params as MongoDB ObjectId
router.param('id', (req, res, next, value) => {
    if (!mongoose_1.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ message: 'Invalid id: must be a valid ObjectId' });
    }
    next();
});
// Helper to get the appropriate filter based on user's role
const getActionItemsFilter = async (req) => {
    try {
        // For members or users with no team membership, only show their own action items
        if (!req.userTeams || req.userTeams.length === 0) {
            return { userId: new mongoose_1.Types.ObjectId(req.userId) };
        }
        // Check if user is MANAGER or LEAD in any team
        const isManagerOrLead = req.userTeams.some(team => team.role === 'MANAGER' || team.role === 'LEAD');
        if (!isManagerOrLead) {
            return { userId: new mongoose_1.Types.ObjectId(req.userId) };
        }
        // User is MANAGER or LEAD - fetch all team members from their teams
        const teamIds = req.userTeams
            .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
            .map(team => new mongoose_1.Types.ObjectId(team.teamId));
        if (teamIds.length === 0) {
            return { userId: new mongoose_1.Types.ObjectId(req.userId) };
        }
        const teamMembers = await TeamMember_1.default.find({ teamId: { $in: teamIds } })
            .select('userId')
            .lean();
        const memberUserIds = Array.from(new Set([
            new mongoose_1.Types.ObjectId(req.userId),
            ...teamMembers.map(tm => tm.userId),
        ]));
        return { userId: { $in: memberUserIds } };
    }
    catch {
        return { userId: new mongoose_1.Types.ObjectId(req.userId) };
    }
};
const actionItemQuerySchema = validation_1.paginationQuerySchema.merge(validation_1.statusFilterSchema);
router.get('/', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(actionItemQuerySchema, 'query'), (0, errors_1.asyncHandler)(async (req, res) => {
    const { page, limit, status } = req.query;
    const skip = (page - 1) * limit;
    let filter = await getActionItemsFilter(req);
    if (status) {
        filter.status = status;
    }
    const [actionItems, total] = await Promise.all([
        ActionItem_1.default.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('meetingId', 'title')
            .lean(),
        ActionItem_1.default.countDocuments(filter),
    ]);
    res.json({
        data: actionItems.map((item) => ({
            ...item,
            id: item._id.toString(),
            meeting: item.meetingId ? { id: item.meetingId._id.toString(), title: item.meetingId.title } : undefined,
            meetingId: item.meetingId?._id?.toString() || item.meetingId?.toString(),
        })),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}));
router.get('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const actionItem = await ActionItem_1.default.findById(req.params.id)
        .populate('meetingId')
        .lean();
    if (!actionItem) {
        return res.status(404).json({ message: 'Action item not found' });
    }
    // Check if user can view this action item
    if (!(await (0, authorize_1.canViewUserData)(req.userId, actionItem.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to view this action item' });
    }
    res.json(actionItem);
}));
router.post('/', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.createActionItemSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { meetingId, title, description, assignee, dueDate, priority } = req.body;
    const meeting = await Meeting_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(meetingId),
        userId: new mongoose_1.Types.ObjectId(req.userId),
    }).lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    const actionItem = await ActionItem_1.default.create({
        meetingId: meeting._id,
        title,
        description,
        assignee,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        reminderSentAt: null,
        userId: new mongoose_1.Types.ObjectId(req.userId),
    });
    await (0, meetingStatus_1.syncMeetingStatusFromActionItems)(meetingId);
    res.status(201).json(actionItem.toObject());
}));
router.patch('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.updateActionItemSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { title, description, assignee, dueDate, priority, status } = req.body;
    const actionItem = await ActionItem_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(req.params.id),
        userId: new mongoose_1.Types.ObjectId(req.userId),
    }).lean();
    if (!actionItem) {
        return res.status(404).json({ message: 'Action item not found' });
    }
    // Check if user can modify this action item (must be owner)
    if (actionItem.userId.toString() !== req.userId) {
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
        updateData.reminderSentAt = null;
    }
    if (status === 'completed' && !actionItem.completedAt) {
        updateData.completedAt = new Date();
    }
    if (status !== undefined && status !== 'completed') {
        updateData.reminderSentAt = null;
    }
    const updated = await ActionItem_1.default.findByIdAndUpdate(actionItem._id, { $set: updateData }, { returnDocument: 'after' }).lean();
    await (0, meetingStatus_1.syncMeetingStatusFromActionItems)(actionItem.meetingId.toString());
    res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));
router.delete('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const actionItem = await ActionItem_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(req.params.id),
        userId: new mongoose_1.Types.ObjectId(req.userId),
    }).lean();
    if (!actionItem) {
        return res.status(404).json({ message: 'Action item not found' });
    }
    // Check if user can delete this action item (must be owner)
    if (actionItem.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this action item' });
    }
    await ActionItem_1.default.findByIdAndDelete(actionItem._id);
    await (0, meetingStatus_1.syncMeetingStatusFromActionItems)(actionItem.meetingId.toString());
    res.status(204).send();
}));
router.post('/:id/complete', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const actionItem = await ActionItem_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(req.params.id),
        userId: new mongoose_1.Types.ObjectId(req.userId),
    }).lean();
    if (!actionItem) {
        return res.status(404).json({ message: 'Action item not found' });
    }
    const updated = await ActionItem_1.default.findByIdAndUpdate(actionItem._id, { $set: { status: 'completed', completedAt: new Date() } }, { returnDocument: 'after' }).lean();
    await (0, meetingStatus_1.syncMeetingStatusFromActionItems)(actionItem.meetingId.toString());
    res.json(updated ? { ...updated, id: updated._id.toString() } : null);
}));
exports.default = router;
//# sourceMappingURL=actionItems.js.map