import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from '@/hooks';
import { storageService } from '@/services/storage.service';
import { R2StorageInfo, R2FileCount } from '@/types';

export interface StorageMonitoringState {
  // Storage data
  storageInfo: R2StorageInfo | null;
  fileCount: R2FileCount | null;
  
  // Loading states
  isLoadingStorageInfo: boolean;
  isLoadingFileCount: boolean;
  
  // Notifications
  notifications: any[];
  dismiss: (id: string) => void;
  
  // Actions
  refreshStorageInfo: () => Promise<void>;
  refreshFileCount: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useStorageMonitoring = (): StorageMonitoringState => {
  const { notifications, showError, dismiss } = useNotifications();
  
  // Storage data state
  const [storageInfo, setStorageInfo] = useState<R2StorageInfo | null>(null);
  const [fileCount, setFileCount] = useState<R2FileCount | null>(null);
  
  // Loading states
  const [isLoadingStorageInfo, setIsLoadingStorageInfo] = useState(false);
  const [isLoadingFileCount, setIsLoadingFileCount] = useState(false);
  
  // Fetch storage information
  const refreshStorageInfo = useCallback(async () => {
    setIsLoadingStorageInfo(true);
    try {
      const response = await storageService.getStorageInfo();
      setStorageInfo(response.data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch storage information';
      showError(errorMessage);
    } finally {
      setIsLoadingStorageInfo(false);
    }
  }, [showError]);
  
  // Fetch file count
  const refreshFileCount = useCallback(async () => {
    setIsLoadingFileCount(true);
    try {
      const response = await storageService.getFileCount();
      setFileCount(response.data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch file count';
      showError(errorMessage);
    } finally {
      setIsLoadingFileCount(false);
    }
  }, [showError]);
  
  // Refresh all storage data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshStorageInfo(),
      refreshFileCount()
    ]);
  }, [refreshStorageInfo, refreshFileCount]);
  
  // Auto-refresh on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);
  
  return {
    // Storage data
    storageInfo,
    fileCount,
    
    // Loading states
    isLoadingStorageInfo,
    isLoadingFileCount,
    
    // Notifications
    notifications,
    dismiss,
    
    // Actions
    refreshStorageInfo,
    refreshFileCount,
    refreshAll,
  };
};
