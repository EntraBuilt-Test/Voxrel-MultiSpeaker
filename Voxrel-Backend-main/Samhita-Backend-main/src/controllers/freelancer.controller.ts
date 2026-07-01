import ApiResponse from '@/utils/api-response.utility.js';
import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as freelancerService from '@/services/freelancer.service.js';
import recordingService from '@/services/recording.service.js';
import Task from '@/models/task.model.js';
import ApiError from '@/utils/api-error.utility.js';

export const updateProfileController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const result = await freelancerService.updateProfile(req.user._id.toString(), req.body);
  new ApiResponse(200, result, 'Profile updated successfully').send(res);
});

export const listAvailableTasksController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const result = await freelancerService.getAvailableTasks(req.user._id.toString(), req.query);
  new ApiResponse(200, result).send(res);
});

export const claimTaskController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.claimTask(req.user._id.toString(), taskId);
  new ApiResponse(200, result, 'Task claimed successfully').send(res);
});

export const listMyTasksController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const result = await freelancerService.getMyTasks(req.user._id.toString(), req.query);
  new ApiResponse(200, result).send(res);
});

export const getTaskByIdController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.getTaskById(req.user._id.toString(), taskId);
  new ApiResponse(200, result).send(res);
});

export const submitTaskController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const { submission, speakerName, speakerAge, speakerLocation } = req.body;
  const result = await freelancerService.submitTask(
    req.user._id.toString(),
    taskId,
    submission,
    { speakerName, speakerAge, speakerLocation }
  );
  new ApiResponse(200, result, 'Task submitted successfully').send(res);
});

export const listAssignedReviewsController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const result = await freelancerService.listAssignedReviews(req.user._id.toString(), req.query);
  new ApiResponse(200, result).send(res);
});

export const submitReviewController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { reviewId } = req.params;
  const { rating, feedback, decision } = req.body;
  const result = await freelancerService.submitReview(
    req.user._id.toString(),
    reviewId,
    rating,
    feedback,
    decision
  );
  new ApiResponse(200, result, 'Review submitted successfully').send(res);
});

export const startReviewTaskController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.startReviewTask(req.user._id.toString(), taskId);
  new ApiResponse(200, result, 'Review task started successfully').send(res);
});

export const saveDraftController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const { progress, segments, lastSavedAt } = req.body;
  const result = await freelancerService.saveDraft(req.user._id.toString(), taskId, {
    progress,
    segments,
    lastSavedAt,
  });
  new ApiResponse(200, result, 'Draft saved successfully').send(res);
});

export const getDraftController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.getDraft(req.user._id.toString(), taskId);
  new ApiResponse(200, result).send(res);
});

export const saveTranscriptController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const { segments } = req.body;
  const result = await freelancerService.saveTranscript(req.user._id.toString(), taskId, {
    segments,
  });
  new ApiResponse(200, result, 'Transcript saved successfully').send(res);
});

export const getTranscriptController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.getTranscript(req.user._id.toString(), taskId);
  new ApiResponse(200, result).send(res);
});

export const uploadAudioController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  
  console.log('[uploadAudioController] Request received:', {
    taskId,
    userId: req.user._id.toString(),
    hasFiles: !!req.files,
    filesKeys: req.files ? Object.keys(req.files as object) : [],
  });

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // Get audio file from any of the supported field names
  const audioFile =
    files?.audio?.[0] || files?.audios?.[0] || files?.files?.[0] || files?.audioFiles?.[0];

  if (!audioFile) {
    console.error('[uploadAudioController] No audio file provided:', {
      taskId,
      filesKeys: files ? Object.keys(files) : [],
      hasAudio: !!files?.audio,
      hasAudios: !!files?.audios,
      hasFiles: !!files?.files,
      hasAudioFiles: !!files?.audioFiles,
    });
    throw new ApiError(400, 'No audio file provided. Please ensure the file is uploaded with one of these field names: audio, audios, files, or audioFiles.');
  }

  console.log('[uploadAudioController] Audio file found:', {
    taskId,
    fileName: audioFile.originalname,
    fileSize: audioFile.size,
    mimeType: audioFile.mimetype,
  });

  const result = await freelancerService.uploadAudio(req.user._id.toString(), taskId, audioFile);
  new ApiResponse(200, result, 'Audio uploaded successfully').send(res);
});

export const getRoomTokenController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const result = await freelancerService.getRoomToken(req.user._id.toString(), taskId);
  new ApiResponse(200, result, 'Room token generated successfully').send(res);
});

export const startRecordingController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;

  console.log('[startRecordingController] Request received:', {
    taskId,
    userId: req.user._id.toString(),
  });

  // Verify task exists and user is assigned
  const task = await Task.findById(taskId);
  if (!task) {
    console.error('[startRecordingController] Task not found:', taskId);
    throw new ApiError(404, 'Task not found');
  }

  if (task.type !== 'multi') {
    throw new ApiError(400, 'This task is not a multi-speaker task');
  }

  // Check if user is assigned
  const userId = req.user._id.toString();
  
  // Helper to normalize ObjectId to string for comparison
  const normalizeId = (id: any): string => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.toString) return id.toString();
    return String(id);
  };
  
  // Debug logging
  console.log('[startRecordingController] Checking assignment:', {
    userId,
    taskId,
    assignedFreelancers: task.assignedFreelancers?.map(id => normalizeId(id)),
    claimedById: normalizeId(task.claimedById),
    taskType: task.type,
    taskStatus: task.status,
  });
  
  // Check if user is assigned (handle both ObjectId and string formats)
  const isInAssignedFreelancers = task.assignedFreelancers?.some((id) => {
    const normalizedId = normalizeId(id);
    return normalizedId === userId;
  });
  
  const isClaimedBy = normalizeId(task.claimedById) === userId;
  
  const isAssigned = isInAssignedFreelancers || isClaimedBy;

  if (!isAssigned) {
    console.warn('[startRecordingController] User not assigned:', {
      userId,
      taskId,
      assignedFreelancers: task.assignedFreelancers?.map(id => normalizeId(id)),
      claimedById: normalizeId(task.claimedById),
      isInAssignedFreelancers,
      isClaimedBy,
    });
    throw new ApiError(403, 'You are not assigned to this task');
  }

  if (!task.roomName) {
    throw new ApiError(500, 'Task room name not set');
  }

  // Check if already recording
  if (task.recordingEgressId) {
    throw new ApiError(400, 'Recording is already in progress');
  }

  // Start recording
  const egressId = await recordingService.startRecording(task.roomName, taskId);
  new ApiResponse(200, { egressId }, 'Recording started successfully').send(res);
});

export const stopRecordingController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;

  // Verify task exists and user is assigned
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.type !== 'multi') {
    throw new ApiError(400, 'This task is not a multi-speaker task');
  }

  // Check if user is assigned
  const userId = req.user._id.toString();
  
  // Helper to normalize ObjectId to string for comparison
  const normalizeId = (id: any): string => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.toString) return id.toString();
    return String(id);
  };
  
  // Check if user is assigned (handle both ObjectId and string formats)
  const isInAssignedFreelancers = task.assignedFreelancers?.some((id) => {
    const normalizedId = normalizeId(id);
    return normalizedId === userId;
  });
  
  const isClaimedBy = normalizeId(task.claimedById) === userId;
  
  const isAssigned = isInAssignedFreelancers || isClaimedBy;

  if (!isAssigned) {
    throw new ApiError(403, 'You are not assigned to this task');
  }

  if (!task.recordingEgressId) {
    throw new ApiError(400, 'No recording in progress');
  }

  // Stop recording
  await recordingService.stopRecording(task.recordingEgressId);
  new ApiResponse(200, { message: 'Recording stopped successfully. File will be processed and stored.' }).send(res);
});

export const checkRecordingController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;

  // Verify task exists and user is assigned
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.type !== 'multi') {
    throw new ApiError(400, 'This task is not a multi-speaker task');
  }

  // Check if user is assigned
  const userId = req.user._id.toString();
  const normalizeId = (id: any): string => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.toString) return id.toString();
    return String(id);
  };
  
  const isInAssignedFreelancers = task.assignedFreelancers?.some((id) => {
    const normalizedId = normalizeId(id);
    return normalizedId === userId;
  });
  
  const isClaimedBy = normalizeId(task.claimedById) === userId;
  const isAssigned = isInAssignedFreelancers || isClaimedBy;

  if (!isAssigned) {
    throw new ApiError(403, 'You are not assigned to this task');
  }

  // Check and refresh recording URL
  const result = await recordingService.checkAndRefreshRecordingUrl(taskId);
  
  // CRITICAL: Validate the returned URL contains the correct task ID
  if (result.found && result.recordingUrl) {
    const normalizedTaskId = taskId.toLowerCase().trim();
    const urlTaskIdMatch = result.recordingUrl.match(/task-([a-f0-9]{24})/i);
    if (urlTaskIdMatch && urlTaskIdMatch[1]) {
      const urlTaskId = urlTaskIdMatch[1].toLowerCase().trim();
      if (urlTaskId !== normalizedTaskId) {
        console.error('[checkRecordingController] CRITICAL: Returned URL has wrong task ID!', {
          requestedTaskId: normalizedTaskId,
          urlTaskId: urlTaskId,
          recordingUrl: result.recordingUrl
        });
        // Don't return the wrong URL
        return new ApiResponse(200, {
          found: false,
          message: `Found URL belongs to different task (${urlTaskId} vs ${normalizedTaskId})`
        }).send(res);
      }
    }
  }
  
  new ApiResponse(200, result).send(res);
});
export const saveSpeakerMetadataController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const { taskId } = req.params;
  const { speakersMetadata } = req.body;
  
  if (!speakersMetadata || !Array.isArray(speakersMetadata)) {
    throw new ApiError(400, 'speakersMetadata must be an array');
  }

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  // Replace entire metadata array with new data
  task.speakersMetadata = speakersMetadata.map((m: any) => ({
    freelancerId: req.user!._id,
    speakerLabel: m.speakerLabel || 'Speaker 1',
    name: m.speakerName || m.name || '',
    age: parseInt(m.age) || 0,
    gender: m.gender || '',
    qualification: m.qualification || '',
    occupation: m.occupation || '',
    motherTongue: m.motherTongue || '',
    nativePlace: m.nativePlace || '',
    location: m.currentLocation || m.location || '',
    district: m.district || '',
    state: m.state || '',
    dialectZone: m.dialectZone || '',
    recordingDevice: m.recordingDevice || '',
    recordingEnvironment: m.recordingEnvironment || '',
  }));

  await task.save();
  new ApiResponse(200, task.speakersMetadata, 'Speaker metadata saved successfully').send(res);
});
