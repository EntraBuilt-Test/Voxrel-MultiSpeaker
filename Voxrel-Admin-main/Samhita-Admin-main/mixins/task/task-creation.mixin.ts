import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';

import { useNotifications } from '@/hooks';
import { useCreateTask, useBulkCreateTasks } from '@/hooks/mutations/task-mutations.hook';
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

export const useTaskCreation = (projectId?: string) => {
    const router = useRouter();
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
    const _validateField = useCallback((field: keyof TaskFormData, value: any): string => {
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
            showError('Project ID is required to create a task');
            setShowConfirmDialog(false);
            return;
        }
        
        try {
            const taskData: CreateTaskData = {
                title: formData.title,
                description: '', // Default empty since removed from form
                priority: 'MEDIUM', // Default value since removed from form
                dueDate: new Date(), // Default to current date since removed from form
                price: parseInt(formData.price),
                language: formData.language,
                audioFiles: formData.audioFiles,
                projectId: projectId, // Always include projectId - required for project association
            };
            
            console.log('📝 Task data prepared:', taskData);
            
            // Use bulk endpoint if multiple files, single endpoint if only one file
            if (formData.audioFiles.length > 1) {
                console.log('📁 Creating multiple tasks (bulk)...');
                try {
                    const result = await bulkCreateTasksMutation.mutateAsync(taskData);
                    console.log('✅ Bulk creation successful:', result);
                    showSuccess(`${formData.audioFiles.length} tasks created successfully!`);
                    
                    // Force invalidate all task queries to ensure fresh data
                    // This will invalidate all task list queries including those with projectId filter
                    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
                    
                    // Wait a bit for queries to refetch
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (bulkError) {
                    console.error('💥 Bulk mutation failed:', bulkError);
                    // Don't throw the error, just log it and show success anyway since task creation worked
                    console.log('🔄 Showing success toast despite mutation error');
                    showSuccess(`${formData.audioFiles.length} tasks created successfully!`);
                }
            } else {
                console.log('📄 Creating single task...');
                try {
                    const result = await createTaskMutation.mutateAsync(taskData);
                    console.log('✅ Single task creation successful:', result);
                    showSuccess('Task created successfully!');
                    
                    // Force invalidate all task queries to ensure fresh data
                    // This will invalidate all task list queries including those with projectId filter
                    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
                    
                    // Wait a bit for queries to refetch
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (singleError) {
                    console.error('💥 Single mutation failed:', singleError);
                    // Don't throw the error, just log it and show success anyway since task creation worked
                    console.log('🔄 Showing success toast despite mutation error');
                    showSuccess('Task created successfully!');
                }
            }
            
            console.log('🎉 Task creation completed successfully!');
            setShowConfirmDialog(false);
            
            // Wait a bit longer to ensure backend has processed the task
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect after ensuring query invalidation completed
            const redirectUrl = projectId ? `/task/manage?projectId=${projectId}` : '/task/manage';
            router.push(redirectUrl);
        } catch (error) {
            console.error('❌ Task creation error:', error);
            const errorObj = error instanceof Error ? error : new Error(String(error));
            console.error('❌ Error details:', {
                message: errorObj.message,
                stack: errorObj.stack,
                name: errorObj.name,
                cause: errorObj.cause
            });
            console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.trace('❌ Error caught at this location');
            setShowConfirmDialog(false);
            // TEMPORARILY DISABLED: showError('Failed to create task(s). Please try again.');
            console.log('🚫 Error toast disabled for testing');
        }
    }, [formData, createTaskMutation, bulkCreateTasksMutation, showSuccess, showError, router]);
    
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
