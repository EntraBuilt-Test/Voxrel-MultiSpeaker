"use client";

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button.ui';
import type { Notification } from '@/hooks/notifications.hook';
import { cn } from '@/lib/utils.lib';


interface NotificationToastProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
    className?: string;
}

const notificationConfig = {
    success: {
        icon: CheckCircle,
        className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
        iconClassName: 'text-green-600 dark:text-green-400',
    },
    error: {
        icon: XCircle,
        className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
        iconClassName: 'text-red-600 dark:text-red-400',
    },
    warning: {
        icon: AlertTriangle,
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
        iconClassName: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
        icon: Info,
        className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
        iconClassName: 'text-blue-600 dark:text-blue-400',
    },
} as const;

/**
 * NotificationToast Component
 * Renders a stack of notification toasts with consistent styling
 * Works with the useNotifications hook
 * 
 * @example
 * const { notifications, dismiss } = useNotifications();
 * 
 * return (
 *   <>
 *     <YourMainContent />
 *     <NotificationToast 
 *       notifications={notifications} 
 *       onDismiss={dismiss} 
 *     />
 *   </>
 * );
 */
export function NotificationToast({
    notifications,
    onDismiss,
    className
}: NotificationToastProps) {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 space-y-2 max-w-md',
                className
            )}
        >
            {notifications.map((notification) => {
                const config = notificationConfig[notification.type];
                const Icon = config.icon;

                return (
                    <div
                        key={notification.id}
                        className={cn(
                            'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300',
                            config.className
                        )}
                    >
                        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.iconClassName)} />

                        <div className="flex-1 min-w-0">
                            {notification.title && (
                                <p className="text-sm font-semibold mb-1">
                                    {notification.title}
                                </p>
                            )}
                            <p className="text-sm leading-relaxed">
                                {notification.message}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismiss(notification.id)}
                            className={cn(
                                'ml-auto p-1 h-auto w-auto hover:bg-black/10 dark:hover:bg-white/10 shrink-0',
                                'text-current opacity-70 hover:opacity-100'
                            )}
                            aria-label="Dismiss notification"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}

export default NotificationToast;
