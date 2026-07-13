import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from './redis';

/**
 * Shared rate limiter configurations for all backend routes.
 *
 * Each limiter targets a specific class of endpoint so that a burst on one
 * part of the API — e.g. a flurry of login attempts — doesn't exhaust the
 * budget for unrelated operations.
 *
 * All limiters auto-detect whether Redis is available (via REDIS_URL env var).
 * When Redis is present the counters are shared across all server instances;
 * otherwise each process tracks its own counters in-memory.
 *
 * Limiters (3):
 *   authLimiter  —  10 / 5 min  — sensitive auth endpoints
 *   apiLimiter   —  60 /  1 min  — general authenticated CRUD
 *   uploadLimiter — 10 /  1 hr   — meeting uploads + AI proxy (cost protection)
 */

/**
 * Create a new store for each limiter so express-rate-limit doesn't complain
 * about ERR_ERL_STORE_REUSE (each limiter must have its own store instance).
 * Returns undefined when Redis is unavailable (falls back to in-memory).
 */
const withFreshStore = <T extends object>(config: T): T => {
  const store = createRateLimitStore();
  return store ? { ...config, store } : config;
};

/** Strict — sensitive auth endpoints (login, register, password reset). */
export const authLimiter = rateLimit(withFreshStore({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 5 minutes.' },
}));

/** General — read-mostly CRUD (meetings, action items, teams, workspace, profile). */
export const apiLimiter = rateLimit(withFreshStore({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
}));

/**
 * Cost protection — meeting uploads + AI proxy (both hit external APIs).
 * 10 requests per hour per IP keeps runaway scripts in check.
 */
export const uploadLimiter = rateLimit(withFreshStore({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads or AI requests. Please slow down.' },
}));
