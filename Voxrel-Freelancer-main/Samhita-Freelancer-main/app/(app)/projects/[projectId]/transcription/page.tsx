"use client";

import { FileText, ArrowLeft, Search, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { projectService } from "@/services/project.service";
import { useProjectStore } from "@/stores";
import { Task } from "@/types";


export default function TranscriptionDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { selectedProject } = useProjectStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await projectService.getProjectTasks(projectId, 1, 50);
      setTasks(response.data.tasks);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      OPEN: "default",
      ASSIGNED: "secondary",
      SUBMITTED: "outline",
      COMPLETED: "default",
    };
    return variants[status] || "outline";
  };

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
          <div className="p-2 rounded-lg bg-green-500 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Transcription Dashboard</h1>
            <p className="text-muted-foreground">
              {selectedProject?.name || "Transcription Project"}
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "OPEN" ? "default" : "outline"}
                onClick={() => setFilterStatus("OPEN")}
              >
                Available
              </Button>
              <Button
                variant={filterStatus === "ASSIGNED" ? "default" : "outline"}
                onClick={() => setFilterStatus("ASSIGNED")}
              >
                My Tasks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "No tasks match your filters"
                : "No tasks available in this project"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id || task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                  <Badge variant={getStatusBadge(task.status)}>{task.status}</Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {task.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Language:</span>
                    <Badge variant="outline">{task.language}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">₹{task.price}</span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Link href={`/workspace/${task.id || task._id}`}>
                    <Button className="w-full mt-4">
                      {task.status === "OPEN" ? "Claim Task" : "Continue Work"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

