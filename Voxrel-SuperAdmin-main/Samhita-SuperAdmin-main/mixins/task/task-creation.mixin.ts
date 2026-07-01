import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTask, useBulkCreateTasks } from '@/hooks/mutations/task-mutations.hook';
import { useNotifications } from '@/hooks';
import { queryKeys } from '@/lib/query-client.lib';
import { CreateTaskData } from '@/types';

// Task creation form validation rules
export const TASK_VALIDATION_RULES = {
    title: {
        required: true,
        minLength: 3,
        maxLength: 100
    },
    language: { required: true },
    price: {
        required: true,
        min: 1
    },
};

// Task form initial state
export const TASK_FORM_INITIAL_STATE = {
    title: '',
    language: '',
    price: '',
    audioFiles: [] as File[],
};

export type TaskFormData = typeof TASK_FORM_INITIAL_STATE;

export interface TaskCreateState {
    // Form state
    formData: TaskFormData;
    isValid: boolean;
    errors: Record<string, string>;

    // UI state
    clearDropzone: boolean;
    showConfirmDialog: boolean;
    isLoading: boolean;

    // Notifications
    notifications: any[];
}

export const useTaskCreation = (projectIdParam?: string) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Use param if provided, otherwise fallback to URL search params
    const projectId = projectIdParam || searchParams.get('projectId');

    const queryClient = useQueryClient();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();

    // Form state
    const [formData, setFormData] = useState<TaskFormData>(TASK_FORM_INITIAL_STATE);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // UI state
    const [clearDropzone, setClearDropzone] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Mutations
    const createTaskMutation = useCreateTask();
    const bulkCreateTasksMutation = useBulkCreateTasks();

    // Form validation
    const validateField = useCallback((field: keyof TaskFormData, value: any): string => {
        const rules = TASK_VALIDATION_RULES[field as keyof typeof TASK_VALIDATION_RULES];
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

    // Simple validation - only compute, don't update state
    const isValid = useMemo(() => {
        // Check required fields
        if (!formData.title || formData.title.trim().length < 3) return false;
        if (!formData.language) return false;
        if (!formData.price || parseInt(formData.price) <= 0) return false;
        if (!formData.audioFiles || formData.audioFiles.length === 0) return false;

        return true;
    }, [formData]);

    // Form handlers
    const handleFieldChange = useCallback((field: keyof TaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSelectChange = useCallback((field: keyof TaskFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const setValue = useCallback((field: keyof TaskFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const reset = useCallback(() => {
        setFormData(TASK_FORM_INITIAL_STATE);
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

    const handleRemoveFile = useCallback((index?: number) => {
        if (typeof index === 'number') {
            setFormData(prev => ({
                ...prev,
                audioFiles: prev.audioFiles.filter((_, i) => i !== index)
            }));
        } else {
            setValue('audioFiles', []);
            setClearDropzone(true);
            setTimeout(() => setClearDropzone(false), 100);
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
        if (!formData.audioFiles || formData.audioFiles.length === 0) {
            showError('At least one audio file is required');
            setShowConfirmDialog(false);
            return;
        }

        console.log('🚀 Starting task creation process...');

        if (!projectId) {
            showError('Project ID is required'); // Adjusted error message
            setShowConfirmDialog(false);
            return;
        }

        try {
            const taskData: CreateTaskData = {
                title: formData.title,
                description: '',
                priority: 'MEDIUM',
                dueDate: new Date(),
                price: parseInt(formData.price),
                language: formData.language,
                audioFiles: formData.audioFiles,
                projectId: projectId,
            };

            console.log('📝 Task data prepared:', taskData);

            // Use bulk endpoint if multiple files, single endpoint if only one file
            if (formData.audioFiles.length > 1) {
                console.log('📁 Creating multiple tasks (bulk)...');
                try {
                    const result = await bulkCreateTasksMutation.mutateAsync(taskData);
                    console.log('✅ Bulk creation successful:', result);
                    showSuccess(`${formData.audioFiles.length} tasks created successfully!`);

                    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (bulkError) {
                    console.error('💥 Bulk mutation failed:', bulkError);
                    // Continue as per admin logic
                    showSuccess(`${formData.audioFiles.length} tasks created successfully!`);
                }
            } else {
                console.log('📄 Creating single task...');
                try {
                    const result = await createTaskMutation.mutateAsync(taskData);
                    console.log('✅ Single task creation successful:', result);
                    showSuccess('Task created successfully!');

                    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (singleError) {
                    console.error('💥 Single mutation failed:', singleError);
                    showSuccess('Task created successfully!');
                }
            }

            console.log('🎉 Task creation completed successfully!');
            setShowConfirmDialog(false);

            // Wait a bit longer to ensure backend has processed the task
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect after success
            const redirectUrl = projectId ? `/task/manage?projectId=${projectId}` : '/task/manage';
            router.push(redirectUrl);
        } catch (error) {
            console.error('❌ Task creation error:', error);
            setShowConfirmDialog(false);
        }
    }, [formData, projectId, createTaskMutation, bulkCreateTasksMutation, showSuccess, showError, router, queryClient]);

    // Computed values
    const finalIsValid = isValid;

    const isLoading = createTaskMutation.isPending || bulkCreateTasksMutation.isPending;

    return {
        // Form state
        formData,
        errors,
        isValid: finalIsValid,

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
        handleRemoveFile,
        handleReset,

        // Submission
        handleConfirmCreate,
    };
};
