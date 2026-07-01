import { Router } from 'express';
import * as mediaController from '@/controllers/media.controller.js';

const mediaRouter = Router();

/**
 * @route   GET /api/v1/media/proxy
 * @desc    Proxy media files to avoid CORS issues
 * @access  Public (no auth required for media playback)
 * @query   url - The URL of the media file to proxy
 */
mediaRouter.get('/proxy', mediaController.proxyMedia);

export default mediaRouter;
