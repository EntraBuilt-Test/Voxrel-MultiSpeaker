import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catch-async.utility.js';
import ApiResponse from '@/utils/api-response.utility.js';
import * as settingsService from '@/services/settings.service.js';
import ApiError from '@/utils/api-error.utility.js';

export const getAllSettingsController = catchAsync(async (req: Request, res: Response) => {
  const settings = await settingsService.getAllSettings();
  new ApiResponse(200, settings, 'Settings retrieved successfully').send(res);
});

export const updateSettingController = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value, description, isActive } = req.body;
  const updatedBy = req.user?._id?.toString();

  if (!updatedBy) {
    throw new ApiError(401, 'User not authenticated');
  }

  const updatedSetting = await settingsService.updateSetting(key, {
    value,
    description,
    isActive,
    updatedBy,
  });

  new ApiResponse(200, updatedSetting, 'Setting updated successfully').send(res);
});

export const getMaxTaskPerUserController = catchAsync(async (req: Request, res: Response) => {
  const maxTaskPerUser = await settingsService.getMaxTaskPerUser();

  new ApiResponse(200, { maxTaskPerUser }, 'Max task per user retrieved successfully').send(res);
});
