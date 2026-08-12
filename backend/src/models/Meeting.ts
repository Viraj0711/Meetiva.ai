import type { MeetingStatus, MeetingPriority } from '../lib/shared';
import mongoose, { Schema, Document, Types } from 'mongoose';
import MeetingSummary from './MeetingSummary';
import Transcript from './Transcript';
import Task from './ActionItem';
import { deleteFileFromFirebase } from '../lib/firebaseStorage';

export interface IMeeting extends Document {
  title: string;
  description?: string | null;
  status: MeetingStatus;
  priority: MeetingPriority;
  audioUrl?: string | null;
  videoUrl?: string | null;
  fileUrl?: string | null;
  fileKind?: 'audio' | 'video' | 'text' | null;
  fileStoragePath?: string | null;
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
    // Firebase Storage — signed URL of the uploaded file + metadata to refresh/delete it.
    fileUrl: { type: String, default: null },
    fileKind: { type: String, enum: ['audio', 'video', 'text'], default: null },
    fileStoragePath: { type: String, default: null },
    duration: { type: Number, default: null },
    participants: { type: [String], default: [] },
    processingProgress: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'meetings' }
);

meetingSchema.index({ userId: 1, createdAt: -1 });

// ── Cascade delete: when a Meeting is deleted, remove summaries, transcripts, tasks ──
meetingSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    const meetingId = doc._id;
    await Promise.all([
      MeetingSummary.deleteMany({ meetingId }),
      Transcript.deleteMany({ meetingId }),
      Task.deleteMany({ meetingId }),
    ]);
    // Best-effort cleanup of the stored file (never blocks meeting deletion).
    if (doc.fileStoragePath) {
      deleteFileFromFirebase(doc.fileStoragePath);
    }
  }
});

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
