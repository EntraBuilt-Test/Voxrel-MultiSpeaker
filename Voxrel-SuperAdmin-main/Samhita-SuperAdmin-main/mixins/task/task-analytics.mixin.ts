import { useState, useCallback, useMemo } from 'react';
import {
  useTaskAnalyticsSummary,
  useTaskStatusDistribution,
  useTaskCompletionTrends,
  useTaskRevenueTrends,
  useTaskLanguageDistribution
} from '@/hooks/queries/task-analytics-queries.hook';
import { ANALYTICS_CONSTANTS } from '@/constants/analytics.constants';
import { TaskAnalytics, TaskStatusDistribution, TaskCompletionTrend, TaskRevenueTrend, TaskLanguageDistribution } from '@/types';

export interface TaskAnalyticsFilters {
  quickFilter: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  [key: string]: string | undefined;
}

export interface TaskAnalyticsState {
  // Filter state
  filterValues: TaskAnalyticsFilters;

  // Data
  analyticsData: TaskAnalytics;
  statusDistribution: any[];
  completionTrendData: TaskCompletionTrend[];
  revenueTrendData: TaskRevenueTrend[];
  languageDistribution: any[];

  // Chart configs
  statusChartConfig: any;
  completionTrendConfig: any;
  languageConfig: any;

  // Utility functions
  formatTrend: (value: number) => { arrow: string; color: string; displayText: string };

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: string | null;

  // Handlers
  handleFilterChange: (key: keyof TaskAnalyticsFilters, value: string | undefined) => void;
  handleQuickFilterChange: (value: string) => void;
  handleDateRangeChange: (from: string, to: string) => void;
  handleResetFilters: () => void;
}

export const useTaskAnalytics = (projectId?: string) => {
  // Filter states
  const [filterValues, setFilterValues] = useState<TaskAnalyticsFilters>({
    quickFilter: ANALYTICS_CONSTANTS.DEFAULT_QUICK_FILTER,
    dateRangeFrom: undefined,
    dateRangeTo: undefined,
  });

  // Get date range based on quick filter
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    // Use local date methods to avoid timezone issues
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    switch (filterValues.quickFilter) {
      case 'today':
        return {
          dateFrom: today,
          dateTo: today
        };
      case 'this_week':
        // Get start of current week (Monday)
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, Monday is 1
        startOfWeek.setDate(now.getDate() + daysToMonday);
        const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        return {
          dateFrom: startOfWeekStr,
          dateTo: today
        };
      case 'this_month':
        // Get start and end of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
        const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
        const endOfMonthStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
        return {
          dateFrom: startOfMonthStr,
          dateTo: endOfMonthStr
        };
      case 'last_90_days':
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const last90DaysStr = `${last90Days.getFullYear()}-${String(last90Days.getMonth() + 1).padStart(2, '0')}-${String(last90Days.getDate()).padStart(2, '0')}`;
        return {
          dateFrom: last90DaysStr,
          dateTo: today
        };
      case 'custom':
        // For custom range, ensure we have both dates
        if (filterValues.dateRangeFrom && filterValues.dateRangeTo) {
          return {
            dateFrom: filterValues.dateRangeFrom,
            dateTo: filterValues.dateRangeTo
          };
        }
        // If custom is selected but no dates are set, default to this month
        const customStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const customEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const customStartOfMonthStr = `${customStartOfMonth.getFullYear()}-${String(customStartOfMonth.getMonth() + 1).padStart(2, '0')}-${String(customStartOfMonth.getDate()).padStart(2, '0')}`;
        const customEndOfMonthStr = `${customEndOfMonth.getFullYear()}-${String(customEndOfMonth.getMonth() + 1).padStart(2, '0')}-${String(customEndOfMonth.getDate()).padStart(2, '0')}`;
        return {
          dateFrom: customStartOfMonthStr,
          dateTo: customEndOfMonthStr
        };
      default:
        // Default to last 90 days if no filter is set
        const defaultLast90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const defaultLast90DaysStr = `${defaultLast90Days.getFullYear()}-${String(defaultLast90Days.getMonth() + 1).padStart(2, '0')}-${String(defaultLast90Days.getDate()).padStart(2, '0')}`;
        return {
          dateFrom: defaultLast90DaysStr,
          dateTo: today
        };
    }
  }, [filterValues.quickFilter, filterValues.dateRangeFrom, filterValues.dateRangeTo]);

  // Date range is now properly calculated with useMemo

  // Fetch analytics data using React Query
  const analyticsSummaryQuery = useTaskAnalyticsSummary(dateFrom, dateTo, projectId);
  const statusDistributionQuery = useTaskStatusDistribution(dateFrom, dateTo, projectId);
  const completionTrendsQuery = useTaskCompletionTrends(dateFrom, dateTo, projectId);
  const revenueTrendsQuery = useTaskRevenueTrends(dateFrom, dateTo, projectId);
  const languageDistributionQuery = useTaskLanguageDistribution(dateFrom, dateTo, projectId);

  // React Query automatically handles refetching when query keys change

  // Compute loading and error states
  const isLoading = analyticsSummaryQuery.isLoading ||
    statusDistributionQuery.isLoading ||
    completionTrendsQuery.isLoading ||
    revenueTrendsQuery.isLoading ||
    languageDistributionQuery.isLoading;

  const isError = analyticsSummaryQuery.isError ||
    statusDistributionQuery.isError ||
    completionTrendsQuery.isError ||
    revenueTrendsQuery.isError ||
    languageDistributionQuery.isError;

  const error = analyticsSummaryQuery.error?.message ||
    statusDistributionQuery.error?.message ||
    completionTrendsQuery.error?.message ||
    revenueTrendsQuery.error?.message ||
    languageDistributionQuery.error?.message ||
    null;

  // Process status distribution data with colors
  const statusDistribution = useMemo(() => {
    if (!statusDistributionQuery.data?.data) return [];

    const colors = ['#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd'];
    return statusDistributionQuery.data.data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [statusDistributionQuery.data]);

  // Process language distribution data with colors
  const languageDistribution = useMemo(() => {
    if (!languageDistributionQuery.data?.data) return [];

    // Blue theme with maximum contrast - carefully selected shades
    // Colors ordered to ensure adjacent segments have high contrast
    const colors = [
      '#1e3a8a', // Very Dark Navy Blue (Marathi)
      '#7dd3fc', // Sky Blue Light (Hindi) 
      '#1e40af', // Dark Royal Blue (Telugu)
      '#bfdbfe', // Pale Blue (Bengali)
      '#0c4a6e', // Deep Navy (Urdu)
      '#60a5fa', // Medium Light Blue (Kannada)
      '#1d4ed8', // Royal Blue (Gujarati)
      '#e0f2fe', // Very Pale Blue (English)
      '#0369a1', // Teal Blue (Tamil)
      '#93c5fd', // Light Blue (Malayalam)
      '#2563eb', // Bright Blue (Punjabi)
    ];
    return languageDistributionQuery.data.data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [languageDistributionQuery.data]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof TaskAnalyticsFilters, value: string | undefined) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value || ''
    }));
    // React Query will automatically refetch when date parameters change
  }, []);

  const handleQuickFilterChange = useCallback((value: string) => {
    setFilterValues(prev => ({
      ...prev,
      quickFilter: value,
      dateRangeFrom: undefined,
      dateRangeTo: undefined
    }));
    // React Query will automatically refetch when date parameters change
  }, []);

  const handleDateRangeChange = useCallback((from: string, to: string) => {
    setFilterValues(prev => ({
      ...prev,
      dateRangeFrom: from,
      dateRangeTo: to,
      quickFilter: 'custom'
    }));
    // React Query will automatically refetch when date parameters change
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterValues({
      quickFilter: ANALYTICS_CONSTANTS.DEFAULT_QUICK_FILTER,
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
    });
    // React Query will automatically refetch when date parameters change
  }, []);

  // Utility functions
  const formatTrend = useCallback((value: number) => {
    const isPositive = value >= 0;
    const arrow = isPositive ? '↗' : '↘';
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const displayText = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;

    return {
      arrow,
      color,
      displayText
    };
  }, []);

  // Chart configurations
  const statusChartConfig = {
    pending: {
      label: "Pending",
      color: "#3b82f6",
    },
    in_progress: {
      label: "In Progress",
      color: "#60a5fa",
    },
    completed: {
      label: "Completed",
      color: "#1d4ed8",
    },
    cancelled: {
      label: "Cancelled",
      color: "#93c5fd",
    },
  };

  const completionTrendConfig = {
    created: {
      label: "Created",
      color: "#3b82f6",
    },
    completed: {
      label: "Completed",
      color: "#1d4ed8",
    },
  };

  const languageConfig = {
    count: {
      label: "Tasks",
      color: "#3b82f6",
    },
  };

  // Default analytics data structure
  const defaultAnalyticsData: TaskAnalytics = {
    totalTasks: { count: 0, growth: 0 },
    activeTasks: { count: 0, growth: 0 },
    completedTasks: { count: 0, rate: 0, growth: 0 },
    overdueTasks: { count: 0, rate: 0, growth: 0 },
    avgCompletionTime: { days: 0, change: 0 }
  };

  return {
    // Filter state
    filterValues,

    // Data
    analyticsData: analyticsSummaryQuery.data?.data || defaultAnalyticsData,
    statusDistribution,
    completionTrendData: completionTrendsQuery.data?.data || [],
    revenueTrendData: revenueTrendsQuery.data?.data || [],
    languageDistribution,

    // Chart configs
    statusChartConfig,
    completionTrendConfig,
    languageConfig,

    // Utility functions
    formatTrend,

    // Loading states
    isLoading,
    isError,
    error,

    // Handlers
    handleFilterChange,
    handleQuickFilterChange,
    handleDateRangeChange,
    handleResetFilters,
  };
};