import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const log = createLogger('meetiva:http');

interface RateLimitHeaders {
  'ratelimit-limit'?: string;
  'ratelimit-remaining'?: string;
  'ratelimit-reset'?: string;
  'retry-after'?: string;
}

const getRateLimitHeaders = (res: Response): RateLimitHeaders => {
  const headers: RateLimitHeaders = {};

  const limit = res.getHeader('ratelimit-limit');
  if (limit !== undefined) headers['ratelimit-limit'] = String(limit);

  const remaining = res.getHeader('ratelimit-remaining');
  if (remaining !== undefined) headers['ratelimit-remaining'] = String(remaining);

  const reset = res.getHeader('ratelimit-reset');
  if (reset !== undefined) headers['ratelimit-reset'] = String(reset);

  const retryAfter = res.getHeader('retry-after');
  if (retryAfter !== undefined) headers['retry-after'] = String(retryAfter);

  return headers;
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 1000 / 60).toFixed(1)}min`;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const rateLimitHeaders = getRateLimitHeaders(res);
    const userId = (req as any).userId ?? '-';

    const data: Record<string, unknown> = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: formatDuration(durationMs),
      ip: req.ip,
      uid: userId,
    };

    if (rateLimitHeaders['ratelimit-remaining']) {
      data.rl = `${rateLimitHeaders['ratelimit-remaining']}/${rateLimitHeaders['ratelimit-limit'] ?? '?'}`;
    }
    if (rateLimitHeaders['retry-after']) {
      data.retryAfter = `${rateLimitHeaders['retry-after']}s`;
    }

    const msg = `${req.method} ${req.originalUrl} -> ${res.statusCode}`;

    if (res.statusCode >= 500) {
      log.error(msg, data);
    } else if (res.statusCode >= 400) {
      log.warn(msg, data);
    } else {
      log.info(msg, data);
    }
  });

  next();
};
