import { Document, Types } from 'mongoose';

export enum ReviewStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  rating?: number;
  feedback?: string;
  status: ReviewStatus;
  assignedAt: Date;
  dueDate?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
