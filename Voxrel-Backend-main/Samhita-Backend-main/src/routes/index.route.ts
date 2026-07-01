import { Router } from 'express';
import adminRouter from '@/routes/admin.route.js';
import authRouter from '@/routes/auth.route.js';
import freelancerRouter from '@/routes/freelancer.route.js';
import settingsRouter from '@/routes/settings.route.js';
import notificationRouter from '@/routes/notification.route.js';
import mediaRouter from '@/routes/media.route.js';
import webhookRouter from '@/routes/webhook.route.js';

const v1Router = Router();

// Mount route modules
v1Router.use('/admin', adminRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/freelancer', freelancerRouter);
v1Router.use('/settings', settingsRouter);
v1Router.use('/notifications', notificationRouter);
v1Router.use('/media', mediaRouter);
v1Router.use('/webhooks', webhookRouter);

export default v1Router;
