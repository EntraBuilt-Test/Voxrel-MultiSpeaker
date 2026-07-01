'use client';

// AUDIO PROJECT TASK CREATION
// Component for Audio Recording project task creation

import { RotateCcw, ArrowLeft, Plus, Users, X, Loader2, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { NotificationToast } from '@/components/shared';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog.ui';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Dropzone } from '@/components/ui/dropzone.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { Textarea } from '@/components/ui/textarea.ui';
import { CURRENCY_SYMBOL, LANGUAGE_OPTIONS } from '@/constants/options.constants';
import { useAudioRecordingTaskCreation } from '@/mixins/task/audio-recording-task-creation.mixin';
import { projectService } from '@/services/project.service';

interface AudioRecordingTaskFormProps {
    projectId: string;
}

export default function AudioRecordingTaskForm({ projectId }: AudioRecordingTaskFormProps) {
    const {
        // Form state
        formData,
        errors,
        isValid,

        // UI state
        showConfirmDialog,
        setShowConfirmDialog,
        isLoading,
        clearDropzone,

        // Notifications
        notifications,
        dismiss,

        // Form handlers
        handleFieldChange,
        handleSelectChange,
        setValue,
        handleSubmit,

        // File handlers
        handleFileChange,
        handleReset,

        // Submission
        handleConfirmCreate,
    } = useAudioRecordingTaskCreation(projectId);

    // Freelancer selection state
    const [availableFreelancers, setAvailableFreelancers] = useState<Array<{ id?: string; _id?: string; name?: string; email?: string; [key: string]: unknown }>>([]);
    const [isLoadingFreelancers, setIsLoadingFreelancers] = useState(false);
    const [showFreelancerSelect, setShowFreelancerSelect] = useState(false);

    const fetchProjectFreelancers = React.useCallback(async () => {
        if (!projectId) return;
        setIsLoadingFreelancers(true);
        try {
            const response = await projectService.getProjectUsers(projectId, 1, 200);
            if (response.success && response.data) {
                setAvailableFreelancers(response.data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch project freelancers:', error);
        } finally {
            setIsLoadingFreelancers(false);
        }
    }, [projectId]);

    // Fetch freelancers when task type is multi
    useEffect(() => {
        if (formData.type === 'multi' && projectId) {
            fetchProjectFreelancers();
        } else {
            // Clear selected freelancers if switching to single speaker
            if (formData.type === 'single') {
                setValue('assignedFreelancers', []);
            }
        }
    }, [formData.type, projectId, fetchProjectFreelancers, setValue]);

    const toggleFreelancerSelection = (freelancerId: string) => {
        const current = formData.assignedFreelancers || [];
        if (current.includes(freelancerId)) {
            setValue('assignedFreelancers', current.filter(id => id !== freelancerId));
        } else {
            setValue('assignedFreelancers', [...current, freelancerId]);
        }
    };

    const removeFreelancer = (freelancerId: string) => {
        const current = formData.assignedFreelancers || [];
        setValue('assignedFreelancers', current.filter(id => id !== freelancerId));
    };

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Audio Recording Task</h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload text files and configure transcription task requirements.</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="flex-1 min-h-[calc(100vh-14rem)]">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-4 space-y-3 h-full overflow-y-auto flex flex-col">
                        <form onSubmit={handleSubmit} className="space-y-3 flex flex-col">
                            <div className="space-y-3">
                                {/* Task Title */}
                                <div className="space-y-1">
                                    <Label htmlFor="title" className="text-base font-medium">Task Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter task title..."
                                        value={formData.title}
                                        onChange={(e) => handleFieldChange('title')(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                {/* Task Description */}
                                <div className="space-y-1">
                                    <Label htmlFor="description" className="text-base font-medium">Task Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter task description..."
                                        value={formData.description}
                                        onChange={(e) => handleFieldChange('description')(e.target.value)}
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>



                                {/* Text Files Upload */}
                                <div className="space-y-1">
                                    <Label className="text-base font-medium">Text Files (Optional)</Label>
                                    <Dropzone
                                        onFilesChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                        maxFiles={100}
                                        disabled={isLoading}
                                        clearFiles={clearDropzone}
                                    />
                                </div>

                                {/* Task Type */}
                                <div className="space-y-1">
                                    <Label htmlFor="type" className="text-base font-medium">Task Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={handleSelectChange('type')}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select task type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Speaker</SelectItem>
                                            <SelectItem value="multi">Multi Speaker</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.type === 'single' 
                                            ? 'Personal recording space for one speaker'
                                            : 'Collaborative recording environment for multiple speakers'}
                                    </p>
                                    {errors.type && (
                                        <p className="text-sm text-red-600">{errors.type}</p>
                                    )}
                                </div>

                                {/* Assigned Freelancers (Multi-Speaker Only) */}
                                {formData.type === 'multi' && (
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium">Assign Freelancers *</Label>
                                        <div className="space-y-2">
                                            {/* Selected Freelancers */}
                                            {formData.assignedFreelancers && formData.assignedFreelancers.length > 0 && (
                                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
                                                    {formData.assignedFreelancers.map((freelancerId) => {
                                                        const freelancer = availableFreelancers.find(f => (f.id || f._id) === freelancerId);
                                                        if (!freelancer) return null;
                                                        return (
                                                            <div
                                                                key={freelancerId}
                                                                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                <span>{freelancer.name || freelancer.email}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFreelancer(freelancerId)}
                                                                    className="ml-1 hover:text-destructive"
                                                                    disabled={isLoading}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Freelancer Selection Dropdown */}
                                            <Popover open={showFreelancerSelect} onOpenChange={setShowFreelancerSelect}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full justify-start"
                                                        disabled={isLoading || isLoadingFreelancers}
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        {isLoadingFreelancers ? 'Loading freelancers...' : 'Select Freelancers'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                                                    <div className="p-2 border-b">
                                                        <p className="text-sm font-medium">Select Freelancers</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Choose freelancers to participate in this multi-speaker session
                                                        </p>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {isLoadingFreelancers ? (
                                                            <div className="flex justify-center items-center py-8">
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                            </div>
                                                        ) : availableFreelancers.length === 0 ? (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                                <p className="text-sm">No freelancers found in this project.</p>
                                                                <p className="text-xs mt-1">Please add freelancers to the project first.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y">
                                                                {availableFreelancers.map((freelancer) => {
                                                                    const freelancerId = freelancer.id || freelancer._id;
                                                                    if (!freelancerId) return null;
                                                                    const isSelected = formData.assignedFreelancers?.includes(freelancerId);
                                                                    return (
                                                                        <div
                                                                            key={freelancerId}
                                                                            className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                                                                            onClick={() => toggleFreelancerSelection(freelancerId)}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                                                                    isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                                                }`}>
                                                                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium text-sm">{freelancer.name || 'Unknown'}</p>
                                                                                    <p className="text-xs text-muted-foreground">{freelancer.email}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Select at least one freelancer to participate in the multi-speaker session
                                        </p>
                                        {formData.type === 'multi' && (!formData.assignedFreelancers || formData.assignedFreelancers.length === 0) && (
                                            <p className="text-sm text-amber-600">
                                                ⚠️ At least one freelancer must be assigned for multi-speaker tasks
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Language and Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="language" className="text-base font-medium">Language *</Label>
                                        <Select
                                            value={formData.language}
                                            onValueChange={handleSelectChange('language')}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.language && (
                                            <p className="text-sm text-red-600">{errors.language}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="price" className="text-base font-medium">Compensation ({CURRENCY_SYMBOL}) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="1"
                                            placeholder="0"
                                            value={formData.price}
                                            onChange={(e) => setValue('price', e.target.value)}
                                            disabled={isLoading}
                                        />
                                        {errors.price && (
                                            <p className="text-sm text-red-600">{errors.price}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-3 border-t flex-shrink-0">
                                {/* Secondary Actions - Left Side */}
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        disabled={isLoading}
                                        size="default"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-0.5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                        size="default"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-0.5" />
                                        Reset
                                    </Button>
                                </div>

                                {/* Primary Action - Right Side */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !isValid}
                                    size="default"
                                    className="min-w-[140px]"
                                >
                                    <Plus className="h-4 w-4 mr-0.5" />
                                    {isLoading ? 'Creating...' : 'Create Task'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="max-h-[90vh] flex flex-col">
                    <AlertDialogHeader className="flex-shrink-0">
                        <AlertDialogTitle>Confirm Audio Recording Task Creation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please review the task details before creating:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 my-4 flex-1 overflow-y-auto pr-2 min-h-0">
                        <div className="flex justify-between">
                            <span className="font-medium">Title:</span>
                            <span className="text-right">{formData.title}</span>
                        </div>
                        {formData.description && (
                            <div className="flex justify-between">
                                <span className="font-medium">Description:</span>
                                <span className="text-right text-sm">{formData.description}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="font-medium">Task Type:</span>
                            <span className="capitalize text-right">
                                {formData.type === 'single' ? 'Single Speaker' : 'Multi Speaker'}
                            </span>
                        </div>
                        {formData.type === 'multi' && formData.assignedFreelancers && formData.assignedFreelancers.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Assigned Freelancers:</span>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.assignedFreelancers.length} freelancer{formData.assignedFreelancers.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 bg-muted/30">
                                    <ul className="space-y-1 text-sm">
                                        {formData.assignedFreelancers.map((freelancerId) => {
                                            const freelancer = availableFreelancers.find(f => (f.id || f._id) === freelancerId);
                                            return (
                                                <li key={freelancerId} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span>{freelancer?.name || freelancer?.email || freelancerId}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="font-medium">Language:</span>
                            <span className="capitalize text-right">
                                {LANGUAGE_OPTIONS.find(opt => opt.value === formData.language)?.label || formData.language}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Compensation:</span>
                            <span className="text-right">{CURRENCY_SYMBOL}{parseInt(formData.price || '0').toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Text Files:</span>
                                <span className="text-sm text-muted-foreground">
                                    {formData.audioFiles?.length || 0} file{formData.audioFiles?.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto border rounded-md p-2 bg-muted/30">
                                <ul className="space-y-1 text-sm">
                                    {formData.audioFiles?.map((f: File, i: number) => (
                                        <li key={i} className="flex justify-between items-center py-1 px-2 rounded hover:bg-muted/50">
                                            <span className="truncate flex-1 mr-2">{f.name}</span>
                                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                                                {(f.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex-shrink-0 mt-4">
                        <AlertDialogCancel disabled={isLoading}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCreate}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4 mr-0.5" />
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}
