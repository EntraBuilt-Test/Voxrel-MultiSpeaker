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
    const projectId = searchParams.get('projectId');

    const { getProjectById, projects, fetchProjects, isLoading: isStoreLoading } = useProjectStore();
    const [projectType, setProjectType] = useState<ProjectType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch project type from projectId
    useEffect(() => {
        const loadProject = async () => {
            if (!projectId) {
                setIsLoading(false);
                return;
            }

            // If projects not loaded (or store empty), fetch them
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
                // If project not found in store after fetch, redirect
                // But first check if fetchProjects is actually happening async
                // Assuming await fetchProjects() completes, project should be there if valid
                router.push('/projects');
            }
            setIsLoading(false);
        };

        loadProject();
    }, [projectId, projects.length, getProjectById, fetchProjects, router]);

    // Show loading state
    if (isLoading || isStoreLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // If no projectId, redirect handled in useEffect, but safe return here
    if (!projectId) {
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
                        <p className="text-muted-foreground">Project type &quot;{projectType}&quot; not supported for task creation.</p>
                        <p className="text-sm text-muted-foreground mt-2">Supported types: TRANSCRIPTION, AUDIO_RECORDING, REVIEW</p>
                    </div>
                </div>
            );
    }
}