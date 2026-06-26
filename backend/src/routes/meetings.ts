import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import ExcelJS from 'exceljs';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { canViewUserData } from '../middleware/authorize';
import prisma from '../lib/prisma';
import { jsonArrayToStringArray, normalizeTranscriptForComparison } from '../lib/prismaUtils';
import { analyzeTranscriptWithGrok } from '../services/grokMeetingAnalyzer';
import {
  transcribeWithWhisper,
  isAudioOrVideoFile,
  WHISPER_MAX_BYTES,
} from '../services/whisperTranscriber';
import { syncMeetingStatusFromActionItems } from '../services/meetingStatus';
import { apiLimiter, uploadLimiter } from '../lib/rateLimiters';
import { validate, updateMeetingSchema, createMeetingSchema } from '../lib/validation';
import { asyncHandler, AppError } from '../lib/errors';

const router = Router();

// Multer: keep limit at Whisper's hard cap (25 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: WHISPER_MAX_BYTES },
});

// Helper to get the appropriate where clause based on user's role
const getMeetingsWhereClause = async (req: AuthRequest): Promise<Prisma.MeetingWhereInput> => {
  // For members or users with no team membership, only show their own meetings
  if (!req.userTeams || req.userTeams.length === 0) {
    return { userId: req.userId! };
  }

  // Check if user is MANAGER or LEAD in any team
  const isManagerOrLead = req.userTeams.some(team =>
    team.role === 'MANAGER' || team.role === 'LEAD'
  );

  if (!isManagerOrLead) {
    return { userId: req.userId! };
  }

  // User is MANAGER or LEAD - fetch all team members from their teams
  const teamIds = req.userTeams
    .filter(team => team.role === 'MANAGER' || team.role === 'LEAD')
    .map(team => team.teamId);

  if (teamIds.length === 0) {
    return { userId: req.userId! };
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    select: { userId: true }
  });

  const memberUserIds = Array.from(new Set([req.userId!, ...teamMembers.map(tm => tm.userId)]));

  return {
    userId: { in: memberUserIds }
  };
};

router.get('/stats', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const where = await getMeetingsWhereClause(req);
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Use aggregation at the DB level instead of loading all records into memory.
  const [
    totalMeetings,
    completedMeetings,
    processingMeetings,
    durationAgg,
    totalActionItems,
    recentMeetings,
  ] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.count({ where: { ...where, status: 'completed' } }),
    prisma.meeting.count({ where: { ...where, status: 'processing' } }),
    prisma.meeting.aggregate({
      where,
      _sum: { duration: true },
    }),
    prisma.actionItem.count({
      where: { meeting: { ...where } },
    }),
    // Only fetch last 6 months for trends + top participants, with a limit.
    prisma.meeting.findMany({
      where: { ...where, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, participants: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
  ]);

  const totalDuration = durationAgg._sum.duration ?? 0;
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
    completedMeetings,
    processingMeetings,
    totalDuration,
    avgDuration,
    avgActionItems,
    trends,
    topParticipants,
  });
}));

router.get('/', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  const where = await getMeetingsWhereClause(req);

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        duration: true,
        participants: true,
        processingProgress: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    }),
    prisma.meeting.count({ where })
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
}));

router.get('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check if user can view this meeting
  if (!canViewUserData(req.userId!, meeting.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  res.json(meeting);
}));

router.post('/upload', uploadLimiter, authenticate, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const title = typeof req.body.title === 'string' && req.body.title.trim().length > 0
    ? req.body.title.trim()
    : req.file?.originalname || 'Uploaded meeting';

  const description = typeof req.body.description === 'string' ? req.body.description : null;
  const participants = (() => {
    if (!req.body.participants) return [];
    if (Array.isArray(req.body.participants)) {
      return req.body.participants.filter((item: unknown): item is string => typeof item === 'string');
    }
    if (typeof req.body.participants === 'string') {
      try {
        const parsed = JSON.parse(req.body.participants);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
      } catch {
        return req.body.participants.split(',').map((item: string) => item.trim()).filter(Boolean);
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
  const normalizedIncomingTranscript = normalizeTranscriptForComparison(transcriptText);
  const existingMeetings = await prisma.meeting.findMany({
    where: {
      userId: req.userId!,
      transcript: { isNot: null },
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      transcript: {
        select: {
          fullText: true,
        },
      },
    },
  });

  const duplicateMeeting = existingMeetings.find((candidate) => {
    const existingText = candidate.transcript?.fullText;
    if (!existingText) {
      return false;
    }

    return normalizeTranscriptForComparison(existingText) === normalizedIncomingTranscript;
  });

  if (duplicateMeeting) {
    return res.status(409).json({
      message: 'This meeting already exists in your workspace.',
      code: 'MEETING_DUPLICATE',
      existingMeeting: {
        id: duplicateMeeting.id,
        title: duplicateMeeting.title,
        status: duplicateMeeting.status,
        createdAt: duplicateMeeting.createdAt,
      },
    });
  }

  // ── Step 2: persist meeting record ───────────────────────────────────────
  const createdMeeting = await prisma.meeting.create({
    data: {
      title,
      description,
      participants,
      status: 'processing',
      processingProgress: transcribedByWhisper ? 50 : 20,
      userId: req.userId!,
    },
  });

  // ── Step 3: Grok analysis ─────────────────────────────────────────────────
  const analysis = await analyzeTranscriptWithGrok(transcriptText);

  // ── Step 4: persist all derived data atomically ──────────────────────────
  await prisma.$transaction(async (tx) => {
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
          userId: req.userId!,
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          priority: (task.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: (task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled') || 'pending',
          tags: task.tags || [],
        })),
      });
    }

    // Keep meeting as 'processing' instead of immediately marking complete
    // This allows users to see processing state before it's ready for review
    await tx.meeting.update({
      where: { id: createdMeeting.id },
      data: { processingProgress: 100 },
    });
  });

  const meeting = await prisma.meeting.findUnique({ where: { id: createdMeeting.id } });

  res.status(201).json({
    data: meeting,
    message: transcribedByWhisper
      ? 'Meeting transcribed with Whisper, summarized with Grok, and tasks extracted successfully.'
      : 'Meeting uploaded, summarized with Grok, and tasks extracted successfully.',
    transcribedByWhisper,
    actionItemsExportUrl: `/meetings/${createdMeeting.id}/action-items/export`,
    taskCount: analysis.tasks.length,
  });
}));

router.get('/:id/summary', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!canViewUserData(req.userId!, meeting.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const summary = await prisma.meetingSummary.findUnique({
    where: { meetingId: meeting.id }
  });

  if (!summary) {
    return res.status(404).json({ message: 'Summary not found for this meeting yet' });
  }

  res.json({
    id: summary.id,
    meetingId: summary.meetingId,
    executiveSummary: summary.executiveSummary,
    keyPoints: jsonArrayToStringArray(summary.keyPoints),
    decisions: jsonArrayToStringArray(summary.decisions),
    openQuestions: jsonArrayToStringArray(summary.openQuestions),
    sentiment: summary.sentiment,
    createdAt: summary.createdAt
  });
}));

router.get('/:id/transcript', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!canViewUserData(req.userId!, meeting.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const transcript = await prisma.transcript.findUnique({
    where: { meetingId: meeting.id }
  });

  if (!transcript) {
    return res.status(404).json({ message: 'Transcript not found for this meeting yet' });
  }

  res.json({
    id: transcript.id,
    meetingId: transcript.meetingId,
    segments: [],
    fullText: transcript.fullText,
    language: transcript.language,
    createdAt: transcript.createdAt
  });
}));

router.get('/:id/action-items', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findFirst({
    where: { id: req.params.id }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!canViewUserData(req.userId!, meeting.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to view this meeting' });
  }

  const { page = '1', limit = '50' } = req.query;
  const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNumber = Math.max(1, Math.min(parseInt(limit as string, 10) || 50, 200));
  const skip = (pageNumber - 1) * limitNumber;

  const [actionItems, total] = await Promise.all([
    prisma.actionItem.findMany({
      where: { meetingId: req.params.id },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limitNumber,
      select: {
        id: true,
        meetingId: true,
        userId: true,
        title: true,
        description: true,
        assignee: true,
        dueDate: true,
        priority: true,
        status: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    }),
    prisma.actionItem.count({
      where: { meetingId: req.params.id },
    }),
  ]);

  res.json({
    data: actionItems.map((item) => ({
      ...item,
      tags: jsonArrayToStringArray(item.tags)
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
  const meeting = await prisma.meeting.findFirst({
    where: { id: req.params.id },
    select: { id: true, title: true, userId: true }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Check permissions
  if (!canViewUserData(req.userId!, meeting.userId, req.userTeams || [])) {
    return res.status(403).json({ message: 'You do not have permission to export this meeting' });
  }

  const actionItems = await prisma.actionItem.findMany({
    where: { meetingId: meeting.id },
    orderBy: { createdAt: 'asc' },
    select: {
      title: true,
      description: true,
      assignee: true,
      priority: true,
      status: true,
      dueDate: true,
      tags: true,
    },
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
  const { title, description, duration, participants } = req.body as z.infer<typeof createMeetingSchema>;

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description,
      duration,
      participants: participants,
      userId: req.userId!,
      status: 'completed',
      processingProgress: 100,
      completedAt: new Date()
    }
  });

  res.status(201).json(meeting);
}));

router.patch('/:id', apiLimiter, authenticate, validate(updateMeetingSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, priority, status } = req.body as z.infer<typeof updateMeetingSchema>;

  const meeting = await prisma.meeting.findFirst({
    where: { id: req.params.id }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Only owner can modify
  if (meeting.userId !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to modify this meeting' });
  }

  const updated = await prisma.meeting.update({
    where: { id: req.params.id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {})
    }
  });

  await syncMeetingStatusFromActionItems(req.params.id);

  const refreshed = await prisma.meeting.findUnique({ where: { id: req.params.id } });

  res.json(refreshed ?? updated);
}));

router.delete('/:id', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findFirst({
    where: { id: req.params.id }
  });

  if (!meeting) {
    return res.status(404).json({ message: 'Meeting not found' });
  }

  // Only owner can delete
  if (meeting.userId !== req.userId!) {
    return res.status(403).json({ message: 'You do not have permission to delete this meeting' });
  }

  await prisma.meeting.delete({ where: { id: req.params.id } });

  res.status(204).send();
}));

export default router;
