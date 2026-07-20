import RefreshToken from '../models/RefreshToken';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:cleanup');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

const cleanupExpiredRefreshTokens = async (): Promise<void> => {
  const now = new Date();

  const { deletedCount } = await RefreshToken.deleteMany({
    expiresAt: { $lt: now },
  });

  if (deletedCount && deletedCount > 0) {
    log.info('Expired refresh tokens deleted', { count: deletedCount });
  }
};

export const runRefreshTokenCleanup = async (): Promise<void> => {
  try {
    await cleanupExpiredRefreshTokens();
  } catch (error) {
    log.error('Refresh token cleanup sweep failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const startRefreshTokenCleanup = async (): Promise<void> => {
  try {
    await runRefreshTokenCleanup();
  } catch (error) {
    log.warn('Initial refresh token cleanup sweep skipped (db may be unavailable)');
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    void runRefreshTokenCleanup();
  }, SIX_HOURS_MS);

  log.info('Starting cleanup job', { schedule: 'every 6h' });
};

export const stopRefreshTokenCleanup = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    log.info('Refresh token cleanup stopped');
  }
};
