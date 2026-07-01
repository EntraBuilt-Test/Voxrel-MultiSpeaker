// Export all stores from a central location
export { default as useUserStore } from './user.store';
export { default as useTaskStore } from './task.store';
export { default as useProjectStore } from './useProjectStore';

// Re-export types for convenience
export type * from '@/types';
