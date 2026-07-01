import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/query-client.lib';
import { User } from '@/types';

// Hook for updating user status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'BANNED' }) => {
      await userService.updateUserStatus(id, status);
      return { id, status };
    },
    onSuccess: (updatedUser) => {
      // Invalidate users list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      
      // Update the user in cache if we have the detail query
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), (oldData: User | undefined) => {
        if (oldData) {
          return { ...oldData, status: updatedUser.status };
        }
        return oldData;
      });
    },
  });
};

// Hook for deleting a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await userService.deleteUser(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedId) });
      
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};

// Hook for creating a user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: 'ADMIN' | 'FREELANCER'; status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED' }) => {
      const response = await userService.createUser(userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list to refetch with the new user
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};

// Hook for updating user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      // This would be implemented when the API endpoint is available
      throw new Error('Update user profile endpoint not implemented yet');
    },
    onSuccess: (updatedUser: User) => {
      // Update the user in cache
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
      
      // Invalidate users list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};
