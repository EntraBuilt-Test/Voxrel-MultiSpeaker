import { Request, Response } from 'express';
import ApiResponse from '@/utils/api-response.utility.js';

export const createTask = async (req: Request, res: Response) => {
  // Simple implementation
  new ApiResponse(201, { success: true }, 'Task created successfully').send(res);
};

export const getTasks = async (req: Request, res: Response) => {
  // Simple implementation
  new ApiResponse(200, { success: true }, 'Tasks retrieved successfully').send(res);
};

export const updateTask = async (req: Request, res: Response) => {
  // Simple implementation
  new ApiResponse(200, { success: true }, 'Task updated successfully').send(res);
};
