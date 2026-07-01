import ApplicationSettings, { IApplicationSettings } from '@/models/application-settings.model.js';
import ApiError from '@/utils/api-error.utility.js';
import SettingsCache from '@/utils/settings-cache.utility.js';

export interface CreateSettingData {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  updatedBy: string;
}

export interface UpdateSettingData {
  value?: string | number | boolean | Record<string, unknown>;
  description?: string;
  isActive?: boolean;
  updatedBy: string;
}

export const updateSetting = async (
  key: string,
  data: UpdateSettingData
): Promise<IApplicationSettings> => {
  const setting = await ApplicationSettings.findOne({ key, isActive: true });
  if (!setting) {
    throw new ApiError(404, 'Setting not found');
  }

  // If value is being updated, validate it
  if (data.value !== undefined) {
    validateSettingValue(data.value, setting.type);
  }

  const updatedSetting = await ApplicationSettings.findByIdAndUpdate(
    setting._id,
    { ...data, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updatedSetting) {
    throw new ApiError(500, 'Failed to update setting');
  }

  // Update cache
  if (data.value !== undefined) {
    await SettingsCache.set(key, data.value);
  }
  if (data.isActive === false) {
    await SettingsCache.delete(key);
  }

  return updatedSetting;
};

export const getAllSettings = async (): Promise<IApplicationSettings[]> => {
  return await ApplicationSettings.find({ isActive: true }).sort({ key: 1 });
};

export const getMaxTaskPerUser = async (): Promise<number> => {
  return await SettingsCache.getMaxTaskPerUser();
};

export const initializeDefaultSettings = async (adminUserId: string): Promise<void> => {
  const defaultSettings = [
    {
      key: 'MAX_TASK_PER_USER',
      value: 20,
      description: 'Maximum number of tasks a user can claim at once',
      type: 'number' as const,
      updatedBy: adminUserId,
    },
  ];

  for (const settingData of defaultSettings) {
    const existingSetting = await ApplicationSettings.findOne({ key: settingData.key });
    if (!existingSetting) {
      await ApplicationSettings.create(settingData);
      // Cache the setting
      await SettingsCache.set(settingData.key, settingData.value);
    }
  }
};

const validateSettingValue = (
  value: string | number | boolean | Record<string, unknown>,
  type: string
): void => {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        throw new ApiError(400, 'Value must be a string');
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ApiError(400, 'Value must be a valid number');
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new ApiError(400, 'Value must be a boolean');
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ApiError(400, 'Value must be an object');
      }
      break;
    default:
      throw new ApiError(400, 'Invalid setting type');
  }
};

export default {
  updateSetting,
  getAllSettings,
  getMaxTaskPerUser,
  initializeDefaultSettings,
};
