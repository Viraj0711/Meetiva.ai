import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITranscript extends Document {
  meetingId: Types.ObjectId;
  segments: Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  fullText: string;
  language: string;
  createdAt: Date;
}

const transcriptSchema = new Schema<ITranscript>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    segments: {
      type: [
        {
          speaker: { type: String, required: true },
          text: { type: String, required: true },
          startTime: { type: Number, required: true },
          endTime: { type: Number, required: true },
          confidence: { type: Number, required: true },
        },
      ],
      default: [],
    },
    fullText: { type: String, required: true },
    language: { type: String, default: 'en' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'transcripts' }
);

export default mongoose.model<ITranscript>('Transcript', transcriptSchema);
