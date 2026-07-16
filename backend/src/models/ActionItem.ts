import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ActionItemStatus, MeetingPriority } from '../lib/shared';

export interface IActionItem extends Document {
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: Date | null;
  priority: MeetingPriority;
  status: ActionItemStatus;
  tags: string[];
  reminderSentAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const actionItemSchema = new Schema<IActionItem>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    assignee: { type: String, default: null },
    dueDate: { type: Date, default: null },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    tags: { type: [String], default: [] },
    reminderSentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'action_items' }
);

actionItemSchema.index({ userId: 1, status: 1 });
actionItemSchema.index({ userId: 1, createdAt: -1 });
actionItemSchema.index({ meetingId: 1 });
actionItemSchema.index({ status: 1, dueDate: 1, reminderSentAt: 1 });

export default mongoose.model<IActionItem>('ActionItem', actionItemSchema);
