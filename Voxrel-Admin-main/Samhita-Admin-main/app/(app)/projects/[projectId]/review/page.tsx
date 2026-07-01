"use client";

import { CheckCircle2, ArrowLeft, Plus, Users, Loader2, FileText, Mic } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectService } from "@/services/project.service";
import { useProjectStore } from "@/stores";
import { Task } from "@/types";


export default function ReviewAdminDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { selectedProject } = useProjectStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await projectService.getProjectTasks(projectId, 1, 50, {
        status: "IN_REVIEW",
      });
      setTasks(response.data.tasks);
    } catch {
      toast.error("Failed to load review tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/projects")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Review Dashboard</h1>
            <p className="text-muted-foreground">
              {selectedProject?.name || "Review Project"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Review Task</CardTitle>
            <CardDescription>Create review tasks from completed work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                From Recording Task
              </Button>
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                From Uploaded Files
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage project users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/users`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Tasks</CardTitle>
          <CardDescription>Manage all review tasks in this project</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No review tasks available. Tasks from other projects will appear here when moved for review.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id || task._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {task.audioUrl ? (
                        <Mic className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold">{task.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{task.status}</Badge>
                      <Badge variant="outline">{task.language}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

