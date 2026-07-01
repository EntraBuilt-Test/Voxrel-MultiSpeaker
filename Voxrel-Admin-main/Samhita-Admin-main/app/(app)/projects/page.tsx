"use client";

import {
  Mic,
  FileText,
  CheckCircle2,
  FolderKanban,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/stores";
import { Project, ProjectType } from "@/types";


const projectTypeConfig: Record<ProjectType, { icon: any; label: string; description: string; color: string }> = {
  AUDIO_RECORDING: {
    icon: Mic,
    label: "Audio Recording",
    description: "Manage audio recording tasks and assignments",
    color: "bg-blue-500",
  },
  TRANSCRIPTION: {
    icon: FileText,
    label: "Transcription",
    description: "Manage transcription tasks and assignments",
    color: "bg-green-500",
  },
  REVIEW: {
    icon: CheckCircle2,
    label: "Review",
    description: "Manage review tasks and assignments",
    color: "bg-purple-500",
  },
  FUTURE: {
    icon: FolderKanban,
    label: "Custom Workflow",
    description: "Custom workflow interface",
    color: "bg-gray-500",
  },
};

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, error, fetchProjects, selectProject } = useProjectStore();
  const [selectingProjectId, setSelectingProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects().catch((err) => {
      toast.error(err.message || "Failed to load projects");
    });
  }, [fetchProjects]);

  const handleSelectProject = async (project: Project) => {
    const projectId = project.id || project._id;
    if (!projectId) return;
    setSelectingProjectId(projectId);
    try {
      selectProject(project);

      // Navigate to Manage Tasks page with projectId
      router.push(`/task/manage?projectId=${projectId}`);
    } catch {
      toast.error("Failed to select project");
      setSelectingProjectId(null);
    }
  };

  const getProjectTypeConfig = (type: ProjectType) => {
    return projectTypeConfig[type] || projectTypeConfig.FUTURE;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load projects</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => fetchProjects()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select a Project</h1>
        <p className="text-muted-foreground">
          Choose a project to manage tasks, users, and assignments
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No projects available. Please contact Platform Admin to be assigned to a project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const config = getProjectTypeConfig(project.type);
            const Icon = config.icon;

            return (
              <Card
                key={project.id || project._id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => selectingProjectId !== (project.id || project._id) && handleSelectProject(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge
                      variant={project.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription>{config.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description || config.description}
                  </p>
                  {project.supportedLanguages && project.supportedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.supportedLanguages.slice(0, 3).map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                      {project.supportedLanguages.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.supportedLanguages.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={(selectingProjectId !== null && selectingProjectId === (project.id || project._id)) || project.status !== "ACTIVE"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProject(project);
                      }}
                    >
                      {selectingProjectId === (project.id || project._id) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        "Manage Project"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

