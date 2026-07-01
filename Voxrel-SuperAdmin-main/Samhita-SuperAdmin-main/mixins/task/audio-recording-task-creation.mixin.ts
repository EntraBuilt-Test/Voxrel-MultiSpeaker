// AUDIO PROJECT TASK CREATION
// Mixin for Audio Recording project task creation

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask, useBulkCreateTasks } from '@/hooks/mutations/task-mutations.hook';
import { useNotifications } from '@/hooks';
import { queryKeys } from '@/lib/query-client.lib';
import { CreateTaskData } from '@/types';

// Audio Recording task form validation rules
export const AUDIO_TASK_VALIDATION_RULES = {
    title: {
        required: true,
        minLength: 3,
        maxLength: 100
    },
    description: {
        required: false,
        maxLength: 500
    },
    language: { required: true },
    price: {
        required: true,
        min: 1
    },
};

// Audio Recording task form initial state
export const AUDIO_TASK_FORM_INITIAL_STATE = {
    title: '',
    description: '',
    language: '',
    price: '',
    type: 'single' as 'single' | 'multi', // Task type: single or multi-speaker
    assignedFreelancers: [] as string[], // Array of freelancer IDs for multi-speaker tasks
    audioFiles: [] as File[],
};

export type AudioTaskFormData = typeof AUDIO_TASK_FORM_INITIAL_STATE;

export const useAudioRecordingTaskCreation = (projectId?: string) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();

    // Form state
    const [formData, setFormData] = useState<AudioTaskFormData>(AUDIO_TASK_FORM_INITIAL_STATE);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // UI state
    const [clearDropzone, setClearDropzone] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Mutations
    const createTaskMutation = useCreateTask();
    const bulkCreateTasksMutation = useBulkCreateTasks();

    // Form validation
    const validateField = useCallback((field: keyof AudioTaskFormData, value: any): string => {
        const rules = AUDIO_TASK_VALIDATION_RULES[field as keyof typeof AUDIO_TASK_VALIDATION_RULES];
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

        if ('min' in rules && rules.min && value && parseInt(value) < rules.min) {
            return `${field} must be at least ${rules.min}`;
        }

        return '';
    }, []);

    // Simple validation
    const isValid = useMemo(() => {
        if (!formData.title || formData.title.trim().length < 3) return false;
        if (!formData.language) return false;
        if (!formData.price || parseInt(formData.price) <= 0) return false;
        
        // For multi-speaker tasks, require at least one assigned freelancer
        if (formData.type === 'multi') {
            if (!formData.assignedFreelancers || formData.assignedFreelancers.length === 0) {
                return false;
            }
        }

        return true;
    }, [formData]);

    // Form handlers
    const handleFieldChange = useCallback((field: keyof AudioTaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSelectChange = useCallback((field: keyof AudioTaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const setValue = useCallback((field: keyof AudioTaskFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const reset = useCallback(() => {
        setFormData(AUDIO_TASK_FORM_INITIAL_STATE);
        setErrors({});
        setClearDropzone(true);
        setTimeout(() => setClearDropzone(false), 100);
    }, []);

    // File handlers
    const handleFileChange = useCallback((files: File[]) => {
        if (files.length > 0) {
            setValue('audioFiles', files);
            setClearDropzone(false);
        } else {
            setValue('audioFiles', []);
        }
    }, [setValue]);

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
        if (!projectId) {
            showError('Project ID is required');
            setShowConfirmDialog(false);
            return;
        }

        try {
            const taskData: CreateTaskData = {
                title: formData.title,
                description: formData.description || '',
                priority: 'MEDIUM',
                dueDate: new Date(),
                price: parseInt(formData.price),
                language: formData.language,
                audioFiles: formData.audioFiles || [], // Ensure array if undefined
                projectId: projectId,
                type: formData.type, // 'single' or 'multi'
                assignedFreelancers: formData.assignedFreelancers, // Array of freelancer IDs for multi-speaker
            };

            // Use bulk endpoint if multiple files, single endpoint if only one file or no files
            if (formData.audioFiles && formData.audioFiles.length > 1) {
                await bulkCreateTasksMutation.mutateAsync(taskData);
                showSuccess(`${formData.audioFiles.length} tasks created successfully!`);
            } else {
                await createTaskMutation.mutateAsync(taskData);
                showSuccess('Task created successfully!');
            }

            // Invalidate all task queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

            // Wait a bit for queries to refetch
            await new Promise(resolve => setTimeout(resolve, 500));

            setShowConfirmDialog(false);

            // Wait a bit longer to ensure backend has processed the task
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect back to project task list
            router.push(`/task/manage?projectId=${projectId}`);
        } catch (error: any) {
            console.error('Audio task creation error:', error);
            setShowConfirmDialog(false);
            // Display specific error message if available
            const errorMessage = error?.message || error?.response?.data?.message || 'Failed to create task(s). Please try again.';
            showError(errorMessage);
        }
    }, [formData, projectId, createTaskMutation, bulkCreateTasksMutation, showSuccess, showError, router, queryClient]);

    const isLoading = createTaskMutation.isPending || bulkCreateTasksMutation.isPending;

    return {
        // Form state
        formData,
        errors,
        isValid,

        // UI state
        clearDropzone,
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

        // File handlers
        handleFileChange,
        handleReset,

        // Submission
        handleConfirmCreate,
    };
};
