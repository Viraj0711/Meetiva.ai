import mongoose, { Schema, Document, Types } from 'mongoose';
import type { OrganizationStatus } from '../lib/shared';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  adminUserId: Types.ObjectId;
  status: OrganizationStatus;
  seatLimit: number;
  seatsUsed: number;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    seatLimit: { type: Number, default: 20 },
    seatsUsed: { type: Number, default: 0 },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'organizations' }
);

organizationSchema.index({ adminUserId: 1 });
organizationSchema.index({ slug: 1 });

export default mongoose.model<IOrganization>('Organization', organizationSchema);
