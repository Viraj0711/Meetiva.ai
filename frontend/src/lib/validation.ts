/**
 * Frontend validation helpers.
 *
 * Re-exports all shared Zod schemas (canonical source: `shared/validation.ts`)
 * and provides a `zodResolver` convenience for react-hook-form.
 */
export {
  // Reusable fields
  uuidField,
  emailField,
  passwordField,
  optionalDescription,
  iso8601Field,

  // Auth
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  updateProfileSchema,

  // Meetings
  createMeetingSchema,
  updateMeetingSchema,

  // Action Items
  createActionItemSchema,
  updateActionItemSchema,

  // Teams
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateMemberProfileSchema,
  chatMessageSchema,

  // Calendar
  createEventSchema,

  // Contact
  contactFormSchema,

  // Notifications
  notificationQuerySchema,
} from '@shared/schemas';

import { zodResolver as _zodResolver } from '@hookform/resolvers/zod';

/**
 * Wraps @hookform/resolvers zodResolver with relaxed generics to work around
 * Zod v3.23+ / @hookform/resolvers type incompatibility (ZodObject no longer
 * satisfies ZodType<any,any,any> as a generic constraint).
 * Runtime behaviour is identical.
 */
export const zodResolver = _zodResolver as unknown as (
  schema: any,
  resolverOptions?: any,
) => any;
