import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { projectService } from '@/services/project.service';
import { queryKeys } from '@/lib/query-client.lib';
import { User } from '@/types';

export interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Hook to fetch users with filters and pagination
export const useUsers = (
  page: number = 1,
  limit: number = 50,
  filters: UserFilters = {},
  options?: UseQueryOptions<UsersResponse>
) => {
  return useQuery({
    queryKey: queryKeys.users.list({ page, limit, ...filters }),
    queryFn: async () => {
      // Use project-specific endpoint if projectId is provided
      const response = filters.projectId
        ? await projectService.getProjectUsers(filters.projectId, page, limit, filters)
        : await userService.getAllUsers(page, limit, filters);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch users');
      }
      return {
        users: response.data.users,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalUsers: response.data.pagination.totalUsers,
          hasNext: response.data.pagination.hasNext,
          hasPrev: response.data.pagination.hasPrev,
        }
      };
    },
    ...options,
  });
};

// Hook to fetch a single user by ID
export const useUser = (
  id: string,
  options?: UseQueryOptions<User>
) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const response = await userService.getUserById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};
