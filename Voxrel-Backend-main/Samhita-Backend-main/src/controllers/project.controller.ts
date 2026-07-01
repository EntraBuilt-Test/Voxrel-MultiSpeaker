import ApiResponse from '@/utils/api-response.utility.js';
import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as projectService from '@/services/project.service.js';

export const createProjectController = catchAsync(async (req: Request, res: Response) => {
  const { name, description, type, supportedLanguages, metadata } = req.body;

  if (!name || !type) {
    throw new Error('Name and type are required');
  }

  const result = await projectService.createProject({
    name,
    description,
    type,
    supportedLanguages,
    metadata,
  });

  new ApiResponse(201, result, 'Project created successfully').send(res);
});

export const getProjectsController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  const result = await projectService.getProjects(
    req.query as unknown as { status?: string; type?: string; search?: string },
    req.user
  );
  new ApiResponse(200, result, 'Projects retrieved successfully').send(res);
});

export const getProjectTasksController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await projectService.getProjectTasks(
    projectId,
    req.query as unknown as {
      status?: string;
      language?: string;
      priority?: string;
      page?: number;
      limit?: number;
    }
  );
  new ApiResponse(200, result, 'Project tasks retrieved successfully').send(res);
});

export const getProjectUsersController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await projectService.getProjectUsers(
    projectId,
    req.query as unknown as {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  );
  new ApiResponse(200, result, 'Project users retrieved successfully').send(res);
});

export const getProjectByIdController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await projectService.getProjectById(projectId);
  new ApiResponse(200, result, 'Project retrieved successfully').send(res);
});

export const updateProjectController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await projectService.updateProject(projectId, req.body);
  new ApiResponse(200, result, 'Project updated successfully').send(res);
});

export const deleteProjectController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await projectService.deleteProject(projectId);
  new ApiResponse(200, result, 'Project deleted successfully').send(res);
});

export const assignProjectToAdminController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { adminId } = req.body;

  if (!adminId) {
    throw new Error('Admin ID is required');
  }

  const result = await projectService.assignProjectToAdmin(projectId, adminId);
  new ApiResponse(200, result, 'Admin assigned to project successfully').send(res);
});

export const removeAdminFromProjectController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { adminId } = req.body;

  if (!adminId) {
    throw new Error('Admin ID is required');
  }

  const result = await projectService.removeAdminFromProject(projectId, adminId);
  new ApiResponse(200, result, 'Admin removed from project successfully').send(res);
});

export const addUserToProjectController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw new Error('User ID is required');
  }

  const result = await projectService.addUserToProject(projectId, userId);
  new ApiResponse(200, result, 'User added to project successfully').send(res);
});

export const removeUserFromProjectController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw new Error('User ID is required');
  }

  const result = await projectService.removeUserFromProject(projectId, userId);
  new ApiResponse(200, result, 'User removed from project successfully').send(res);
});

export const requestToJoinProjectController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const result = await projectService.requestToJoinProject(
    req.params.projectId,
    req.user._id.toString()
  );
  new ApiResponse(200, result, 'Join request submitted').send(res);
});

export const approveJoinRequestController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body;
  if (!userId) throw new Error('User ID is required');
  const result = await projectService.approveJoinRequest(projectId, userId);
  new ApiResponse(200, result, 'Join request approved').send(res);
});

export const rejectJoinRequestController = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body;
  if (!userId) throw new Error('User ID is required');
  const result = await projectService.rejectJoinRequest(projectId, userId);
  new ApiResponse(200, result, 'Join request rejected').send(res);
});

export const getProjectsNotAssignedForReviewController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await projectService.getProjectsNotAssignedForReview();
    new ApiResponse(200, result, 'Projects not assigned for review retrieved successfully').send(
      res
    );
  }
);
