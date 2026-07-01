import { Document, Types } from 'mongoose';

export interface DraftSegment {
  timestamp: {
    start: number;
    end: number;
  };
  content: string;
  remark?: string;
  quality: number;
}

export interface IDraft extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  segments: DraftSegment[];
  progress: number;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
