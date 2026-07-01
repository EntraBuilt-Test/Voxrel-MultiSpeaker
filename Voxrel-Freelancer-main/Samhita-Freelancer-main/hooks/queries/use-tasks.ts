import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { CreateTaskData, UpdateTaskData } from "@/types";
import { toast } from "sonner";

// Query Keys
export const taskKeys = {
    all: ["tasks"] as const,
    lists: () => [...taskKeys.all, "list"] as const,
    list: (filters: Record<string, any>) => [...taskKeys.lists(), filters] as const,
    details: () => [...taskKeys.all, "detail"] as const,
    detail: (id: string) => [...taskKeys.details(), id] as const,
    myTasks: (filters: Record<string, any>) => [...taskKeys.all, "my", filters] as const,
    analytics: () => [...taskKeys.all, "analytics"] as const,
};

// Get all tasks with pagination and filters
export function useTasks(
    page = 1,
    limit = 10,
    filters: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        search?: string;
    } = {},
) {
    return useQuery({
        queryKey: taskKeys.list({ page, limit, ...filters }),
        queryFn: () => taskService.getAvailableTasks(page, limit, filters),
    });
}

// Get task by ID
export function useTask(id: string) {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: () => taskService.getTaskById(id),
        enabled: !!id, // Only run if ID exists
    });
}

// Get my tasks
export function useMyTasks(page = 1, limit = 10, status?: string) {
    return useQuery({
        queryKey: taskKeys.myTasks({ page, limit, status }),
        queryFn: () => taskService.getMyTasks(page, limit, { status }),
    });
}

// Get task analytics
export function useTaskAnalytics(dateRange?: { from: string; to: string }) {
    return useQuery({
        queryKey: taskKeys.analytics(),
        queryFn: () => taskService.getMyTaskAnalytics(dateRange),
    });
}

// Create task mutation - TODO: Implement createTask method in TaskService
// export function useCreateTask() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (taskData: CreateTaskData) => taskService.createTask(taskData),
//         onSuccess: () => {
//             // Invalidate and refetch tasks list
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Task created successfully!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to create task");
//         },
//     });
// }

// Update task mutation - TODO: Implement updateTask method in TaskService
// export function useUpdateTask() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) => taskService.updateTask(id, data),
//         onSuccess: (_, variables) => {
//             // Invalidate the specific task and the list
//             queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Task updated successfully!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to update task");
//         },
//     });
// }

// Delete task mutation - TODO: Implement deleteTask method in TaskService
// export function useDeleteTask() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (id: string) => taskService.deleteTask(id),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Task deleted successfully!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to delete task");
//         },
//     });
// }

// Update task status mutation - TODO: Implement updateTaskStatus method in TaskService
// export function useUpdateTaskStatus() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: ({ id, status }: { id: string; status: "pending" | "in_progress" | "completed" | "cancelled" }) =>
//             taskService.updateTaskStatus(id, status),
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Task status updated!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to update task status");
//         },
//     });
// }

// Assign task mutation - TODO: Implement assignTask method in TaskService
// export function useAssignTask() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => taskService.assignTask(id, assignedTo),
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Task assigned successfully!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to assign task");
//         },
//     });
// }

// Bulk delete tasks mutation - TODO: Implement bulkDeleteTasks method in TaskService
// export function useBulkDeleteTasks() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: (taskIds: string[]) => taskService.bulkDeleteTasks(taskIds),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
//             toast.success("Tasks deleted successfully!");
//         },
//         onError: (error: Error) => {
//             toast.error(error.message || "Failed to delete tasks");
//         },
//     });
// }
