import type { NotificationType } from '../lib/shared';
import ActionItem from '../models/ActionItem';
import Notification from '../models/Notification';
import mongoose from 'mongoose';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:deadline');

const ONE_HOUR_MS = 60 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

const createInAppReminderNotifications = async () => {
  const now = new Date();
  const upcomingWindow = new Date(now.getTime() + 24 * ONE_HOUR_MS);

  const dueSoonItems = await ActionItem.find({
    status: { $in: ['pending', 'in_progress'] },
    dueDate: {
      $gte: now,
      $lte: upcomingWindow,
    },
    reminderSentAt: null,
  })
    .populate('meetingId', 'title')
    .populate('userId', 'name email')
    .lean() as any[];

  if (dueSoonItems.length === 0) {
    return;
  }

  await Notification.insertMany(
    dueSoonItems.map((item) => ({
      userId: item.userId._id || item.userId,
      actionItemId: item._id,
      type: 'DEADLINE_REMINDER' as const satisfies NotificationType,
      channel: 'in_app',
      title: 'Deadline approaching in 24 hours',
      message: `${item.title} from meeting "${(item.meetingId as any)?.title || 'Unknown'}" is due by ${item.dueDate ? item.dueDate.toISOString() : 'soon'}.`,
    }))
  );

  await ActionItem.updateMany(
    { _id: { $in: dueSoonItems.map((item) => item._id) } },
    { $set: { reminderSentAt: now } }
  );

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    for (const item of dueSoonItems) {
      log.info('Deadline reminder queued for email', { email: (item.userId as any)?.email });
    }
  }
};

export const runDeadlineReminderSweep = async () => {
  try {
    await createInAppReminderNotifications();
  } catch (error) {
    log.error('Deadline notifier sweep failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const startDeadlineNotifier = async () => {
  try {
    await runDeadlineReminderSweep();
  } catch (error) {
    log.warn('Initial deadline notifier sweep skipped (db may be unavailable)');
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    void runDeadlineReminderSweep();
  }, ONE_HOUR_MS);

  log.info('Starting deadline job', { schedule: 'every 1h' });
};

export const stopDeadlineNotifier = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    log.info('Deadline notifier stopped');
  }
};
