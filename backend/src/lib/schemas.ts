/**
 * ── Canonical Zod validation schemas ──────────────────────────────────────
 *
 * Pure Zod schemas only — no Express middleware here.  Import this file
 * from both backend (Express routes) and frontend (React forms).
 *
 * Backend:   import { ... } from '../lib/schemas';
 * Frontend:  import { ... } from '@shared/schemas';
 *
 * Express-specific middleware lives in `validation.ts` alongside this file.
 */
import { z } from 'zod';

// ── Reusable field schemas ─────────────────────────────────────────────────

/** Encode HTML special characters to prevent stored XSS. */
export const sanitize = (value: string): string =>
  value
    .replace(/[<]/g, '&lt;')
    .replace(/[>]/g, '&gt;');

export const uuidField = z.string().uuid('Must be a valid UUID');

/** Validate a 24-character hex string (MongoDB ObjectId format). */
export const objectIdField = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  'Must be a valid ObjectId (24-character hex string)'
);
export const emailField = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()
  .transform((val) => sanitize(val));
export const passwordField = z.string().min(8, 'Password must be at least 8 characters');
export const optionalDescription = z
  .string()
  .trim()
  .max(5000)
  .transform((val) => sanitize(val))
  .optional()
  .nullable();
// offset: true accepts BOTH UTC ("...Z") and numeric-offset ISO-8601
// ("...+05:30") so the frontend can send local timezone-aware datetimes.
export const iso8601Field = z.string().datetime({ offset: true, message: 'Must be an ISO-8601 date' });

/** Validates and coerces query params for paginated list endpoints. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  teamId: z.string().optional(),
});

/** Validates and coerces query params with optional status filter. */
export const statusFilterSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

// ── Auth schemas ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailField,
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50)
    .transform((val) => sanitize(val)),
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: emailField,
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().length(64, 'Invalid reset token'),
  password: passwordField,
});

export const changePasswordSchema = z.object({
  // Optional so accounts without a password yet (Google Sign-In users) can set
  // one. The route requires currentPassword only when the user HAS a password.
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: passwordField,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: emailField,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

export const resendOtpSchema = z.object({
  email: emailField,
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80)
    .transform((val) => sanitize(val))
    .optional(),
  email: emailField.optional(),
}).refine(data => data.name || data.email, {
  message: 'At least one of name or email must be provided',
});

// ── Meeting schemas ────────────────────────────────────────────────────────

export const createMeetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200)
    .transform((val) => sanitize(val)),
  description: optionalDescription,
  duration: z.number().int().min(0).optional(),
  participants: z.array(
    z
      .string()
      .trim()
      .transform((val) => sanitize(val))
  ).optional().default([]),
});

export const updateMeetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .transform((val) => sanitize(val))
    .optional(),
  description: optionalDescription,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed']).optional(),
});

// ── Task schemas ──────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  meetingId: objectIdField,
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(500)
    .transform((val) => sanitize(val)),
  description: optionalDescription,
  assignee: z
    .string()
    .trim()
    .max(200)
    .transform((val) => sanitize(val))
    .optional()
    .nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .transform((val) => sanitize(val))
    .optional(),
  description: optionalDescription,
  assignee: z
    .string()
    .trim()
    .max(200)
    .transform((val) => sanitize(val))
    .optional()
    .nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

// ── Team schemas ───────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(100)
    .transform((val) => sanitize(val)),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((val) => sanitize(val))
    .optional()
    .nullable(),
});

export const inviteMemberSchema = z.object({
  email: emailField,
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['LEAD', 'MEMBER']),
});

export const updateMemberProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .transform((val) => sanitize(val))
    .optional(),
  email: emailField.optional(),
}).refine(data => data.name || data.email, {
  message: 'At least one of name or email must be provided',
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000)
    .transform((val) => sanitize(val)),
});

// ── Calendar schemas ───────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(140)
    .transform((val) => sanitize(val)),
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((val) => sanitize(val))
    .optional()
    .default(''),
  startTime: iso8601Field,
  endTime: iso8601Field,
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((val) => sanitize(val))
    .optional(),
}).refine(data => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
  message: 'endTime must be later than startTime',
  path: ['endTime'],
});

// ── Contact form schemas ───────────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100)
    .transform((val) => sanitize(val)),
  email: emailField,
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(200)
    .transform((val) => sanitize(val)),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(5000)
    .transform((val) => sanitize(val)),
});

// ── Notification schemas ───────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

// ── Name field (backend-specific max length) ───────────────────────────────

export const nameField = z
  .string()
  .trim()
  .min(2, 'Must be at least 2 characters')
  .max(100)
  .transform((val) => sanitize(val));
