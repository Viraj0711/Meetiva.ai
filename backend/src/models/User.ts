import mongoose, { Schema, Document, Types } from 'mongoose';
import type { SubscriptionTier, AccountType, OrgRole } from '../lib/shared';
import Meeting from './Meeting';
import Task from './ActionItem';
import TeamMember from './TeamMember';
import TeamInvitation from './TeamInvitation';
import Notification from './Notification';
import RefreshToken from './RefreshToken';
import GoogleCalendarAuth from './GoogleCalendarAuth';
import TeamChatMessage from './TeamChatMessage';
import Project from './Project';

export interface IUser extends Document {
  email: string;
  name: string;
  // null when the account has no password yet (e.g. created via Google Sign-In)
  hashedPassword: string | null;
  passwordSalt: string;
  // Set when the user signs in via Google. Used to link a Google account to
  // the existing Meetiva account (same email) instead of duplicating it.
  // `undefined` when the user has never signed in with Google (field absent,
  // so the sparse unique index excludes them).
  googleId: string | null | undefined;
  isActive: boolean;
  isVerified: boolean;
  subscriptionTier: SubscriptionTier;
  meetingCountThisMonth: number;
  meetingCountResetAt: Date | null;
  subscriptionExpiresAt: Date | null;
  // Enterprise fields
  accountType: AccountType;
  orgRole: OrgRole | null;
  organizationId: Types.ObjectId | null;
  createdByUserId: Types.ObjectId | null;
  forcePasswordChange: boolean;
  isRemoved: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    // Optional: null until the user sets a password (Google Sign-In users can
    // set one later via the change-password endpoint to enable email login).
    hashedPassword: { type: String, default: null },
    // Per-user random salt used to hash `hashedPassword` (see lib/password.ts).
    // bcrypt also embeds the salt in the hash string, so legacy records without
    // this column still verify correctly.
    passwordSalt: { type: String, default: '' },
    // IMPORTANT: no default. An explicit `default: null` would store `null`
    // in every unlinked document, and the sparse unique index below indexes
    // null values (sparse only skips MISSING fields) — allowing only ONE
    // unlinked user before E11000 ("A record with this googleId already
    // exists."). Omitting the field keeps unlinked users out of the index.
    googleId: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    subscriptionTier: {
      type: String,
      enum: ['FREE', 'TEAM', 'ENTERPRISE'],
      default: 'FREE',
    },
    meetingCountThisMonth: { type: Number, default: 0 },
    meetingCountResetAt: { type: Date, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    // Enterprise fields
    accountType: { type: String, enum: ['self', 'corporate'], default: 'self' },
    orgRole: { type: String, enum: ['super_admin', 'admin', 'manager', 'team_leader', 'member', null], default: null },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    forcePasswordChange: { type: Boolean, default: false },
    isRemoved: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'users' }
);

userSchema.index({ subscriptionTier: 1, meetingCountResetAt: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ accountType: 1 });
// One Google account maps to at most one Meetiva user (sparse: documents
// without googleId are excluded from the index, so unlinked users coexist).
userSchema.index({ googleId: 1 }, { sparse: true, unique: true });

// ── Cascade delete: when a User is deleted, remove all related data ────────
// Meeting.deleteMany() cascades to meeting summaries, transcripts and tasks
// via the Meeting model's pre('deleteMany') hook (and cleans up Firebase
// files). Corporate users are blocked from hard-delete by the guards below.
const deleteUserContent = async (userId: Types.ObjectId): Promise<void> => {
  await Promise.all([
    Meeting.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    TeamMember.deleteMany({ userId }),
    TeamInvitation.deleteMany({ invitedBy: userId }),
    Notification.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId }),
    GoogleCalendarAuth.deleteMany({ userId }),
    TeamChatMessage.deleteMany({ userId }),
    Project.deleteMany({ managerUserId: userId }),
  ]);
};

userSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (!doc) return;
  if (doc.accountType === 'corporate' && !doc.isRemoved) {
    throw new Error('Corporate users must be removed via removeUser()');
  }
  await deleteUserContent(doc._id);
});

// ── Safety net: prevent accidental hard-delete of enterprise users ─────────
// Corporate users must go through removeUser() service for soft-delete + seat
// cleanup. These hooks throw to catch any raw deleteOne/deleteMany calls.
userSchema.pre('deleteOne', { document: true }, async function (this: IUser) {
  const doc = this;
  if (doc?.accountType === 'corporate' && !doc.isRemoved) {
    throw new Error('Corporate users must be removed via removeUser()');
  }
  await deleteUserContent(doc._id);
});

userSchema.pre('deleteMany', async function (this: any) {
  const filter = this.getFilter();
  const docs = await mongoose.model('User').find(filter).select('_id accountType isRemoved').lean() as any[];
  for (const doc of docs) {
    if (doc.accountType === 'corporate' && !doc.isRemoved) {
      throw new Error('Corporate users must be removed via removeUser()');
    }
  }
  for (const doc of docs) {
    if (doc.accountType !== 'corporate') {
      await deleteUserContent(doc._id);
    }
  }
});

export default mongoose.model<IUser>('User', userSchema);
