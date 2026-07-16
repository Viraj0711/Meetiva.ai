import mongoose, { Schema, Document, Types } from 'mongoose';
import type { Sentiment } from '../lib/shared';

export interface IMeetingSummary extends Document {
  meetingId: Types.ObjectId;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: Sentiment;
  createdAt: Date;
}

const meetingSummarySchema = new Schema<IMeetingSummary>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    executiveSummary: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    decisions: { type: [String], default: [] },
    openQuestions: { type: [String], default: [] },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'meeting_summaries' }
);

export default mongoose.model<IMeetingSummary>('MeetingSummary', meetingSummarySchema);
