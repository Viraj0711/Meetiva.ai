import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export {
  sanitize,
  uuidField,
  emailField,
  passwordField,
  optionalDescription,
  iso8601Field,
  paginationQuerySchema,
  statusFilterSchema,
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  updateProfileSchema,
  createMeetingSchema,
  updateMeetingSchema,
  createActionItemSchema,
  updateActionItemSchema,
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateMemberProfileSchema,
  chatMessageSchema,
  createEventSchema,
  contactFormSchema,
  notificationQuerySchema,
  nameField,
} from './schemas';

// ── UUID helpers ───────────────────────────────────────────────────────────

/** UUID v4 regex pattern — case-insensitive. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Express `router.param()` callback factory that validates a route parameter
 * is a well-formed UUID v4. Returns 400 with a descriptive message on failure.
 *
 * Usage:
 *   router.param('id',     validateUuidParam('id'));
 *   router.param('teamId', validateUuidParam('teamId'));
 *
 * This catches malformed UUIDs before they reach the database (which would return
 * a 500 instead of a 400 for invalid UUID strings).
 */
export const validateUuidParam = (paramName: string) =>
  (req: Request, res: Response, next: NextFunction, value: string): void => {
    if (!UUID_REGEX.test(value)) {
      res.status(400).json({
        message: `Invalid ${paramName}: must be a valid UUID`,
      });
      return;
    }
    next();
  };

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Express middleware factory that validates `req.body` (or a custom source)
 * against a Zod schema.  On success the parsed (and potentially transformed)
 * value is written back to `req.body` so downstream handlers receive clean
 * typed data.  On failure a 400 with structured error messages is returned.
 */
export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = flattenZodErrors(result.error);
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }
    // Replace the source with the parsed (coerced/transformed) data
    (req as any)[source] = result.data;
    next();
  };

/** Turn a ZodError into a flat `{ field: message }` map. */
export const flattenZodErrors = (error: ZodError): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!map[path]) {
      map[path] = issue.message;
    }
  }
  return map;
};
