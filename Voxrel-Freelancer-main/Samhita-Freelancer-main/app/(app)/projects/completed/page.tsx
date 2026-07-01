"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { ProjectList } from "@/components/projects/project-list";
import { useProjectStore } from "@/stores";
import { Project } from "@/types";



export default function CompletedProjectsPage() {
    const router = useRouter();
    const { projects, isLoading, error, fetchProjects, selectProject } = useProjectStore();

    useEffect(() => {
        fetchProjects().catch((err) => {
            toast.error(err.message || "Failed to load projects");
        });
    }, [fetchProjects]);

    const handleSelectProject = async (project: Project) => {
        try {
            selectProject(project);

            switch (project.type) {
                case "AUDIO_RECORDING":
                    router.push(`/projects/${project.id}/recording`);
                    break;
                case "TRANSCRIPTION":
                    router.push(`/projects/${project.id}/transcription`);
                    break;
                case "REVIEW":
                    router.push(`/projects/${project.id}/review`);
                    break;
                case "FUTURE":
                    router.push(`/projects/${project.id}/workflow`);
                    break;
                default:
                    router.push(`/projects/${project.id}`);
            }
        } catch {
            toast.error("Failed to select project");
        }
    };

    // Filter for completed/archived projects
    const completedProjects = projects.filter(p => p.status === 'ARCHIVED' || p.status === 'INACTIVE');

    return (
        <ProjectList
            projects={completedProjects}
            isLoading={isLoading}
            error={error}
            onRetry={fetchProjects}
            onSelect={handleSelectProject}
            title="Completed Projects"
            description="View your past projects"
            emptyMessage="No completed projects found."
        />
    );
}
