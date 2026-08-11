import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import mongoose from 'mongoose';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:api');

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  log.error(`${err.name}: ${err.message}`, {
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  const mongoErr = err as { code?: number; keyValue?: Record<string, unknown>; keyPattern?: Record<string, unknown> };
  if (mongoErr.code === 11000) {
    const fields = Object.keys(mongoErr.keyPattern || {}).join(', ');
    res.status(409).json({
      message: `A record with this ${fields} already exists.`,
    });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
