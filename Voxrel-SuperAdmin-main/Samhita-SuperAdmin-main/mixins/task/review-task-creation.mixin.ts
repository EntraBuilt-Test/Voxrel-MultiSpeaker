// REVIEW PROJECT TASK CREATION
// Mixin for Review project task creation

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask } from '@/hooks/mutations/task-mutations.hook';
import { useTasks } from '@/hooks/queries/tasks-queries.hook';
import { useNotifications } from '@/hooks';
import { queryKeys } from '@/lib/query-client.lib';
import { CreateTaskData, Task } from '@/types';
import { useProjectStore } from '@/stores';

// Review task form validation rules
export const REVIEW_TASK_VALIDATION_RULES = {
    title: {
        required: true,
        minLength: 3,
        maxLength: 100
    },
    sourceTaskId: { required: true },
    instructions: {
        required: false,
        maxLength: 1000
    },
};

// Review task form initial state
export const REVIEW_TASK_FORM_INITIAL_STATE = {
    title: '',
    taskType: 'AUDIO_REVIEW' as 'AUDIO_REVIEW' | 'TRANSCRIPTION_REVIEW',
    sourceTaskId: '',
    instructions: '',
};

export type ReviewTaskFormData = typeof REVIEW_TASK_FORM_INITIAL_STATE;

export const useReviewTaskCreation = (projectId?: string) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();
    const { getProjectById } = useProjectStore();

    // Form state
    const [formData, setFormData] = useState<ReviewTaskFormData>(REVIEW_TASK_FORM_INITIAL_STATE);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedSourceTask, setSelectedSourceTask] = useState<Task | null>(null);

    // UI state
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Mutations
    const createTaskMutation = useCreateTask();

    // Get the current review project to find the original project ID
    const currentProject = useMemo(() => {
        if (!projectId) return null;
        return getProjectById(projectId);
    }, [projectId, getProjectById]);

    // Extract original project ID from review project's metadata
    const originalProjectId = useMemo(() => {
        if (!currentProject || !currentProject.metadata) return null;
        const metadata = currentProject.metadata as any;
        return metadata.originalProjectId || null;
    }, [currentProject]);

    // Fetch completed tasks from all projects (for source task selection)
    // Fetch tasks with SUBMITTED status
    const { data: completedTasksData, isLoading: isLoadingTasks } = useTasks(
        1,
        100,
        { status: 'SUBMITTED' }
    );

    const completedTasks = completedTasksData?.tasks || [];

    // Filter tasks: only show tasks from the original project (if review project has one)
    // Otherwise, show all submitted tasks except those from the current review project
    const eligibleTasks = useMemo(() => {
        if (!projectId) return completedTasks;

        // If review project has an original project ID, only show tasks from that project
        if (originalProjectId) {
            return completedTasks.filter(task => {
                const taskProjectId = (task as any).projectId;
                // Only include tasks from the original project
                return taskProjectId === originalProjectId;
            });
        }

        // Fallback: exclude tasks from the current review project
        return completedTasks.filter(task => {
            const taskProjectId = (task as any).projectId;
            return taskProjectId !== projectId;
        });
    }, [completedTasks, projectId, originalProjectId]);

    // Form validation
    const validateField = useCallback((field: keyof ReviewTaskFormData, value: any): string => {
        const rules = REVIEW_TASK_VALIDATION_RULES[field as keyof typeof REVIEW_TASK_VALIDATION_RULES];
        if (!rules) return '';

        if (rules.required && (!value || value === '')) {
            return `${field} is required`;
        }

        if ('minLength' in rules && rules.minLength && value && value.length < rules.minLength) {
            return `${field} must be at least ${rules.minLength} characters`;
        }

        if ('maxLength' in rules && rules.maxLength && value && value.length > rules.maxLength) {
            return `${field} must be no more than ${rules.maxLength} characters`;
        }

        return '';
    }, []);

    // Simple validation
    const isValid = useMemo(() => {
        if (!formData.title || formData.title.trim().length < 3) return false;
        if (!formData.taskType) return false;
        if (!formData.sourceTaskId) return false;

        return true;
    }, [formData]);

    // Update selected source task when sourceTaskId changes
    useEffect(() => {
        if (formData.sourceTaskId) {
            const task = eligibleTasks.find(t => {
                const taskId = t._id || t.id;
                return taskId === formData.sourceTaskId;
            });
            setSelectedSourceTask(task || null);
        } else {
            setSelectedSourceTask(null);
        }
    }, [formData.sourceTaskId, eligibleTasks]);

    // Form handlers
    const handleFieldChange = useCallback((field: keyof ReviewTaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSelectChange = useCallback((field: keyof ReviewTaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const setValue = useCallback((field: keyof ReviewTaskFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const reset = useCallback(() => {
        setFormData(REVIEW_TASK_FORM_INITIAL_STATE);
        setErrors({});
        setSelectedSourceTask(null);
    }, []);

    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    // Form submission
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            setShowConfirmDialog(true);
        }
    }, [isValid]);

    const handleConfirmCreate = useCallback(async () => {
        if (!formData.sourceTaskId) {
            showError('Source task is required');
            setShowConfirmDialog(false);
            return;
        }

        if (!projectId) {
            showError('Project ID is required');
            setShowConfirmDialog(false);
            return;
        }

        if (!selectedSourceTask) {
            showError('Selected source task not found');
            setShowConfirmDialog(false);
            return;
        }

        try {
            // Create review task based on source task
            // Preserve original task metadata
            const taskData: CreateTaskData = {
                title: formData.title,
                description: formData.instructions || `Review task for: ${selectedSourceTask.title}`,
                priority: selectedSourceTask.priority || 'MEDIUM',
                dueDate: new Date(),
                price: selectedSourceTask.price || 0,
                language: selectedSourceTask.language,
                projectId: projectId,
                // Store source task reference and review type in tags
                tags: JSON.stringify({
                    reviewType: formData.taskType,
                    sourceTaskId: formData.sourceTaskId,
                    sourceProjectId: (selectedSourceTask as any).projectId || 'unknown',
                }),
                // For review tasks, use the source task's audio URL or submission URL (for self-recordings) instead of uploading new files
                audioUrl: selectedSourceTask.audioUrl || selectedSourceTask.submission,
                audioFiles: [], // Empty array since we're using audioUrl
            };

            // Validate that source task has audio URL or submission
            if (!taskData.audioUrl) {
                showError('Source task does not have an audio URL or submission. Cannot create review task.');
                setShowConfirmDialog(false);
                return;
            }

            await createTaskMutation.mutateAsync(taskData);
            showSuccess('Review task created successfully!');

            // Invalidate all task queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

            // Wait a bit for queries to refetch
            await new Promise(resolve => setTimeout(resolve, 500));

            setShowConfirmDialog(false);

            // Wait a bit longer to ensure backend has processed the task
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect back to review project task list
            router.push(`/task/manage?projectId=${projectId}`);
        } catch (error) {
            console.error('Review task creation error:', error);
            setShowConfirmDialog(false);
            showError('Failed to create review task. Please try again.');
        }
    }, [formData, projectId, selectedSourceTask, createTaskMutation, showSuccess, showError, router, queryClient]);

    const isLoading = createTaskMutation.isPending;

    return {
        // Form state
        formData,
        errors,
        isValid,
        selectedSourceTask,
        eligibleTasks,
        isLoadingTasks,

        // UI state
        showConfirmDialog,
        setShowConfirmDialog,
        isLoading,

        // Notifications
        notifications,
        dismiss,

        // Form handlers
        handleFieldChange,
        handleSelectChange,
        setValue,
        reset,
        handleSubmit,
        handleReset,

        // Submission
        handleConfirmCreate,
    };
};
