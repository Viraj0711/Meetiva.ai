import { Router, Response } from 'express';
import z from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getCalendarConnectionStatus,
  getGoogleCalendarClient,
  revokeGoogleConnection,
} from '../services/googleCalendar';
import { apiLimiter } from '../lib/rateLimiters';
import { validate, createEventSchema } from '../lib/validation';
import { asyncHandler, AppError } from '../lib/errors';

const router = Router();

const maxResultsSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(50).optional().default(20),
});

router.get('/status', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await getCalendarConnectionStatus(req.userId!);
  return res.json({ data: status });
}));

router.get(
  '/events',
  apiLimiter,
  authenticate,
  validate(maxResultsSchema, 'query'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { maxResults } = req.query as unknown as z.infer<typeof maxResultsSchema>;
    const calendar = await getGoogleCalendarClient(req.userId!);

    const result = await calendar.events.list({
      calendarId: 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
      maxResults,
    });

    return res.json({ data: result.data.items || [] });
  })
);

router.get('/events/upcoming', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const calendar = await getGoogleCalendarClient(req.userId!);
  const result = await calendar.events.list({
    calendarId: 'primary',
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
    maxResults: 10,
  });

  return res.json({ data: result.data.items || [] });
}));

router.post(
  '/create-event',
  apiLimiter,
  authenticate,
  validate(createEventSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, startTime, endTime, timeZone } = req.body as z.infer<typeof createEventSchema>;

    const calendar = await getGoogleCalendarClient(req.userId!);
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title.trim(),
        description: description || '',
        start: { dateTime: new Date(startTime).toISOString(), timeZone: timeZone || 'UTC' },
        end: { dateTime: new Date(endTime).toISOString(), timeZone: timeZone || 'UTC' },
      },
    });

    return res.status(201).json({ data: result.data, message: 'Event created successfully' });
  })
);

router.post('/disconnect', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  await revokeGoogleConnection(req.userId!);
  return res.json({ message: 'Google Calendar disconnected' });
}));

export default router;
