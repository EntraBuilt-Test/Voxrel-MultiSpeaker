"use client";

// SUPER ADMIN EXTENSION: Create Project Page
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { RoleGuard } from "@/components/auth/role.guard";
import { NotificationToast } from "@/components/shared";
import { Button } from "@/components/ui/button.ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.ui";
import { Textarea } from "@/components/ui/textarea.ui";
import { useNotifications } from "@/hooks";
import { projectService } from "@/services/project.service";
import { useProjectStore } from "@/stores";
import { ProjectType, Project } from "@/types";

export default function SuperAdminCreateProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const { notifications, showSuccess, showError, dismiss } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    type: "AUDIO_RECORDING" as ProjectType,
    supportedLanguages: [] as string[],
    originalProjectId: "" as string | undefined,
  });
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch available projects when type is REVIEW
  useEffect(() => {
    const fetchAvailableProjects = async () => {
      if (newProject.type === "REVIEW") {
        setIsLoadingProjects(true);
        try {
          const response = await projectService.getProjectsNotAssignedForReview();
          if (response.success && response.data.projects) {
            setAvailableProjects(response.data.projects);
          }
        } catch (error) {
          console.error("Failed to fetch available projects:", error);
          showError("Failed to load available projects");
        } finally {
          setIsLoadingProjects(false);
        }
      } else {
        setAvailableProjects([]);
        setNewProject(prev => ({ ...prev, originalProjectId: undefined }));
      }
    };

    fetchAvailableProjects();
  }, [newProject.type, showError]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      showError("Project name is required");
      return;
    }

    if (newProject.type === "IMAGE_ANNOTATION" || newProject.type === "VIDEO_ANNOTATION") {
      showError("This feature will be implemented soon.");
      return;
    }

    if (newProject.type === "REVIEW" && !newProject.originalProjectId) {
      showError("Please select an original project for this review project");
      return;
    }

    setIsCreating(true);
    try {
      // Prepare project data with metadata for REVIEW projects
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        type: newProject.type,
        supportedLanguages: newProject.supportedLanguages,
        metadata: (newProject.type === "REVIEW" && newProject.originalProjectId)
          ? { originalProjectId: newProject.originalProjectId }
          : undefined
      };

      await createProject(projectData);
      showSuccess("Project created successfully");
      // Redirect back to Super Admin landing page
      router.push('/super-admin');
    } catch {
      showError("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/super-admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create Project</h1>
          <p className="text-muted-foreground">
            Create a new project with custom settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Fill in the details to create a new project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="type">Project Type *</Label>
                <Select
                  value={newProject.type}
                  onValueChange={(value) => setNewProject({ ...newProject, type: value as ProjectType, originalProjectId: undefined })}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUDIO_RECORDING">Audio Recording</SelectItem>
                    <SelectItem value="TRANSCRIPTION">Transcription</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="IMAGE_ANNOTATION">Image Annotation</SelectItem>
                    <SelectItem value="VIDEO_ANNOTATION">Video Annotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newProject.type === "REVIEW" && (
                <div>
                  <Label htmlFor="originalProject">Original Project *</Label>
                  {isLoadingProjects ? (
                    <div className="flex items-center gap-2 p-4 border rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading available projects...</span>
                    </div>
                  ) : availableProjects.length > 0 ? (
                    <Select
                      value={newProject.originalProjectId || ""}
                      onValueChange={(value) => setNewProject({ ...newProject, originalProjectId: value })}
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an original project" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project._id || project.id} value={project._id || project.id}>
                            {project.name} ({project.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        No projects available for review. All existing projects have already been assigned for review.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the original project that this review project will be associated with
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/super-admin')}
                  disabled={isCreating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProject.name.trim() || (newProject.type === "REVIEW" && !newProject.originalProjectId)}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Toast */}
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
      </div>
    </RoleGuard>
  );
}
