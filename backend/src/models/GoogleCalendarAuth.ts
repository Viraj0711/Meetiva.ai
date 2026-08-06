import type { IntegrationType } from '../lib/shared';
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGoogleCalendarAuth extends Document {
  userId: Types.ObjectId;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  tokenType: string;
  scope?: string | null;
  expiryDate?: Date | null;
  integrationType: IntegrationType;
  createdAt: Date;
  updatedAt: Date;
}

const googleCalendarAuthSchema = new Schema<IGoogleCalendarAuth>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, required: true },
    tokenType: { type: String, default: 'Bearer' },
    scope: { type: String, default: null },
    expiryDate: { type: Date, default: null },
    integrationType: {
      type: String,
      enum: ['google-calendar'],
      default: 'google-calendar',
    },
  },
  { timestamps: true, collection: 'google_calendar_auth' }
);

googleCalendarAuthSchema.index({ expiryDate: 1 });

export default mongoose.model<IGoogleCalendarAuth>('GoogleCalendarAuth', googleCalendarAuthSchema);
