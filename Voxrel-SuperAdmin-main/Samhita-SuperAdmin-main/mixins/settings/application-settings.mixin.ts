import { useState, useCallback } from 'react';
import { useFormState, useNotifications } from '@/hooks';
import { useStorageMonitoring } from './storage-monitoring.mixin';
import {
    APPLICATION_INITIAL_STATE,
    APPLICATION_VALIDATION_RULES,
    REGISTRATION_MODE_OPTIONS,
    SETTINGS_MESSAGES,
} from '@/constants/settings.constants';

export interface ApplicationSettingsState {
    // Form state
    applicationForm: ReturnType<typeof useFormState<typeof APPLICATION_INITIAL_STATE>>;

    // Loading state
    isLoading: boolean;

    // System status (read-only)
    systemStatus: {
        frontend: { online: boolean; responseTime: number; lastChecked: Date };
        backend: { online: boolean; responseTime: number; lastChecked: Date };
        storage: {
            used: number;
            total: number;
            files: number;
            averageFileSizeMB: number;
            bucketName: string;
            isLoading: boolean;
            hasData: boolean;
        };
    };

    // Notifications
    notifications: any[];
    dismiss: (id: string) => void;

    // Utility functions
    formatStorageUsage: () => {
        percentage: string;
        visualPercentage: string;
        usedDisplay: string;
        totalDisplay: string;
        usedGB: string;
        totalGB: string;
    };
    formatAverageFileSize: (sizeMB: number) => string;
    getStatusColor: (isOnline: boolean) => string;
    getRegistrationDescription: (mode: string) => string;

    // Event handlers
    handleSaveSettings: (formData: typeof APPLICATION_INITIAL_STATE) => Promise<void>;
    handleRefreshStorage: () => Promise<void>;
}

export const useApplicationSettings = (): ApplicationSettingsState => {
    const { notifications, showSuccess, showError, dismiss } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    // Storage monitoring
    const {
        storageInfo,
        fileCount,
        isLoadingStorageInfo,
        isLoadingFileCount,
        refreshStorageInfo,
        refreshFileCount,
        refreshAll: refreshStorageData,
    } = useStorageMonitoring();

    // System status state (read-only information)
    const systemStatus = {
        frontend: { online: true, responseTime: 45, lastChecked: new Date() },
        backend: { online: true, responseTime: 120, lastChecked: new Date() },
        storage: {
            // Use totalSizeMB when totalSizeGB is 0 or very small, otherwise use totalSizeGB
            used: storageInfo?.totalSizeGB && storageInfo.totalSizeGB > 0
                ? storageInfo.totalSizeGB
                : (storageInfo?.totalSizeMB || 0) / 1024, // Convert MB to GB
            total: 2048, // GB - 2TB total capacity
            files: storageInfo?.totalFiles || fileCount?.fileCount || 0,
            averageFileSizeMB: storageInfo?.averageFileSizeMB || 0,
            bucketName: "kreactive-storage",
            // Add loading states
            isLoading: isLoadingStorageInfo || isLoadingFileCount,
            hasData: !!(storageInfo || fileCount)
        }
    };

    const applicationForm = useFormState(
        APPLICATION_INITIAL_STATE,
        APPLICATION_VALIDATION_RULES
    );

    // Handle form submission
    const handleSaveSettings = useCallback(async (formData: typeof APPLICATION_INITIAL_STATE) => {
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showSuccess(SETTINGS_MESSAGES.APPLICATION_SAVED);
        } catch {
            showError(SETTINGS_MESSAGES.SAVE_ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [showSuccess, showError]);

    // Utility functions
    const formatStorageUsage = useCallback(() => {
        const used = systemStatus.storage.used;
        const total = systemStatus.storage.total;

        // Check if we have raw MB data from API
        const hasRawMBData = storageInfo?.totalSizeMB && storageInfo.totalSizeMB > 0 && (!storageInfo?.totalSizeGB || storageInfo.totalSizeGB === 0);

        let usedDisplay, totalDisplay, percentage, rawPercentage;

        if (hasRawMBData) {
            // Use raw MB data from API
            const usedMB = storageInfo.totalSizeMB;
            const totalGB = total; // Total is already in GB (2048GB = 2TB)
            const totalMB = totalGB * 1024; // Convert total GB to MB for percentage calculation
            rawPercentage = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;

            usedDisplay = `${usedMB.toFixed(1)}MB`;
            totalDisplay = `${totalGB.toFixed(0)}GB`; // Show total in GB
        } else {
            // Use converted data
            rawPercentage = total > 0 ? (used / total) * 100 : 0;

            usedDisplay = used < 1 ? `${(used * 1024).toFixed(0)}MB` : used >= 1024 ? `${(used / 1024).toFixed(1)}TB` : `${used.toFixed(1)}GB`;
            totalDisplay = total < 1 ? `${(total * 1024).toFixed(0)}MB` : total >= 1024 ? `${(total / 1024).toFixed(1)}TB` : `${total.toFixed(1)}GB`;
        }

        // Display percentage logic
        percentage = rawPercentage > 0 && rawPercentage < 0.1 ? '< 0.1' : rawPercentage.toFixed(1);

        // Visual percentage logic (ensure at least 1% width if usage > 0)
        const visualPercentage = rawPercentage > 0 && rawPercentage < 1 ? '1%' : `${rawPercentage.toFixed(1)}%`;

        return {
            percentage,
            visualPercentage,
            usedDisplay,
            totalDisplay,
            usedGB: used.toFixed(1),
            totalGB: total.toFixed(1),
        };
    }, [systemStatus.storage, storageInfo]);

    // Storage debugging data available if needed

    const getStatusColor = useCallback((isOnline: boolean) => {
        return isOnline ? 'text-green-600' : 'text-red-600';
    }, []);

    const getRegistrationDescription = useCallback((mode: string) => {
        switch (mode) {
            case 'open':
                return 'Anyone can register immediately';
            case 'invite_only':
                return 'Users can only join with an invitation';
            case 'approval_required':
                return 'Admin approval required for new registrations';
            default:
                return 'Select registration mode';
        }
    }, []);

    // Format average file size (show MB or GB as appropriate)
    const formatAverageFileSize = useCallback((sizeMB: number) => {
        if (sizeMB < 1024) {
            return `${sizeMB.toFixed(1)}MB`;
        } else {
            return `${(sizeMB / 1024).toFixed(1)}GB`;
        }
    }, []);

    // Handle storage refresh
    const handleRefreshStorage = useCallback(async () => {
        try {
            await refreshStorageData();
            showSuccess('Storage information refreshed successfully');
        } catch (error) {
            showError('Failed to refresh storage information');
        }
    }, [refreshStorageData, showSuccess, showError]);

    return {
        // Form state
        applicationForm,

        // Loading state
        isLoading,

        // System status
        systemStatus,

        // Notifications
        notifications,
        dismiss,

        // Utility functions
        formatStorageUsage,
        formatAverageFileSize,
        getStatusColor,
        getRegistrationDescription,

        // Event handlers
        handleSaveSettings,
        handleRefreshStorage,
    };
};
