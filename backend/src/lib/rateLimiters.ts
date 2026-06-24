import rateLimit from 'express-rate-limit';

/**
 * Shared rate limiter configurations for all backend routes.
 *
 * Each limiter targets a specific class of endpoint so that a burst on one
 * part of the API — e.g. a flurry of login attempts — doesn't exhaust the
 * global budget for unrelated operations like fetching meetings or posting
 * chat messages.
 */

/** Strict — sensitive auth endpoints (login, register, password reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
});

/** Moderate — authenticated profile / refresh endpoints. */
export const authedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Moderate — meeting uploads (large payloads, expensive Grok analysis). */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads. Please slow down.' },
});

/** General — read-mostly CRUD (meetings, action items, teams, workspace). */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Strict — AI proxy (cost protection). */
export const grokLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests. Please slow down.' },
});
