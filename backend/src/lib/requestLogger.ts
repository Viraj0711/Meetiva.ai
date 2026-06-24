import { Request, Response, NextFunction } from 'express';

/**
 * Interface for the rate limit headers set by `express-rate-limit`
 * when `standardHeaders: true` is configured.
 */
interface RateLimitHeaders {
  'ratelimit-limit'?: string;
  'ratelimit-remaining'?: string;
  'ratelimit-reset'?: string;
  'retry-after'?: string;
}

/**
 * Extract rate-limit related headers from a response object.
 */
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

/**
 * Format milliseconds into a human-readable duration string.
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 1000 / 60).toFixed(1)}min`;
};

/**
 * Conditional logging levels based on status code.
 */
const statusLabel = (statusCode: number): string => {
  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARN ';
  if (statusCode >= 300) return 'REDIR';
  return 'OK   ';
};

/**
 * Request logging middleware.
 *
 * Logs every HTTP request with:
 *  - Timestamp, method, path, status code, duration
 *  - Rate-limit headers set by express-rate-limit (when present)
 *  - User-ID hint for authenticated requests
 *
 * Place this middleware AFTER `express.json()` / `cookieParser()` but
 * BEFORE the route mounts so it wraps every matched route handler.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Capture the original `end` to hook into response completion
  const originalEnd = res.end.bind(res);

  // Override res.end — cast through `any` to bypass strict Node.js overloaded type
  res.end = function (this: Response, ...args: any[]): any {
    const durationMs = Date.now() - start;
    const rateLimitHeaders = getRateLimitHeaders(res);
    const userId = (req as any).userId ?? '-';

    // Build a compact log line
    const parts: string[] = [
      new Date().toISOString(),
      `[${statusLabel(res.statusCode)}]`,
      `${req.method} ${req.originalUrl}`,
      `→ ${res.statusCode}`,
      `(${formatDuration(durationMs)})`,
      `ip=${req.ip}`,
      `uid=${userId}`,
    ];

    // Append rate-limit info when present (helps debug throttling)
    if (rateLimitHeaders['ratelimit-remaining']) {
      parts.push(
        `rl=${rateLimitHeaders['ratelimit-remaining']}/${rateLimitHeaders['ratelimit-limit'] ?? '?'}`,
      );
    }
    if (rateLimitHeaders['retry-after']) {
      parts.push(`retry-after=${rateLimitHeaders['retry-after']}s`);
    }

    // Log at different levels depending on status
    if (res.statusCode >= 500) {
      console.error(parts.join('  '));
    } else if (res.statusCode >= 400) {
      console.warn(parts.join('  '));
    } else {
      console.log(parts.join('  '));
    }

    // Call original end
    return originalEnd(...args);
  } as typeof res.end;

  next();
};
