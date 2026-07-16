import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TeamRole, InvitationStatus } from '../lib/shared';

// Re-export for backward compatibility (other files import these from TeamMember)
export type { TeamRole, InvitationStatus };

export interface ITeamMember extends Document {
  userId: Types.ObjectId;
  teamId: Types.ObjectId;
  role: TeamRole;
  status: InvitationStatus;
  invitedBy?: Types.ObjectId | null;
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    role: {
      type: String,
      enum: ['MANAGER', 'LEAD', 'MEMBER'],
      default: 'MEMBER',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'ACCEPTED',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    invitedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'team_members' }
);

teamMemberSchema.index({ userId: 1, teamId: 1 }, { unique: true });
teamMemberSchema.index({ teamId: 1 });
teamMemberSchema.index({ userId: 1 });
teamMemberSchema.index({ status: 1 });

export default mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);
