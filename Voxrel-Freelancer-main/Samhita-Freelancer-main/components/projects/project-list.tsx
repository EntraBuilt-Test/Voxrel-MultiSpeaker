"use client";

import {
    Mic,
    FileText,
    CheckCircle2,
    FolderKanban,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, ProjectType } from "@/types";


const projectTypeConfig: Record<ProjectType, { icon: React.ComponentType<{ className?: string }>; label: string; description: string; color: string }> = {
    AUDIO_RECORDING: {
        icon: Mic,
        label: "Audio Recording",
        description: "Record audio content for transcription and analysis",
        color: "bg-blue-500",
    },
    TRANSCRIPTION: {
        icon: FileText,
        label: "Transcription",
        description: "Transcribe audio files into text",
        color: "bg-green-500",
    },
    REVIEW: {
        icon: CheckCircle2,
        label: "Review",
        description: "Review completed recordings and transcriptions",
        color: "bg-purple-500",
    },
    FUTURE: {
        icon: FolderKanban,
        label: "Custom Workflow",
        description: "Custom workflow interface",
        color: "bg-gray-500",
    },
};

interface ProjectListProps {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    onSelect: (project: Project) => void;
    currentUserId?: string;
    onRequestJoin?: (project: Project) => Promise<void>;
    title: string;
    description: string;
    emptyMessage: string;
}

export function ProjectList({
    projects,
    isLoading,
    error,
    onRetry,
    onSelect,
    currentUserId,
    onRequestJoin,
    title,
    description,
    emptyMessage
}: ProjectListProps) {
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [requestingId, setRequestingId] = useState<string | null>(null);

    const handleRequest = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (!onRequestJoin) return;
        const pid = project.id || project._id;
        if (!pid) return;

        setRequestingId(pid);
        try {
            await onRequestJoin(project);
        } finally {
            setRequestingId(null);
        }
    };

    const handleSelect = async (project: Project) => {
        const pid = project.id || project._id;
        if (!pid) return;
        
        setSelectingId(pid);
        try {
            await onSelect(project);
        } catch {
            // Error handled in parent or here
            setSelectingId(null);
        } finally {
            // We don't set false immediately if navigation is happening, but here we can
            // actually, the parent usually navigates away.
            // If navigation fails, we should reset.
            // But props.onSelect is async?
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
                <Button onClick={onRetry}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground">
                    {description}
                </p>
            </div>

            {projects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            {emptyMessage}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const config = getProjectTypeConfig(project.type);
                        const Icon = config.icon;
                        const pid = project.id || project._id;
                        
                        // Check if user is member (handle populated objects or ID strings)
                        const isMember = project.users?.some(u =>
                            (typeof u === 'string' ? u === currentUserId : (u.id === currentUserId || u._id === currentUserId))
                        );
                        const isPending = project.joinRequests?.includes(currentUserId || '');
                        
                        // Only allow card click for member projects
                        const canSelect = isMember && !selectingId && pid;

                        return (
                            <Card
                                key={pid}
                                className={`transition-shadow ${canSelect ? 'hover:shadow-lg cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                    if (canSelect) {
                                        handleSelect(project);
                                    }
                                }}
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
                                    {(() => {
                                        const isRequesting = requestingId === pid;

                                        if (isMember) {
                                            const isSelecting = selectingId === pid;
                                            return (
                                                <Button
                                                    className="w-full"
                                                    disabled={isSelecting || project.status !== "ACTIVE"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(project);
                                                    }}
                                                >
                                                    {isSelecting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Selecting...
                                                        </>
                                                    ) : (
                                                        "Enter Project"
                                                    )}
                                                </Button>
                                            );
                                        } else if (isPending) {
                                            return (
                                                <Button className="w-full" disabled variant="secondary">
                                                    Request Pending
                                                </Button>
                                            );
                                        } else {
                                            return (
                                                <Button
                                                    className="w-full"
                                                    variant="outline"
                                                    disabled={isRequesting || !onRequestJoin}
                                                    onClick={(e) => handleRequest(e, project)}
                                                >
                                                    {isRequesting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Request to Join"
                                                    )}
                                                </Button>
                                            );
                                        }
                                    })()}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
