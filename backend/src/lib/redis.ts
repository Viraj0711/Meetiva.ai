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
      retryStrategy(times) {
        if (times > 5) {
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
    sendCommand: (...args: [string, ...string[]]) =>
      client.call(...args) as Promise<boolean | number | string | (boolean | number | string)[]>,
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
