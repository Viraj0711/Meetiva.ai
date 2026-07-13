import mongoose, { Schema, Document, Types } from 'mongoose';
import { InvitationStatus, TeamRole } from './TeamMember';

export interface ITeamInvitation extends Document {
  email: string;
  teamId: Types.ObjectId;
  role: TeamRole;
  invitedBy: Types.ObjectId;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

const teamInvitationSchema = new Schema<ITeamInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    role: {
      type: String,
      enum: ['MANAGER', 'LEAD', 'MEMBER'],
      default: 'MEMBER',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'PENDING',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'team_invitations' }
);

teamInvitationSchema.index({ email: 1, teamId: 1 }, { unique: true });
teamInvitationSchema.index({ email: 1 });
teamInvitationSchema.index({ teamId: 1 });

// TTL index: automatically expire documents when expiresAt is reached
teamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ITeamInvitation>('TeamInvitation', teamInvitationSchema);
