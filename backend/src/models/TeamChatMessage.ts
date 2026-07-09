import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeamChatMessage extends Document {
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamChatMessageSchema = new Schema<ITeamChatMessage>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
  },
  { timestamps: true, collection: 'team_chat_messages' }
);

teamChatMessageSchema.index({ teamId: 1, createdAt: -1 });
teamChatMessageSchema.index({ userId: 1 });

export default mongoose.model<ITeamChatMessage>('TeamChatMessage', teamChatMessageSchema);
