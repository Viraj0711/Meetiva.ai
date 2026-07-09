import RefreshToken from '../models/RefreshToken';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

const cleanupExpiredRefreshTokens = async (): Promise<void> => {
  const now = new Date();

  const { deletedCount } = await RefreshToken.deleteMany({
    expiresAt: { $lt: now },
  });

  if (deletedCount && deletedCount > 0) {
    console.log(`[RefreshTokenCleanup] Deleted ${deletedCount} expired refresh token(s)`);
  }
};

export const runRefreshTokenCleanup = async (): Promise<void> => {
  try {
    await cleanupExpiredRefreshTokens();
  } catch (error) {
    console.error('Refresh token cleanup sweep failed:', error);
  }
};

export const startRefreshTokenCleanup = async (): Promise<void> => {
  try {
    await runRefreshTokenCleanup();
  } catch (error) {
    console.warn('⚠️ Initial refresh token cleanup sweep skipped (db may be unavailable)');
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    void runRefreshTokenCleanup();
  }, SIX_HOURS_MS);

  console.log('✅ Refresh token cleanup started (6-hour cadence)');
};

export const stopRefreshTokenCleanup = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('Refresh token cleanup stopped.');
  }
};
