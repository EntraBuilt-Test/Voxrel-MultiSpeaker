'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import AudioRecordingTaskForm from '@/components/task-forms/audio-recording-task-form.component';
import ReviewTaskForm from '@/components/task-forms/review-task-form.component';
import TranscriptionTaskForm from '@/components/task-forms/transcription-task-form.component';
import { useProjectStore } from '@/stores';
import { ProjectType } from '@/types';

export default function CreateTaskPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId') || undefined;
    const { getProjectById, projects, fetchProjects } = useProjectStore();
    const [projectType, setProjectType] = useState<ProjectType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch project type from projectId
    useEffect(() => {
        const loadProject = async () => {
            if (!projectId) {
                setIsLoading(false);
                return;
            }

            // If projects not loaded, fetch them
            if (projects.length === 0) {
                try {
                    await fetchProjects();
                } catch (error) {
                    console.error('Failed to fetch projects:', error);
                    setIsLoading(false);
                    return;
                }
            }

            // Get project by ID
            const project = getProjectById(projectId);
            if (project) {
                setProjectType(project.type);
            } else {
                // If project not found in store, try to fetch it
                // For now, redirect back if project not found
                router.push('/projects');
            }
            setIsLoading(false);
        };

        loadProject();
    }, [projectId, projects, getProjectById, fetchProjects, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // If no projectId, redirect to projects page
    if (!projectId) {
        router.push('/projects');
        return null;
    }

    // Render appropriate form based on project type
    switch (projectType) {
        case 'TRANSCRIPTION':
            return <TranscriptionTaskForm projectId={projectId} />;
        case 'AUDIO_RECORDING':
            return <AudioRecordingTaskForm projectId={projectId} />;
        case 'REVIEW':
            return <ReviewTaskForm projectId={projectId} />;
        default:
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-muted-foreground">Project type not supported for task creation.</p>
                    </div>
                </div>
            );
    }
}