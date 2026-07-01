import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client.lib';
import { taskService } from '@/services/task.service';
import { Task } from '@/types';

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  language?: string;
  createdAfter?: string;
  createdBefore?: string;
  dueDateAfter?: string;
  dueDateBefore?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Hook to fetch tasks with filters and pagination
export const useTasks = (
  page: number = 1,
  limit: number = 20,
  filters: TaskFilters = {},
  options?: UseQueryOptions<TasksResponse>
) => {
  return useQuery({
    queryKey: queryKeys.tasks.list({ page, limit, ...filters }),
    queryFn: async () => {
      const response = await taskService.getAllTasks(page, limit, filters);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch a single task by ID
export const useTask = (
  id: string,
  options?: UseQueryOptions<Task>
) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: async () => {
      const response = await taskService.getTaskById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch task');
      }
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};
