import mongoose, { Schema, Document, Types } from 'mongoose';
import TeamMember from './TeamMember';
import TeamInvitation from './TeamInvitation';
import TeamChatMessage from './TeamChatMessage';

export interface ITeam extends Document {
  name: string;
  description?: string | null;
  managerId?: Types.ObjectId | null;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: 'teams' }
);

teamSchema.index({ managerId: 1 });

// ── Cascade delete: when a Team is deleted, remove members, invitations, chat messages ──
teamSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const teamId = doc._id;
    await Promise.all([
      TeamMember.deleteMany({ teamId }),
      TeamInvitation.deleteMany({ teamId }),
      TeamChatMessage.deleteMany({ teamId }),
    ]);
  }
});

export default mongoose.model<ITeam>('Team', teamSchema);
