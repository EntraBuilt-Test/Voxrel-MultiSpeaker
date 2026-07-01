import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from 'react';

import { Button } from "@/components/ui/button.ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.ui";
import { Label } from "@/components/ui/label.ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.ui";
import { projectService } from "@/services/project.service";
import { Project } from "@/types";

interface SpawnTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
    onSuccess: () => void;
    showError: (msg: string) => void;
    showSuccess: (msg: string) => void;
}

export function SpawnTaskModal({ isOpen, onClose, taskId, taskTitle, onSuccess, showError, showSuccess }: SpawnTaskModalProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProjects = React.useCallback(async () => {
        setIsLoadingProjects(true);
        try {
            const res = await projectService.getProjects();
            if (res.success && res.data?.projects) {
                // Filter for Transcription projects
                const transcriptionProjects = res.data.projects.filter((p: Project) => p.type === 'TRANSCRIPTION' && p.status === 'ACTIVE');
                setProjects(transcriptionProjects);
            }
        } catch (error) {
            console.error(error);
            showError("Failed to fetch projects");
        } finally {
            setIsLoadingProjects(false);
        }
    }, [showError]);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen, fetchProjects]);

    const handleSpawn = async () => {
        if (!selectedProjectId) {
            showError("Please select a target project");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await projectService.spawnTaskToProject(taskId, selectedProjectId);
            if (res.success) {
                showSuccess("Task spawned successfully");
                onSuccess();
                onClose();
            } else {
                showError(res.message || "Failed to spawn task");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to spawn task";
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Spawn Task to Transcription</DialogTitle>
                    <DialogDescription>
                        Create a transcription task from: <br />
                        <span className="font-semibold text-foreground">{taskTitle}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project">Target Project</Label>
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a transcription project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.length === 0 && !isLoadingProjects && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No active transcription projects found</div>
                                )}
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id || ''}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isLoadingProjects && <p className="text-xs text-muted-foreground">Loading projects...</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSpawn} disabled={isSubmitting || !selectedProjectId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Spawn Task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
