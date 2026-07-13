import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  actionItemId?: Types.ObjectId | null;
  type: 'DEADLINE_REMINDER' | 'SYSTEM';
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionItemId: { type: Schema.Types.ObjectId, ref: 'ActionItem', default: null },
    type: {
      type: String,
      enum: ['DEADLINE_REMINDER', 'SYSTEM'],
      default: 'SYSTEM',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, default: 'in_app' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ actionItemId: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
