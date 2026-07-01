import {
  INotification,
  NotificationStatus,
  NotificationType,
} from '@/types/notification.interface.js';
import { model, Schema } from 'mongoose';

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
      required: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;
