import type { MeetingStatus, MeetingPriority } from '../lib/shared';
import mongoose, { Schema, Document, Types } from 'mongoose';
import MeetingSummary from './MeetingSummary';
import Transcript from './Transcript';
import ActionItem from './ActionItem';

export interface IMeeting extends Document {
  title: string;
  description?: string | null;
  status: MeetingStatus;
  priority: MeetingPriority;
  audioUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  participants: string[];
  processingProgress?: number | null;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'uploading', 'processing', 'transcribing', 'analyzing', 'completed', 'failed'],
      default: 'uploading',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    audioUrl: { type: String, default: null },
    videoUrl: { type: String, default: null },
    duration: { type: Number, default: null },
    participants: { type: [String], default: [] },
    processingProgress: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'meetings' }
);

meetingSchema.index({ userId: 1, createdAt: -1 });

// ── Cascade delete: when a Meeting is deleted, remove summaries, transcripts, action items ──
meetingSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const meetingId = doc._id;
    await Promise.all([
      MeetingSummary.deleteMany({ meetingId }),
      Transcript.deleteMany({ meetingId }),
      ActionItem.deleteMany({ meetingId }),
    ]);
  }
});

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
