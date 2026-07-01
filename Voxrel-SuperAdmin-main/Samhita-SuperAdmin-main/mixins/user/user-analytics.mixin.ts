import { useState, useCallback, useEffect, useMemo } from 'react';
import { useUserAnalyticsDashboard } from '@/hooks/queries/user-analytics-queries.hook';
import { ANALYTICS_CONSTANTS } from '@/constants/analytics.constants';

export interface UserAnalyticsFilters {
  quickFilter: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  [key: string]: string | undefined;
}

export interface UserAnalyticsData {
  totalUsers: { count: number; growth: number };
  revenuePerUser: { amount: number; growth: number };
  taskCompletion: { rate: number; growth: number };
  tasksPerUser: { average: number; growth: number };
}

export interface UserGrowthData {
  date: string;
  users: number;
  newUsers: number;
}

export interface TopPerformer {
  id: string;
  rank: number;
  initials: string;
  name: string;
  avatar: string;
  tasksCompleted: number;
  revenue: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface UserAnalyticsState {
  // Filter state
  filterValues: UserAnalyticsFilters;
  
  // Data
  analyticsData: UserAnalyticsData;
  userGrowthData: UserGrowthData[];
  topPerformers: TopPerformer[];
  isLoading: boolean;
  error: string | null;
}

export const useUserAnalytics = () => {
  // Filter states
  const [filterValues, setFilterValues] = useState<UserAnalyticsFilters>({
    quickFilter: ANALYTICS_CONSTANTS.DEFAULT_QUICK_FILTER,
    dateRangeFrom: undefined,
    dateRangeTo: undefined,
  });

  // Get date range from filters - use state to prevent infinite calls
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    // Default to last 90 days
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const last90DaysStr = `${last90Days.getFullYear()}-${String(last90Days.getMonth() + 1).padStart(2, '0')}-${String(last90Days.getDate()).padStart(2, '0')}`;
    return {
      dateFrom: last90DaysStr,
      dateTo: today
    };
  });

  // Update date range when filters change
  useEffect(() => {
    const now = new Date();
    let dateFrom: string;
    let dateTo: string;

    if (filterValues.quickFilter === 'custom') {
      dateFrom = filterValues.dateRangeFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateTo = filterValues.dateRangeTo || now.toISOString().split('T')[0];
    } else {
      // For relative dates, calculate based on filter
      switch (filterValues.quickFilter) {
        case 'today':
          dateFrom = now.toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'this_week':
          // Get start of current week (Monday)
          const startOfWeek = new Date(now);
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, Monday is 1
          startOfWeek.setDate(now.getDate() + daysToMonday);
          dateFrom = startOfWeek.toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'this_month':
          // Get start and end of current month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
          dateFrom = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
          dateTo = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
          break;
        case 'last_90_days':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'last7days':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'last30days':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'last90days':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        case 'lastYear':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
          break;
        default:
          // Default to last 90 days
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          dateTo = now.toISOString().split('T')[0];
      }
    }

    setDateRange({ dateFrom, dateTo });
  }, [filterValues.quickFilter, filterValues.dateRangeFrom, filterValues.dateRangeTo]);

  const { dateFrom, dateTo } = dateRange;

  // Date range is properly calculated and formatted

  // Fetch user analytics data from API
  const { 
    data: analyticsResponse, 
    isLoading, 
    error 
  } = useUserAnalyticsDashboard(dateFrom, dateTo, 5);

  // Process analytics data
  const analyticsData = useMemo(() => {
    if (!analyticsResponse || !(analyticsResponse as any).data) {
      return {
        totalUsers: { count: 0, growth: 0 },
        revenuePerUser: { amount: 0, growth: 0 },
        taskCompletion: { rate: 0, growth: 0 },
        tasksPerUser: { average: 0, growth: 0 }
      };
    }

    const summary = (analyticsResponse as any).data.summary;
    
    // Map API response to UI format
    return {
      totalUsers: {
        count: summary.totalUsers?.count || 0,
        growth: summary.totalUsers?.growth || 0
      },
      revenuePerUser: {
        amount: summary.revenuePerUser?.amount || 0,
        growth: summary.revenuePerUser?.growth || 0
      },
      taskCompletion: {
        rate: summary.taskCompletion?.rate || 0,
        growth: summary.taskCompletion?.growth || 0
      },
      tasksPerUser: {
        average: summary.tasksPerUser?.average || 0,
        growth: summary.tasksPerUser?.change || 0 // Map 'change' to 'growth'
      }
    };
  }, [analyticsResponse]);

  // Process user growth data
  const userGrowthData = useMemo(() => {
    if (!analyticsResponse || !(analyticsResponse as any).data?.growthTrend) {
      return [];
    }

    return (analyticsResponse as any).data.growthTrend.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: item.totalUsers,
      newUsers: item.newUsers
    }));
  }, [analyticsResponse]);

  // Process top performers data
  const topPerformers = useMemo(() => {
    if (!analyticsResponse || !(analyticsResponse as any).data?.topPerformers) {
      return [];
    }

    return (analyticsResponse as any).data.topPerformers.map((performer: any, index: number) => ({
      id: performer.name?.toLowerCase().replace(/\s+/g, '-') || '',
      rank: index + 1,
      initials: performer.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
      name: performer.name || 'Unknown',
      avatar: "",
      tasksCompleted: performer.tasksCompleted || 0,
      revenue: performer.revenueGenerated || 0,
      completionRate: performer.completionRate || 0,
      trend: performer.trend || 'stable'
    }));
  }, [analyticsResponse]);

  // Event handlers
  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterValues({
      quickFilter: ANALYTICS_CONSTANTS.DEFAULT_QUICK_FILTER,
      dateRangeFrom: undefined,
      dateRangeTo: undefined,
    });
  }, []);

  // Utility functions
  const formatTrend = useCallback((value: number) => {
    const isPositive = value > 0;
    const arrow = isPositive ? '↗' : '↘';
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    return {
      arrow,
      color,
      displayText: `${isPositive ? '+' : ''}${value}%`
    };
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'up':
        return 'up';
      case 'down':
        return 'down';
      default:
        return 'stable';
    }
  }, []);

  // Chart configurations
  const userGrowthConfig = {
    users: {
      label: "Users",
      color: "#3b82f6",
    },
    newUsers: {
      label: "New Users",
      color: "#1d4ed8",
    },
  };

  return {
    // State
    filterValues,
    
    // Data
    analyticsData,
    userGrowthData,
    topPerformers,
    isLoading,
    error,
    
    // Chart config
    userGrowthConfig,
    
    // Utility functions
    formatTrend,
    getTrendIcon,
    
    // Event handlers
    handleFilterChange,
    handleResetFilters,
  };
};
