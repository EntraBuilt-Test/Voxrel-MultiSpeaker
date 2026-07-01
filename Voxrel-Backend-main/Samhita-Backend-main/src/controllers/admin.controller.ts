import ApiResponse from '@/utils/api-response.utility.js';
import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as adminService from '@/services/admin.service.js';

export const listUsersController = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.listUsers(req.query);
  new ApiResponse(200, result).send(res);
});

export const updateUserStatusController = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;
  const result = await adminService.updateUserStatus(userId, status);
  new ApiResponse(200, result, 'User status updated successfully').send(res);
});

export const getUserByIdController = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await adminService.getUserById(userId);
  new ApiResponse(200, result, 'User details retrieved successfully').send(res);
});

export const deleteUserController = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await adminService.deleteUser(userId);
  new ApiResponse(200, result, 'User deleted successfully').send(res);
});

export const createUserController = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role, status } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role || !status) {
    throw new Error('All fields are required');
  }

  const result = await adminService.createUser({
    name,
    email,
    password,
    role,
    status,
  });

  new ApiResponse(201, result, 'User created successfully').send(res);
});

export const createTaskController = catchAsync(async (req: Request, res: Response) => {
  // Normalize file from multiple possible field names (now supports files, audioFiles, etc.)
  let file: Express.Multer.File | undefined;
  if (Array.isArray(req.files)) {
    file = req.files[0];
  } else if (req.files && typeof req.files === 'object') {
    const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] };
    const candidates = ['audio', 'audios', 'files', 'audioFiles'];
    for (const key of candidates) {
      if (Array.isArray(filesMap[key]) && filesMap[key].length > 0) {
        file = filesMap[key][0];
        break;
      }
    }
  } else if (req.file) {
    // Fallback for single file (shouldn't happen with new multer config, but keep for safety)
    file = req.file;
  }

  // Debug: Log the incoming request body to see if type is being sent
  console.log('📥 Create Task Request:', {
    body: req.body,
    type: req.body.type,
    hasType: 'type' in req.body,
    bodyKeys: Object.keys(req.body)
  });

  const result = await adminService.createTask(req.body, file);
  new ApiResponse(201, result, 'Task created successfully').send(res);
});

export const createTasksBulkController = catchAsync(async (req: Request, res: Response) => {
  // Normalize files from multiple possible field names
  const filesArray: Express.Multer.File[] = [];
  if (Array.isArray(req.files)) {
    filesArray.push(...(req.files as Express.Multer.File[]));
  } else if (req.files && typeof req.files === 'object') {
    const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] };
    const candidates = ['audio', 'audios', 'files', 'audioFiles'];
    for (const key of candidates) {
      if (Array.isArray(filesMap[key])) filesArray.push(...filesMap[key]);
    }
  }

  const result = await adminService.createTasksBulk(req.body, filesArray);
  new ApiResponse(
    201,
    result,
    `${result.uploadedFiles} task(s) created successfully with ${result.totalFiles} audio file(s)`
  ).send(res);
});

export const listTasksAdminController = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.listTasksAdmin(req.query);
  new ApiResponse(200, result).send(res);
});

export const getTaskByIdAdminController = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await adminService.getTaskById(taskId);
  new ApiResponse(200, result, 'Task details retrieved successfully').send(res);
});

export const updateTaskAdminController = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await adminService.updateTaskAdmin(taskId, req.body);
  new ApiResponse(200, result, 'Task updated successfully').send(res);
});

export const deleteTaskAdminController = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await adminService.deleteTaskAdmin(taskId);
  new ApiResponse(200, result, 'Task deleted successfully').send(res);
});

export const updateTaskClaimController = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { action } = req.body;
  const result = await adminService.updateTaskClaim(taskId, action);
  const actionText = action === 'APPROVE' ? 'approved' : 'rejected';
  new ApiResponse(200, result, `Claim ${actionText} successfully.`).send(res);
});

export const spawnTaskController = catchAsync(async (req: Request, res: Response) => {
  const { sourceTaskId, targetProjectId } = req.body;

  if (!sourceTaskId || !targetProjectId) {
    throw new Error('sourceTaskId and targetProjectId are required');
  }

  const result = await adminService.spawnTask(sourceTaskId, targetProjectId);
  new ApiResponse(201, result, 'Task spawned successfully').send(res);
});

export const getR2StorageInfoController = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getR2StorageInfo();
  new ApiResponse(200, result, 'R2 storage information retrieved successfully').send(res);
});

export const getR2FileCountController = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getR2FileCount();
  new ApiResponse(200, { fileCount: result }, 'R2 file count retrieved successfully').send(res);
});
