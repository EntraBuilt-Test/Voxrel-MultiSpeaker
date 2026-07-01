import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as notificationService from '@/services/notification.service.js';

export const getNotificationsController = catchAsync(async (req: Request, res: Response) => {
  await notificationService.getNotifications(req, res);
});

export const markAsReadController = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req, res);
});

export const markAllAsReadController = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req, res);
});

export const deleteNotificationController = catchAsync(async (req: Request, res: Response) => {
  await notificationService.deleteNotification(req, res);
});

export const getUnreadCountController = catchAsync(async (req: Request, res: Response) => {
  await notificationService.getUnreadCount(req, res);
});
