import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInviteToken extends Document {
  token: string;
  type: 'project_manager' | 'team_leader' | 'team_member';
  organizationId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  teamId?: Types.ObjectId | null;
  role: 'manager' | 'team_leader' | 'member';
  invitedBy: Types.ObjectId;
  email?: string | null;
  expiresAt: Date;
  usedBy?: Types.ObjectId | null;
  usedAt?: Date | null;
  createdAt: Date;
}

const inviteTokenSchema = new Schema<IInviteToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['project_manager', 'team_leader', 'team_member'],
      required: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    role: {
      type: String,
      enum: ['manager', 'team_leader', 'member'],
      required: true,
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'invite_tokens' }
);

// TTL index: automatically clean up expired tokens
inviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
inviteTokenSchema.index({ token: 1 });
inviteTokenSchema.index({ organizationId: 1 });

export default mongoose.model<IInviteToken>('InviteToken', inviteTokenSchema);
