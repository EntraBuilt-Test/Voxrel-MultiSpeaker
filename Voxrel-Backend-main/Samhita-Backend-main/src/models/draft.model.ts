import { DraftSegment, IDraft } from '@/types/draft.interface.js';
import { model, Schema } from 'mongoose';

const draftSegmentSchema = new Schema<DraftSegment>(
  {
    timestamp: {
      start: {
        type: Number,
        required: true,
        min: 0,
      },
      end: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    quality: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const draftSchema = new Schema<IDraft>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    segments: [draftSegmentSchema],
    progress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    lastSavedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure only one draft per task per user
draftSchema.index({ taskId: 1, userId: 1 }, { unique: true });

const Draft = model<IDraft>('Draft', draftSchema);

export default Draft;
