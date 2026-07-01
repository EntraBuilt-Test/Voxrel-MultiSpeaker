import { ITranscription, TranscriptionSegment } from '@/types/transcription.interface.js';
import { model, Schema } from 'mongoose';

const transcriptionSegmentSchema = new Schema<TranscriptionSegment>(
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
      min: 1,
      max: 100,
    },
  },
  { _id: false }
);

const transcriptionSchema = new Schema<ITranscription>(
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
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    segments: [transcriptionSegmentSchema],
  },
  { timestamps: true }
);

// Ensure only one transcription per task per user
transcriptionSchema.index({ taskId: 1, userId: 1 }, { unique: true });

const Transcription = model<ITranscription>('Transcription', transcriptionSchema);

export default Transcription;
