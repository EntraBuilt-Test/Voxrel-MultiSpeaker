import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { UserAnalyticsDashboard } from '@/types';
import { queryKeys, cacheConfig } from '@/lib/query-client.lib';

// User Analytics Dashboard (Combined endpoint - recommended)
export const useUserAnalyticsDashboard = (
  dateFrom: string,
  dateTo: string,
  limit: number = 5,
  projectId?: string
) => {
  return useQuery({
    queryKey: queryKeys.users.analyticsDashboard(dateFrom, dateTo, limit, projectId),
    queryFn: () => userService.getUserAnalyticsDashboard(dateFrom, dateTo, limit, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
  });
};

// Individual User Analytics Endpoints (for specific use cases)
export const useUserAnalyticsSummary = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.users.analyticsSummary(dateFrom, dateTo, projectId),
    queryFn: () => userService.getUserAnalyticsSummary(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
  });
};

export const useUserGrowthTrend = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.users.analyticsGrowthTrend(dateFrom, dateTo, projectId),
    queryFn: () => userService.getUserGrowthTrend(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
  });
};

export const useTopPerformers = (dateFrom: string, dateTo: string, limit: number = 5, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.users.analyticsTopPerformers(dateFrom, dateTo, limit, projectId),
    queryFn: () => userService.getTopPerformers(dateFrom, dateTo, limit, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
  });
};

// User Statistics (Individual user)
export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.stats(userId),
    queryFn: () => userService.getUserStats(userId),
    enabled: !!userId,
    ...cacheConfig.user,
  });
};

// Current user's stats
export const useMyStats = () => {
  return useQuery({
    queryKey: ['myStats'],
    queryFn: () => userService.getMyStats(),
    ...cacheConfig.user,
  });
};
