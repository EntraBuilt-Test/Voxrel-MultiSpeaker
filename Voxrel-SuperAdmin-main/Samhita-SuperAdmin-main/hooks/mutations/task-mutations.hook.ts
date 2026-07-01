import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { queryKeys } from '@/lib/query-client.lib';
import { CreateTaskData, UpdateTaskData, Task } from '@/types';

// Hook for creating a new task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('🔄 Single task mutation starting with data:', taskData);
      
      const response = await taskService.createTask(taskData);
      console.log('📦 Raw single task response:', response);
      
      // Temporarily returning raw response without any processing
      console.log('✅ Single task response (returning raw response)');
      return response;
    },
    onSuccess: (newTask) => {
      console.log('🎉 Single task mutation onSuccess called with:', newTask);
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Optionally add the new task to the cache
      queryClient.setQueryData(queryKeys.tasks.detail(newTask.data.id), newTask.data);
    },
    onError: (error) => {
      console.error('💥 Single task mutation onError called with:', error);
    }
  });
};

// Hook for bulk creating tasks (one task per audio file)
export const useBulkCreateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('🔄 Bulk mutation starting with data:', taskData);
      
      const response = await taskService.bulkCreateTasks(taskData);
      console.log('📦 Raw bulk response:', response);
      
      // Temporarily returning raw response without any processing
      console.log('✅ Bulk response (returning raw response)');
      return response;
    },
    onSuccess: (newTasks) => {
      console.log('🎉 Bulk mutation onSuccess called with:', newTasks);
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Optionally add the new tasks to the cache
      newTasks.data.forEach((task: Task) => {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      });
    },
    onError: (error) => {
      console.error('💥 Bulk mutation onError called with:', error);
    }
  });
};

// Hook for updating a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskData }) => {
      const response = await taskService.updateTask(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update task');
      }
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Update the task in the cache
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id), updatedTask);
      
      // Invalidate tasks list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

// Hook for deleting a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await taskService.deleteTask(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete task');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the task from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(deletedId) });
      
      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

// Hook for approving task claim
export const useApproveTaskClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await taskService.approveTaskClaim(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to approve task claim');
      }
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Update the task in the cache
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id), updatedTask);
      
      // Invalidate tasks list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

// Hook for rejecting task claim
export const useRejectTaskClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await taskService.rejectTaskClaim(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reject task claim');
      }
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Update the task in the cache
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id), updatedTask);
      
      // Invalidate tasks list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};
