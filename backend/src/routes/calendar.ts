import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getCalendarConnectionStatus,
  getGoogleCalendarClient,
  revokeGoogleConnection,
} from '../services/googleCalendar';

const router = Router();

const getValidationError = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return false;
  }

  res.status(400).json({ message: 'Invalid input', errors: errors.array() });
  return true;
};

router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
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
  authenticate,
  [query('maxResults').optional().isInt({ min: 1, max: 50 })],
  async (req: AuthRequest, res: Response) => {
    if (getValidationError(req, res)) {
      return;
    }

    try {
      const maxResults = req.query.maxResults ? Number(req.query.maxResults) : 20;
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

router.get('/events/upcoming', authenticate, async (req: AuthRequest, res: Response) => {
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
  authenticate,
  [
    body('title').isString().trim().isLength({ min: 1, max: 140 }),
    body('description').optional().isString().trim().isLength({ max: 5000 }),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('timeZone').optional().isString().trim().isLength({ min: 1, max: 100 }),
  ],
  async (req: AuthRequest, res: Response) => {
    if (getValidationError(req, res)) {
      return;
    }

    const { title, description, startTime, endTime, timeZone } = req.body;

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      return res.status(400).json({ message: 'endTime must be later than startTime' });
    }

    try {
      const calendar = await getGoogleCalendarClient(req.userId!);
      const result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: title.trim(),
          description: typeof description === 'string' ? description.trim() : '',
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

router.post('/disconnect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await revokeGoogleConnection(req.userId!);
    return res.json({ message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
});

export default router;
