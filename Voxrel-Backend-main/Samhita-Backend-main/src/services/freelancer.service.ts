/* eslint-disable max-lines-per-function, complexity, max-depth, @typescript-eslint/no-explicit-any */
import { FilterQuery, Types } from 'mongoose';
import { TaskFilters } from '@/types/filter.interface.js';
import { IProfile } from '@/types/profile.interface.js';
import { ITask, TaskStatus, TaskType } from '@/types/task.interface.js';
import { IReview, ReviewStatus } from '@/types/review.interface.js';
import { DraftSegment } from '@/types/draft.interface.js';
import { TranscriptionSegment } from '@/types/transcription.interface.js';
import Profile from '@/models/profile.model.js';
import Task from '@/models/task.model.js';
import Review from '@/models/review.model.js';
import Draft from '@/models/draft.model.js';
import Transcription from '@/models/transcription.model.js';
import ApiError from '@/utils/api-error.utility.js';

// --- Helper Functions ---

const addBasicAvailableFilters = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const { priority, language } = filters;

  if (priority) query.priority = priority as 'LOW' | 'MEDIUM' | 'HIGH';
  if (language) query.language = language;
};

const addSearchFilterToAvailable = (query: FilterQuery<ITask>, search?: string) => {
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }
};

const addDateFiltersToAvailable = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const { createdAfter, createdBefore, dueDateAfter, dueDateBefore } = filters;

  if (createdAfter || createdBefore) {
    query.createdAt = {};
    if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
    if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
  }

  if (dueDateAfter || dueDateBefore) {
    query.deadline = {};
    if (dueDateAfter) query.deadline.$gte = new Date(dueDateAfter);
    if (dueDateBefore) query.deadline.$lte = new Date(dueDateBefore);
  }
};

const addBudgetFiltersToAvailable = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const { minBudget, maxBudget } = filters;

  if (minBudget || maxBudget) {
    query.price = {};
    if (minBudget) query.price.$gte = parseFloat(minBudget);
    if (maxBudget) query.price.$lte = parseFloat(maxBudget);
  }
};

const buildAvailableTasksQuery = (filters: TaskFilters, userId: string): FilterQuery<ITask> => {
  const query: FilterQuery<ITask> = {
    status: TaskStatus.OPEN,
    claimedById: { $ne: userId },
  };

  // Filter by projectId if provided
  if (filters.projectId) {
    query.projectId = new Types.ObjectId(filters.projectId);
  }

  addBasicAvailableFilters(query, filters);
  addSearchFilterToAvailable(query, filters.search);
  addDateFiltersToAvailable(query, filters);
  addBudgetFiltersToAvailable(query, filters);

  return query;
};

const buildMyTasksQuery = (filters: TaskFilters, userId: string): FilterQuery<ITask> => {
  const {
    status,
    priority,
    search,
    language,
    createdAfter,
    createdBefore,
    dueDateAfter,
    dueDateBefore,
    projectId,
  } = filters;

  // Include tasks where user is either:
  // 1. The claimed freelancer (claimedById)
  // 2. Assigned to the task (in assignedFreelancers array)
  const query: FilterQuery<ITask> = {
    $or: [
      { claimedById: new Types.ObjectId(userId) },
      { assignedFreelancers: new Types.ObjectId(userId) },
    ],
  };

  // Filter by projectId if provided
  if (projectId) {
    query.projectId = new Types.ObjectId(projectId);
  }

  if (status) query.status = status as TaskStatus;
  if (priority) query.priority = priority as 'LOW' | 'MEDIUM' | 'HIGH';
  if (language) query.language = language;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (createdAfter || createdBefore) {
    query.createdAt = {};
    if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
    if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
  }

  if (dueDateAfter || dueDateBefore) {
    query.deadline = {};
    if (dueDateAfter) query.deadline.$gte = new Date(dueDateAfter);
    if (dueDateBefore) query.deadline.$lte = new Date(dueDateBefore);
  }

  return query;
};

const buildSortObject = (sortBy?: string, sortOrder?: string): Record<string, 1 | -1> => {
  if (!sortBy) return { createdAt: -1 };

  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

// --- Main Service Functions ---

export const updateProfile = async (userId: string, profileData: Partial<IProfile>) => {
  const profile = await Profile.findOneAndUpdate({ userId }, profileData, {
    new: true,
    upsert: true,
  }).lean();

  return profile;
};

export const getAvailableTasks = async (userId: string, filters: TaskFilters) => {
  // Parse page and limit as numbers to ensure proper calculations
  const page = parseInt(String(filters.page || 1), 10);
  const limit = parseInt(String(filters.limit || 10), 10);
  const { sortBy, sortOrder } = filters;

  const skip = (page - 1) * limit;

  const query = buildAvailableTasksQuery(filters, userId);
  const sort = buildSortObject(sortBy, sortOrder);

  const [tasks, total] = await Promise.all([
    Task.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Task.countDocuments(query),
  ]);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const claimTask = async (userId: string, taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.status !== TaskStatus.OPEN) {
    throw new ApiError(400, 'Task is not available for claiming');
  }

  if (task.claimedById) {
    throw new ApiError(400, 'Task is already claimed');
  }

  // Check max task per user limit
  const { getMaxTaskPerUser } = await import('@/services/settings.service.js');
  const maxTaskPerUser = await getMaxTaskPerUser();

  // Count current tasks claimed by user (in progress statuses)
  const currentClaimedTasks = await Task.countDocuments({
    claimedById: new Types.ObjectId(userId),
    status: { $in: [TaskStatus.PENDING_APPROVAL, TaskStatus.ASSIGNED] },
  });

  if (currentClaimedTasks >= maxTaskPerUser) {
    throw new ApiError(400, `Reach max task per user quota. Maximum allowed: ${maxTaskPerUser}`);
  }

  task.claimedById = new Types.ObjectId(userId);
  task.status = TaskStatus.PENDING_APPROVAL;
  await task.save();

  return task.toObject();
};

export const getMyTasks = async (userId: string, filters: TaskFilters) => {
  // Parse page and limit as numbers to ensure proper calculations
  const page = parseInt(String(filters.page || 1), 10);
  const limit = parseInt(String(filters.limit || 10), 10);
  const { sortBy, sortOrder } = filters;

  const skip = (page - 1) * limit;

  const query = buildMyTasksQuery(filters, userId);
  const sort = buildSortObject(sortBy, sortOrder);

  const [tasks, total] = await Promise.all([
    Task.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Task.countDocuments(query),
  ]);

  // Debug: Log recordingUrl for multi-speaker tasks
  const multiSpeakerTasks = tasks.filter((t: any) => t.type === 'multi');
  if (multiSpeakerTasks.length > 0) {
    console.log(`[getMyTasks] Found ${multiSpeakerTasks.length} multi-speaker tasks:`);
    multiSpeakerTasks.forEach((t: any) => {
      console.log(`[getMyTasks]   - Task ${t._id}: type=${t.type}, recordingUrl=${t.recordingUrl || 'none'}, roomName=${t.roomName || 'none'}`);
    });
  }

  // Fetch reviews for all tasks
  const taskIds = tasks.map(task => task._id);
  const reviews = await Review.find({ taskId: { $in: taskIds } })
    .populate('reviewerId', 'name email')
    .lean();

  console.log('Debug: Found reviews count:', reviews.length);

  // Create a map of taskId to review
  const reviewMap = new Map();
  reviews.forEach(review => {
    // Handle both populated (object with _id) and unpopulated (ObjectId/string) taskId
    const taskIdString =
      review.taskId && (review.taskId as any)._id
        ? (review.taskId as any)._id.toString()
        : review.taskId?.toString();

    if (taskIdString) {
      reviewMap.set(taskIdString, review);
    }
  });

  // Attach reviews to tasks
  const tasksWithReviews = tasks.map(task => {
    const taskIdStr = task._id.toString();
    const review = reviewMap.get(taskIdStr);
    return {
      ...task,
      review: review || null,
    };
  });

  return {
    tasks: tasksWithReviews,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const getTaskById = async (userId: string, taskId: string) => {
  // Validate that taskId is a valid ObjectId format
  if (!Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid task ID format');
  }

  const task = await Task.findById(taskId)
    .populate('claimedById', 'name email')
    .populate('projectId', 'name type')
    .lean();

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // FIRST: Check if user is assigned as reviewer (regardless of task status)
  // This allows reviewers to see tasks even if status hasn't been updated to IN_REVIEW yet
  const review = await Review.findOne({
    taskId: new Types.ObjectId(taskId),
    reviewerId: new Types.ObjectId(userId),
  }).lean();

  // If user is the reviewer, allow access (this is the primary use case for review page)
  if (review) {
    return { ...task, review };
  }

  // SECOND: Check if user claimed the task (for freelancers working on their tasks)
  if (task.claimedById && typeof task.claimedById === 'object') {
    const claimedById = (task.claimedById as any)._id?.toString() || task.claimedById.toString();
    if (claimedById === userId) {
      return task;
    }
  }

  // Check if user is in assignedFreelancers (for multi-speaker tasks)
  if (task.assignedFreelancers && Array.isArray(task.assignedFreelancers)) {
    const isAssigned = task.assignedFreelancers.some((id) => {
      const normalizedId = typeof id === 'object' && id.toString ? id.toString() : String(id);
      return normalizedId === userId;
    });
    if (isAssigned) {
      return task;
    }
  }

  // THIRD: If task is in a project and user is a project member, allow access
  // (This would require checking project membership, but for now we'll be permissive for review tasks)
  if (task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.SUBMITTED) {
    return task;
  }

  // If none of the above, deny access
  throw new ApiError(403, 'You are not authorized to access this task');
};

export const submitTask = async (
  userId: string,
  taskId: string,
  submission: string,
  speakerMetadata?: { speakerName?: string; speakerAge?: number; speakerLocation?: string }
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Helper to normalize ObjectId to string for comparison
  const normalizeId = (id: any): string => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.toString) return id.toString();
    return String(id);
  };

  // Check if user is authorized to submit
  // For single-speaker tasks: check claimedById
  // For multi-speaker tasks: check assignedFreelancers
  const isClaimedBy = normalizeId(task.claimedById) === userId;
  const isInAssignedFreelancers = task.assignedFreelancers?.some((id) => {
    const normalizedId = normalizeId(id);
    return normalizedId === userId;
  });

  if (!isClaimedBy && !isInAssignedFreelancers) {
    throw new ApiError(403, 'You are not authorized to submit this task');
  }

  if (task.status !== TaskStatus.ASSIGNED) {
    throw new ApiError(400, 'Task is not in a state that allows submission');
  }

  task.submission = submission;
  task.status = TaskStatus.SUBMITTED;

  // Save speaker metadata
  if (speakerMetadata) {
    // For single-speaker tasks, save directly
    if (task.type === TaskType.SINGLE) {
      if (speakerMetadata.speakerName) {
        task.speakerName = speakerMetadata.speakerName;
      }
      if (speakerMetadata.speakerAge) {
        task.speakerAge = speakerMetadata.speakerAge;
      }
      if (speakerMetadata.speakerLocation) {
        task.speakerLocation = speakerMetadata.speakerLocation;
      }
    } else if (task.type === TaskType.MULTI) {
      // For multi-speaker tasks, add to speakersMetadata array
      if (!task.speakersMetadata) {
        task.speakersMetadata = [];
      }
      
      // Check if this freelancer already has metadata (update if exists)
      const existingIndex = task.speakersMetadata.findIndex(
        (meta: any) => normalizeId(meta.freelancerId) === userId
      );

      const speakerData = {
        freelancerId: new Types.ObjectId(userId),
        name: speakerMetadata.speakerName || '',
        age: speakerMetadata.speakerAge || 0,
        location: speakerMetadata.speakerLocation || '',
      };

      if (existingIndex >= 0) {
        // Update existing metadata
        task.speakersMetadata[existingIndex] = speakerData;
      } else {
        // Add new metadata
        task.speakersMetadata.push(speakerData);
      }
    }
  }

  await task.save();

  return task.toObject();
};

export const listAssignedReviews = async (userId: string, filters: TaskFilters) => {
  // Parse page and limit as numbers to ensure proper calculations
  const page = parseInt(String(filters.page || 1), 10);
  const limit = parseInt(String(filters.limit || 10), 10);
  const { sortBy, sortOrder } = filters;

  const skip = (page - 1) * limit;

  const query: FilterQuery<IReview> = {
    reviewerId: new Types.ObjectId(userId),
    status: ReviewStatus.PENDING,
  };

  const sort = buildSortObject(sortBy, sortOrder);

  const [reviews, total] = await Promise.all([
    Review.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const submitReview = async (
  userId: string,
  reviewId: string,
  rating: number,
  feedback: string,
  decision?: 'APPROVE' | 'REJECT'
) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (review.reviewerId.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to submit this review');
  }

  if (review.status !== ReviewStatus.PENDING) {
    throw new ApiError(400, 'Review has already been submitted');
  }

  review.rating = rating;
  review.feedback = feedback;
  review.status = ReviewStatus.COMPLETED;
  review.submittedAt = new Date();
  await review.save();

  // Update original task based on decision
  console.log(`[submitReview] Processing decision: ${decision} for review ${reviewId}`);
  if (decision) {
    console.log(`[submitReview] Finding original task with ID: ${review.taskId}`);
    const originalTask = await Task.findById(review.taskId);

    if (originalTask) {
      console.log(
        `[submitReview] Found original task: ${originalTask._id}, current status: ${originalTask.status}`
      );

      let targetTask = originalTask;
      let reviewWrapperTask: any = null;

      // Check if this task is a "Review Task" wrapper that points to a "Source Task"
      if (originalTask.tags && originalTask.tags.length > 0) {
        // Tag format check: regex search for sourceTaskId inside the tag string
        // The tag might be a JSON string like '{"sourceTaskId":"..."}' OR just a string 'sourceTaskId:...'
        // We iterate tags to find the one containing the key
        const sourceIdTag = originalTask.tags.find(t => t.includes('sourceTaskId'));
        if (sourceIdTag) {
          console.log(`[submitReview] Found sourceIdTag: ${sourceIdTag}`);

          // More robust extraction: get everything after sourceTaskId: until end or comma/brace
          const match = sourceIdTag.match(/sourceTaskId["'\s]*:["'\s]*([^,"'}]+)/);

          if (match && match[1]) {
            // Clean up ANY lingering quotes or whitespace
            const sourceId = match[1].replace(/["'}]/g, '').trim();
            console.log(`[submitReview] Extracted & cleaned sourceId: ${sourceId}`);

            if (/^[0-9a-fA-F]{24}$/.test(sourceId)) {
              try {
                const sourceTask = await Task.findById(sourceId);
                if (sourceTask) {
                  console.log(
                    `[submitReview] Redirect confirmed. Source task found: ${sourceTask._id}`
                  );
                  reviewWrapperTask = originalTask;
                  targetTask = sourceTask;
                } else {
                  console.log(
                    `[submitReview] Source task ID valid format but task not found via findById.`
                  );
                }
              } catch (err) {
                console.error(`[submitReview] Error finding source task:`, err);
              }
            } else {
              console.log(`[submitReview] Extracted ID does not look like a valid ObjectId.`);
            }
          }
        }
      }

      if (decision === 'APPROVE') {
        console.log(`[submitReview] Setting target task (${targetTask._id}) status to COMPLETED`);
        targetTask.status = TaskStatus.COMPLETED;
      } else if (decision === 'REJECT') {
        console.log(`[submitReview] Setting target task (${targetTask._id}) status to ASSIGNED`);
        targetTask.status = TaskStatus.ASSIGNED;
      }
      await targetTask.save();
      console.log(`[submitReview] Target task updated successfully`);

      // If we found a wrapper task here (meaning review.taskId pointed to "gooddd"),
      // we must mark the wrapper as COMPLETED now.
      if (reviewWrapperTask) {
        console.log(`[submitReview] Also completing wrapper task: ${reviewWrapperTask._id}`);
        reviewWrapperTask.status = TaskStatus.COMPLETED;
        await reviewWrapperTask.save();

        // CRITICAL: Propagate review data (feedback, rating) to the Source Task's review record
        // This ensures the Admin Dashboard (which looks at Source Task) sees the review details.
        try {
          console.log(
            `[submitReview] Propagating review details to source task: ${targetTask._id}`
          );
          let sourceReview = await Review.findOne({ taskId: targetTask._id });

          if (!sourceReview) {
            console.log(`[submitReview] No review record found for source task. Creating one.`);
            sourceReview = new Review({
              taskId: targetTask._id,
              reviewerId: review.reviewerId,
              assignedAt: review.assignedAt || new Date(),
            });
          }

          sourceReview.rating = rating;
          sourceReview.feedback = feedback;
          sourceReview.status = ReviewStatus.COMPLETED;
          sourceReview.submittedAt = new Date();
          await sourceReview.save();
          console.log(`[submitReview] Source task review record updated successfully.`);
        } catch (err) {
          console.error(`[submitReview] Error propagating review to source task:`, err);
        }
      }
    } else {
      console.error(`[submitReview] CRITICAL: Original task not found for ID: ${review.taskId}`);
    }
  } else {
    console.log(`[submitReview] No decision provided in request`);
  }

  // Also update the review task status to SUBMITTED if it exists and hasn't been submitted yet.
  // We identify the review task by the sourceTaskId tag matching review.taskId
  try {
    const matchingReviewTask = await Task.findOne({
      claimedById: new Types.ObjectId(userId),
      tags: { $elemMatch: { $regex: `.*"sourceTaskId":"${review.taskId}".*` } },
      status: { $in: [TaskStatus.ASSIGNED, TaskStatus.IN_REVIEW] },
    });

    if (matchingReviewTask) {
      console.log(`[submitReview] Found matching review task: ${matchingReviewTask._id}`);
      // Mark the review task as COMPLETED because the review work is finished
      matchingReviewTask.status = TaskStatus.COMPLETED;
      await matchingReviewTask.save();

      // Ensure the review record for this wrapper task is also updated with feedback
      // This is crucial if the Admin is viewing the Wrapper Task in the dashboard.
      try {
        const wrapperReview = await Review.findOne({ taskId: matchingReviewTask._id });
        if (wrapperReview) {
          wrapperReview.rating = rating;
          wrapperReview.feedback = feedback;
          wrapperReview.status = ReviewStatus.COMPLETED;
          wrapperReview.submittedAt = new Date();
          await wrapperReview.save();
          console.log(`[submitReview] Wrapper task review updated with feedback.`);
        }
      } catch (err) {
        console.error(`[submitReview] Error updating wrapper review:`, err);
      }
    } else {
      console.log(`[submitReview] No matching review task found for review ${reviewId}`);
    }
  } catch (err) {
    console.error(`[submitReview] Error updating review task status:`, err);
    // Don't block the review submission if this fails, but log it
  }

  return review.toObject();
};

export const startReviewTask = async (userId: string, taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.claimedById?.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to start this review');
  }

  // Ensure a Review object exists for this task
  // This mirrors the logic in admin.service.ts updateTaskAdmin
  const existingReview = await Review.findOne({ taskId: task._id });
  if (!existingReview) {
    console.log(`[startReviewTask] Creating new Review object for task ${task._id}`);
    await Review.create({
      taskId: task._id,
      reviewerId: new Types.ObjectId(userId),
      status: ReviewStatus.PENDING,
      assignedAt: new Date(),
    });
  } else {
    console.log(`[startReviewTask] Review object already exists for task ${task._id}`);
  }

  if (task.status !== TaskStatus.ASSIGNED) {
    // If already in review, just return it
    if (task.status === TaskStatus.IN_REVIEW) {
      return task.toObject();
    }
    throw new ApiError(400, 'Task is not in ASSIGNED state');
  }

  task.status = TaskStatus.IN_REVIEW;
  await task.save();

  return task.toObject();
};

export const saveDraft = async (
  userId: string,
  taskId: string,
  draftData: {
    progress: number;
    segments: DraftSegment[];
    lastSavedAt: string;
  }
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.claimedById?.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to save draft for this task');
  }

  // Upsert draft (create or update)
  const draft = await Draft.findOneAndUpdate(
    { taskId: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) },
    {
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      segments: draftData.segments,
      progress: draftData.progress,
      lastSavedAt: new Date(draftData.lastSavedAt),
    },
    { upsert: true, new: true }
  );

  return draft.toObject();
};

export const getDraft = async (userId: string, taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check if user is the one who claimed the task
  const isClaimant = task.claimedById?.toString() === userId;

  // Check if user is a reviewer assigned to this task
  const review = await Review.findOne({
    taskId: new Types.ObjectId(taskId),
    reviewerId: new Types.ObjectId(userId),
  });
  const isReviewer = !!review;

  if (!isClaimant && !isReviewer) {
    throw new ApiError(403, 'You are not authorized to access draft for this task');
  }

  // If claimant, get their own draft. If reviewer, get the draft of the task.
  const query: any = { taskId: new Types.ObjectId(taskId) };
  if (isClaimant && !isReviewer) {
    query.userId = new Types.ObjectId(userId);
  }

  const draft = await Draft.findOne(query);

  if (!draft) {
    return {
      progress: 0,
      segments: [],
      lastSavedAt: new Date().toISOString(),
    };
  }

  return {
    progress: draft.progress,
    segments: draft.segments,
    lastSavedAt: draft.lastSavedAt.toISOString(),
  };
};

export const saveTranscript = async (
  userId: string,
  taskId: string,
  transcriptData: {
    segments: TranscriptionSegment[];
  }
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.claimedById?.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to save transcript for this task');
  }

  // Upsert transcription (create or update)
  const transcription = await Transcription.findOneAndUpdate(
    { taskId: new Types.ObjectId(taskId), userId: new Types.ObjectId(userId) },
    {
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      segments: transcriptData.segments,
    },
    { upsert: true, new: true }
  );

  return transcription.toObject();
};

export const getTranscript = async (userId: string, taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check if this is a review task by checking if it has sourceTaskId in tags
  // Review tasks store the source task ID in tags as JSON
  let isReviewTask = false;
  let sourceTaskIdFromTags = null;

  console.log(`[getTranscript] Task tags:`, task.tags);
  console.log(`[getTranscript] Task tags type:`, typeof task.tags, Array.isArray(task.tags));

  if (task.tags && Array.isArray(task.tags) && task.tags.length > 0) {
    console.log(`[getTranscript] Processing ${task.tags.length} tag(s)`);
    for (let i = 0; i < task.tags.length; i++) {
      const tag = task.tags[i];
      console.log(`[getTranscript] Tag ${i}:`, tag, `Type:`, typeof tag);

      try {
        // Try parsing as JSON string first
        let parsedTag: any = tag;
        if (typeof tag === 'string') {
          parsedTag = JSON.parse(tag);
        }

        // If it's already an object, use it directly
        if (typeof parsedTag === 'object' && parsedTag !== null) {
          console.log(`[getTranscript] Parsed tag ${i}:`, parsedTag);
          if (parsedTag.sourceTaskId) {
            isReviewTask = true;
            sourceTaskIdFromTags = parsedTag.sourceTaskId;
            console.log(
              `[getTranscript] ✅ Detected review task with sourceTaskId in tags: ${sourceTaskIdFromTags}`
            );
            break;
          }
        }
      } catch (e) {
        console.log(`[getTranscript] Tag ${i} is not JSON, error:`, e);
        // Not JSON, continue
      }
    }
  }

  if (!sourceTaskIdFromTags) {
    console.log(`[getTranscript] No sourceTaskId found in tags`);
  }

  // IMPORTANT: Check reviewer status FIRST (before claimant check)
  // This is because review tasks might have the reviewer as claimedById,
  // but we want to use reviewer logic to find the original task's transcription
  const review = await Review.findOne({
    taskId: new Types.ObjectId(taskId),
    reviewerId: new Types.ObjectId(userId),
  });
  const isReviewer = !!review;

  // Also check if there's ANY review for this task (in case reviewerId doesn't match exactly)
  // If a review exists for this task, we should use reviewer logic to find the original task's transcription
  const anyReview = await Review.findOne({ taskId: new Types.ObjectId(taskId) });
  const hasReviewForTask = !!anyReview;

  console.log(
    `[getTranscript] Review check - isReviewTask: ${isReviewTask}, isReviewer: ${isReviewer}, hasReviewForTask: ${hasReviewForTask}`
  );
  if (anyReview) {
    console.log(`[getTranscript] Review details:`, {
      reviewId: anyReview._id,
      taskId: anyReview.taskId,
      reviewerId: anyReview.reviewerId,
      status: anyReview.status,
    });
  }

  // Check if user is the one who claimed the task (only if not a reviewer and no review exists and not a review task)
  const isClaimant =
    !isReviewer && !hasReviewForTask && !isReviewTask && task.claimedById?.toString() === userId;

  // If there's a review for this task OR it's a review task, treat as reviewer
  const shouldUseReviewerLogic = isReviewer || hasReviewForTask || isReviewTask;

  if (!isClaimant && !shouldUseReviewerLogic) {
    throw new ApiError(403, 'You are not authorized to access transcript for this task');
  }

  console.log(
    `[getTranscript] User ${userId} - isReviewer: ${isReviewer}, isClaimant: ${isClaimant}, shouldUseReviewerLogic: ${shouldUseReviewerLogic}, taskId: ${taskId}, task.status: ${task.status}, task.projectId: ${task.projectId}`
  );

  // Build query to get the transcript
  let transcription = null;

  // FIRST: If NOT a review task, try to find transcription directly for the given taskId
  // This handles the case where the frontend passes the original task ID
  if (!isReviewTask) {
    console.log(
      `[getTranscript] Step 1: Trying direct lookup for taskId (not a review task): ${taskId}`
    );

    // Try with userId if task has claimedById
    if (task.claimedById) {
      const directQueryWithUserId = {
        taskId: new Types.ObjectId(taskId),
        userId: new Types.ObjectId(task.claimedById.toString()),
      };
      console.log(
        `[getTranscript] Direct query (with userId):`,
        JSON.stringify(directQueryWithUserId, null, 2)
      );
      transcription = await Transcription.findOne(directQueryWithUserId);
      if (transcription && transcription.segments && transcription.segments.length > 0) {
        console.log(
          `[getTranscript] ✅ Found transcription directly (with userId): ${transcription.segments.length} segments`
        );
      }
    }

    // Try without userId filter
    if (!transcription || !transcription.segments || transcription.segments.length === 0) {
      const directQueryByTaskId = { taskId: new Types.ObjectId(taskId) };
      console.log(
        `[getTranscript] Direct query (taskId only):`,
        JSON.stringify(directQueryByTaskId, null, 2)
      );
      transcription = await Transcription.findOne(directQueryByTaskId);
      if (transcription && transcription.segments && transcription.segments.length > 0) {
        console.log(
          `[getTranscript] ✅ Found transcription directly (taskId only): ${transcription.segments.length} segments`
        );
      }
    }

    // If found directly, return it
    if (transcription && transcription.segments && transcription.segments.length > 0) {
      console.log(
        `[getTranscript] ✅ Returning transcription found directly for taskId: ${taskId}`
      );
      const segments = Array.isArray(transcription.segments) ? transcription.segments : [];
      return { segments };
    }
  } else {
    console.log(
      `[getTranscript] Step 1: Skipping direct lookup - this is a review task, will use sourceTaskId`
    );
  }

  // SECOND: If not found directly and user is claimant, try claimant-specific query
  if (!transcription && isClaimant && !shouldUseReviewerLogic) {
    const query = {
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    };
    console.log(`[getTranscript] Claimant query:`, JSON.stringify(query, null, 2));
    transcription = await Transcription.findOne(query);
    if (transcription && transcription.segments && transcription.segments.length > 0) {
      console.log(`[getTranscript] ✅ Found transcription for claimant`);
      const segments = Array.isArray(transcription.segments) ? transcription.segments : [];
      return { segments };
    }
  }

  // THIRD: If still not found and should use reviewer logic, try reviewer strategies
  if (!transcription && shouldUseReviewerLogic) {
    // Use reviewer logic if user is a reviewer OR if there's any review for this task
    console.log(`[getTranscript] Using reviewer logic to find transcription`);
    // For reviewers, the taskId might be a review task (new task), not the original submitted task
    // We need to find the original task that has the transcription

    // Strategy 0: Check if this is a review task with sourceTaskId in tags
    // Review tasks store the source task ID in tags as JSON
    // Use the sourceTaskId we already extracted above
    if (sourceTaskIdFromTags) {
      console.log(
        `[getTranscript] Strategy 0: Using sourceTaskId from tags: ${sourceTaskIdFromTags}`
      );

      // Get the source task to find its claimedById and projectId
      const sourceTask = await Task.findById(sourceTaskIdFromTags);
      if (sourceTask) {
        console.log(`[getTranscript] Source task found:`, {
          taskId: sourceTask._id,
          status: sourceTask.status,
          claimedById: sourceTask.claimedById,
          projectId: sourceTask.projectId,
        });

        // First try with the original task's claimedById
        if (sourceTask.claimedById) {
          const queryWithSourceUserId = {
            taskId: new Types.ObjectId(sourceTaskIdFromTags),
            userId: new Types.ObjectId(sourceTask.claimedById.toString()),
          };
          console.log(
            `[getTranscript] Querying transcription for source task (with userId):`,
            JSON.stringify(queryWithSourceUserId, null, 2)
          );
          transcription = await Transcription.findOne(queryWithSourceUserId);
          if (transcription && transcription.segments && transcription.segments.length > 0) {
            console.log(
              `[getTranscript] ✅ Found transcription using sourceTaskId with userId (${transcription.segments.length} segments)`
            );
          }
        }

        // If not found, try without userId filter
        if (!transcription || !transcription.segments || transcription.segments.length === 0) {
          const queryBySourceTaskId = { taskId: new Types.ObjectId(sourceTaskIdFromTags) };
          console.log(
            `[getTranscript] Querying transcription for source task (taskId only):`,
            JSON.stringify(queryBySourceTaskId, null, 2)
          );
          transcription = await Transcription.findOne(queryBySourceTaskId);
          if (transcription && transcription.segments && transcription.segments.length > 0) {
            console.log(
              `[getTranscript] ✅ Found transcription using sourceTaskId without userId (${transcription.segments.length} segments)`
            );
          }
        }

        // If still not found, try searching in the source task's project
        if (!transcription || !transcription.segments || transcription.segments.length === 0) {
          if (sourceTask.projectId) {
            console.log(
              `[getTranscript] Strategy 0.5: Searching transcriptions in source project: ${sourceTask.projectId}`
            );

            // Find all tasks in the source project
            const sourceProjectTasks = await Task.find({
              projectId: sourceTask.projectId,
            }).sort({ createdAt: -1 });

            console.log(
              `[getTranscript] Found ${sourceProjectTasks.length} task(s) in source project`
            );

            // Try to find transcription for each task in the source project
            for (const sourceProjectTask of sourceProjectTasks) {
              const sourceProjectTaskId = sourceProjectTask._id.toString();

              // Try with userId first
              if (sourceProjectTask.claimedById) {
                const querySourceProjectTask = {
                  taskId: new Types.ObjectId(sourceProjectTaskId),
                  userId: new Types.ObjectId(sourceProjectTask.claimedById.toString()),
                };
                const foundTranscription = await Transcription.findOne(querySourceProjectTask);
                if (
                  foundTranscription &&
                  foundTranscription.segments &&
                  foundTranscription.segments.length > 0
                ) {
                  console.log(
                    `[getTranscript] ✅ Found transcription in source project task: ${sourceProjectTaskId} (${foundTranscription.segments.length} segments)`
                  );
                  transcription = foundTranscription;
                  break;
                }
              }

              // Try without userId
              const querySourceProjectTaskById = {
                taskId: new Types.ObjectId(sourceProjectTaskId),
              };
              const foundTranscription = await Transcription.findOne(querySourceProjectTaskById);
              if (
                foundTranscription &&
                foundTranscription.segments &&
                foundTranscription.segments.length > 0
              ) {
                console.log(
                  `[getTranscript] ✅ Found transcription in source project task: ${sourceProjectTaskId} (${foundTranscription.segments.length} segments)`
                );
                transcription = foundTranscription;
                break;
              }
            }
          }
        }

        if (!transcription || !transcription.segments || transcription.segments.length === 0) {
          console.log(
            `[getTranscript] ❌ No transcription found for sourceTaskId: ${sourceTaskIdFromTags} or in source project`
          );
        }
      } else {
        console.log(`[getTranscript] ❌ Source task not found: ${sourceTaskIdFromTags}`);
      }
    }

    // Strategy 1: Try to find transcription by current taskId (in case it's the original task)
    if (!transcription && task.claimedById) {
      const queryWithUserId = {
        taskId: new Types.ObjectId(taskId),
        userId: new Types.ObjectId(task.claimedById.toString()),
      };
      console.log(
        `[getTranscript] Reviewer query (with userId):`,
        JSON.stringify(queryWithUserId, null, 2)
      );
      transcription = await Transcription.findOne(queryWithUserId);
    }

    // Strategy 2: Try to find ANY transcription for this taskId
    if (!transcription) {
      const queryByTaskId = { taskId: new Types.ObjectId(taskId) };
      console.log(
        `[getTranscript] Reviewer fallback query (taskId only):`,
        JSON.stringify(queryByTaskId, null, 2)
      );
      transcription = await Transcription.findOne(queryByTaskId);
      if (transcription) {
        console.log(`[getTranscript] Found transcription using taskId-only query`);
      }
    }

    // Strategy 3: Find transcription by matching audioUrl with other tasks
    if (
      !transcription &&
      (task.audioUrl ||
        (task.audioUrls && Array.isArray(task.audioUrls) && task.audioUrls.length > 0))
    ) {
      const audioUrlToMatch =
        task.audioUrl || (task.audioUrls && task.audioUrls.length > 0 ? task.audioUrls[0] : null);
      if (audioUrlToMatch) {
        console.log(
          `[getTranscript] Review task detected (taskId: ${taskId}), searching for original task with audioUrl: ${audioUrlToMatch}`
        );
        console.log(
          `[getTranscript] Current task status: ${task.status}, claimedById: ${task.claimedById}, projectId: ${task.projectId}`
        );

        // Find ALL tasks that have this audioUrl (excluding current task)
        const tasksWithSameAudio = await Task.find({
          $or: [{ audioUrl: audioUrlToMatch }, { audioUrls: audioUrlToMatch }],
          _id: { $ne: new Types.ObjectId(taskId) }, // Exclude the current review task
        }).sort({ createdAt: -1 }); // Get the most recent first

        console.log(
          `[getTranscript] Found ${tasksWithSameAudio.length} task(s) with same audioUrl`
        );

        // Try each task to find one with a transcription
        for (const originalTask of tasksWithSameAudio) {
          const originalTaskId = originalTask._id.toString();
          console.log(
            `[getTranscript] Checking task ${originalTaskId} (status: ${originalTask.status}, claimedById: ${originalTask.claimedById})`
          );

          // Try to find transcription for this task
          let foundTranscription = null;

          if (originalTask.claimedById) {
            const queryOriginalWithUserId = {
              taskId: new Types.ObjectId(originalTaskId),
              userId: new Types.ObjectId(originalTask.claimedById.toString()),
            };
            console.log(
              `[getTranscript] Querying transcription for task ${originalTaskId} (with userId):`,
              JSON.stringify(queryOriginalWithUserId, null, 2)
            );
            foundTranscription = await Transcription.findOne(queryOriginalWithUserId);
          }

          // If not found, try without userId filter
          if (!foundTranscription) {
            const queryOriginalByTaskId = { taskId: new Types.ObjectId(originalTaskId) };
            console.log(
              `[getTranscript] Querying transcription for task ${originalTaskId} (taskId only):`,
              JSON.stringify(queryOriginalByTaskId, null, 2)
            );
            foundTranscription = await Transcription.findOne(queryOriginalByTaskId);
          }

          if (
            foundTranscription &&
            foundTranscription.segments &&
            foundTranscription.segments.length > 0
          ) {
            console.log(
              `[getTranscript] ✅ Found transcription for original task: ${originalTaskId} (${foundTranscription.segments.length} segments)`
            );
            transcription = foundTranscription;
            break; // Found it, stop searching
          } else {
            console.log(`[getTranscript] No transcription found for task ${originalTaskId}`);
          }
        }

        if (!transcription) {
          console.log(
            `[getTranscript] ❌ No transcription found in any task with audioUrl: ${audioUrlToMatch}`
          );
        }
      }
    }

    // Strategy 4: NEW APPROACH - Find transcription by projectId (if available)
    // This is a more reliable fallback - find all transcriptions for tasks in the same project
    if (!transcription && task.projectId) {
      console.log(
        `[getTranscript] Strategy 4: Searching for transcription by projectId: ${task.projectId}`
      );

      // Find all tasks in the same project that have transcriptions
      const projectTasks = await Task.find({
        projectId: task.projectId,
        _id: { $ne: new Types.ObjectId(taskId) }, // Exclude current review task
      }).sort({ createdAt: -1 });

      console.log(`[getTranscript] Found ${projectTasks.length} task(s) in the same project`);

      // Try to find transcription for each task in the project
      for (const projectTask of projectTasks) {
        const projectTaskId = projectTask._id.toString();

        // Try with userId first
        if (projectTask.claimedById) {
          const queryProjectTask = {
            taskId: new Types.ObjectId(projectTaskId),
            userId: new Types.ObjectId(projectTask.claimedById.toString()),
          };
          const foundTranscription = await Transcription.findOne(queryProjectTask);
          if (
            foundTranscription &&
            foundTranscription.segments &&
            foundTranscription.segments.length > 0
          ) {
            console.log(
              `[getTranscript] ✅ Found transcription for project task: ${projectTaskId} (${foundTranscription.segments.length} segments)`
            );
            transcription = foundTranscription;
            break;
          }
        }

        // Try without userId
        const queryProjectTaskById = { taskId: new Types.ObjectId(projectTaskId) };
        const foundTranscription = await Transcription.findOne(queryProjectTaskById);
        if (
          foundTranscription &&
          foundTranscription.segments &&
          foundTranscription.segments.length > 0
        ) {
          console.log(
            `[getTranscript] ✅ Found transcription for project task: ${projectTaskId} (${foundTranscription.segments.length} segments)`
          );
          transcription = foundTranscription;
          break;
        }
      }

      if (!transcription) {
        console.log(`[getTranscript] ❌ No transcription found in project ${task.projectId}`);
      }
    }

    // Strategy 5: LAST RESORT - Find transcription by checking all transcriptions and matching by project
    // Find all transcriptions, then check if their task belongs to the same project
    if (!transcription && task.projectId) {
      console.log(
        `[getTranscript] Strategy 5: Last resort - searching all transcriptions for project ${task.projectId}`
      );

      // Get all transcriptions with segments
      const allTranscriptions = await Transcription.find({
        $expr: { $gt: [{ $size: { $ifNull: ['$segments', []] } }, 0] },
      })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to most recent 50

      console.log(
        `[getTranscript] Found ${allTranscriptions.length} transcription(s) with segments`
      );

      // Check each transcription's task to see if it belongs to the same project
      for (const trans of allTranscriptions) {
        const transTask = await Task.findById(trans.taskId);
        if (
          transTask &&
          transTask.projectId &&
          transTask.projectId.toString() === task.projectId.toString()
        ) {
          if (trans.segments && trans.segments.length > 0) {
            console.log(
              `[getTranscript] ✅ Found transcription (last resort): task ${trans.taskId} in project ${task.projectId} (${trans.segments.length} segments)`
            );
            transcription = trans;
            break;
          }
        }
      }

      if (!transcription) {
        console.log(`[getTranscript] ❌ No transcriptions found in project ${task.projectId}`);
      }
    }
  }

  console.log(
    `[getTranscript] Final check - Found transcription:`,
    transcription ? `Yes (${transcription.segments?.length || 0} segments)` : 'No'
  );

  if (transcription) {
    console.log(`[getTranscript] Transcription details:`, {
      _id: transcription._id,
      taskId: transcription.taskId,
      userId: transcription.userId,
      segmentsCount: transcription.segments?.length || 0,
      hasSegments: !!transcription.segments,
      segmentsIsArray: Array.isArray(transcription.segments),
    });

    // Make sure segments is an array
    const segments = Array.isArray(transcription.segments) ? transcription.segments : [];
    console.log(`[getTranscript] ✅ Returning ${segments.length} segments`);
    return {
      segments,
    };
  }

  // If no transcription found, log comprehensive debugging info
  console.log(`[getTranscript] ❌ No transcription found for task ${taskId}`);
  console.log(`[getTranscript] Task details:`, {
    taskId,
    taskStatus: task.status,
    taskProjectId: task.projectId,
    taskClaimedById: task.claimedById,
    taskTags: task.tags,
    isReviewTask,
    sourceTaskIdFromTags,
    shouldUseReviewerLogic,
  });

  // Also log all transcriptions for this taskId for debugging
  const allTranscriptions = await Transcription.find({ taskId: new Types.ObjectId(taskId) });
  console.log(`[getTranscript] All transcriptions for taskId ${taskId}:`, allTranscriptions.length);
  if (allTranscriptions.length > 0) {
    console.log(
      `[getTranscript] Found ${allTranscriptions.length} transcription(s) but query didn't match:`,
      allTranscriptions.map(t => ({ _id: t._id, taskId: t.taskId, userId: t.userId }))
    );
  }

  // If we have sourceTaskId, also check transcriptions for that task
  if (sourceTaskIdFromTags) {
    const sourceTranscriptions = await Transcription.find({
      taskId: new Types.ObjectId(sourceTaskIdFromTags),
    });
    console.log(
      `[getTranscript] All transcriptions for sourceTaskId ${sourceTaskIdFromTags}:`,
      sourceTranscriptions.length
    );
    if (sourceTranscriptions.length > 0) {
      console.log(
        `[getTranscript] Source task transcriptions:`,
        sourceTranscriptions.map(t => ({
          _id: t._id,
          taskId: t.taskId,
          userId: t.userId,
          segmentsCount: t.segments?.length || 0,
        }))
      );
    }
  }

  return {
    segments: [],
  };
};

export const uploadAudio = async (
  userId: string,
  taskId: string,
  audioFile: Express.Multer.File
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.claimedById?.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to upload audio for this task');
  }

  if (task.status !== TaskStatus.ASSIGNED) {
    throw new ApiError(400, 'Task is not in a state that allows audio upload');
  }

  // Upload audio file to R2
  const { uploadFileToR2 } = await import('@/utils/r2.utility.js');
  const audioUrl = await uploadFileToR2(audioFile, 'tasks');

  return {
    url: audioUrl,
    taskId,
  };
};

export const getRoomToken = async (userId: string, taskId: string) => {
  // 1. Verify JWT (already done by middleware)
  // 2. Check freelancer is assigned
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.type !== 'multi') {
    throw new ApiError(400, 'Task is not a multi-speaker task');
  }

  // Check if user is assigned (either in assignedFreelancers or claimedById)
  const isAssigned =
    task.assignedFreelancers?.some((id) => id.toString() === userId) ||
    task.claimedById?.toString() === userId;

  if (!isAssigned) {
    throw new ApiError(403, 'You are not assigned to this task');
  }

  // 3. Fetch task.roomName
  if (!task.roomName) {
    throw new ApiError(500, 'Task room name not set');
  }

  // 4. Generate LiveKit token
  const identity = `user-${userId}`;

  const { generateLiveKitToken } = await import('@/utils/livekit.js');
  const tokenData = await generateLiveKitToken(task.roomName, identity);

  // 5. Return token
  return tokenData;
};