import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { createLogger } from './logger';

const log = createLogger('meetiva:redis');

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;
let redisError: Error | null = null;

export const getRedisClient = (): Redis | null => {
  if (redis !== null) return redis;
  if (redisError !== null) return null;

  if (!REDIS_URL) {
    redisError = new Error('REDIS_URL is not set');
    return null;
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      commandTimeout: 3000,
      retryStrategy(times) {
        if (times > 3) {
          log.warn('Max retries reached — falling back to in-memory stores');
          redis = null;
          redisError = new Error('Redis connection failed');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      log.warn('Connection error', { error: err.message });
    });

    redis.on('connect', () => {
      log.info('Connected');
    });

    redis.on('end', () => {
      log.warn('Connection ended — falling back to in-memory stores');
      redis = null;
      redisError = new Error('Redis connection ended');
    });

    return redis;
  } catch (err) {
    redisError = err instanceof Error ? err : new Error(String(err));
    log.warn('Failed to create client — falling back to in-memory stores');
    return null;
  }
};

export const createRateLimitStore = (): RedisStore | undefined => {
  const client = getRedisClient();
  if (!client || client.status !== 'ready') return undefined;

  return new RedisStore({
    sendCommand: (...args: [string, ...string[]]) => {
      // Guard against using a client that closed after the initial ready check
      if (!redis || redis.status !== 'ready') {
        return Promise.resolve(0) as Promise<boolean | number | string | (boolean | number | string)[]>;
      }
      return redis.call(...args) as Promise<boolean | number | string | (boolean | number | string)[]>;
    },
    prefix: 'meetiva:rl:',
  });
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    log.info('Disconnected');
  }
};

const RESET_TOKEN_PREFIX = 'meetiva:reset:';
const RESET_TOKEN_TTL = 60 * 60;

const fallbackResetTokens = new Map<string, { userId: string }>();

export const setResetToken = async (token: string, userId: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.set(`${RESET_TOKEN_PREFIX}${token}`, userId, 'EX', RESET_TOKEN_TTL);
  } else {
    fallbackResetTokens.set(token, { userId });
    setTimeout(() => {
      fallbackResetTokens.delete(token);
    }, RESET_TOKEN_TTL * 1000).unref();
  }
};

export const getResetToken = async (token: string): Promise<string | null> => {
  const client = getRedisClient();
  if (client) {
    const result = await client.get(`${RESET_TOKEN_PREFIX}${token}`);
    return result ?? null;
  }
  const stored = fallbackResetTokens.get(token);
  return stored ? stored.userId : null;
};

export const deleteResetToken = async (token: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.del(`${RESET_TOKEN_PREFIX}${token}`);
  } else {
    fallbackResetTokens.delete(token);
  }
};

// ── Email verification OTP helpers ───────────────────────────────────────────
// Same pattern as password reset tokens — Redis with in-memory fallback.

const OTP_PREFIX = 'meetiva:otp:';
const OTP_TTL = 5 * 60; // 5 minutes in seconds
const OTP_COOLDOWN = 60; // 1 minute cooldown between resends

/** In-memory fallback: Maps email → { otp, createdAt } */
const fallbackOtpTokens = new Map<string, { otp: string; createdAt: number }>();

/**
 * Store a 6-digit OTP for email verification with a 5-minute TTL.
 * If an existing OTP exists for this email, it is discarded.
 */
export const setOtp = async (email: string, otp: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    // Delete any existing OTP for this email first
    await client.del(`${OTP_PREFIX}${email}`);
    await client.set(`${OTP_PREFIX}${email}`, otp, 'EX', OTP_TTL);
  } else {
    // Discard old OTP and store new one
    fallbackOtpTokens.set(email, { otp, createdAt: Date.now() });
    setTimeout(() => {
      const stored = fallbackOtpTokens.get(email);
      if (stored && stored.otp === otp) {
        fallbackOtpTokens.delete(email);
      }
    }, OTP_TTL * 1000).unref();
  }
};

/**
 * Check whether a valid (non-expired) OTP currently exists for the email.
 * Used by login so a fresh code is only (re)generated when the previous one
 * has expired or is missing (e.g. server restarted with the in-memory
 * fallback, or Redis was cleared).
 */
export const hasValidOtp = async (email: string): Promise<boolean> => {
  const client = getRedisClient();
  if (client) {
    const ttl = await client.ttl(`${OTP_PREFIX}${email}`);
    return ttl > 0;
  }
  const stored = fallbackOtpTokens.get(email);
  if (!stored) return false;
  return Date.now() - stored.createdAt < OTP_TTL * 1000;
};

/**
 * Retrieve and validate an OTP for the given email.
 * Returns `true` if the OTP matches, `false` otherwise.
 * The OTP is consumed (deleted) on successful validation.
 */
export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const client = getRedisClient();
  if (client) {
    const stored = await client.get(`${OTP_PREFIX}${email}`);
    if (!stored || stored !== otp) return false;
    await client.del(`${OTP_PREFIX}${email}`);
    return true;
  }
  const stored = fallbackOtpTokens.get(email);
  if (!stored || stored.otp !== otp) return false;
  fallbackOtpTokens.delete(email);
  return true;
};

/**
 * Check if an OTP was recently sent (within cooldown period).
 * Returns the number of milliseconds remaining in the cooldown, or 0 if ready.
 */
export const getOtpCooldown = async (email: string): Promise<number> => {
  const client = getRedisClient();
  if (client) {
    const ttl = await client.ttl(`${OTP_PREFIX}${email}`);
    if (ttl <= 0) return 0;
    // TTL is remaining lifetime (up to 300s). Cooldown is 60s.
    // If TTL > 240 (i.e. sent within last 60s), return remaining cooldown.
    const elapsed = OTP_TTL - ttl;
    if (elapsed < OTP_COOLDOWN) {
      return (OTP_COOLDOWN - elapsed) * 1000;
    }
    return 0;
  }
  const stored = fallbackOtpTokens.get(email);
  if (!stored) return 0;
  const elapsed = Date.now() - stored.createdAt;
  if (elapsed < OTP_COOLDOWN * 1000) {
    return OTP_COOLDOWN * 1000 - elapsed;
  }
  return 0;
};

/**
 * Delete an OTP (e.g. after successful verification).
 */
export const deleteOtp = async (email: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.del(`${OTP_PREFIX}${email}`);
  } else {
    fallbackOtpTokens.delete(email);
  }
};

// ── OTP failed-attempt lockout helpers ───────────────────────────────────────
// Brute-force guard for 6-digit verification codes. After MAX_OTP_ATTEMPTS
// failed verifications for an email, further attempts are rejected with 429
// for OTP_ATTEMPT_LOCK_MS — regardless of the caller's IP (per-IP limiters
// alone can be bypassed by rotating IPs).

const OTP_ATTEMPT_PREFIX = 'meetiva:otp:attempts:';
const OTP_ATTEMPT_LOCK_MS = 15 * 60 * 1000; // 15 minutes

/** Max failed OTP verification attempts before the email is temporarily locked. */
export const MAX_OTP_ATTEMPTS = 5;

/** In-memory fallback: Maps email → { count, lockedAt } */
const fallbackOtpAttempts = new Map<string, { count: number; lockedAt: number }>();

/**
 * Record a failed OTP verification for an email.
 * Returns the new attempt count (1 for the first failure).
 */
export const incrementOtpFailedAttempts = async (email: string): Promise<number> => {
  const client = getRedisClient();
  if (client) {
    const key = `${OTP_ATTEMPT_PREFIX}${email}`;
    // Atomic INCR + EXPIRE so a crash between the two can't leave a key
    // without a TTL (which would permanently lock the email).
    const results = await client
      .multi()
      .incr(key)
      .expire(key, OTP_ATTEMPT_LOCK_MS / 1000)
      .exec();
    return Number(results?.[0]?.[1] ?? 1);
  }

  // Lazy expiry via lockedAt — expired entries are cleaned up on access.
  const stored = fallbackOtpAttempts.get(email);
  if (!stored || Date.now() - stored.lockedAt >= OTP_ATTEMPT_LOCK_MS) {
    fallbackOtpAttempts.set(email, { count: 1, lockedAt: Date.now() });
    return 1;
  }
  stored.count += 1;
  return stored.count;
};

/**
 * Current failed-attempt count for an email (0 if none / expired).
 */
export const getOtpFailedAttempts = async (email: string): Promise<number> => {
  const client = getRedisClient();
  if (client) {
    const count = await client.get(`${OTP_ATTEMPT_PREFIX}${email}`);
    return count ? parseInt(count, 10) : 0;
  }
  const stored = fallbackOtpAttempts.get(email);
  if (!stored) return 0;
  if (Date.now() - stored.lockedAt >= OTP_ATTEMPT_LOCK_MS) {
    fallbackOtpAttempts.delete(email);
    return 0;
  }
  return stored.count;
};

/**
 * Reset the failed-attempt counter (successful verification, or a fresh OTP).
 */
export const clearOtpFailedAttempts = async (email: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.del(`${OTP_ATTEMPT_PREFIX}${email}`);
  } else {
    fallbackOtpAttempts.delete(email);
  }
};

// ── OTP resend cap helpers ───────────────────────────────────────────────────
// A fresh code resets the failed-attempt budget (so a locked-out user can
// recover via resend), but resends are capped per window so an attacker can't
// farm unlimited fresh codes by rotating IPs to keep brute-forcing.

const OTP_RESEND_PREFIX = 'meetiva:otp:resends:';

/** Max verification-code resends per lock window (per email). */
export const MAX_OTP_RESENDS = 3;

/** In-memory fallback: Maps email → { count, at } */
const fallbackOtpResends = new Map<string, { count: number; at: number }>();

/**
 * Record a verification-code resend for an email.
 * Returns the new resend count (1 for the first resend).
 */
export const incrementOtpResendCount = async (email: string): Promise<number> => {
  const client = getRedisClient();
  if (client) {
    const key = `${OTP_RESEND_PREFIX}${email}`;
    const results = await client
      .multi()
      .incr(key)
      .expire(key, OTP_ATTEMPT_LOCK_MS / 1000)
      .exec();
    return Number(results?.[0]?.[1] ?? 1);
  }
  const stored = fallbackOtpResends.get(email);
  if (!stored || Date.now() - stored.at >= OTP_ATTEMPT_LOCK_MS) {
    fallbackOtpResends.set(email, { count: 1, at: Date.now() });
    return 1;
  }
  stored.count += 1;
  return stored.count;
};

/**
 * Current resend count for an email (0 if none / expired).
 */
export const getOtpResendCount = async (email: string): Promise<number> => {
  const client = getRedisClient();
  if (client) {
    const count = await client.get(`${OTP_RESEND_PREFIX}${email}`);
    return count ? parseInt(count, 10) : 0;
  }
  const stored = fallbackOtpResends.get(email);
  if (!stored) return 0;
  if (Date.now() - stored.at >= OTP_ATTEMPT_LOCK_MS) {
    fallbackOtpResends.delete(email);
    return 0;
  }
  return stored.count;
};

/**
 * Reset the resend counter (e.g. after successful verification).
 */
export const clearOtpResendCount = async (email: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.del(`${OTP_RESEND_PREFIX}${email}`);
  } else {
    fallbackOtpResends.delete(email);
  }
};
