import mongoose, { Schema, Document, Types } from 'mongoose';
import type { OrganizationStatus, SubscriptionPlan } from '../lib/shared';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  contactEmail: string | null;
  adminUserId: Types.ObjectId;
  status: OrganizationStatus;
  seatLimit: number;
  seatsUsed: number;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | null;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contactEmail: { type: String, default: null },
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null as any },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    seatLimit: { type: Number, default: 20 },
    seatsUsed: { type: Number, default: 0 },
    subscriptionPlan: { type: String, enum: ['monthly', 'yearly', null], default: null },
    subscriptionStatus: { type: String, enum: ['active', 'past_due', 'cancelled', null], default: null },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'organizations' }
);

organizationSchema.index({ adminUserId: 1 });
organizationSchema.index({ slug: 1 });

export default mongoose.model<IOrganization>('Organization', organizationSchema);
