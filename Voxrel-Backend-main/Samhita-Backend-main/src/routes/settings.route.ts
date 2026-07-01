import { Router } from 'express';
import * as settingsController from '@/controllers/settings.controller.js';
import { authenticate } from '@/middleware/authenticate.middleware.js';
import { authorize } from '@/middleware/authorize.middleware.js';

const settingsRouter = Router();

// All settings routes require authentication and admin authorization
settingsRouter.use(authenticate);
settingsRouter.use(authorize('ADMIN'));

// Settings management routes
settingsRouter.get('/', settingsController.getAllSettingsController);
settingsRouter.get('/max-task-per-user', settingsController.getMaxTaskPerUserController);
settingsRouter.patch('/:key', settingsController.updateSettingController);

export default settingsRouter;
