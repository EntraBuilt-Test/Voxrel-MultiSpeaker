'use client';

// REVIEW PROJECT TASK CREATION
// Component for Review project task creation

import { RotateCcw, ArrowLeft, Plus } from 'lucide-react';
import React from 'react';

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
import { Badge } from '@/components/ui/badge.ui';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { Textarea } from '@/components/ui/textarea.ui';
import { useReviewTaskCreation } from '@/mixins/task/review-task-creation.mixin';
import { Task } from '@/types';

interface ReviewTaskFormProps {
    projectId: string;
}

export default function ReviewTaskForm({ projectId }: ReviewTaskFormProps) {
    const {
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
        handleSubmit,
        handleReset,

        // Submission
        handleConfirmCreate,
    } = useReviewTaskCreation(projectId);

    const getTaskId = (task: Task): string => {
        return task._id || task.id || '';
    };

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Review Task</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create a review task from a submitted task in the original project
                    </p>
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
                                    <Label htmlFor="title" className="text-base font-medium">Review Task Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter review task title..."
                                        value={formData.title}
                                        onChange={(e) => handleFieldChange('title')(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                {/* Task Type */}


                                {/* Source Task Selection */}
                                <div className="space-y-1">
                                    <Label htmlFor="sourceTaskId" className="text-base font-medium">Source Task *</Label>
                                    {isLoadingTasks ? (
                                        <div className="text-sm text-muted-foreground">Loading submitted tasks...</div>
                                    ) : eligibleTasks.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                            No submitted tasks available for review from the original project. Tasks must be submitted in the original project first.
                                        </div>
                                    ) : (
                                        <>
                                            <Select
                                                value={formData.sourceTaskId}
                                                onValueChange={handleSelectChange('sourceTaskId')}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a submitted task to review" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eligibleTasks.map((task) => {
                                                        const taskId = getTaskId(task);
                                                        return (
                                                            <SelectItem key={taskId} value={taskId}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{task.title}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {task.language} • {task.status}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {errors.sourceTaskId && (
                                                <p className="text-sm text-red-600">{errors.sourceTaskId}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Selected Source Task Details */}
                                {selectedSourceTask && (
                                    <div className="p-3 border rounded-md bg-muted/30 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Source Task Details:</span>
                                            <Badge variant="outline">{selectedSourceTask.status}</Badge>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div><span className="font-medium">Title:</span> {selectedSourceTask.title}</div>
                                            <div><span className="font-medium">Language:</span> {selectedSourceTask.language}</div>
                                            {selectedSourceTask.description && (
                                                <div><span className="font-medium">Description:</span> {selectedSourceTask.description}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Instructions for Reviewer */}
                                <div className="space-y-1">
                                    <Label htmlFor="instructions" className="text-base font-medium">Instructions for Reviewer</Label>
                                    <Textarea
                                        id="instructions"
                                        placeholder="Enter specific instructions for the reviewer..."
                                        value={formData.instructions}
                                        onChange={(e) => handleFieldChange('instructions')(e.target.value)}
                                        disabled={isLoading}
                                        rows={4}
                                    />
                                    {errors.instructions && (
                                        <p className="text-sm text-red-600">{errors.instructions}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Optional: Provide specific guidelines or requirements for reviewing this task
                                    </p>
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
                                    disabled={isLoading || !isValid || eligibleTasks.length === 0}
                                    size="default"
                                    className="min-w-[140px]"
                                >
                                    <Plus className="h-4 w-4 mr-0.5" />
                                    {isLoading ? 'Creating...' : 'Create Review Task'}
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
                        <AlertDialogTitle>Confirm Review Task Creation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please review the task details before creating:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 my-4 flex-1 overflow-y-auto pr-2 min-h-0">
                        <div className="flex justify-between">
                            <span className="font-medium">Review Task Title:</span>
                            <span className="text-right">{formData.title}</span>
                        </div>

                        {selectedSourceTask && (
                            <>
                                <div className="flex justify-between">
                                    <span className="font-medium">Source Task:</span>
                                    <span className="text-right">{selectedSourceTask.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Source Language:</span>
                                    <span className="text-right">{selectedSourceTask.language}</span>
                                </div>
                            </>
                        )}
                        {formData.instructions && (
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">Instructions:</span>
                                <span className="text-sm text-muted-foreground">{formData.instructions}</span>
                            </div>
                        )}
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
                            {isLoading ? 'Creating...' : 'Create Review Task'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}
