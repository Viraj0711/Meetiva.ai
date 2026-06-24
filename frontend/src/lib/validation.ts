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
  paginationFields,

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
} from '@shared/validation';

export { zodResolver } from '@hookform/resolvers/zod';
