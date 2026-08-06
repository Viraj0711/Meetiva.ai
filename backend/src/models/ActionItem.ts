import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TaskStatus, MeetingPriority } from '../lib/shared';

export interface ITask extends Document {
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: Date | null;
  priority: MeetingPriority;
  status: TaskStatus;
  tags: string[];
  reminderSentAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
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

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ meetingId: 1 });
taskSchema.index({ status: 1, dueDate: 1, reminderSentAt: 1 });

export default mongoose.model<ITask>('ActionItem', taskSchema);
