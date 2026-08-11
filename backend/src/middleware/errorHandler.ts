import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import mongoose from 'mongoose';

/**
 * Global Express error-handling middleware.
 *
 * Place this AFTER all route registrations in index.ts.
 * Handles:
 *   - AppError (typed errors with status codes)
 *   - Mongoose ValidationError (schema validation → 400)
 *   - Mongoose CastError (invalid ObjectId → 400)
 *   - MongoDB duplicate key error (code 11000 → 409)
 *   - Everything else → 500
 *
 * Security: Internal details are ALWAYS logged server-side but NEVER sent
 * to the client in production.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Log everything server-side for debugging ────────────────────────────
  console.error(`[ErrorHandler] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // ── AppError — throw-and-forward from asyncHandler ──────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  // ── Mongoose validation errors ──────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  // ── Mongoose CastError (e.g. invalid ObjectId) ──────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  // ── MongoDB driver errors (duplicate key, etc.) ─────────────────────────
  const mongoErr = err as { code?: number; keyValue?: Record<string, unknown>; keyPattern?: Record<string, unknown> };
  if (mongoErr.code === 11000) {
    const fields = Object.keys(mongoErr.keyPattern || {}).join(', ');
    res.status(409).json({
      message: `A record with this ${fields} already exists.`,
    });
    return;
  }

  // ── Generic / unexpected ────────────────────────────────────────────────
  res.status(500).json({ message: 'Internal server error' });
};
