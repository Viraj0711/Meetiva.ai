import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  organizationId: Types.ObjectId;
  managerUserId: Types.ObjectId;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: null },
  },
  { timestamps: true, collection: 'projects' }
);

projectSchema.index({ organizationId: 1 });
projectSchema.index({ managerUserId: 1 });

export default mongoose.model<IProject>('Project', projectSchema);
