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

const router = Router();

const maxResultsSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(50).optional().default(20),
});

router.get('/status', apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const status = await getCalendarConnectionStatus(req.userId!);
    return res.json({ data: status });
  } catch (error) {
    console.error('Calendar status error:', error);
    return res.status(500).json({ message: 'Failed to fetch calendar status' });
  }
});

router.get(
  '/events',
  apiLimiter,
  authenticate,
  validate(maxResultsSchema, 'query'),
  async (req: AuthRequest, res: Response) => {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch calendar events';
      const status = message.includes('not connected') ? 403 : 500;
      return res.status(status).json({ message });
    }
  }
);

router.get('/events/upcoming', apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const calendar = await getGoogleCalendarClient(req.userId!);
    const result = await calendar.events.list({
      calendarId: 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
      maxResults: 10,
    });

    return res.json({ data: result.data.items || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch upcoming events';
    const status = message.includes('not connected') ? 403 : 500;
    return res.status(status).json({ message });
  }
});

router.post(
  '/create-event',
  apiLimiter,
  authenticate,
  validate(createEventSchema),
  async (req: AuthRequest, res: Response) => {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create calendar event';
      const status = message.includes('not connected') ? 403 : 500;
      return res.status(status).json({ message });
    }
  }
);

router.post('/disconnect', apiLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await revokeGoogleConnection(req.userId!);
    return res.json({ message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
});

export default router;
