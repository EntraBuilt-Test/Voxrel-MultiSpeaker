// Export all stores from a central location
export { default as useUserStore } from './useUserStore';
export { default as useTaskStore } from './useTaskStore';
export { default as useWorkspaceStore } from './useWorkspaceStore';
export { default as useFreelancerStore } from './useFreelancerStore';
export { default as useProjectStore } from './useProjectStore';

// Re-export store types
export type { AudioConfig, TranscriptSegment, WaveformRegion, WaveformMode, WaveformSize } from './useWorkspaceStore';

// Re-export types for convenience
export type * from '@/types';
