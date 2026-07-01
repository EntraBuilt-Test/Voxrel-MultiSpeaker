import mongoose, { Document, Schema } from 'mongoose';

export interface IApplicationSettings extends Document {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  isActive: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSettingsSchema = new Schema<IApplicationSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
applicationSettingsSchema.index({ key: 1, isActive: 1 });

export default mongoose.model<IApplicationSettings>(
  'ApplicationSettings',
  applicationSettingsSchema
);
