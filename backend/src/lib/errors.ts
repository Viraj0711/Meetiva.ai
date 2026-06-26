import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Application-level error with an HTTP status code.
 * Throw this from any route handler and the global error middleware
 * will pick it up and send the right status + message.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Wraps an async Express route handler so thrown errors (or rejected promises)
 * automatically flow to the global error handler via next().
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 *
 * Ponytail note: this eliminates ~40 identical try/catch blocks.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

