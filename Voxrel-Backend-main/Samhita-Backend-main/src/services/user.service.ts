import { Request, Response } from 'express';
import ApiResponse from '@/utils/api-response.utility.js';

export const getUserProfile = async (req: Request, res: Response) => {
  // Simple implementation
  new ApiResponse(200, { success: true }, 'User profile retrieved').send(res);
};

export const updateUserProfile = async (req: Request, res: Response) => {
  // Simple implementation
  new ApiResponse(200, { success: true }, 'User profile updated').send(res);
};
