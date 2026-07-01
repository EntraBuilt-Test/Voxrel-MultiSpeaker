import type { FilterConfig, FilterOption } from '@/components/shared/filter-bar.component';
import {
  TASK_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  USER_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  LANGUAGE_OPTIONS,
  PRICE_RANGE_OPTIONS,
} from './options.constants';

/**
 * Predefined filter configurations for common use cases
 * These can be used directly with the FilterBar component
 */

// Task Management Filters (API-compatible)
export const TASK_FILTERS: FilterConfig[] = [
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'All Status',
    options: [
      { value: 'all', label: 'All Status' },
      // Will be populated dynamically from API
    ],
  },
  {
    key: 'language',
    type: 'select',
    label: 'Language',
    placeholder: 'All Languages',
    options: [
      { value: 'all', label: 'All Languages' },
      // Will be populated dynamically from API
    ],
    className: 'min-w-[120px]',
  },
];

// Sort field options for tasks
export const TASK_SORT_FIELDS: FilterOption[] = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

// Sort order options
export const SORT_ORDER_OPTIONS: FilterOption[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

// Backward compatibility - combined sort options
export const TASK_SORT_OPTIONS: FilterOption[] = [
  { value: 'createdAt-desc', label: 'Created (Newest)' },
  { value: 'createdAt-asc', label: 'Created (Oldest)' },
  { value: 'updatedAt-desc', label: 'Updated (Recent)' },
  { value: 'updatedAt-asc', label: 'Updated (Oldest)' },
  { value: 'dueDate-asc', label: 'Due Date (Nearest)' },
  { value: 'dueDate-desc', label: 'Due Date (Farthest)' },
  { value: 'priority-desc', label: 'Priority (High to Low)' },
  { value: 'priority-asc', label: 'Priority (Low to High)' },
  { value: 'status-asc', label: 'Status (A-Z)' },
  { value: 'status-desc', label: 'Status (Z-A)' },
];

// User Management Filters
export const USER_FILTERS: FilterConfig[] = [
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'All Status',
    options: [...USER_STATUS_OPTIONS],
  },
  {
    key: 'role',
    type: 'select',
    label: 'Role',
    placeholder: 'All Roles',
    options: [...USER_ROLE_OPTIONS],
  },
];

// Task Review Filters (subset of task filters)
export const TASK_REVIEW_FILTERS: FilterConfig[] = [
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'All Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'IN_REVIEW', label: 'In Review' },
      { value: 'SUBMITTED', label: 'Submitted' },
      { value: 'ASSIGNED', label: 'Assigned' },
    ],
  },
  {
    key: 'language',
    type: 'select',
    label: 'Language',
    placeholder: 'All Languages',
    options: [
      { value: 'all', label: 'All Languages' },
      ...LANGUAGE_OPTIONS,
    ],
  },
];

// Analytics Filters
export const ANALYTICS_FILTERS: FilterConfig[] = [
  {
    key: 'dateFrom',
    type: 'date',
    label: 'From Date',
    placeholder: 'Start date',
  },
  {
    key: 'dateTo',
    type: 'date',
    label: 'To Date',
    placeholder: 'End date',
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'All Status',
    options: [...TASK_STATUS_OPTIONS],
  },
];

// Common filter combinations for quick access
export const FILTER_PRESETS = {
  taskManagement: TASK_FILTERS,
  userManagement: USER_FILTERS,
  taskReview: TASK_REVIEW_FILTERS,
  analytics: ANALYTICS_FILTERS,
} as const;

export type FilterPresetKey = keyof typeof FILTER_PRESETS;
