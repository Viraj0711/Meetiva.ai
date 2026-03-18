"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const grokMeetingAnalyzer_1 = require("../services/grokMeetingAnalyzer");
const whisperTranscriber_1 = require("../services/whisperTranscriber");
const router = (0, express_1.Router)();
// Multer: keep limit at Whisper's hard cap (25 MB).
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: whisperTranscriber_1.WHISPER_MAX_BYTES },
});
const jsonArrayToStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((entry) => typeof entry === 'string');
};
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const meetings = await prisma_1.default.meeting.findMany({
            where: { userId: req.userId },
            include: { actionItems: true }
        });
        const totalMeetings = meetings.length;
        const totalDuration = meetings.reduce((sum, meeting) => sum + (meeting.duration || 0), 0);
        const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
        const totalActionItems = meetings.reduce((sum, meeting) => sum + meeting.actionItems.length, 0);
        const avgActionItems = totalMeetings > 0 ? Number((totalActionItems / totalMeetings).toFixed(1)) : 0;
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyMeetings = meetings.filter((meeting) => meeting.createdAt >= sixMonthsAgo);
        const monthMap = new Map();
        monthlyMeetings.forEach((meeting) => {
            const month = new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short' });
            monthMap.set(month, (monthMap.get(month) || 0) + 1);
        });
        const trends = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
        const participantMap = new Map();
        meetings.forEach((meeting) => {
            const participants = jsonArrayToStringArray(meeting.participants);
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
            completedMeetings: meetings.filter((meeting) => meeting.status === 'completed').length,
            processingMeetings: meetings.filter((meeting) => meeting.status === 'processing').length,
            totalDuration,
            avgDuration,
            avgActionItems,
            trends,
            topParticipants
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { page = '1', limit = '10' } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNumber - 1) * limitNumber;
        const [meetings, total] = await Promise.all([
            prisma_1.default.meeting.findMany({
                where: { userId: req.userId },
                skip,
                take: limitNumber,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { actionItems: true }
                    }
                }
            }),
            prisma_1.default.meeting.count({ where: { userId: req.userId } })
        ]);
        res.json({
            data: meetings,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    }
    catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ message: 'Failed to fetch meetings' });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: { actionItems: true }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        res.json(meeting);
    }
    catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ message: 'Failed to fetch meeting' });
    }
});
router.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res) => {
    try {
        const title = typeof req.body.title === 'string' && req.body.title.trim().length > 0
            ? req.body.title.trim()
            : req.file?.originalname || 'Uploaded meeting';
        const description = typeof req.body.description === 'string' ? req.body.description : null;
        const participants = (() => {
            if (!req.body.participants)
                return [];
            if (Array.isArray(req.body.participants)) {
                return req.body.participants.filter((item) => typeof item === 'string');
            }
            if (typeof req.body.participants === 'string') {
                try {
                    const parsed = JSON.parse(req.body.participants);
                    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
                }
                catch {
                    return req.body.participants.split(',').map((item) => item.trim()).filter(Boolean);
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
        // ── Step 2: persist meeting record ───────────────────────────────────────
        const createdMeeting = await prisma_1.default.meeting.create({
            data: {
                title,
                description,
                participants,
                status: 'processing',
                processingProgress: transcribedByWhisper ? 50 : 20,
                userId: req.userId,
            },
        });
        // ── Step 3: Grok analysis ─────────────────────────────────────────────────
        const analysis = await (0, grokMeetingAnalyzer_1.analyzeTranscriptWithGrok)(transcriptText);
        // ── Step 4: persist all derived data atomically ──────────────────────────
        await prisma_1.default.$transaction(async (tx) => {
            await tx.transcript.create({
                data: { meetingId: createdMeeting.id, fullText: transcriptText, segments: [] },
            });
            await tx.meetingSummary.create({
                data: {
                    meetingId: createdMeeting.id,
                    executiveSummary: analysis.executiveSummary,
                    keyPoints: analysis.keyPoints,
                    decisions: analysis.decisions,
                    openQuestions: analysis.openQuestions,
                    sentiment: analysis.sentiment,
                },
            });
            if (analysis.tasks.length > 0) {
                await tx.actionItem.createMany({
                    data: analysis.tasks.map((task) => ({
                        meetingId: createdMeeting.id,
                        userId: req.userId,
                        title: task.title,
                        description: task.description,
                        assignee: task.assignee,
                        dueDate: task.dueDate ? new Date(task.dueDate) : null,
                        priority: task.priority || 'medium',
                        status: task.status || 'pending',
                        tags: task.tags || [],
                    })),
                });
            }
            await tx.meeting.update({
                where: { id: createdMeeting.id },
                data: { status: 'completed', processingProgress: 100, completedAt: new Date() },
            });
        });
        const meeting = await prisma_1.default.meeting.findUnique({ where: { id: createdMeeting.id } });
        res.status(201).json({
            data: meeting,
            message: transcribedByWhisper
                ? 'Meeting transcribed with Whisper, summarized with Grok, and tasks extracted successfully.'
                : 'Meeting uploaded, summarized with Grok, and tasks extracted successfully.',
            transcribedByWhisper,
            actionItemsExportUrl: `/meetings/${createdMeeting.id}/action-items/export`,
            taskCount: analysis.tasks.length,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            type: error instanceof Error ? error.constructor.name : typeof error
        };
        console.error('Meeting upload processing error:', JSON.stringify(errorDetails, null, 2));
        // Surface user-friendly Whisper size errors
        if (error instanceof Error && error.message.includes('Whisper')) {
            return res.status(413).json({ message: error.message });
        }
        // Surface API errors
        if (error instanceof Error && error.message.includes('Grok')) {
            return res.status(502).json({ message: `AI service error: ${error.message}` });
        }
        res.status(500).json({ message: 'Failed to process uploaded meeting', error: errorMessage });
    }
});
router.get('/:id/summary', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: { summary: true }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        if (!meeting.summary) {
            return res.status(404).json({ message: 'Summary not found for this meeting yet' });
        }
        res.json({
            id: meeting.summary.id,
            meetingId: meeting.summary.meetingId,
            executiveSummary: meeting.summary.executiveSummary,
            keyPoints: jsonArrayToStringArray(meeting.summary.keyPoints),
            decisions: jsonArrayToStringArray(meeting.summary.decisions),
            openQuestions: jsonArrayToStringArray(meeting.summary.openQuestions),
            sentiment: meeting.summary.sentiment,
            createdAt: meeting.summary.createdAt
        });
    }
    catch (error) {
        console.error('Error fetching meeting summary:', error);
        res.status(500).json({ message: 'Failed to fetch meeting summary' });
    }
});
router.get('/:id/transcript', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: { transcript: true }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        if (!meeting.transcript) {
            return res.status(404).json({ message: 'Transcript not found for this meeting yet' });
        }
        res.json({
            id: meeting.transcript.id,
            meetingId: meeting.transcript.meetingId,
            segments: [],
            fullText: meeting.transcript.fullText,
            language: meeting.transcript.language,
            createdAt: meeting.transcript.createdAt
        });
    }
    catch (error) {
        console.error('Error fetching transcript:', error);
        res.status(500).json({ message: 'Failed to fetch transcript' });
    }
});
router.get('/:id/action-items', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId },
            select: { id: true }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        const actionItems = await prisma_1.default.actionItem.findMany({
            where: { meetingId: req.params.id, userId: req.userId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(actionItems.map((item) => ({
            ...item,
            tags: jsonArrayToStringArray(item.tags)
        })));
    }
    catch (error) {
        console.error('Error fetching meeting action items:', error);
        res.status(500).json({ message: 'Failed to fetch meeting action items' });
    }
});
router.get('/:id/action-items/export', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId },
            select: { id: true, title: true }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        const actionItems = await prisma_1.default.actionItem.findMany({
            where: { meetingId: meeting.id, userId: req.userId },
            orderBy: { createdAt: 'asc' }
        });
        const rows = actionItems.map((item) => ({
            Task: item.title,
            Description: item.description || '',
            Assignee: item.assignee || '',
            Priority: item.priority,
            Status: item.status,
            DueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : '',
            Tags: jsonArrayToStringArray(item.tags).join(', ')
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
        const fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        const safeTitle = meeting.title.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
        const filename = `${safeTitle || 'meeting'}_tasks.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(fileBuffer);
    }
    catch (error) {
        console.error('Error exporting action items:', error);
        res.status(500).json({ message: 'Failed to export action items' });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { title, description, duration, participants } = req.body;
        const meeting = await prisma_1.default.meeting.create({
            data: {
                title,
                description,
                duration,
                participants: Array.isArray(participants) ? participants : [],
                userId: req.userId,
                status: 'completed',
                processingProgress: 100,
                completedAt: new Date()
            }
        });
        res.status(201).json(meeting);
    }
    catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ message: 'Failed to create meeting' });
    }
});
router.patch('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { title, description, priority, status } = req.body;
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        const updated = await prisma_1.default.meeting.update({
            where: { id: req.params.id },
            data: {
                ...(title ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(priority ? { priority } : {}),
                ...(status ? { status } : {})
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({ message: 'Failed to update meeting' });
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const meeting = await prisma_1.default.meeting.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        await prisma_1.default.meeting.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ message: 'Failed to delete meeting' });
    }
});
exports.default = router;
