import BaseService from './base.service';

export interface R2StorageInfo {
  totalSizeBytes: number;
  totalSizeGB: number;
  totalSizeMB: number;
  totalFiles: number;
  averageFileSizeMB: number;
}

export interface R2StorageInfoResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: R2StorageInfo;
}

export interface R2FileCount {
  fileCount: number;
}

export interface R2FileCountResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: R2FileCount;
}

export class StorageService extends BaseService {
  /**
   * Get comprehensive R2 storage usage information
   */
  async getStorageInfo(): Promise<R2StorageInfoResponse> {
    return this.get<R2StorageInfoResponse>('/admin/storage/info');
  }

  /**
   * Get total number of files in R2 storage
   */
  async getFileCount(): Promise<R2FileCountResponse> {
    return this.get<R2FileCountResponse>('/admin/storage/file-count');
  }
}

export const storageService = new StorageService();
