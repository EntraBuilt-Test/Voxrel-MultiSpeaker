"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { ProjectList } from "@/components/projects/project-list";
import projectService from "@/services/project.service";
import { useProjectStore, useUserStore } from "@/stores";
import { Project } from "@/types";

export default function AvailableProjectsPage() {
    const router = useRouter();
    const { projects, isLoading, error, fetchProjects, selectProject } = useProjectStore();
    const { user } = useUserStore();

    useEffect(() => {
        fetchProjects().catch((err) => {
            toast.error(err.message || "Failed to load projects");
        });
    }, [fetchProjects]);

    const handleSelectProject = async (project: Project) => {
        try {
            selectProject(project);

            // Navigate to project-specific dashboard - ALL projects now go to tasks view first
            // The query param ensures the target page knows which project context to load if store is empty
            router.push(`/tasks/available?projectId=${project.id || project._id}`);
        } catch {
            toast.error("Failed to select project");
        }
    };

    const handleRequestJoin = async (project: Project) => {
        try {
            await projectService.requestToJoinProject(project.id || project._id!);
            toast.success("Request sent successfully");
            await fetchProjects();
        } catch (error: any) {
            toast.error(error.message || "Failed to send request");
        }
    };

    return (
        <ProjectList
            projects={projects}
            isLoading={isLoading}
            error={error}
            onRetry={fetchProjects}
            onSelect={handleSelectProject}
            currentUserId={user?.id || user?._id}
            onRequestJoin={handleRequestJoin}
            title="Available Projects"
            description="Choose a project to start working on tasks"
            emptyMessage="No available projects found. Please contact an administrator."
        />
    );
}
