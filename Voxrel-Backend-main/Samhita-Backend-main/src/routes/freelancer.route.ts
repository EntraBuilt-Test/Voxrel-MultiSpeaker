import { Router } from 'express';
import * as freelancerController from '@/controllers/freelancer.controller.js';
import * as analyticsController from '@/controllers/analytics.controller.js';
import * as projectController from '@/controllers/project.controller.js';
import { authenticate } from '@/middleware/authenticate.middleware.js';
import { uploadAudio } from '@/utils/multer.utility.js';

const freelancerRouter = Router();

freelancerRouter.use(authenticate);

freelancerRouter.patch('/profile', freelancerController.updateProfileController);
freelancerRouter.get('/projects', projectController.getProjectsController);
const requestJoinPath = '/projects/:projectId/request-join';
freelancerRouter.post(requestJoinPath, projectController.requestToJoinProjectController);
freelancerRouter.get('/tasks', freelancerController.listAvailableTasksController);
freelancerRouter.get('/tasks/my', freelancerController.listMyTasksController); // Must come before /tasks/:taskId
freelancerRouter.get('/tasks/:taskId', freelancerController.getTaskByIdController);
freelancerRouter.get('/tasks/:taskId/room-token', freelancerController.getRoomTokenController);
freelancerRouter.post('/tasks/:taskId/recording/start', freelancerController.startRecordingController);
freelancerRouter.post('/tasks/:taskId/recording/stop', freelancerController.stopRecordingController);
freelancerRouter.post('/tasks/:taskId/recording/check', freelancerController.checkRecordingController);
freelancerRouter.post('/tasks/:taskId/claim', freelancerController.claimTaskController);
freelancerRouter.post(
  '/tasks/:taskId/upload-audio',
  uploadAudio,
  freelancerController.uploadAudioController
);
freelancerRouter.post('/tasks/:taskId/submit', freelancerController.submitTaskController);
freelancerRouter.post(
  '/tasks/:taskId/start-review',
  freelancerController.startReviewTaskController
);
freelancerRouter.post('/tasks/:taskId/draft', freelancerController.saveDraftController);
freelancerRouter.get('/tasks/:taskId/draft', freelancerController.getDraftController);
freelancerRouter.post('/tasks/:taskId/transcript', freelancerController.saveTranscriptController);
freelancerRouter.post('/tasks/:taskId/speaker-metadata', freelancerController.saveSpeakerMetadataController);
freelancerRouter.get('/tasks/:taskId/transcript', freelancerController.getTranscriptController);
freelancerRouter.get('/reviews/assigned', freelancerController.listAssignedReviewsController);
freelancerRouter.post('/reviews/:reviewId/submit', freelancerController.submitReviewController);

// Analytics Routes
freelancerRouter.get('/stats', analyticsController.getUserStatsController);
freelancerRouter.get('/performance', analyticsController.getFreelancerPerformanceController);

export default freelancerRouter;
