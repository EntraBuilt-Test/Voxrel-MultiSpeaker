import { useState, useCallback } from 'react';
import { NOTIFICATION_TIMEOUT } from '@/constants/options.constants';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  timeout?: number;
  persistent?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  showSuccess: (message: string, options?: Partial<Notification>) => void;
  showError: (message: string, options?: Partial<Notification>) => void;
  showInfo: (message: string, options?: Partial<Notification>) => void;
  showWarning: (message: string, options?: Partial<Notification>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Hook for managing application notifications/toasts
 * Provides consistent notification management across the app
 * 
 * @example
 * const { showSuccess, showError, notifications } = useNotifications();
 * 
 * // Show success message
 * showSuccess('Task created successfully');
 * 
 * // Show error with custom timeout
 * showError('Failed to save', { timeout: 10000 });
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timeout: notification.timeout ?? NOTIFICATION_TIMEOUT,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss unless persistent
    if (!newNotification.persistent && newNotification.timeout) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, newNotification.timeout);
    }
  }, []);

  const showSuccess = useCallback((message: string, options?: Partial<Notification>) => {
    console.log('🟢 showSuccess called with message:', message);
    console.trace('showSuccess call stack');
    addNotification({
      type: 'success',
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((message: string, options?: Partial<Notification>) => {
    console.log('🔴 showError called with message:', message);
    console.trace('showError call stack');
    addNotification({
      type: 'error',
      message,
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'info',
      message,
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'warning',
      message,
      ...options,
    });
  }, [addNotification]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismiss,
    dismissAll,
  };
}

export default useNotifications;
