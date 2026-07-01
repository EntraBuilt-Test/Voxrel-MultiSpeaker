import { FilterQuery, Types } from 'mongoose';
import { TaskFilters, UserFilters } from '@/types/filter.interface.js';
import { ITask, TaskPriority, TaskStatus, TaskType } from '@/types/task.interface.js';
import { IUser, UserStatus } from '@/types/user.interface.js';
import { ReviewStatus } from '@/types/review.interface.js';
import { ProjectType } from '@/types/project.interface.js';
import Task from '@/models/task.model.js';
import User from '@/models/user.model.js';
import Project from '@/models/project.model.js';
import Review from '@/models/review.model.js';
import Transcription from '@/models/transcription.model.js';
import ApiError from '@/utils/api-error.utility.js';

// --- Helper Functions ---

const addBasicFilters = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const { status, priority, assignedTo, language, projectId } = filters;

  if (status) {
    if (status.includes(',')) {
      query.status = { $in: status.split(',') as TaskStatus[] };
    } else {
      query.status = status as TaskStatus;
    }
  }
  if (priority) query.priority = priority as TaskPriority;
  if (assignedTo) query.claimedById = assignedTo;
  if (language) query.language = { $regex: new RegExp(`^\\s*${language}\\s*$`, 'i') };
  if (projectId) query.projectId = projectId;
};

const addSearchFilter = (query: FilterQuery<ITask>, search?: string) => {
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }
};

const addDateFilters = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const {
    createdAfter,
    createdBefore,
    dueDateAfter,
    dueDateBefore,
    assignedAfter,
    assignedBefore,
  } = filters;

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

  if (assignedAfter || assignedBefore) {
    query.updatedAt = {};
    if (assignedAfter) query.updatedAt.$gte = new Date(assignedAfter);
    if (assignedBefore) query.updatedAt.$lte = new Date(assignedBefore);
  }
};

const addBudgetFilters = (query: FilterQuery<ITask>, filters: TaskFilters) => {
  const { minBudget, maxBudget } = filters;

  if (minBudget || maxBudget) {
    query.price = {};
    if (minBudget) query.price.$gte = parseFloat(minBudget);
    if (maxBudget) query.price.$lte = parseFloat(maxBudget);
  }
};

const addCompletionFilter = (query: FilterQuery<ITask>, completedAfter?: string) => {
  if (completedAfter) {
    query.status = TaskStatus.COMPLETED;
    query.updatedAt = { $gte: new Date(completedAfter) };
  }
};

const buildTaskQuery = (filters: TaskFilters): FilterQuery<ITask> => {
  const query: FilterQuery<ITask> = {};

  addBasicFilters(query, filters);
  addSearchFilter(query, filters.search);
  addDateFilters(query, filters);
  addBudgetFilters(query, filters);
  addCompletionFilter(query, filters.completedAfter);

  return query;
};

const buildUserQuery = (filters: UserFilters): FilterQuery<IUser> => {
  const { role, status, search, createdAfter, createdBefore } = filters;

  const query: FilterQuery<IUser> = {};

  // SUPER ADMIN EXTENSION: Handle role filtering including SUPER_ADMIN
  if (role && role !== 'all') {
    query.role = role as 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER';
  } else if (!role) {
    // Default to only freelancers if no role specified (exclude admin and super admin)
    query.role = 'FREELANCER';
  }
  // If role === 'all', we don't set query.role, so it returns all roles

  if (status) query.status = status as UserStatus;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (createdAfter || createdBefore) {
    query.createdAt = {};
    if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
    if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
  }

  return query;
};

const buildSortObject = (sortBy?: string, sortOrder?: string): Record<string, 1 | -1> => {
  if (!sortBy) return { createdAt: -1 };

  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

// Helper function to build task payload with optional fields
const buildTaskPayload = (taskData: Partial<ITask>, audioUrl?: string): Partial<ITask> => {
  const taskPayload: Partial<ITask> = {
    title: taskData.title,
    price: taskData.price,
    language: taskData.language,
    ...(audioUrl && { audioUrl }),
  };

  // Only include optional fields if they are provided
  if (taskData.tags && taskData.tags.length > 0) {
    taskPayload.tags = taskData.tags;
  }
  if (taskData.description) {
    taskPayload.description = taskData.description;
  }
  if (taskData.priority) {
    taskPayload.priority = taskData.priority;
  }
  if (taskData.deadline) {
    taskPayload.deadline = taskData.deadline;
  }
  if (taskData.projectId) {
    taskPayload.projectId = taskData.projectId;
  }
  
  // Always include type field - use provided value or default to SINGLE
  // This ensures the type is always set, even if not explicitly provided
  taskPayload.type = taskData.type || TaskType.SINGLE;
  
  if (taskData.assignedFreelancers && taskData.assignedFreelancers.length > 0) {
    taskPayload.assignedFreelancers = taskData.assignedFreelancers;
  }

  // Speaker metadata for single-speaker tasks
  if (taskData.speakerName) {
    taskPayload.speakerName = taskData.speakerName;
  }
  if (taskData.speakerAge) {
    taskPayload.speakerAge = taskData.speakerAge;
  }
  if (taskData.speakerLocation) {
    taskPayload.speakerLocation = taskData.speakerLocation;
  }

  // Speaker metadata for multi-speaker tasks
  if (taskData.speakersMetadata && Array.isArray(taskData.speakersMetadata) && taskData.speakersMetadata.length > 0) {
    taskPayload.speakersMetadata = taskData.speakersMetadata.map((meta: any) => ({
      freelancerId: new Types.ObjectId(meta.freelancerId),
      name: meta.name,
      age: meta.age,
      location: meta.location,
    }));
  }

  console.log('📝 Building task payload:', {
    receivedType: taskData.type,
    finalType: taskPayload.type,
    taskData: JSON.stringify(taskData, null, 2)
  });

  return taskPayload;
};

// Helper function to clean task response by removing empty optional fields
const cleanTaskResponse = (taskObj: Record<string, unknown>): Record<string, unknown> => {
  const cleanedTask: Record<string, unknown> = {
    _id: taskObj._id,
    title: taskObj.title,
    price: taskObj.price,
    language: taskObj.language,
    audioUrl: taskObj.audioUrl,
    status: taskObj.status,
    createdAt: taskObj.createdAt,
    updatedAt: taskObj.updatedAt,
  };

  if (taskObj.tags && Array.isArray(taskObj.tags) && taskObj.tags.length > 0) {
    cleanedTask.tags = taskObj.tags;
  }
  if (taskObj.description) {
    cleanedTask.description = taskObj.description;
  }
  if (taskObj.priority) {
    cleanedTask.priority = taskObj.priority;
  }
  if (taskObj.deadline) {
    cleanedTask.deadline = taskObj.deadline;
  }
  if (taskObj.claimedById) {
    cleanedTask.claimedById = taskObj.claimedById;
  }
  if (taskObj.submission) {
    cleanedTask.submission = taskObj.submission;
  }
  if (taskObj.type) {
    cleanedTask.type = taskObj.type;
  }
  if (taskObj.roomName) {
    cleanedTask.roomName = taskObj.roomName;
  }
  if (taskObj.assignedFreelancers && Array.isArray(taskObj.assignedFreelancers) && taskObj.assignedFreelancers.length > 0) {
    cleanedTask.assignedFreelancers = taskObj.assignedFreelancers;
  }
  if (taskObj.recordingUrl) {
    cleanedTask.recordingUrl = taskObj.recordingUrl;
  }
  if (taskObj.recordingFileName) {
    cleanedTask.recordingFileName = taskObj.recordingFileName;
  }
  if (taskObj.recordingDuration) {
    cleanedTask.recordingDuration = taskObj.recordingDuration;
  }
  if (taskObj.recordingStatus) {
    cleanedTask.recordingStatus = taskObj.recordingStatus;
  }
  // Speaker metadata for single-speaker tasks
  if (taskObj.speakerName) {
    cleanedTask.speakerName = taskObj.speakerName;
  }
  if (taskObj.speakerAge) {
    cleanedTask.speakerAge = taskObj.speakerAge;
  }
  if (taskObj.speakerLocation) {
    cleanedTask.speakerLocation = taskObj.speakerLocation;
  }
  // Speaker metadata for multi-speaker tasks
  if (taskObj.speakersMetadata && Array.isArray(taskObj.speakersMetadata) && taskObj.speakersMetadata.length > 0) {
    cleanedTask.speakersMetadata = taskObj.speakersMetadata;
  }

  return cleanedTask;
};

// --- Main Service Functions ---

export const listUsers = async (filters: UserFilters) => {
  // Parse page and limit as numbers to ensure proper calculations
  const page = parseInt(String(filters.page || 1), 10);
  const limit = parseInt(String(filters.limit || 10), 10);
  const { sortBy, sortOrder } = filters;

  const skip = (page - 1) * limit;

  const query = buildUserQuery(filters);
  const sort = buildSortObject(sortBy, sortOrder);

  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  // Get user statistics for each user
  const usersWithStats = await Promise.all(
    users.map(async user => {
      const [
        totalTasksCompleted,
        currentTasksClaimed,
        totalRevenueEarned,
        tasksInProgress,
        totalTasksClaimed, // Total tasks ever claimed by user
        totalRevenueGenerated, // Total revenue from all tasks (including incomplete)
      ] = await Promise.all([
        // Total tasks completed by user (all time)
        Task.countDocuments({
          claimedById: user._id,
          status: TaskStatus.COMPLETED,
        }),
        // Current tasks under claim (not completed)
        Task.countDocuments({
          claimedById: user._id,
          status: {
            $in: [
              TaskStatus.PENDING_APPROVAL,
              TaskStatus.ASSIGNED,
              TaskStatus.SUBMITTED,
              TaskStatus.IN_REVIEW,
            ],
          },
        }),
        // Total revenue earned by user (all time) - only completed tasks
        Task.aggregate([
          {
            $match: {
              claimedById: user._id,
              status: TaskStatus.COMPLETED,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$price' },
            },
          },
        ]).then(result => result[0]?.total || 0),
        // Tasks currently in progress (assigned, submitted, in review)
        Task.countDocuments({
          claimedById: user._id,
          status: {
            $in: [TaskStatus.ASSIGNED, TaskStatus.SUBMITTED, TaskStatus.IN_REVIEW],
          },
        }),
        // Total tasks ever claimed by user (all statuses)
        Task.countDocuments({
          claimedById: user._id,
        }),
        // Total revenue generated from all tasks claimed by user (all statuses)
        Task.aggregate([
          {
            $match: {
              claimedById: user._id,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$price' },
            },
          },
        ]).then(result => result[0]?.total || 0),
      ]);

      return {
        ...user,
        stats: {
          totalTasksCompleted,
          currentTasksClaimed,
          totalRevenueEarned,
          tasksInProgress,
          averageTaskValue:
            totalTasksCompleted > 0 ? Math.round(totalRevenueEarned / totalTasksCompleted) : 0,
          // ✨ NEW: Additional metrics requested
          totalTasksClaimed, // Total number of tasks ever claimed
          totalRevenueGenerated, // Total revenue from all claimed tasks
        },
      };
    })
  );

  return {
    users: usersWithStats,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // SUPER ADMIN EXTENSION: Only restrict SUPER_ADMIN from being viewed by normal flows
  // Ideally, Super Admin should see everyone. For now, we only restrict SUPER_ADMIN being modified/viewed via this API unless intended.
  // We will allow ADMIN to be viewed.
  if (user.role === 'SUPER_ADMIN') {
    throw new ApiError(404, 'User not found');
  }

  // Get user statistics
  const [
    totalTasksCompleted,
    currentTasksClaimed,
    totalRevenueEarned,
    tasksInProgress,
    totalTasksClaimed, // Total tasks ever claimed by user
    totalRevenueGenerated, // Total revenue from all tasks (including incomplete)
  ] = await Promise.all([
    // Total tasks completed by user (all time)
    Task.countDocuments({
      claimedById: user._id,
      status: TaskStatus.COMPLETED,
    }),
    // Current tasks under claim (not completed)
    Task.countDocuments({
      claimedById: user._id,
      status: {
        $in: [
          TaskStatus.PENDING_APPROVAL,
          TaskStatus.ASSIGNED,
          TaskStatus.SUBMITTED,
          TaskStatus.IN_REVIEW,
        ],
      },
    }),
    // Total revenue earned by user (all time) - only completed tasks
    Task.aggregate([
      {
        $match: {
          claimedById: user._id,
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
    // Tasks currently in progress (assigned, submitted, in review)
    Task.countDocuments({
      claimedById: user._id,
      status: {
        $in: [TaskStatus.ASSIGNED, TaskStatus.SUBMITTED, TaskStatus.IN_REVIEW],
      },
    }),
    // Total tasks ever claimed by user (all statuses)
    Task.countDocuments({
      claimedById: user._id,
    }),
    // Total revenue generated from all tasks claimed by user (all statuses)
    Task.aggregate([
      {
        $match: {
          claimedById: user._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
  ]);

  return {
    ...user,
    stats: {
      totalTasksCompleted,
      currentTasksClaimed,
      totalRevenueEarned,
      tasksInProgress,
      averageTaskValue:
        totalTasksCompleted > 0 ? Math.round(totalRevenueEarned / totalTasksCompleted) : 0,
      // ✨ NEW: Additional metrics requested
      totalTasksClaimed, // Total number of tasks ever claimed
      totalRevenueGenerated, // Total revenue from all claimed tasks
    },
  };
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // SUPER ADMIN EXTENSION: Only restrict SUPER_ADMIN status changes?
  // We allow modifying ADMIN status (e.g. approving them).
  if (user.role === 'SUPER_ADMIN') {
    throw new ApiError(404, 'User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { status }, { new: true }).lean();
  return updatedUser;
};

export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // SUPER ADMIN EXTENSION: Allow deleting ADMINs
  if (user.role === 'SUPER_ADMIN') {
    throw new ApiError(404, 'User not found');
  }

  const _deletedUser = await User.findByIdAndDelete(userId);

  // Also delete related data
  await Promise.all([
    Task.updateMany(
      { claimedById: userId },
      { $unset: { claimedById: 1 }, status: TaskStatus.OPEN }
    ),
    Review.deleteMany({ reviewerId: userId }),
  ]);

  return { success: true, deletedUser: user.toObject() };
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER';
  status: UserStatus;
}) => {
  const { name, email, password, role, status } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  // Validate password length
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    status,
  });

  // Return user without password
  const userResponse = user.toObject() as unknown as Record<string, unknown>;
  if ('password' in userResponse) {
    delete userResponse.password;
  }

  return userResponse;
};

export const createTask = async (taskData: Partial<ITask>, audioFile?: Express.Multer.File) => {
  let audioUrl = taskData.audioUrl;

  // If file is provided (audio or text document), upload it to R2
  if (audioFile) {
    const { uploadFileToR2 } = await import('@/utils/r2.utility.js');
    audioUrl = await uploadFileToR2(audioFile, 'tasks');
  }

  // Validate that we have a file URL (audio or text document)
  // Modified: Allow tasks without audioUrl (e.g. Self Recording tasks)
  /*
  if (!audioUrl) {
    throw new ApiError(
      400,
      'File URL is required. Please provide an audio file, text document, or file URL.'
    );
  }
  */

  // Build task payload with optional fields
  const taskPayload = buildTaskPayload(taskData, audioUrl);

  // If assignedFreelancers are provided, set status to ASSIGNED
  // This ensures assigned freelancers can immediately see and start the task
  if (taskPayload.assignedFreelancers && Array.isArray(taskPayload.assignedFreelancers) && taskPayload.assignedFreelancers.length > 0) {
    taskPayload.status = TaskStatus.ASSIGNED;
  }

  // Create task with audio URL
  const task = await Task.create(taskPayload);

  // Auto-generate roomName for multi-speaker tasks
  if (task.type === 'multi' && task.projectId) {
    task.roomName = `project-${task.projectId}-task-${task._id}`;
    await task.save();
  }

  // Clean and return task response
  const taskObj = task.toObject() as unknown as Record<string, unknown>;
  return cleanTaskResponse(taskObj);
};

export const createTasksBulk = async (
  taskData: Partial<ITask>,
  audioFiles: Express.Multer.File[]
) => {
  if (!audioFiles || audioFiles.length === 0) {
    throw new ApiError(400, 'At least one audio file is required');
  }

  const { uploadFilesToR2 } = await import('@/utils/r2.utility.js');
  const { successes, failures } = await uploadFilesToR2(audioFiles, 'tasks');

  if (successes.length === 0) {
    throw new ApiError(500, 'Failed to upload all files to R2');
  }

  // Create one task per audio file, each using the same metadata
  const tasks = await Task.insertMany(
    successes.map(audioUrl => {
      const payload = buildTaskPayload(taskData, audioUrl);
      // If assignedFreelancers are provided, set status to ASSIGNED
      if (payload.assignedFreelancers && Array.isArray(payload.assignedFreelancers) && payload.assignedFreelancers.length > 0) {
        payload.status = TaskStatus.ASSIGNED;
      }
      return payload;
    })
  );

  return {
    createdTasks: tasks
      .map(task => {
        if (!task) return null;
        const taskObj = (task as { toObject: () => unknown }).toObject() as unknown as Record<
          string,
          unknown
        >;
        return cleanTaskResponse(taskObj);
      })
      .filter(task => task !== null),
    totalFiles: successes.length,
    uploadedFiles: successes.length,
    failedFiles: failures.length,
    failures,
  };
};

export const listTasksAdmin = async (filters: TaskFilters) => {
  // Parse page and limit as numbers to ensure proper calculations
  const page = parseInt(String(filters.page || 1), 10);
  const limit = parseInt(String(filters.limit || 10), 10);
  const { sortBy, sortOrder } = filters;

  const skip = (page - 1) * limit;

  const query = buildTaskQuery(filters);
  const sort = buildSortObject(sortBy, sortOrder);

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('claimedById', 'name email')
      .lean(),
    Task.countDocuments(query),
  ]);

  // For submitted tasks, include review and transcription data
  const tasksWithDetails = await Promise.all(
    tasks.map(async task => {
      // Add claimedBy user details
      let claimedBy = null;
      if (task.claimedById && typeof task.claimedById === 'object' && 'name' in task.claimedById) {
        claimedBy = {
          _id: task.claimedById._id || task.claimedById,
          name: (task.claimedById as unknown as { name: string; email: string }).name,
          email: (task.claimedById as unknown as { name: string; email: string }).email,
        };
      }

      if (
        task.status === TaskStatus.SUBMITTED ||
        task.status === TaskStatus.IN_REVIEW ||
        task.status === TaskStatus.COMPLETED
      ) {
        // Debugging logs
        // console.log(`Processing task ${task._id} with status ${task.status}`);

        const [review, transcription] = await Promise.all([
          Review.findOne({ taskId: new Types.ObjectId(task._id.toString()) })
            .populate('reviewerId', 'name email')
            .lean(),
          Transcription.findOne({ taskId: new Types.ObjectId(task._id.toString()) })
            .populate('userId', 'name email')
            .populate('reviewerId', 'name email')
            .lean(),
        ]);

        /*
        if (review) {
          console.log(`Found review for task ${task._id}:`, review._id);
        } else {
          console.log(`NO review found for task ${task._id}`);
        }
        */

        let reviewData = null;
        if (review) {
          reviewData = {
            _id: review._id,
            reviewerId: review.reviewerId,
            reviewer: review.reviewerId,
            status: review.status,
            assignedAt: review.assignedAt,
            dueDate: review.dueDate,
            rating: review.rating,
            feedback: review.feedback,
            submittedAt: review.submittedAt,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          };
        }

        let transcriptionData = null;
        if (transcription) {
          transcriptionData = {
            _id: transcription._id,
            taskId: transcription.taskId,
            user: transcription.userId,
            reviewer: transcription.reviewerId,
            segments: transcription.segments,
            createdAt: transcription.createdAt,
            updatedAt: transcription.updatedAt,
          };
        }

        return {
          ...task,
          claimedBy,
          review: reviewData,
          transcription: transcriptionData,
        };
      }

      return {
        ...task,
        claimedBy,
      };
    })
  );

  return {
    tasks: tasksWithDetails,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const getTaskById = async (taskId: string) => {
  const task = await Task.findById(taskId).populate('claimedById', 'name email').lean();
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Add claimedBy user details
  let claimedBy = null;
  if (task.claimedById && typeof task.claimedById === 'object' && 'name' in task.claimedById) {
    claimedBy = {
      _id: task.claimedById._id || task.claimedById,
      name: (task.claimedById as unknown as { name: string; email: string }).name,
      email: (task.claimedById as unknown as { name: string; email: string }).email,
    };
  }

  // For submitted tasks, include review and transcription data
  if (
    task.status === TaskStatus.SUBMITTED ||
    task.status === TaskStatus.IN_REVIEW ||
    task.status === TaskStatus.COMPLETED
  ) {
    const [review, transcription] = await Promise.all([
      Review.findOne({ taskId }).populate('reviewerId', 'name email').lean(),
      Transcription.findOne({ taskId })
        .populate('userId', 'name email')
        .populate('reviewerId', 'name email')
        .lean(),
    ]);

    let reviewData = null;
    if (review) {
      reviewData = {
        _id: review._id,
        reviewerId: review.reviewerId,
        reviewer: review.reviewerId,
        status: review.status,
        assignedAt: review.assignedAt,
        dueDate: review.dueDate,
        rating: review.rating,
        feedback: review.feedback,
        submittedAt: review.submittedAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };
    }

    let transcriptionData = null;
    if (transcription) {
      transcriptionData = {
        _id: transcription._id,
        taskId: transcription.taskId,
        user: transcription.userId,
        reviewer: transcription.reviewerId,
        segments: transcription.segments,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
      };
    }

    return {
      ...task,
      claimedBy,
      review: reviewData,
      transcription: transcriptionData,
    };
  }

  return {
    ...task,
    claimedBy,
  };
};

// eslint-disable-next-line complexity
export const updateTaskAdmin = async (
  taskId: string,
  updateData: Partial<ITask> & { adminFeedback?: string }
) => {
  const { adminFeedback, ...taskUpdateData } = updateData;

  const task = await Task.findByIdAndUpdate(taskId, taskUpdateData, { new: true });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // If status is changed to IN_REVIEW, ensure a Review record exists
  if (updateData.status === TaskStatus.IN_REVIEW && task.claimedById) {
    const existingReview = await Review.findOne({ taskId: task._id });

    if (!existingReview) {
      // Create a new review record
      await Review.create({
        taskId: task._id,
        reviewerId: task.claimedById,
        status: ReviewStatus.PENDING,
        assignedAt: new Date(),
      });
    }
  }

  // Handle admin feedback when approving or rejecting tasks
  if (
    (updateData.status === TaskStatus.COMPLETED || updateData.status === TaskStatus.CANCELLED) &&
    adminFeedback
  ) {
    // Find or create review record for this task
    let review = await Review.findOne({ taskId: task._id });

    if (!review && task.claimedById) {
      // Create a new review record if it doesn't exist
      review = await Review.create({
        taskId: task._id,
        reviewerId: task.claimedById, // Use the freelancer who claimed the task
        status:
          updateData.status === TaskStatus.COMPLETED
            ? ReviewStatus.COMPLETED
            : ReviewStatus.PENDING,
        assignedAt: new Date(),
        feedback: adminFeedback,
        rating: updateData.status === TaskStatus.COMPLETED ? 5 : 1, // Default rating
        submittedAt: new Date(),
      });
    } else if (review) {
      // Update existing review with admin feedback
      review.feedback = adminFeedback;
      review.status =
        updateData.status === TaskStatus.COMPLETED ? ReviewStatus.COMPLETED : ReviewStatus.PENDING;
      review.submittedAt = new Date();
      // Keep existing rating if present, otherwise set default
      if (!review.rating) {
        review.rating = updateData.status === TaskStatus.COMPLETED ? 5 : 1;
      }
      await review.save();
    }
  }

  return task.toObject();
};

export const deleteTaskAdmin = async (taskId: string) => {
  const deleted = await Task.findByIdAndDelete(taskId);
  if (!deleted) {
    throw new ApiError(404, 'Task not found');
  }
  return { success: true };
};

export const updateTaskClaim = async (taskId: string, action: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (action === 'APPROVE') {
    task.status = TaskStatus.ASSIGNED;
  } else if (action === 'REJECT') {
    task.status = TaskStatus.OPEN;
    task.claimedById = undefined;
  }

  await task.save();
  return task.toObject();
};

export const spawnTask = async (sourceTaskId: string, targetProjectId: string) => {
  const sourceTask = await Task.findById(sourceTaskId);
  if (!sourceTask) {
    throw new ApiError(404, 'Source task not found');
  }

  const targetProject = await Project.findById(targetProjectId);
  if (!targetProject) {
    throw new ApiError(404, 'Target project not found');
  }

  // Determine behavior based on source project type
  let sourceAudioUrl = sourceTask.audioUrl;
  let sourceAudioUrls = sourceTask.audioUrls;

  if (sourceTask.projectId) {
    const sourceProject = await Project.findById(sourceTask.projectId);
    if (sourceProject && sourceProject.type === ProjectType.AUDIO_RECORDING) {
      // For Audio Recording tasks, the output (submission) becomes the input (audioUrl)
      if (!sourceTask.submission) {
        throw new ApiError(400, 'Source Audio Recording task has no submission to spawn from');
      }
      sourceAudioUrl = sourceTask.submission;
      sourceAudioUrls = undefined; // Clear bulk URLs as we are spawning from a single submission
    }
  }

  // Basic validation using the determined audio source
  if (!sourceAudioUrl && (!sourceAudioUrls || sourceAudioUrls.length === 0)) {
    throw new ApiError(400, 'Source task does not have any audio to spawn from');
  }

  const newTaskPayload: Partial<ITask> = {
    title: sourceTask.title,
    description: sourceTask.description,
    price: sourceTask.price, // Default to source price, can be updated later
    priority: sourceTask.priority,
    tags: sourceTask.tags,
    language: sourceTask.language,
    audioUrl: sourceAudioUrl,
    audioUrls: sourceAudioUrls,
    projectId: new Types.ObjectId(targetProjectId),
    status: TaskStatus.OPEN,
    spawnedFrom: {
      taskId: sourceTask._id,
      ...(sourceTask.projectId && { projectId: sourceTask.projectId }),
    },
  };

  // Create the new task
  const newTask = await Task.create(newTaskPayload);

  return cleanTaskResponse(newTask.toObject() as unknown as Record<string, unknown>);
};

export const getUserAnalytics = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: UserStatus.ACTIVE });
  const freelancers = await User.countDocuments({ role: 'FREELANCER' });
  const admins = await User.countDocuments({ role: 'ADMIN' });
  const superAdmins = await User.countDocuments({ role: 'SUPER_ADMIN' });

  return {
    totalUsers,
    activeUsers,
    freelancers,
    admins,
    superAdmins,
    inactiveUsers: totalUsers - activeUsers,
  };
};

export const getTaskAnalytics = async () => {
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: TaskStatus.COMPLETED });
  const openTasks = await Task.countDocuments({ status: TaskStatus.OPEN });
  const assignedTasks = await Task.countDocuments({ status: TaskStatus.ASSIGNED });

  return {
    totalTasks,
    completedTasks,
    openTasks,
    assignedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
  };
};

export const getR2StorageInfo = async () => {
  const { getR2StorageInfo: getStorageInfo } = await import('@/utils/r2.utility.js');
  return await getStorageInfo();
};

export const getR2FileCount = async () => {
  const { getR2FileCount } = await import('@/utils/r2.utility.js');
  return await getR2FileCount();
};
