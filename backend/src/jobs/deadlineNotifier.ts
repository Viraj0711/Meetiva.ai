import prisma from '../lib/prisma';

const ONE_HOUR_MS = 60 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

const createInAppReminderNotifications = async () => {
  const now = new Date();
  const upcomingWindow = new Date(now.getTime() + 24 * ONE_HOUR_MS);

  const dueSoonItems = await prisma.actionItem.findMany({
    where: {
      status: { in: ['pending', 'in_progress'] },
      dueDate: {
        gte: now,
        lte: upcomingWindow,
      },
      reminderSentAt: null,
    },
    include: {
      meeting: {
        select: { title: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  for (const item of dueSoonItems) {
    const dueText = item.dueDate ? item.dueDate.toISOString() : 'soon';

    await prisma.$transaction([
      prisma.notification.create({
        data: {
          userId: item.userId,
          actionItemId: item.id,
          type: 'DEADLINE_REMINDER',
          channel: 'in_app',
          title: 'Deadline approaching in 24 hours',
          message: `${item.title} from meeting "${item.meeting.title}" is due by ${dueText}.`,
        },
      }),
      prisma.actionItem.update({
        where: { id: item.id },
        data: { reminderSentAt: now },
      }),
    ]);

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // Placeholder hook for SMTP transport integration if enabled.
      console.log(`Deadline reminder queued for email to ${item.user.email}`);
    }
  }
};

export const runDeadlineReminderSweep = async () => {
  try {
    await createInAppReminderNotifications();
  } catch (error) {
    console.error('Deadline notifier sweep failed:', error);
  }
};

export const startDeadlineNotifier = async () => {
  try {
    await runDeadlineReminderSweep();
  } catch (error) {
    console.warn('⚠️ Initial deadline notifier sweep skipped (db may be unavailable)');
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    void runDeadlineReminderSweep();
  }, ONE_HOUR_MS);

  console.log('✅ Deadline notifier started (hourly cadence)');
};
