import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { queryKeys, cacheConfig } from '@/lib/query-client.lib';

// Task Analytics Summary Query
export const useTaskAnalyticsSummary = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.analyticsSummary(dateFrom, dateTo, projectId),
    queryFn: () => taskService.getTaskAnalyticsSummary(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
    refetchOnWindowFocus: false,
  });
};

// Task Status Distribution Query
export const useTaskStatusDistribution = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.analyticsStatusDistribution(dateFrom, dateTo, projectId),
    queryFn: () => taskService.getTaskStatusDistribution(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
    refetchOnWindowFocus: false,
  });
};

// Task Completion Trends Query
export const useTaskCompletionTrends = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.analyticsCompletionTrends(dateFrom, dateTo, projectId),
    queryFn: () => taskService.getTaskCompletionTrends(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
    refetchOnWindowFocus: false,
  });
};

// Task Revenue Trends Query
export const useTaskRevenueTrends = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.analyticsRevenueTrends(dateFrom, dateTo, projectId),
    queryFn: () => taskService.getTaskRevenueTrends(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
    refetchOnWindowFocus: false,
  });
};

// Task Language Distribution Query
export const useTaskLanguageDistribution = (dateFrom: string, dateTo: string, projectId?: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.analyticsLanguageDistribution(dateFrom, dateTo, projectId),
    queryFn: () => taskService.getTaskLanguageDistribution(dateFrom, dateTo, projectId),
    enabled: !!dateFrom && !!dateTo,
    ...cacheConfig.analytics,
    refetchOnWindowFocus: false,
  });
};
