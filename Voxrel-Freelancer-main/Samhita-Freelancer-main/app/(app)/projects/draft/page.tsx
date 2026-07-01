"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { ProjectList } from "@/components/projects/project-list";
import { useProjectStore } from "@/stores";
import { Project } from "@/types";



export default function MyProjectsPage() {
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

    // For now, assume all available projects are "My Projects" as we don't have user assignment logic 
    // or filter projects where user is assigned if we had that data.
    // Since we know the API returns empty anyway, this is just a placeholder logic.
    const myProjects = projects; // Filter logic would go here

    return (
        <ProjectList
            projects={myProjects}
            isLoading={isLoading}
            error={error}
            onRetry={fetchProjects}
            onSelect={handleSelectProject}
            title="My Projects"
            description="Projects you are currently working on"
            emptyMessage="You haven't joined any projects yet."
        />
    );
}
