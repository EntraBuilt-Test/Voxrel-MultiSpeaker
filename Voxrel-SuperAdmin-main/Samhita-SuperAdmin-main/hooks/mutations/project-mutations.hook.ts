import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { queryKeys } from '@/lib/query-client.lib';
import { Project, ProjectType } from '@/types';
import { toast } from 'sonner';

// Approve Join Request
export const useApproveJoinRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
            const response = await projectService.approveJoinRequest(projectId, userId);
            if (!response.success) {
                throw new Error(response.message || 'Failed to approve join request');
            }
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
            toast.success('Join request approved successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to approve join request');
        },
    });
};

// Reject Join Request
export const useRejectJoinRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
            const response = await projectService.rejectJoinRequest(projectId, userId);
            if (!response.success) {
                throw new Error(response.message || 'Failed to reject join request');
            }
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
            toast.success('Join request rejected');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to reject join request');
        },
    });
};

// Create Project (Moved helper here if needed by other components importing from mutations)
export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            name: string;
            description?: string;
            type: ProjectType;
            supportedLanguages?: string[];
            metadata?: Record<string, any>;
        }) => {
            const response = await projectService.createProject(data);
            if (!response.success) {
                throw new Error(response.message || 'Failed to create project');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
            toast.success('Project created successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create project');
        },
    });
};

// Update Project
export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
            const response = await projectService.updateProject(id, data);
            if (!response.success) {
                throw new Error(response.message || 'Failed to update project');
            }
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data._id || data.id) });
            toast.success('Project updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update project');
        },
    });
};
