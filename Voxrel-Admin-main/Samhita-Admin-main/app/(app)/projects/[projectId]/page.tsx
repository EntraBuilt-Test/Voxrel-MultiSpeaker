"use client";

import { Loader2, Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar.ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import projectService from "@/services/project.service";
import { Project } from "@/types";


export default function ProjectDetailsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("users"); // Default to users as per user focus, or overview. Let's make 'users' default if requests exist? No, 'overview' is standard. But user asked for this feature, maybe 'users' for now? I'll stick to 'overview' as first tab usually.

    const fetchProject = useCallback(async () => {
        try {
            const res = await projectService.getProject(projectId);
            setProject(res.data);
        } catch {
            toast.error("Failed to load project details");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) fetchProject();
    }, [projectId, fetchProject]);

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            await projectService.approveJoinRequest(projectId, userId);
            toast.success("User approved");
            fetchProject();
        } catch {
            toast.error("Failed to approve user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string) => {
        setActionLoading(userId);
        try {
            await projectService.rejectJoinRequest(projectId, userId);
            toast.success("Request rejected");
            fetchProject();
        } catch {
            toast.error("Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    const pendingRequests = project.joinRequests || [];
    const activeMembers = project.users || [];

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.description}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {project.status}
                    </Badge>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="border-b">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'}
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`${activeTab === 'users'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'}
                        whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        User Management
                    </button>
                </nav>
            </div>

            <div className="py-4">
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{project.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Members</span>
                                    <span className="font-medium">{project.users?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Admins</span>
                                    <span className="font-medium">{project.admins?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pending Requests</span>
                                    <span className="font-medium">{pendingRequests.length}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Claims ({pendingRequests.length})</CardTitle>
                                <CardDescription>
                                    Freelancers who have requested to join this project.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pendingRequests.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No pending claims.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRequests.map((user: any) => (
                                            <div key={user._id || user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleApprove(user._id || user.id)}
                                                        disabled={actionLoading === (user._id || user.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleReject(user._id || user.id)}
                                                        disabled={actionLoading === (user._id || user.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Members ({activeMembers.length})</CardTitle>
                                <CardDescription>Users currently working on this project.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activeMembers.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No active members.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {activeMembers.map((user: any) => (
                                            <div key={user._id || user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
