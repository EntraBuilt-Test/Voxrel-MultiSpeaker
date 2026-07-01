import { Router } from 'express';
import * as notificationController from '@/controllers/notification.controller.js';
import { authenticate } from '@/middleware/authenticate.middleware.js';

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

// Notification routes
notificationRouter.get('/', notificationController.getNotificationsController);
notificationRouter.get('/unread-count', notificationController.getUnreadCountController);
notificationRouter.patch('/:notificationId/read', notificationController.markAsReadController);
notificationRouter.patch('/read-all', notificationController.markAllAsReadController);
notificationRouter.delete('/:notificationId', notificationController.deleteNotificationController);

export default notificationRouter;
