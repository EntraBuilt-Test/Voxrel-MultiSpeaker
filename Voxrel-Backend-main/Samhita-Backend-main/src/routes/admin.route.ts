import { Router } from 'express';
import * as adminController from '@/controllers/admin.controller.js';
import * as analyticsController from '@/controllers/analytics.controller.js';
import * as projectController from '@/controllers/project.controller.js';
import { authenticate } from '@/middleware/authenticate.middleware.js';
import { authorize } from '@/middleware/authorize.middleware.js';
import { uploadAudio, uploadAudioArray } from '@/utils/multer.utility.js';

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize('ADMIN'));

adminRouter.post('/users', adminController.createUserController);
adminRouter.get('/users', adminController.listUsersController);
adminRouter.get('/users/:userId', adminController.getUserByIdController);
adminRouter.patch('/users/:userId/status', adminController.updateUserStatusController);
adminRouter.delete('/users/:userId', adminController.deleteUserController);

adminRouter.post('/tasks', uploadAudio, adminController.createTaskController);
// Bulk upload endpoint - supports up to 100+ audio files
// Accepts files with field names: 'audio', 'audios', 'files', or 'audioFiles'
// OR as an array with field name 'audio'
adminRouter.post('/tasks/bulk', uploadAudioArray, adminController.createTasksBulkController);
adminRouter.get('/tasks', adminController.listTasksAdminController);
adminRouter.get('/tasks/:taskId', adminController.getTaskByIdAdminController);
adminRouter.patch('/tasks/:taskId', adminController.updateTaskAdminController);
adminRouter.delete('/tasks/:taskId', adminController.deleteTaskAdminController);
adminRouter.patch('/tasks/:taskId/claim', adminController.updateTaskClaimController);
adminRouter.post('/tasks/spawn', adminController.spawnTaskController);

// Analytics Routes
adminRouter.get('/analytics/tasks/summary', analyticsController.getTaskSummaryController);
adminRouter.get(
  '/analytics/tasks/status-distribution',
  analyticsController.getTaskStatusDistributionController
);
adminRouter.get('/analytics/tasks/trends', analyticsController.getTaskTrendsController);
adminRouter.get(
  '/analytics/tasks/language-distribution',
  analyticsController.getLanguageDistributionController
);

adminRouter.get(
  '/analytics/users/dashboard',
  analyticsController.getUserAnalyticsDashboardController
);
adminRouter.get('/analytics/users/summary', analyticsController.getUserSummaryController);
adminRouter.get('/analytics/users/growth-trend', analyticsController.getUserGrowthTrendController);
adminRouter.get('/analytics/users/top-performers', analyticsController.getTopPerformersController);
adminRouter.get('/analytics/users/:userId/stats', analyticsController.getUserStatsController);

// R2 Storage Monitoring Routes
adminRouter.get('/storage/info', adminController.getR2StorageInfoController);
adminRouter.get('/storage/file-count', adminController.getR2FileCountController);

// Project Management Routes
adminRouter.post('/projects', projectController.createProjectController);
adminRouter.get('/projects', projectController.getProjectsController);
adminRouter.get(
  '/projects/not-assigned-for-review',
  projectController.getProjectsNotAssignedForReviewController
);
adminRouter.get('/projects/:projectId/tasks', projectController.getProjectTasksController);
adminRouter.get('/projects/:projectId', projectController.getProjectByIdController);
adminRouter.patch('/projects/:projectId', projectController.updateProjectController);
adminRouter.delete('/projects/:projectId', projectController.deleteProjectController);
adminRouter.post('/projects/:projectId/admins', projectController.assignProjectToAdminController);
adminRouter.delete(
  '/projects/:projectId/admins',
  projectController.removeAdminFromProjectController
);
adminRouter.get('/projects/:projectId/users', projectController.getProjectUsersController);
adminRouter.post('/projects/:projectId/users', projectController.addUserToProjectController);
adminRouter.delete('/projects/:projectId/users', projectController.removeUserFromProjectController);
adminRouter.post(
  '/projects/:projectId/requests/approve',
  projectController.approveJoinRequestController
);
adminRouter.post(
  '/projects/:projectId/requests/reject',
  projectController.rejectJoinRequestController
);

export default adminRouter;
