'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Notification, NotificationType } from '@/types';

const DEFAULT_TIMEOUT = 5000;

type NotificationInput = Omit<Notification, 'id'> & { id?: string };

const createNotificationId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export function useNotifications(timeout = DEFAULT_TIMEOUT) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addNotification = useCallback(
    (notification: NotificationInput) => {
      const id = notification.id ?? createNotificationId();
      const entry: Notification = {
        id,
        message: notification.message,
        title: notification.title,
        type: notification.type,
        duration: notification.duration ?? timeout,
      };

      setNotifications((prev) => [...prev, entry]);

      if ((notification.duration ?? timeout) > 0) {
        timersRef.current[id] = setTimeout(() => {
          dismiss(id);
        }, notification.duration ?? timeout);
      }

      return id;
    },
    [dismiss, timeout]
  );

  const buildNotifier = useCallback(
    (type: NotificationType) => (message: string, title?: string) =>
      addNotification({ type, message, title }),
    [addNotification]
  );

  const notifySuccess = buildNotifier('success');
  const notifyError = buildNotifier('error');
  const notifyWarning = buildNotifier('warning');
  const notifyInfo = buildNotifier('info');

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  return {
    notifications,
    addNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    dismiss,
  };
}

export default useNotifications;

