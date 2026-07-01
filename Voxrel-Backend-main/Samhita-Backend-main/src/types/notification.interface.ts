import { Document, Types } from 'mongoose';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_REVIEWED = 'TASK_REVIEWED',
  TASK_REJECTED = 'TASK_REJECTED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  relatedTaskId?: Types.ObjectId;
  relatedUserId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
