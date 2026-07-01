'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Check, X, Download, Play, Pause, Volume2, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown, CopyPlus, UserPlus, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { NotificationToast, FilterBar } from '@/components/shared';
import { SpawnTaskModal } from '@/components/shared/spawn-task-modal.component';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog.ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.ui';
import { Badge } from '@/components/ui/badge.ui';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet.ui';
import { Textarea } from '@/components/ui/textarea.ui';
import { CURRENCY_SYMBOL, LANGUAGE_OPTIONS, PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_FILTERS } from '@/constants';
import { useNotifications } from '@/hooks/notifications.hook';
import { getProxiedMediaUrl } from '@/lib/media-proxy';
import { queryKeys } from '@/lib/query-client.lib';
import { useTaskManagement } from '@/mixins/task';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { Task } from '@/types';


export default function ManageTaskPage() {
    const {
        // State
        searchQuery,
        filterValues,
        sortField,
        sortOrder,
        currentPage,
        editFormData,
        setEditFormData,

        // Modals
        viewModal,
        editModal,

        // Data
        tasks,
        pagination,
        isLoading,

        // Notifications
        notifications: taskNotifications,
        dismiss: dismissTaskNotification,

        // Helper functions
        getTaskId,
        getClaimedByDisplay,
        capitalizeFirstLetter,
        getDisplayStatus,
        formatDate,
        getSortIcon,
        getVisiblePageNumbers,

        // Event handlers
        handleEditTask,
        handleViewTask,
        handleUpdateTask,
        handleDeleteTask,
        handleApproveTask,
        handleRejectTask,
        handleFilterChange,
        handleSearchChange,
        handleResetFilters,
        handleSort,

        // Setters
        setCurrentPage,
    } = useTaskManagement();

    // Local notifications
    const { notifications: localNotifications, showSuccess, showError, dismiss: dismissLocalNotification } = useNotifications();

    const notifications = [...taskNotifications, ...localNotifications];
    const dismiss = (id: string) => {
        dismissTaskNotification(id);
        dismissLocalNotification(id);
    };

    const [spawnModal, setSpawnModal] = useState<{ isOpen: boolean; task: Task | null }>({ isOpen: false, task: null });
    const queryClient = useQueryClient();

    const handleSpawnClick = (task: Task) => {
        setSpawnModal({ isOpen: true, task });
    };

    const handleSpawnClose = () => {
        setSpawnModal({ isOpen: false, task: null });
    };

    // Assign Freelancer Dialog State
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<Task | null>(null);
    const [projectFreelancers, setProjectFreelancers] = useState<Array<{ id?: string; _id?: string; name?: string; email?: string; stats?: { totalTasksCompleted?: number }; [key: string]: unknown }>>([]);
    const [isLoadingFreelancers, setIsLoadingFreelancers] = useState(false);
    const [assignActionLoading, setAssignActionLoading] = useState<string | null>(null);

    // Assign Freelancer Functions
    const openAssignDialog = React.useCallback(async (task: Task) => {
        setSelectedTaskForAssign(task);
        setIsAssignDialogOpen(true);
    }, []);

    const fetchProjectFreelancers = React.useCallback(async (taskProjectId: string) => {
        setIsLoadingFreelancers(true);
        try {
            const response = await projectService.getProjectUsers(taskProjectId, 1, 200);
            if (response.success && response.data) {
                setProjectFreelancers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch project freelancers:", error);
            toast.error("Failed to load freelancers");
        } finally {
            setIsLoadingFreelancers(false);
        }
    }, []);

    const handleAssignToFreelancer = React.useCallback(async (freelancerId: string) => {
        if (!selectedTaskForAssign) return;

        setAssignActionLoading(freelancerId);
        try {
            const taskId = getTaskId(selectedTaskForAssign);
            await taskService.updateTask(taskId, {
                claimedById: freelancerId,
                status: 'ASSIGNED'
            });
            toast.success("Task assigned to freelancer successfully");
            setIsAssignDialogOpen(false);
            // Invalidate tasks query to refresh the list
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        } catch (error: unknown) {
            console.error("Failed to assign task:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to assign task";
            toast.error(errorMessage);
        } finally {
            setAssignActionLoading(null);
        }
    }, [selectedTaskForAssign, getTaskId, queryClient]);

    // Fetch freelancers when dialog opens
    useEffect(() => {
        if (isAssignDialogOpen && selectedTaskForAssign?.projectId) {
            fetchProjectFreelancers(selectedTaskForAssign.projectId);
        }
    }, [isAssignDialogOpen, selectedTaskForAssign, fetchProjectFreelancers]);

    // Audio player state (UI only)
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

    // Initialize Audio on client side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setAudioRef(new Audio());
        }
    }, []);

    // Audio player functions (UI only)
    const formatTime = React.useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const handlePlayPause = React.useCallback((audioUrl: string) => {
        if (!audioRef) return;

        // Use proxied URL to avoid CORS issues
        const proxiedUrl = getProxiedMediaUrl(audioUrl) || audioUrl;

        if (audioRef.src !== proxiedUrl) {
            audioRef.src = proxiedUrl;
        }

        if (isPlaying) {
            audioRef.pause();
            setIsPlaying(false);
        } else {
            audioRef.play();
            setIsPlaying(true);
        }
    }, [audioRef, isPlaying]);

    const handleSeek = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        audioRef.currentTime = newTime;
        setCurrentTime(newTime);
    }, [audioRef, duration]);

    // Audio event listeners
    useEffect(() => {
        if (!audioRef) return;

        const audio = audioRef;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioRef]);

    // Create dynamic filters based on API data
    const getDynamicFilters = React.useCallback(() => {
        return TASK_FILTERS.map(filter => {
            switch (filter.key) {
                case 'status':
                    return {
                        ...filter,
                        options: [
                            { value: 'all', label: 'All Status' },
                            ...TASK_STATUS_OPTIONS.filter(opt => opt.value !== 'all')
                        ]
                    };
                case 'language':
                    return {
                        ...filter,
                        options: [
                            { value: 'all', label: 'All Languages' },
                            ...LANGUAGE_OPTIONS
                        ]
                    };
                default:
                    return filter;
            }
        });
    }, []);

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Filter Section */}
            <FilterBar
                searchQuery={searchQuery}
                onSearch={handleSearchChange}
                filters={getDynamicFilters()}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                searchPlaceholder="Search tasks..."
                resetLabel="Reset"
                showSort={false}
            />

            {/* Table Section */}
            <div className="flex-1 min-h-[calc(100vh-14rem)]">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-0 h-full flex flex-col">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">Loading tasks...</div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">
                                    {searchQuery || filterValues.status !== 'all' || filterValues.language !== 'all' || sortField !== 'createdAt' || sortOrder !== 'desc'
                                        ? 'No tasks match your filters'
                                        : 'No tasks found'
                                    }
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 relative">
                                <div className="absolute inset-0 overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort('status')}
                                                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        Status
                                                        {getSortIcon('status') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                                            getSortIcon('status') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                                                    </Button>
                                                </th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Language</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Claimed By</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort('createdAt')}
                                                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        Created At
                                                        {getSortIcon('createdAt') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                                            getSortIcon('createdAt') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                                                    </Button>
                                                </th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {tasks.map((task) => (
                                                <tr key={getTaskId(task)} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium max-w-[200px] truncate">
                                                        {task.title}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge
                                                            variant={
                                                                task.status === 'COMPLETED' ? 'default' :
                                                                    task.status === 'IN_REVIEW' ? 'secondary' :
                                                                        task.status === 'PENDING_APPROVAL' ? 'outline' :
                                                                            'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {getDisplayStatus(task.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm font-medium">
                                                            ₹{task.price.toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {capitalizeFirstLetter(task.language)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {getClaimedByDisplay(task.claimedById)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {task.createdAt ? formatDate(task.createdAt) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-48" align="end">
                                                                <div className="grid gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleViewTask(task)}
                                                                        className="justify-start h-8 px-2"
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEditTask(task)}
                                                                        className="justify-start h-8 px-2"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Button>
                                                                    {task.projectId && !task.claimedById && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openAssignDialog(task)}
                                                                            className="justify-start h-8 px-2 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                                                                        >
                                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                                            Assign to Freelancer
                                                                        </Button>
                                                                    )}
                                                                    {task.status === 'COMPLETED' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleSpawnClick(task)}
                                                                            className="justify-start h-8 px-2"
                                                                        >
                                                                            <CopyPlus className="mr-2 h-4 w-4" />
                                                                            Spawn
                                                                        </Button>
                                                                    )}
                                                                    {task.status === 'PENDING_APPROVAL' && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleApproveTask(getTaskId(task))}
                                                                                className="justify-start h-8 px-2 text-green-600 hover:text-green-600 hover:bg-green-50"
                                                                            >
                                                                                <Check className="mr-2 h-4 w-4" />
                                                                                Approve
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleRejectTask(getTaskId(task))}
                                                                                className="justify-start h-8 px-2 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                                                            >
                                                                                <X className="mr-2 h-4 w-4" />
                                                                                Reject
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure you want to delete this task? This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDeleteTask(getTaskId(task))}
                                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pagination Controls */}
            {pagination.totalTasks > 0 && (
                <div className="shrink-0">
                    <Card>
                        <CardContent className="px-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.totalTasks)} of {pagination.totalTasks} tasks
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newPage = Math.max(1, currentPage - 1);
                                            setCurrentPage(newPage);
                                        }}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {getVisiblePageNumbers().map((page) => (
                                            <Button
                                                key={page}
                                                variant={page === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                }}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newPage = Math.min(pagination.totalPages, currentPage + 1);
                                            setCurrentPage(newPage);
                                        }}
                                        disabled={currentPage === pagination.totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* View Task Sheet */}
            <Sheet open={viewModal.isOpen} onOpenChange={(open) => !open && viewModal.close()}>
                <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto max-h-screen">
                    <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
                        <SheetTitle className="text-lg font-semibold">{viewModal.selectedItem?.title}</SheetTitle>
                        <SheetDescription>
                            Task details and information
                        </SheetDescription>
                    </SheetHeader>
                    {viewModal.selectedItem && (
                        <div className="mt-6 space-y-6 pb-6">
                            <div className="space-y-4">
                                {/* Audio Player */}
                                {viewModal.selectedItem.audioUrl && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">Audio File</h4>
                                        <div className="space-y-3">
                                            {/* Custom Audio Player */}
                                            <div className="p-4 bg-card rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    {/* Play/Pause Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewModal.selectedItem?.audioUrl && handlePlayPause(viewModal.selectedItem.audioUrl)}
                                                        className="flex items-center justify-center w-10 h-10 rounded-full"
                                                        disabled={!audioRef}
                                                    >
                                                        {isPlaying ? (
                                                            <Pause className="h-4 w-4" />
                                                        ) : (
                                                            <Play className="h-4 w-4 ml-0.5" />
                                                        )}
                                                    </Button>

                                                    {/* Progress Bar */}
                                                    <div className="flex-1 space-y-1">
                                                        <div
                                                            className={`w-full bg-secondary rounded-full h-2 ${audioRef ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                            onClick={audioRef ? handleSeek : undefined}
                                                        >
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all duration-200"
                                                                style={{
                                                                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>{formatTime(currentTime)}</span>
                                                            <span>{formatTime(duration)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Volume Icon */}
                                                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const audioUrl = viewModal.selectedItem?.audioUrl;
                                                        if (audioUrl && viewModal.selectedItem) {
                                                            try {
                                                                const taskId = getTaskId(viewModal.selectedItem);
                                                                const link = document.createElement('a');
                                                                link.href = audioUrl;
                                                                link.download = `task-${taskId}-audio`;
                                                                link.click();
                                                            } catch {
                                                                // Error handling is done in the mixin
                                                            }
                                                        }
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const audioUrl = viewModal.selectedItem?.audioUrl;
                                                        if (audioUrl) {
                                                            window.open(audioUrl, '_blank');
                                                        }
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Open in New Tab
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Task Details - Two Column Layout */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Status</h4>
                                            <Badge
                                                variant={
                                                    viewModal.selectedItem.status === 'COMPLETED' ? 'default' :
                                                        viewModal.selectedItem.status === 'IN_REVIEW' ? 'secondary' :
                                                            viewModal.selectedItem.status === 'PENDING_APPROVAL' ? 'outline' :
                                                                'secondary'
                                                }
                                                className="w-fit"
                                            >
                                                {getDisplayStatus(viewModal.selectedItem.status)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Price</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                ₹{viewModal.selectedItem.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Claimed By</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {getClaimedByDisplay(viewModal.selectedItem.claimedById)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Created At</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {viewModal.selectedItem.createdAt
                                                    ? formatDate(viewModal.selectedItem.createdAt)
                                                    : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Language</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {capitalizeFirstLetter(viewModal.selectedItem.language)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Last Updated</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {viewModal.selectedItem.updatedAt
                                                    ? formatDate(viewModal.selectedItem.updatedAt)
                                                    : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Edit Task Sheet */}
            <Sheet open={editModal.isOpen} onOpenChange={(open) => !open && editModal.close()}>
                <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit Task</SheetTitle>
                        <SheetDescription>
                            Make changes to the task details below.
                        </SheetDescription>
                    </SheetHeader>
                    {editModal.selectedItem && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">Title</Label>
                                    <Input
                                        id="edit-title"
                                        value={editFormData.title}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-status">Status</Label>
                                        <Select
                                            value={editFormData.status}
                                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TASK_STATUS_OPTIONS.filter(opt => opt.value !== 'all').map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-priority">Priority</Label>
                                        <Select
                                            value={editFormData.priority}
                                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, priority: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRIORITY_OPTIONS.filter(opt => opt.value !== 'all').map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-price">Price ({CURRENCY_SYMBOL})</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            value={editFormData.price}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-language">Language</Label>
                                        <Select
                                            value={editFormData.language}
                                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, language: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-dueDate">Due Date (Optional)</Label>
                                    <Input
                                        id="edit-dueDate"
                                        type="date"
                                        max="9999-12-31"
                                        value={editFormData.dueDate}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                const year = val.split('-')[0];
                                                if (year && year.length > 4) return;
                                            }
                                            setEditFormData(prev => ({ ...prev, dueDate: val }));
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => editModal.close()}
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleUpdateTask}
                                    >
                                        Update Task
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Assign Freelancer Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Assign Task to Freelancer</DialogTitle>
                        <DialogDescription>
                            Select a freelancer from this project to assign the task &quot;{selectedTaskForAssign?.title}&quot;.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto border rounded-md">
                        {isLoadingFreelancers ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : projectFreelancers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No freelancers found in this project.</p>
                                <p className="text-sm mt-2">Please add freelancers to the project first.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {projectFreelancers.map((freelancer) => (
                                    <div
                                        key={freelancer.id || freelancer._id}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{freelancer.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{freelancer.name}</p>
                                                <p className="text-sm text-muted-foreground">{freelancer.email}</p>
                                                {freelancer.stats && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {freelancer.stats.totalTasksCompleted || 0} tasks completed
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                const freelancerId = freelancer.id || freelancer._id;
                                                if (freelancerId) {
                                                    handleAssignToFreelancer(freelancerId);
                                                }
                                            }}
                                            disabled={assignActionLoading === (freelancer.id || freelancer._id) || !(freelancer.id || freelancer._id)}
                                        >
                                            {assignActionLoading === (freelancer.id || freelancer._id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Assign
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {!isLoadingFreelancers && projectFreelancers.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                            Showing {projectFreelancers.length} freelancer{projectFreelancers.length !== 1 ? 's' : ''} from this project
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />

            {/* Spawn Task Modal */}
            <SpawnTaskModal
                isOpen={spawnModal.isOpen}
                onClose={handleSpawnClose}
                taskId={spawnModal.task ? getTaskId(spawnModal.task) : ''}
                taskTitle={spawnModal.task?.title || ''}
                onSuccess={() => {
                    showSuccess("Task spawned successfully");
                }}
                showError={showError}
                showSuccess={showSuccess}
            />
        </div>
    );
}