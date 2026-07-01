/**
 * Shared Components Export
 * Centralized exports for reusable components
 */

export { FilterBar } from './filter-bar.component';
export type { FilterConfig, FilterOption, FilterType } from './filter-bar.component';

export { NotificationToast } from './notification-toast.component';

// Re-export hook types for convenience
export type { Notification } from '@/hooks/notifications.hook';
