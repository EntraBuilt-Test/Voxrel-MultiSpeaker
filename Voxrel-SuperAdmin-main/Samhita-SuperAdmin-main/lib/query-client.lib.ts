import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors except 408, 429
        const errorWithStatus = error as { status?: number };
        if (errorWithStatus?.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500 && ![408, 429].includes(errorWithStatus.status)) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // Enhanced caching for different data types
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    analytics: () => [...queryKeys.tasks.all, 'analytics'] as const,
    analyticsSummary: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.tasks.analytics(), 'summary', { dateFrom, dateTo, projectId }] as const,
    analyticsStatusDistribution: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.tasks.analytics(), 'statusDistribution', { dateFrom, dateTo, projectId }] as const,
    analyticsCompletionTrends: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.tasks.analytics(), 'completionTrends', { dateFrom, dateTo, projectId }] as const,
    analyticsRevenueTrends: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.tasks.analytics(), 'revenueTrends', { dateFrom, dateTo, projectId }] as const,
    analyticsLanguageDistribution: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.tasks.analytics(), 'languageDistribution', { dateFrom, dateTo, projectId }] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    analytics: () => [...queryKeys.users.all, 'analytics'] as const,
    analyticsDashboard: (dateFrom: string, dateTo: string, limit: number, projectId?: string) => [...queryKeys.users.analytics(), 'dashboard', { dateFrom, dateTo, limit, projectId }] as const,
    analyticsSummary: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.users.analytics(), 'summary', { dateFrom, dateTo, projectId }] as const,
    analyticsGrowthTrend: (dateFrom: string, dateTo: string, projectId?: string) => [...queryKeys.users.analytics(), 'growthTrend', { dateFrom, dateTo, projectId }] as const,
    analyticsTopPerformers: (dateFrom: string, dateTo: string, limit: number, projectId?: string) => [...queryKeys.users.analytics(), 'topPerformers', { dateFrom, dateTo, limit, projectId }] as const,
    stats: (userId: string) => [...queryKeys.users.all, 'stats', userId] as const,
  },
  settings: {
    all: ['settings'] as const,
    application: () => [...queryKeys.settings.all, 'application'] as const,
    profile: () => [...queryKeys.settings.all, 'profile'] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
} as const;

// Cache configuration for different data types
export const cacheConfig = {
  // Static data that rarely changes
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  // User data that changes moderately
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Task data that changes frequently
  task: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Analytics data that's expensive to compute
  analytics: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  // Real-time data that needs frequent updates
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
} as const;
