import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { queryKeys } from '@/lib/query-client.lib';
import { Project, ProjectType } from '@/types';
import { toast } from 'sonner';

// Hook to fetch all projects
export const useProjects = () => {
    return useQuery({
        queryKey: queryKeys.projects.lists(),
        queryFn: async () => {
            const response = await projectService.getProjects();
            if (!response.data || !response.data.projects) {
                throw new Error('Failed to fetch projects');
            }
            return response.data.projects;
        },
    });
};

// Hook to fetch a single project by ID
export const useProject = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.projects.detail(id),
        queryFn: async () => {
            const response = await projectService.getProjectById(id);
            if (!response.data) {
                throw new Error('Failed to fetch project');
            }
            return response.data;
        },
        enabled: !!id && (options?.enabled !== false),
    });
};

// Hook to fetch projects suitable for tasks (excluding generic ones perhaps, or all)
export const useTaskProjects = () => {
    return useQuery({
        queryKey: ['projects', 'task-creation'],
        queryFn: async () => {
            const response = await projectService.getProjects();
            if (!response.data || !response.data.projects) {
                throw new Error('Failed to fetch projects');
            }
            return response.data.projects;
        },
    });
};

// Hook to create a project
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

// Hook to update a project
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
