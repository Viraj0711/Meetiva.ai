import mongoose, { Schema, Document } from 'mongoose';
import Meeting from './Meeting';
import ActionItem from './ActionItem';
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
  subscriptionTier: 'FREE' | 'PRO' | 'TEAM';
  meetingCountThisMonth: number;
  meetingCountResetAt: Date | null;
  subscriptionExpiresAt: Date | null;
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
      enum: ['FREE', 'PRO', 'TEAM'],
      default: 'FREE',
    },
    meetingCountThisMonth: { type: Number, default: 0 },
    meetingCountResetAt: { type: Date, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'users' }
);

userSchema.index({ subscriptionTier: 1, meetingCountResetAt: 1 });

// ── Cascade delete: when a User is deleted, remove all related data ────────
userSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const userId = doc._id;
    await Promise.all([
      Meeting.deleteMany({ userId }),
      ActionItem.deleteMany({ userId }),
      TeamMember.deleteMany({ userId }),
      TeamInvitation.deleteMany({ invitedBy: userId }),
      Notification.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
      GoogleCalendarAuth.deleteMany({ userId }),
      TeamChatMessage.deleteMany({ userId }),
    ]);
  }
});

export default mongoose.model<IUser>('User', userSchema);
