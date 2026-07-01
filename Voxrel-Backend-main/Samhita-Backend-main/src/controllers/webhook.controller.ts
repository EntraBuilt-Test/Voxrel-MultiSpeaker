// LiveKit Webhook Handler
// Handles egress_ended events to save recording URLs to tasks

import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catch-async.utility.js';
import ApiResponse from '@/utils/api-response.utility.js';
import recordingService from '@/services/recording.service.js';
import Task from '@/models/task.model.js';
import ApiError from '@/utils/api-error.utility.js';

/**
 * POST /api/v1/webhooks/livekit
 * Handle LiveKit webhook events (egress_ended, egress_started, egress_failed)
 */
export const handleLiveKitWebhook = catchAsync(async (req: Request, res: Response) => {
  // Verify webhook secret (basic security)
  const webhookSecret = process.env.LIVEKIT_WEBHOOK_SECRET || 'dev-webhook-secret';
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${webhookSecret}`) {
    console.warn('[Webhooks] Unauthorized webhook request');
    throw new ApiError(401, 'Unauthorized');
  }

  const event = req.body;
  console.log(`[Webhooks] Received event: ${event.event}`);

  // Handle different event types
  switch (event.event) {
    case 'egress_ended':
      await recordingService.handleRecordingComplete(event.egress.egressId, event.egress);
      break;

    case 'egress_started':
      console.log(`[Webhooks] Egress started: ${event.egress.egressId} for room: ${event.egress.roomName}`);
      break;

    case 'egress_failed':
      // Handle failed egress (may also be sent as egress_ended with failed status)
      await recordingService.handleRecordingComplete(event.egress.egressId, event.egress);
      break;

    default:
      console.log(`[Webhooks] Unhandled event type: ${event.event}`);
  }

  new ApiResponse(200, { success: true }).send(res);
});

/**
 * POST /api/v1/webhooks/recording-complete
 * Called by standalone LiveKit app when recording is complete
 * Updates the task with the recording URL
 */
export const handleRecordingComplete = catchAsync(async (req: Request, res: Response) => {
  // Verify webhook secret (basic security)
  const webhookSecret = process.env.LIVEKIT_WEBHOOK_SECRET || 'dev-webhook-secret';
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${webhookSecret}`) {
    console.warn('[Webhooks] Unauthorized recording complete request');
    throw new ApiError(401, 'Unauthorized');
  }

  const { roomName, recordingUrl, fileName, duration } = req.body;

  if (!roomName || !recordingUrl) {
    throw new ApiError(400, 'roomName and recordingUrl are required');
  }

  console.log(`[Webhooks] ========== Recording Complete Webhook ==========`);
  console.log(`[Webhooks] Room name: ${roomName}`);
  console.log(`[Webhooks] Recording URL: ${recordingUrl}`);
  console.log(`[Webhooks] File name: ${fileName || 'N/A'}`);
  console.log(`[Webhooks] Duration: ${duration || 'N/A'} seconds`);

  // Find task by roomName (exact match)
  const task = await Task.findOne({ roomName: roomName });
  
  if (!task) {
    console.warn(`[Webhooks] ❌ No task found for roomName: "${roomName}"`);
    console.warn(`[Webhooks] Searching all tasks with roomName field...`);
    // Debug: List all tasks with roomName to help troubleshoot
    const tasksWithRoomName = await Task.find({ roomName: { $exists: true, $ne: null } })
      .select('_id title roomName type')
      .limit(20)
      .lean();
    console.warn(`[Webhooks] Found ${tasksWithRoomName.length} tasks with roomName:`);
    tasksWithRoomName.forEach(t => {
      console.warn(`[Webhooks]   - Task ID: ${t._id}, Title: ${t.title}, RoomName: "${t.roomName}", Type: ${t.type}`);
    });
    const errorMessage = `Task not found for roomName: "${roomName}". Available roomNames: ${tasksWithRoomName.map(t => t.roomName).join(', ')}`;
    console.warn(`[Webhooks] ${errorMessage}`);
    throw new ApiError(404, errorMessage);
  }

  console.log(`[Webhooks] ✅ Found task:`);
  console.log(`[Webhooks]   - Task ID: ${task._id}`);
  console.log(`[Webhooks]   - Title: ${task.title}`);
  console.log(`[Webhooks]   - Type: ${task.type}`);
  console.log(`[Webhooks]   - Current recordingUrl: ${task.recordingUrl || 'none'}`);
  console.log(`[Webhooks]   - Current recordingStatus: ${task.recordingStatus || 'none'}`);

  // Update task with recording information
  task.recordingUrl = recordingUrl;
  if (fileName) task.recordingFileName = fileName;
  if (duration) task.recordingDuration = duration;
  task.recordingCompletedAt = new Date();
  task.recordingStatus = 'COMPLETED';
  
  // Clear recording tracking fields
  task.recordingEgressId = undefined;
  task.recordingStartedAt = undefined;

  await task.save();

  console.log(`[Webhooks] ✅ Task ${task._id} updated successfully!`);
  console.log(`[Webhooks]   - New recordingUrl: ${task.recordingUrl}`);
  console.log(`[Webhooks]   - New recordingStatus: ${task.recordingStatus}`);
  console.log(`[Webhooks]   - Recording completed at: ${task.recordingCompletedAt}`);
  console.log(`[Webhooks] ================================================`);

  new ApiResponse(200, { 
    success: true, 
    message: 'Recording URL saved to task',
    taskId: task._id,
    recordingUrl: task.recordingUrl
  }).send(res);
});
