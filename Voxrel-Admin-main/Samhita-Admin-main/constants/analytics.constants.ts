import type { FilterConfig } from '@/components/shared/filter-bar.component';

// Analytics filter options
export const QUICK_FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
] as const;

// Analytics filter configurations
export const ANALYTICS_FILTERS_CONFIG: FilterConfig[] = [
  {
    key: 'quickFilter',
    type: 'select',
    label: 'Quick Filter',
    placeholder: 'Select period',
    options: [...QUICK_FILTER_OPTIONS],
    className: 'min-w-[140px]',
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: 'Date Range',
    placeholder: 'Custom period',
    showWhen: 'custom', // Only show when quickFilter is 'custom'
  },
];

// Analytics constants
export const ANALYTICS_CONSTANTS = {
  DEFAULT_QUICK_FILTER: 'last_90_days',
  MESSAGES: {
    FILTER_RESET: 'Filters reset to default',
  },
} as const;
