import BaseService from './base.service';
import { Setting } from '@/types';

class SettingsService extends BaseService {
  // Get all settings
  async getAllSettings(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Setting[];
  }> {
    return this.get('/admin/settings');
  }

  // Get a single setting by key
  async getSettingByKey(key: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Setting;
  }> {
    return this.get(`/admin/settings/${key}`);
  }

  // Update a setting
  async updateSetting(key: string, value: any): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Setting;
  }> {
    return this.patch(`/admin/settings/${key}`, { value });
  }

  // Batch update settings
  async batchUpdateSettings(settings: Array<{ key: string; value: any }>): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Setting[];
  }> {
    return this.patch('/admin/settings', { settings });
  }
}

export const settingsService = new SettingsService();
