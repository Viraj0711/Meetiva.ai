import { Router, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import { analyzeTranscriptWithGrok } from '../services/grokMeetingAnalyzer';
import {
  transcribeWithWhisper,
  isAudioOrVideoFile,
  WHISPER_MAX_BYTES,
} from '../services/whisperTranscriber';
import { syncMeetingStatusFromActionItems } from '../services/meetingStatus';
import { apiLimiter, uploadLimiter } from '../lib/rateLimiters';
import {
  validate,
  updateMeetingSchema,
  createMeetingSchema,
  paginationQuerySchema,
  sanitize,
} from '../lib/validation';
import { asyncHandler, AppError } from '../lib/errors';
import { checkMeetingCredits, incrementMeetingCount } from '../lib/subscription';
import Meeting, { IMeeting } from '../models/Meeting';
import MeetingSummary from '../models/MeetingSummary';
import Transcript from '../models/Transcript';
import ActionItem from '../models/ActionItem';
import TeamMember from '../models/TeamMember';
import mongoose, { Types } from 'mongoose';

const router = Router();

// Validate all :id route params as MongoDB ObjectId
router.param('id', (req, res, next, value) => {
  if (!Types.ObjectId.isValid(value)) {
    return res.status(400).json({ message: `Invalid id: must be a valid ObjectId` });
  }
  next();
});

// Multer: keep limit at Whisper's hard cap (25 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: WHISPER_MAX_BYTES },
});

// Helper to get the appropriate filter based on user's role
const getMeetingsFilter = async (req: AuthRequest): Promise<Record<string, any>> => {
  // For members or users with no team membership, only show their own meetings
  if (!req.userTeams || req.userTeams.length === 0) {
    return { userId: new Types.ObjectId(req.userId!) };
  }

  // Check if user is MANAGER or LEAD in any team
  const isManagerOrLead = req.userTeams.some(team =>
    team.role === 'MANAGER' || team.role === 'LEAD'
  );

  if (!isManagerOrLead) {
    return { userId: new Types.ObjectId(req.userId!) };
  }

  // User is MANAGER or LEAD - fetch all team members from their teams
  const teamIds = req.userTeams
    .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
    .map(team => new Types.ObjectId(team.teamId));

  if (teamIds.length === 0) {
    return { userId: new Types.ObjectId(req.userId!) };
  }

  const teamMembers = await TeamMember.find({ teamId: { $in: teamIds } })
    .select('userId')
    .lean();

  const memberUserIds = Array.from(new Set([
    new Types.ObjectId(req.userId!),
    ...teamMembers.map(tm => tm.userId),
  ]));

  return { userId: { $in: memberUserIds } };
};

router.get('/stats', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter = await getMeetingsFilter(req);
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalMeetings,
    completedMeetings,
    processingMeetings,
    durationAgg,
    totalActionItems,
    recentMeetings,
  ] = await Promise.all([
    Meeting.countDocuments(filter),
    Meeting.countDocuments({ ...filter, status: 'completed' }),
    Meeting.countDocuments({ ...filter, status: 'processing' }),
    Meeting.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$duration' } } },
    ]),
    ActionItem.countDocuments({
      ...filter,
    }),
    // Only fetch last 6 months for trends + top participants, with a limit.
    Meeting.find({ ...filter, createdAt: { $gte: sixMonthsAgo } })
      .select('createdAt participants')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  ]);

  const totalDuration = durationAgg[0]?.total ?? 0;
  const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
  const avgActionItems = totalMeetings > 0 ? Number((totalActionItems / totalMeetings).toFixed(1)) : 0;

  // Monthly trends from recent meetings
  const monthMap = new Map<string, number>();
  recentMeetings.forEach((meeting) => {
    const month = new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short' });
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  });
  const trends = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));

  // Top participants from recent meetings
  const participantMap = new Map<string, number>();
  recentMeetings.forEach((meeting) => {
    const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
    participants.forEach((participant: string) => {
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

router.get('/',
  apiLimiter,
  authenticate,
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const filter = await getMeetingsFilter(req);

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('title description status priority duration participants processingProgress userId createdAt updatedAt completedAt')
        .lean(),
      Meeting.countDocuments(filter),
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

router.get('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check if user can view this meeting
  if (!(await canViewUserData(req.userId!, meeting.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  res.json({ ...meeting, id: meeting._id.toString() });
}));

router.post('/upload', uploadLimiter, authenticate, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  // Apply XSS sanitization to user-supplied text fields (the multer/
  // multipart path bypasses the Zod validation pipeline).
  const title = typeof req.body.title === 'string' && req.body.title.trim().length > 0
    ? sanitize(req.body.title.trim())
    : req.file?.originalname || 'Uploaded meeting';

  const description = typeof req.body.description === 'string'
    ? sanitize(req.body.description.trim())
    : null;

  const participants = (() => {
    if (!req.body.participants) return [];
    if (Array.isArray(req.body.participants)) {
      return req.body.participants
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((item: string) => sanitize(item.trim()));
    }
    if (typeof req.body.participants === 'string') {
      try {
        const parsed = JSON.parse(req.body.participants);
        return Array.isArray(parsed)
          ? parsed
              .filter((item): item is string => typeof item === 'string')
              .map((item: string) => sanitize(item.trim()))
          : [];
      } catch {
        return req.body.participants
          .split(',')
          .map((item: string) => sanitize(item.trim()))
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
  else if (
    req.file &&
    (req.file.mimetype.startsWith('text/') || req.file.originalname.endsWith('.txt'))
  ) {
    transcriptText = req.file.buffer.toString('utf8').trim();
  }
  // Priority 3: audio/video file → Whisper transcription
  else if (req.file && isAudioOrVideoFile(req.file.originalname)) {
    if (req.file.buffer.byteLength > WHISPER_MAX_BYTES) {
      return res.status(413).json({
        message:
          `File is ${(req.file.buffer.byteLength / 1024 / 1024).toFixed(1)} MB. ` +
          `Whisper API accepts a maximum of 25 MB. Please trim or compress your recording.`,
      });
    }
    transcriptText = await transcribeWithWhisper(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    transcribedByWhisper = true;
  }

  if (!transcriptText) {
    return res.status(400).json({
      message:
        'No transcript found. Upload an audio/video file (≤ 25 MB), a .txt transcript, ' +
        'or include transcriptText in the form body.',
    });
  }

  // Prevent duplicate meetings for the same user by normalized transcript content.
  const normalizedIncomingTranscript = transcriptText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const existingMeetings = await Transcript.aggregate([
    {
      $lookup: {
        from: 'meetings',
        localField: 'meetingId',
        foreignField: '_id',
        as: 'meeting',
      },
    },
    { $unwind: '$meeting' },
    { $match: { 'meeting.userId': new Types.ObjectId(req.userId!) } },
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

  const duplicateMeeting = existingMeetings.find((candidate: any) => {
    const existingText = candidate.fullText;
    if (!existingText) return false;

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
  await checkMeetingCredits(req.userId!);

  // ── Step 2: persist meeting record ───────────────────────────────────────
  const createdMeeting = await Meeting.create({
    title,
    description,
    participants,
    status: 'processing',
    processingProgress: transcribedByWhisper ? 50 : 20,
    userId: new Types.ObjectId(req.userId!),
  });

  // ── Step 3: Grok analysis ─────────────────────────────────────────────────
  const analysis = await analyzeTranscriptWithGrok(transcriptText);

  // ── Step 4: persist all derived data atomically ──────────────────────────
  // Note: MongoDB transactions require a replica set. For single-node deployments,
  // we use sequential writes. If any fail, manually clean up.
  try {
    await Transcript.create({
      meetingId: createdMeeting._id,
      fullText: transcriptText,
      segments: [],
    });

    await MeetingSummary.create({
      meetingId: createdMeeting._id,
      executiveSummary: analysis.executiveSummary,
      keyPoints: analysis.keyPoints,
      decisions: analysis.decisions,
      openQuestions: analysis.openQuestions,
      sentiment: analysis.sentiment,
    });

    if (analysis.tasks.length > 0) {
      await ActionItem.insertMany(
        analysis.tasks.map((task) => ({
          meetingId: createdMeeting._id,
          userId: new Types.ObjectId(req.userId!),
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          priority: (task.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: (task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending',
          tags: task.tags || [],
        }))
      );
    }

    await Meeting.findByIdAndUpdate(createdMeeting._id, { processingProgress: 100 });
  } catch (err) {
    // Cleanup on failure: remove the meeting and any partial data
    await Promise.all([
      Meeting.findByIdAndDelete(createdMeeting._id),
      Transcript.deleteMany({ meetingId: createdMeeting._id }),
      MeetingSummary.deleteMany({ meetingId: createdMeeting._id }),
      ActionItem.deleteMany({ meetingId: createdMeeting._id }),
    ]);
    throw err;
  }

  // ── Step 5: increment meeting counter ────────────────────────────────────
  await incrementMeetingCount(req.userId!);

  const meeting = await Meeting.findById(createdMeeting._id).lean();

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

router.get('/:id/summary', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id)
    .select('userId')
    .lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!(await canViewUserData(req.userId!, meeting.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const summary = await MeetingSummary.findOne({ meetingId: meeting._id }).lean();

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

router.get('/:id/transcript', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id)
    .select('userId')
    .lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!(await canViewUserData(req.userId!, meeting.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const transcript = await Transcript.findOne({ meetingId: meeting._id }).lean();

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

router.get('/:id/action-items', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!(await canViewUserData(req.userId!, meeting.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const { page = '1', limit = '50' } = req.query;
  const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNumber = Math.max(1, Math.min(parseInt(limit as string, 10) || 50, 200));
  const skip = (pageNumber - 1) * limitNumber;

  const [actionItems, total] = await Promise.all([
    ActionItem.find({ meetingId: meeting._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber)
      .select('title description assignee dueDate priority status tags createdAt updatedAt completedAt')
      .lean(),
    ActionItem.countDocuments({ meetingId: meeting._id }),
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

router.get('/:id/action-items/export', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id)
    .select('title userId')
    .lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!(await canViewUserData(req.userId!, meeting.userId.toString(), req.userTeams || []))) {
    return res.status(403).json({ message: 'You do not have permission to export this meeting' });
  }

  const actionItems = await ActionItem.find({ meetingId: meeting._id })
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

  const workbook = new ExcelJS.Workbook();
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

router.post('/', apiLimiter, authenticate, validate(createMeetingSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkMeetingCredits(req.userId!);

  const { title, description, duration, participants } = req.body as z.infer<typeof createMeetingSchema>;

  const meeting = await Meeting.create({
    title,
    description,
    duration,
    participants: participants,
    userId: new Types.ObjectId(req.userId!),
    status: 'completed',
    processingProgress: 100,
    completedAt: new Date(),
  });

  // Increment meeting counter
  await incrementMeetingCount(req.userId!);

  res.status(201).json({ ...meeting.toObject(), id: meeting._id.toString() });
}));

router.patch('/:id', apiLimiter, authenticate, validate(updateMeetingSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, priority, status } = req.body as z.infer<typeof updateMeetingSchema>;

  const meeting = await Meeting.findById(req.params.id).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Only owner can modify
  if (meeting.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to modify this meeting' });
  }

  const updateData: Record<string, any> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) updateData.status = status;

  await Meeting.findByIdAndUpdate(req.params.id, { $set: updateData });

  await syncMeetingStatusFromActionItems(req.params.id);

  const refreshed = await Meeting.findById(req.params.id).lean();

  res.json(refreshed ? { ...refreshed, id: refreshed._id.toString() } : null);
}));

router.delete('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await Meeting.findById(req.params.id).lean();

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Only owner can delete
  if (meeting.userId.toString() !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to delete this meeting' });
  }

  await Meeting.findByIdAndDelete(req.params.id);

  res.status(204).send();
}));

export default router;
