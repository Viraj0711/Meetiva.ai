/**
 * ── Canonical shared Zod validation schemas ──────────────────────────────
 *
 * This file is the single source of truth for all Zod validation schemas
 * used by both the backend (Express) and frontend (React) apps.
 *
 *  - Backend:  import from   ../../shared/validation
 *  - Frontend: import from   @shared/validation
 *
 * No Express-specific or React-specific code here — only pure Zod.
 */
import { z } from 'zod';

// ── Reusable field schemas ─────────────────────────────────────────────────

export const uuidField = z.string().uuid('Must be a valid UUID');
export const emailField = z.string().email('Invalid email address').toLowerCase().trim();
export const passwordField = z.string().min(8, 'Password must be at least 8 characters');
export const optionalDescription = z.string().trim().max(5000).optional().nullable();
export const iso8601Field = z.string().datetime({ message: 'Must be an ISO-8601 date' });

export const paginationFields = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
};

// ── Auth schemas ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailField,
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
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
  token: z.string().min(1, 'Token is required'),
  password: passwordField,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  email: emailField.optional(),
}).refine(data => data.name || data.email, {
  message: 'At least one of name or email must be provided',
});

// ── Meeting schemas ────────────────────────────────────────────────────────

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: optionalDescription,
  duration: z.number().int().min(0).optional(),
  participants: z.array(z.string()).optional().default([]),
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: optionalDescription,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed']).optional(),
});

// ── Action Item schemas ────────────────────────────────────────────────────

export const createActionItemSchema = z.object({
  meetingId: uuidField,
  title: z.string().trim().min(1, 'Title is required').max(500),
  description: optionalDescription,
  assignee: z.string().trim().max(200).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
});

export const updateActionItemSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: optionalDescription,
  assignee: z.string().trim().max(200).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

// ── Team schemas ───────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const inviteMemberSchema = z.object({
  email: emailField,
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['LEAD', 'MEMBER']),
});

export const updateMemberProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: emailField.optional(),
}).refine(data => data.name || data.email, {
  message: 'At least one of name or email must be provided',
});

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

// ── Calendar schemas ───────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140),
  description: z.string().trim().max(5000).optional().default(''),
  startTime: iso8601Field,
  endTime: iso8601Field,
  timeZone: z.string().trim().min(1).max(100).optional(),
}).refine(data => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
  message: 'endTime must be later than startTime',
  path: ['endTime'],
});

// ── Contact form schemas ───────────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: emailField,
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(5000),
});

// ── Notification schemas ───────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});
