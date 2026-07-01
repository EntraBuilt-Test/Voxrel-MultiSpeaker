import { IReview, ReviewStatus } from '@/types/review.interface.js';
import { model, Schema } from 'mongoose';

const reviewSchema = new Schema<IReview>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required(this: IReview): boolean {
        return this.status === ReviewStatus.COMPLETED;
      },
    },
    feedback: {
      type: String,
      maxLength: 1000,
      required(this: IReview): boolean {
        return this.status === ReviewStatus.COMPLETED;
      },
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Review = model<IReview>('Review', reviewSchema);

export default Review;
