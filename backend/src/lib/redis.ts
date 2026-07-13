import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;
let redisError: Error | null = null;

/**
 * Create and return the singleton Redis client.
 *
 * If REDIS_URL is not set the client stays null and every call returns
 * null — this lets the application degrade gracefully to in-memory stores
 * when Redis is not available (e.g. local dev without Docker).
 */
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
      retryStrategy(times) {
        if (times > 5) {
          console.warn('[redis] Max retries reached — falling back to in-memory stores');
          redis = null;
          redisError = new Error('Redis connection failed');
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('[redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[redis] Connected');
    });

    return redis;
  } catch (err) {
    redisError = err instanceof Error ? err : new Error(String(err));
    console.warn('[redis] Failed to create client — falling back to in-memory stores');
    return null;
  }
};

/**
 * Create a `rate-limit-redis` RedisStore instance, or return `undefined`
 * so that `express-rate-limit` falls back to its built-in memory store.
 */
export const createRateLimitStore = (): RedisStore | undefined => {
  const client = getRedisClient();
  // Only create a RedisStore when the client is actually connected.
  // With lazyConnect:true the client object exists but will fail with
  // "Connection is closed" if we try to send commands before the connection
  // succeeds — or after a connection failure. In those cases we return
  // undefined so express-rate-limit falls back to its built-in memory store.
  if (!client || client.status !== 'ready') return undefined;

  return new RedisStore({
    sendCommand: (...args: [string, ...string[]]) =>
      client.call(...args) as Promise<boolean | number | string | (boolean | number | string)[]>,
    prefix: 'meetiva:rl:',
  });
};

/**
 * Gracefully disconnect the Redis client. Safe to call multiple times.
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[redis] Disconnected');
  }
};

// ── Password reset token helpers ─────────────────────────────────────────────
// These use Redis when available, falling back to an in-memory Map so the app
// works without Redis (e.g. local dev, single-process deployments).

const RESET_TOKEN_PREFIX = 'meetiva:reset:';
const RESET_TOKEN_TTL = 60 * 60; // 1 hour in seconds

/** In-memory fallback used when Redis is not available. */
const fallbackResetTokens = new Map<string, { userId: string }>();

/**
 * Store a password reset token with a 1-hour TTL.
 */
export const setResetToken = async (token: string, userId: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.set(`${RESET_TOKEN_PREFIX}${token}`, userId, 'EX', RESET_TOKEN_TTL);
  } else {
    fallbackResetTokens.set(token, { userId });
    // Manually expire after 1 hour for the fallback
    setTimeout(() => {
      fallbackResetTokens.delete(token);
    }, RESET_TOKEN_TTL * 1000).unref();
  }
};

/**
 * Retrieve a password reset token's userId, or `null` if missing/expired.
 */
export const getResetToken = async (token: string): Promise<string | null> => {
  const client = getRedisClient();
  if (client) {
    const result = await client.get(`${RESET_TOKEN_PREFIX}${token}`);
    return result ?? null;
  }
  const stored = fallbackResetTokens.get(token);
  return stored ? stored.userId : null;
};

/**
 * Delete a password reset token (consumed after successful reset).
 */
export const deleteResetToken = async (token: string): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    await client.del(`${RESET_TOKEN_PREFIX}${token}`);
  } else {
    fallbackResetTokens.delete(token);
  }
};
