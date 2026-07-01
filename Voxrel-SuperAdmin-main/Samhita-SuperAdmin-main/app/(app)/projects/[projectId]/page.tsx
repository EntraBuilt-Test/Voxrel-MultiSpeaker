"use client";

import {
    ChevronLeft,
    ListTodo,
    PlusCircle,
    Users,
    BarChart3,
    CheckCircle2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RoleGuard } from "@/components/auth/role.guard";
import { Badge } from "@/components/ui/badge.ui";
import { Button } from "@/components/ui/button.ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.ui";
import { useNotifications } from "@/hooks";
import { projectService } from "@/services/project.service";
import { Project } from "@/types";

export default function ProjectDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const { showError } = useNotifications();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!projectId) return;

            try {
                setIsLoading(true);
                const response = await projectService.getProjectById(projectId);
                if (response.success && response.data) {
                    setProject(response.data);
                } else {
                    showError("Failed to load project details");
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load project details";
                showError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectDetails();
    }, [projectId, showError]);

    const dashboardItems = [
        {
            title: "Task Management",
            description: "Manage, assign, and track tasks",
            icon: ListTodo,
            action: "Manage Tasks",
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            onClick: () => router.push(`/task/manage?projectId=${projectId}`)
        },
        {
            title: "Create Task",
            description: "Create new tasks for this project",
            icon: PlusCircle,
            action: "Create Task",
            color: "text-green-500",
            bgColor: "bg-green-50",
            onClick: () => router.push(`/task/create?projectId=${projectId}`)
        },
        {
            title: "Review Tasks",
            description: "Review submitted tasks",
            icon: CheckCircle2,
            action: "Review",
            color: "text-purple-500",
            bgColor: "bg-purple-50",
            onClick: () => router.push(`/task/review?projectId=${projectId}`)
        },
        {
            title: "Project Users",
            description: "Manage admins and users for this project",
            icon: Users,
            action: "Manage Users",
            color: "text-orange-500",
            bgColor: "bg-orange-50",
            onClick: () => router.push(`/user/manage?projectId=${projectId}`)
        },
        {
            title: "Analytics",
            description: "View project performance and stats",
            icon: BarChart3,
            action: "View Analytics",
            color: "text-indigo-500",
            bgColor: "bg-indigo-50",
            onClick: () => router.push(`/task/analytic?projectId=${projectId}`)
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-muted-foreground">Loading project details...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="text-muted-foreground">Project not found</div>
                <Button onClick={() => router.push('/super-admin')}>Go Back</Button>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/super-admin')}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                            <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {project.status}
                            </Badge>
                            <Badge variant="outline">{project.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Project Dashboard
                        </p>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardItems.map((item, index) => (
                        <Card
                            key={index}
                            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                            style={{
                                borderLeftColor: item.color.includes('blue') ? '#3b82f6' :
                                    item.color.includes('green') ? '#22c55e' :
                                        item.color.includes('purple') ? '#a855f7' :
                                            item.color.includes('orange') ? '#f97316' :
                                                item.color.includes('indigo') ? '#6366f1' : '#6b7280'
                            }}
                            onClick={item.onClick}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    {item.description}
                                </CardDescription>
                                <Button variant="outline" className="w-full justify-between group">
                                    {item.action}
                                    <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </RoleGuard>
    );
}
