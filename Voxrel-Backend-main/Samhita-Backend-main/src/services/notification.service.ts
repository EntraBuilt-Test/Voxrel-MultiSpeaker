import { Request, Response } from 'express';
import Notification from '@/models/notification.model.js';
import ApiResponse from '@/utils/api-response.utility.js';
import ApiError from '@/utils/api-error.utility.js';
import { NotificationStatus, NotificationType } from '@/types/notification.interface.js';
import { Types } from 'mongoose';

export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { status, limit = '50', page = '1' } = req.query;
  const userId = req.user._id;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: { userId: Types.ObjectId; status?: NotificationStatus } = {
    userId: new Types.ObjectId(userId),
  };

  if (status && (status === NotificationStatus.READ || status === NotificationStatus.UNREAD)) {
    query.status = status as NotificationStatus;
  }

  // Get notifications and total count
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('relatedTaskId', 'title status')
      .populate('relatedUserId', 'name email')
      .lean(),
    Notification.countDocuments(query),
  ]);

  // Get unread count
  const unreadCount = await Notification.countDocuments({
    userId: new Types.ObjectId(userId),
    status: NotificationStatus.UNREAD,
  });

  new ApiResponse(
    200,
    {
      notifications,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalNotifications: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
      unreadCount,
    },
    'Notifications retrieved successfully'
  ).send(res);
};

export const markAsRead = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: notificationId,
    userId: new Types.ObjectId(userId),
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.status === NotificationStatus.READ) {
    new ApiResponse(200, notification, 'Notification already marked as read').send(res);
    return;
  }

  notification.status = NotificationStatus.READ;
  notification.readAt = new Date();
  await notification.save();

  new ApiResponse(200, notification, 'Notification marked as read').send(res);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const userId = req.user._id;

  const result = await Notification.updateMany(
    {
      userId: new Types.ObjectId(userId),
      status: NotificationStatus.UNREAD,
    },
    {
      status: NotificationStatus.READ,
      readAt: new Date(),
    }
  );

  new ApiResponse(
    200,
    { updatedCount: result.modifiedCount },
    'All notifications marked as read'
  ).send(res);
};

export const deleteNotification = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId: new Types.ObjectId(userId),
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  new ApiResponse(200, { success: true }, 'Notification deleted successfully').send(res);
};

export const getUnreadCount = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const userId = req.user._id;

  const unreadCount = await Notification.countDocuments({
    userId: new Types.ObjectId(userId),
    status: NotificationStatus.UNREAD,
  });

  new ApiResponse(200, { unreadCount }, 'Unread count retrieved successfully').send(res);
};

// Helper function to create notifications (can be used by other services)
export const createNotification = async (data: {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: Types.ObjectId | string;
  relatedUserId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
}) => {
  const notification = await Notification.create({
    userId: new Types.ObjectId(data.userId),
    type: data.type,
    title: data.title,
    message: data.message,
    relatedTaskId: data.relatedTaskId ? new Types.ObjectId(data.relatedTaskId) : undefined,
    relatedUserId: data.relatedUserId ? new Types.ObjectId(data.relatedUserId) : undefined,
    metadata: data.metadata || {},
    status: NotificationStatus.UNREAD,
  });

  return notification;
};
