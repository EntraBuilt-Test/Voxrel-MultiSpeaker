import { Document, Types } from 'mongoose';

export interface TranscriptionSegment {
  timestamp: {
    start: number;
    end: number;
  };
  content: string;
  remark?: string;
  quality: number;
}

export interface ITranscription extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  reviewerId?: Types.ObjectId;
  segments: TranscriptionSegment[];
  createdAt: Date;
  updatedAt: Date;
}
