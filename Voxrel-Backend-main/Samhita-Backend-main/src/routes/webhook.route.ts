import { Router } from 'express';
import * as webhookController from '@/controllers/webhook.controller.js';

const webhookRouter = Router();

// LiveKit webhook endpoint (no authentication middleware - uses webhook secret)
webhookRouter.post('/livekit', webhookController.handleLiveKitWebhook);

// Recording complete endpoint (called by standalone app)
webhookRouter.post('/recording-complete', webhookController.handleRecordingComplete);

export default webhookRouter;
