"use client";

import {
  Mic,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Settings,
  Users,
  Key,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge.ui";
import { Button } from "@/components/ui/button.ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.ui";
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
import { projectService } from "@/services/project.service";
import { useProjectStore } from "@/stores";
import { Project, ProjectType } from "@/types";

const projectTypeConfig: Record<ProjectType, { icon: React.ElementType; label: string; description: string; color: string }> = {
  AUDIO_RECORDING: {
    icon: Mic,
    label: "Audio Recording",
    description: "Manage audio recording projects",
    color: "bg-blue-500",
  },
  TRANSCRIPTION: {
    icon: FileText,
    label: "Transcription",
    description: "Manage transcription projects",
    color: "bg-green-500",
  },
  REVIEW: {
    icon: CheckCircle2,
    label: "Review",
    description: "Manage review projects",
    color: "bg-purple-500",
  },
  IMAGE_ANNOTATION: {
    icon: ImageIcon,
    label: "Image Annotation",
    description: "Manage image annotation projects",
    color: "bg-orange-500",
  },
  VIDEO_ANNOTATION: {
    icon: Video,
    label: "Video Annotation",
    description: "Manage video annotation projects",
    color: "bg-red-500",
  },
};

export default function PlatformAdminProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, error, fetchProjects, createProject, selectProject } = useProjectStore();
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    type: "AUDIO_RECORDING" as ProjectType,
    supportedLanguages: [] as string[],
  });
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState<string>("");

  useEffect(() => {
    fetchProjects().catch((err) => {
      toast.error(err.message || "Failed to load projects");
    });
  }, [fetchProjects]);

  useEffect(() => {
    if (newProject.type === "REVIEW" && showCreateDialog) {
      const loadAvailable = async () => {
        setIsLoadingAvailable(true);
        try {
          const res = await projectService.getProjectsNotAssignedForReview();
          setAvailableProjects(res.data.projects);
        } catch {
          toast.error("Failed to load available projects for review");
        } finally {
          setIsLoadingAvailable(false);
        }
      };
      loadAvailable();
    }
  }, [newProject.type, showCreateDialog]);

  const handleSelectProject = async (project: Project) => {
    setIsSelecting(true);
    try {
      selectProject(project);

      // Navigate to project-specific admin dashboard
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
        default:
          router.push(`/projects/${project.id}`);
      }
    } catch {
      toast.error("Failed to select project");
      setIsSelecting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (newProject.type === "IMAGE_ANNOTATION" || newProject.type === "VIDEO_ANNOTATION") {
      toast.error("This feature will be implemented soon.");
      return;
    }

    if (newProject.type === "REVIEW" && !sourceProjectId) {
      toast.error("Please select a source project to review");
      return;
    }

    setIsCreating(true);
    try {
      let metadata = {};

      if (newProject.type === "REVIEW") {
        const sourceProject = availableProjects.find(p => (p.id || p._id) === sourceProjectId);
        if (sourceProject) {
          metadata = {
            originalProjectId: sourceProjectId,
            originalProjectType: sourceProject.type,
          };
        }
      }

      await createProject({
        ...newProject,
        metadata,
      });

      toast.success("Project created successfully");
      setShowCreateDialog(false);
      setNewProject({
        name: "",
        description: "",
        type: "AUDIO_RECORDING",
        supportedLanguages: [],
      });
      setSourceProjectId("");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const getProjectTypeConfig = (type: ProjectType) => {
    return projectTypeConfig[type] || projectTypeConfig.AUDIO_RECORDING;
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage all projects, assign admins, and track platform-wide metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project. New project types may require additional feature development.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Project Type *</Label>
                  <Select
                    value={newProject.type}
                    onValueChange={(value) => {
                      setNewProject({ ...newProject, type: value as ProjectType });
                      // Reset source project when type changes
                      if (value !== "REVIEW") {
                        setSourceProjectId("");
                      }
                    }}
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
                    <Label htmlFor="sourceProject">Source Project *</Label>
                    <Select
                      value={sourceProjectId}
                      onValueChange={setSourceProjectId}
                      disabled={isLoadingAvailable}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project to review" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((p) => (
                          <SelectItem key={p.id || p._id} value={p.id || p._id || ""}>
                            {p.name} ({p.type.replace("_", " ")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingAvailable && <p className="text-xs text-muted-foreground mt-1">Loading projects...</p>}
                    {!isLoadingAvailable && availableProjects.length === 0 && (
                      <p className="text-xs text-destructive mt-1">No eligible projects found for review assignment.</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProject.name.trim() || (newProject.type === "REVIEW" && !sourceProjectId)}
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
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage users and admins</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Password Recovery</CardTitle>
            <CardDescription>Recover admin or user passwords</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Key className="mr-2 h-4 w-4" />
              Recover Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Tracking</CardTitle>
            <CardDescription>Track costs and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              View Tracking
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Projects</CardTitle>
            <CardDescription>All projects on platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-semibold">All Projects</h2>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No projects created yet. Create your first project to get started.
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
                className="hover:shadow-lg transition-shadow"
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
                  {project.admins && project.admins.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Assigned Admins:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.admins.slice(0, 2).map((admin) => (
                          <Badge key={admin.id || admin._id} variant="outline" className="text-xs">
                            {admin.name}
                          </Badge>
                        ))}
                        {project.admins.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.admins.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={isSelecting}
                      onClick={() => handleSelectProject(project)}
                    >
                      {isSelecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        "Manage"
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
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
