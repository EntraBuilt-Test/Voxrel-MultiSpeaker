'use client';

// TRANSCRIPTION PROJECT TASK CREATION
// This component is for Transcription project task creation (existing implementation)
// DO NOT MODIFY - This is the reference implementation

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
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Dropzone } from '@/components/ui/dropzone.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { CURRENCY_SYMBOL, LANGUAGE_OPTIONS } from '@/constants/options.constants';
import { useTaskCreation } from '@/mixins/task';

interface TranscriptionTaskFormProps {
    projectId: string;
}

export default function TranscriptionTaskForm({ projectId }: TranscriptionTaskFormProps) {
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
    } = useTaskCreation(projectId);

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Transcription Task</h1>
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

                                {/* Audio Files Upload */}
                                <div className="space-y-1">
                                    <Label className="text-base font-medium">Audio Files *</Label>
                                    <Dropzone
                                        onFilesChange={handleFileChange}
                                        accept="audio/*"
                                        maxFiles={100}
                                        disabled={isLoading}
                                        clearFiles={clearDropzone}
                                    />
                                </div>

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
                                        <Label htmlFor="price" className="text-base font-medium">Price ({CURRENCY_SYMBOL}) *</Label>
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
                        <AlertDialogTitle>Confirm Task Creation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please review the task details before creating:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 my-4 flex-1 overflow-y-auto pr-2 min-h-0">
                        <div className="flex justify-between">
                            <span className="font-medium">Title:</span>
                            <span className="text-right">{formData.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Language:</span>
                            <span className="capitalize text-right">
                                {LANGUAGE_OPTIONS.find(opt => opt.value === formData.language)?.label || formData.language}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Price:</span>
                            <span className="text-right">{CURRENCY_SYMBOL}{parseInt(formData.price || '0').toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Audio Files:</span>
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
