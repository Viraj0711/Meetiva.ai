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

export interface IUser extends Document {
  email: string;
  name: string;
  hashedPassword: string;
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
    hashedPassword: { type: String, required: true },
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

// ── Cascade delete: when a User is deleted, remove all related data ────────
userSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const userId = doc._id;
    await Promise.all([
      Meeting.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      TeamMember.deleteMany({ userId }),
      TeamInvitation.deleteMany({ invitedBy: userId }),
      Notification.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
      GoogleCalendarAuth.deleteMany({ userId }),
      TeamChatMessage.deleteMany({ userId }),
    ]);
  }
});

// ── Safety net: prevent accidental hard-delete of enterprise users ─────────
// Corporate users must go through removeUser() service for soft-delete + seat
// cleanup. These hooks throw to catch any raw deleteOne/deleteMany calls.
userSchema.pre('deleteOne', { document: true }, async function (this: any) {
  const doc = this;
  if (doc?.accountType === 'corporate' && !doc.isRemoved) {
    throw new Error('Corporate users must be removed via removeUser()');
  }
  if (doc) {
    const userId = doc._id;
    await Promise.all([
      Meeting.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      TeamMember.deleteMany({ userId }),
      TeamInvitation.deleteMany({ invitedBy: userId }),
      Notification.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
      GoogleCalendarAuth.deleteMany({ userId }),
      TeamChatMessage.deleteMany({ userId }),
    ]);
  }
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
      const userId = doc._id;
      await Promise.all([
        Meeting.deleteMany({ userId }),
        Task.deleteMany({ userId }),
        TeamMember.deleteMany({ userId }),
        TeamInvitation.deleteMany({ invitedBy: userId }),
        Notification.deleteMany({ userId }),
        RefreshToken.deleteMany({ userId }),
        GoogleCalendarAuth.deleteMany({ userId }),
        TeamChatMessage.deleteMany({ userId }),
      ]);
    }
  }
});

export default mongoose.model<IUser>('User', userSchema);
