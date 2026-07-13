"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const exceljs_1 = __importDefault(require("exceljs"));
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const grokMeetingAnalyzer_1 = require("../services/grokMeetingAnalyzer");
const whisperTranscriber_1 = require("../services/whisperTranscriber");
const meetingStatus_1 = require("../services/meetingStatus");
const rateLimiters_1 = require("../lib/rateLimiters");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const subscription_1 = require("../lib/subscription");
const Meeting_1 = __importDefault(require("../models/Meeting"));
const MeetingSummary_1 = __importDefault(require("../models/MeetingSummary"));
const Transcript_1 = __importDefault(require("../models/Transcript"));
const ActionItem_1 = __importDefault(require("../models/ActionItem"));
const TeamMember_1 = __importDefault(require("../models/TeamMember"));
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
// Validate all :id route params as MongoDB ObjectId
router.param('id', (req, res, next, value) => {
    if (!mongoose_1.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ message: `Invalid id: must be a valid ObjectId` });
    }
    next();
});
// Multer: keep limit at Whisper's hard cap (25 MB).
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: whisperTranscriber_1.WHISPER_MAX_BYTES },
});
// Helper to get the appropriate filter based on user's role
const getMeetingsFilter = async (req) => {
    // For members or users with no team membership, only show their own meetings
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
};
router.get('/stats', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const filter = await getMeetingsFilter(req);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [totalMeetings, completedMeetings, processingMeetings, durationAgg, totalActionItems, recentMeetings,] = await Promise.all([
        Meeting_1.default.countDocuments(filter),
        Meeting_1.default.countDocuments({ ...filter, status: 'completed' }),
        Meeting_1.default.countDocuments({ ...filter, status: 'processing' }),
        Meeting_1.default.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$duration' } } },
        ]),
        ActionItem_1.default.countDocuments({
            ...filter,
        }),
        // Only fetch last 6 months for trends + top participants, with a limit.
        Meeting_1.default.find({ ...filter, createdAt: { $gte: sixMonthsAgo } })
            .select('createdAt participants')
            .sort({ createdAt: -1 })
            .limit(500)
            .lean(),
    ]);
    const totalDuration = durationAgg[0]?.total ?? 0;
    const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
    const avgActionItems = totalMeetings > 0 ? Number((totalActionItems / totalMeetings).toFixed(1)) : 0;
    // Monthly trends from recent meetings
    const monthMap = new Map();
    recentMeetings.forEach((meeting) => {
        const month = new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short' });
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    const trends = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
    // Top participants from recent meetings
    const participantMap = new Map();
    recentMeetings.forEach((meeting) => {
        const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
        participants.forEach((participant) => {
            participantMap.set(participant, (participantMap.get(participant) || 0) + 1);
        });
    });
    const topParticipants = Array.from(participantMap.entries())
        .map(([name, meetingCount]) => ({ name, meetingCount }))
        .sort((a, b) => b.meetingCount - a.meetingCount)
        .slice(0, 5);
    res.json({
        totalMeetings,
        completedMeetings,
        processingMeetings,
        totalDuration,
        avgDuration,
        avgActionItems,
        trends,
        topParticipants,
    });
}));
router.get('/', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.paginationQuerySchema, 'query'), (0, errors_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const filter = await getMeetingsFilter(req);
    const [meetings, total] = await Promise.all([
        Meeting_1.default.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('title description status priority duration participants processingProgress userId createdAt updatedAt completedAt')
            .lean(),
        Meeting_1.default.countDocuments(filter),
    ]);
    res.json({
        data: meetings.map(m => ({ ...m, id: m._id.toString() })),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}));
router.get('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id).lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Check if user can view this meeting
    if (!(await (0, authorize_1.canViewUserData)(req.userId, meeting.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to view this meeting' });
    }
    res.json({ ...meeting, id: meeting._id.toString() });
}));
router.post('/upload', rateLimiters_1.uploadLimiter, auth_1.authenticate, upload.single('file'), (0, errors_1.asyncHandler)(async (req, res) => {
    // Apply XSS sanitization to user-supplied text fields (the multer/
    // multipart path bypasses the Zod validation pipeline).
    const title = typeof req.body.title === 'string' && req.body.title.trim().length > 0
        ? (0, validation_1.sanitize)(req.body.title.trim())
        : req.file?.originalname || 'Uploaded meeting';
    const description = typeof req.body.description === 'string'
        ? (0, validation_1.sanitize)(req.body.description.trim())
        : null;
    const participants = (() => {
        if (!req.body.participants)
            return [];
        if (Array.isArray(req.body.participants)) {
            return req.body.participants
                .filter((item) => typeof item === 'string')
                .map((item) => (0, validation_1.sanitize)(item.trim()));
        }
        if (typeof req.body.participants === 'string') {
            try {
                const parsed = JSON.parse(req.body.participants);
                return Array.isArray(parsed)
                    ? parsed
                        .filter((item) => typeof item === 'string')
                        .map((item) => (0, validation_1.sanitize)(item.trim()))
                    : [];
            }
            catch {
                return req.body.participants
                    .split(',')
                    .map((item) => (0, validation_1.sanitize)(item.trim()))
                    .filter(Boolean);
            }
        }
        return [];
    })();
    // ── Step 1: resolve transcript text ──────────────────────────────────────
    let transcriptText = '';
    let transcribedByWhisper = false;
    // Priority 1: caller sent raw text in the body
    if (typeof req.body.transcriptText === 'string' && req.body.transcriptText.trim().length > 0) {
        transcriptText = req.body.transcriptText.trim();
    }
    // Priority 2: uploaded .txt file
    else if (req.file &&
        (req.file.mimetype.startsWith('text/') || req.file.originalname.endsWith('.txt'))) {
        transcriptText = req.file.buffer.toString('utf8').trim();
    }
    // Priority 3: audio/video file → Whisper transcription
    else if (req.file && (0, whisperTranscriber_1.isAudioOrVideoFile)(req.file.originalname)) {
        if (req.file.buffer.byteLength > whisperTranscriber_1.WHISPER_MAX_BYTES) {
            return res.status(413).json({
                message: `File is ${(req.file.buffer.byteLength / 1024 / 1024).toFixed(1)} MB. ` +
                    `Whisper API accepts a maximum of 25 MB. Please trim or compress your recording.`,
            });
        }
        transcriptText = await (0, whisperTranscriber_1.transcribeWithWhisper)(req.file.buffer, req.file.originalname, req.file.mimetype);
        transcribedByWhisper = true;
    }
    if (!transcriptText) {
        return res.status(400).json({
            message: 'No transcript found. Upload an audio/video file (≤ 25 MB), a .txt transcript, ' +
                'or include transcriptText in the form body.',
        });
    }
    // Prevent duplicate meetings for the same user by normalized transcript content.
    const normalizedIncomingTranscript = transcriptText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const existingMeetings = await Transcript_1.default.aggregate([
        {
            $lookup: {
                from: 'meetings',
                localField: 'meetingId',
                foreignField: '_id',
                as: 'meeting',
            },
        },
        { $unwind: '$meeting' },
        { $match: { 'meeting.userId': new mongoose_1.Types.ObjectId(req.userId) } },
        {
            $project: {
                _id: '$meeting._id',
                title: '$meeting.title',
                status: '$meeting.status',
                createdAt: '$meeting.createdAt',
                fullText: 1,
            },
        },
    ]);
    const duplicateMeeting = existingMeetings.find((candidate) => {
        const existingText = candidate.fullText;
        if (!existingText)
            return false;
        return existingText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() === normalizedIncomingTranscript;
    });
    if (duplicateMeeting) {
        return res.status(409).json({
            message: 'This meeting already exists in your workspace.',
            code: 'MEETING_DUPLICATE',
            existingMeeting: {
                id: duplicateMeeting._id.toString(),
                title: duplicateMeeting.title,
                status: duplicateMeeting.status,
                createdAt: duplicateMeeting.createdAt,
            },
        });
    }
    // ── Step 1b: check meeting credits (before persisting) ─────────────────
    await (0, subscription_1.checkMeetingCredits)(req.userId);
    // ── Step 2: persist meeting record ───────────────────────────────────────
    const createdMeeting = await Meeting_1.default.create({
        title,
        description,
        participants,
        status: 'processing',
        processingProgress: transcribedByWhisper ? 50 : 20,
        userId: new mongoose_1.Types.ObjectId(req.userId),
    });
    // ── Step 3: Grok analysis ─────────────────────────────────────────────────
    const analysis = await (0, grokMeetingAnalyzer_1.analyzeTranscriptWithGrok)(transcriptText);
    // ── Step 4: persist all derived data atomically ──────────────────────────
    // Note: MongoDB transactions require a replica set. For single-node deployments,
    // we use sequential writes. If any fail, manually clean up.
    try {
        await Transcript_1.default.create({
            meetingId: createdMeeting._id,
            fullText: transcriptText,
            segments: [],
        });
        await MeetingSummary_1.default.create({
            meetingId: createdMeeting._id,
            executiveSummary: analysis.executiveSummary,
            keyPoints: analysis.keyPoints,
            decisions: analysis.decisions,
            openQuestions: analysis.openQuestions,
            sentiment: analysis.sentiment,
        });
        if (analysis.tasks.length > 0) {
            await ActionItem_1.default.insertMany(analysis.tasks.map((task) => ({
                meetingId: createdMeeting._id,
                userId: new mongoose_1.Types.ObjectId(req.userId),
                title: task.title,
                description: task.description,
                assignee: task.assignee,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                priority: task.priority || 'medium',
                status: task.status || 'pending',
                tags: task.tags || [],
            })));
        }
        await Meeting_1.default.findByIdAndUpdate(createdMeeting._id, { processingProgress: 100 });
    }
    catch (err) {
        // Cleanup on failure: remove the meeting and any partial data
        await Promise.all([
            Meeting_1.default.findByIdAndDelete(createdMeeting._id),
            Transcript_1.default.deleteMany({ meetingId: createdMeeting._id }),
            MeetingSummary_1.default.deleteMany({ meetingId: createdMeeting._id }),
            ActionItem_1.default.deleteMany({ meetingId: createdMeeting._id }),
        ]);
        throw err;
    }
    // ── Step 5: increment meeting counter ────────────────────────────────────
    await (0, subscription_1.incrementMeetingCount)(req.userId);
    const meeting = await Meeting_1.default.findById(createdMeeting._id).lean();
    res.status(201).json({
        data: meeting ? { ...meeting, id: meeting._id.toString() } : null,
        message: transcribedByWhisper
            ? 'Meeting transcribed with Whisper, summarized with Grok, and tasks extracted successfully.'
            : 'Meeting uploaded, summarized with Grok, and tasks extracted successfully.',
        transcribedByWhisper,
        actionItemsExportUrl: `/meetings/${createdMeeting._id}/action-items/export`,
        taskCount: analysis.tasks.length,
    });
}));
router.get('/:id/summary', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id)
        .select('userId')
        .lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Check permissions
    if (!(await (0, authorize_1.canViewUserData)(req.userId, meeting.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to view this meeting' });
    }
    const summary = await MeetingSummary_1.default.findOne({ meetingId: meeting._id }).lean();
    if (!summary) {
        return res.status(404).json({ message: 'Summary not found for this meeting yet' });
    }
    res.json({
        id: summary._id.toString(),
        meetingId: summary.meetingId.toString(),
        executiveSummary: summary.executiveSummary,
        keyPoints: summary.keyPoints,
        decisions: summary.decisions,
        openQuestions: summary.openQuestions,
        sentiment: summary.sentiment,
        createdAt: summary.createdAt,
    });
}));
router.get('/:id/transcript', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id)
        .select('userId')
        .lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Check permissions
    if (!(await (0, authorize_1.canViewUserData)(req.userId, meeting.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to view this meeting' });
    }
    const transcript = await Transcript_1.default.findOne({ meetingId: meeting._id }).lean();
    if (!transcript) {
        return res.status(404).json({ message: 'Transcript not found for this meeting yet' });
    }
    res.json({
        id: transcript._id.toString(),
        meetingId: transcript.meetingId.toString(),
        segments: [],
        fullText: transcript.fullText,
        language: transcript.language,
        createdAt: transcript.createdAt,
    });
}));
router.get('/:id/action-items', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id).lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Check permissions
    if (!(await (0, authorize_1.canViewUserData)(req.userId, meeting.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to view this meeting' });
    }
    const { page = '1', limit = '50' } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));
    const skip = (pageNumber - 1) * limitNumber;
    const [actionItems, total] = await Promise.all([
        ActionItem_1.default.find({ meetingId: meeting._id })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limitNumber)
            .select('title description assignee dueDate priority status tags createdAt updatedAt completedAt')
            .lean(),
        ActionItem_1.default.countDocuments({ meetingId: meeting._id }),
    ]);
    res.json({
        data: actionItems.map((item) => ({
            id: item._id.toString(),
            meetingId: item.meetingId.toString(),
            title: item.title,
            description: item.description,
            assignee: item.assignee,
            dueDate: item.dueDate,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            completedAt: item.completedAt,
        })),
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    });
}));
router.get('/:id/action-items/export', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id)
        .select('title userId')
        .lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Check permissions
    if (!(await (0, authorize_1.canViewUserData)(req.userId, meeting.userId.toString(), req.userTeams || []))) {
        return res.status(403).json({ message: 'You do not have permission to export this meeting' });
    }
    const actionItems = await ActionItem_1.default.find({ meetingId: meeting._id })
        .sort({ createdAt: 1 })
        .select('title description assignee priority status dueDate tags')
        .lean();
    const rows = actionItems.map((item) => ({
        Task: item.title,
        Description: item.description || '',
        Assignee: item.assignee || '',
        Priority: item.priority,
        Status: item.status,
        DueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : '',
        Tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    }));
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    worksheet.columns = Object.keys(rows[0] ?? {}).map((key) => ({ header: key, key, width: 20 }));
    worksheet.addRows(rows);
    const fileBuffer = await workbook.xlsx.writeBuffer();
    const safeTitle = meeting.title.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
    const filename = `${safeTitle || 'meeting'}_tasks.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
}));
router.post('/', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.createMeetingSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    await (0, subscription_1.checkMeetingCredits)(req.userId);
    const { title, description, duration, participants } = req.body;
    const meeting = await Meeting_1.default.create({
        title,
        description,
        duration,
        participants: participants,
        userId: new mongoose_1.Types.ObjectId(req.userId),
        status: 'completed',
        processingProgress: 100,
        completedAt: new Date(),
    });
    // Increment meeting counter
    await (0, subscription_1.incrementMeetingCount)(req.userId);
    res.status(201).json({ ...meeting.toObject(), id: meeting._id.toString() });
}));
router.patch('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.updateMeetingSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { title, description, priority, status } = req.body;
    const meeting = await Meeting_1.default.findById(req.params.id).lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Only owner can modify
    if (meeting.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'You do not have permission to modify this meeting' });
    }
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (priority !== undefined)
        updateData.priority = priority;
    if (status !== undefined)
        updateData.status = status;
    await Meeting_1.default.findByIdAndUpdate(req.params.id, { $set: updateData });
    await (0, meetingStatus_1.syncMeetingStatusFromActionItems)(req.params.id);
    const refreshed = await Meeting_1.default.findById(req.params.id).lean();
    res.json(refreshed ? { ...refreshed, id: refreshed._id.toString() } : null);
}));
router.delete('/:id', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const meeting = await Meeting_1.default.findById(req.params.id).lean();
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
    }
    // Only owner can delete
    if (meeting.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this meeting' });
    }
    await Meeting_1.default.findByIdAndDelete(req.params.id);
    res.status(204).send();
}));
exports.default = router;
//# sourceMappingURL=meetings.js.map