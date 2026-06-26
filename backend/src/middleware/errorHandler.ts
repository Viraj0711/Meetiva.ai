import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

/**
 * Global Express error-handling middleware.
 *
 * Place this AFTER all route registrations in index.ts.
 * Handles:
 *   - AppError (typed errors with status codes)
 *   - Prisma known-request errors (P2002 → 409, P2025 → 404)
 *   - Everything else → 500
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── AppError — throw-and-forward from asyncHandler ──────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // ── Prisma known-request errors ─────────────────────────────────────────
  const prismaErr = err as { code?: string; meta?: Record<string, unknown> };
  if (prismaErr.code) {
    switch (prismaErr.code) {
      case 'P2002':
        // Unique constraint violation
        res.status(409).json({
          message: 'A record with this value already exists.',
          code: prismaErr.code,
        });
        return;
      case 'P2025':
        // Record not found
        res.status(404).json({
          message: 'Record not found.',
          code: prismaErr.code,
        });
        return;
    }
  }

  // ── Generic / unexpected ────────────────────────────────────────────────
  console.error(`[ErrorHandler] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(500).json({ message });
};
