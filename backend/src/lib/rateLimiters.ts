import rateLimit from 'express-rate-limit';

/**
 * Shared rate limiter configurations for all backend routes.
 *
 * Each limiter targets a specific class of endpoint so that a burst on one
 * part of the API — e.g. a flurry of login attempts — doesn't exhaust the
 * budget for unrelated operations.
 *
 * Limiters (3):
 *   authLimiter  —  10 / 15 min  — sensitive auth endpoints
 *   apiLimiter   —  60 /  1 min  — general authenticated CRUD
 *   uploadLimiter — 10 /  1 hr   — meeting uploads + AI proxy (cost protection)
 */

/** Strict — sensitive auth endpoints (login, register, password reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
});

/** General — read-mostly CRUD (meetings, action items, teams, workspace, profile). */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Cost protection — meeting uploads + AI proxy (both hit external APIs).
 * 10 requests per hour per IP keeps runaway scripts in check.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads or AI requests. Please slow down.' },
});
