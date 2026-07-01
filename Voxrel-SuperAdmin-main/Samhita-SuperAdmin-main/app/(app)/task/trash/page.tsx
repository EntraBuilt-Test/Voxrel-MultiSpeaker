'use client';

import { Eye, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Download, Play, Pause, Volume2, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { NotificationToast, FilterBar } from '@/components/shared';
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
import { Badge } from '@/components/ui/badge.ui';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.ui';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet.ui';
import { TASK_FILTERS, LANGUAGE_OPTIONS } from '@/constants';
import { useNotifications } from '@/hooks/notifications.hook';
import { useTask } from '@/hooks/queries/tasks-queries.hook';
import { getProxiedMediaUrl } from '@/lib/media-proxy';
import { useTaskManagement } from '@/mixins/task';

export default function TrashTaskPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');

    const {
        // State
        searchQuery,
        filterValues,
        currentPage,
        setFilterValues,

        // Modals
        viewModal,

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
        handleViewTask,
        handleDeleteTask,
        handleSearchChange,
        handleFilterChange,
        handleSort,

        // Setters
        setCurrentPage,
    } = useTaskManagement();

    // Local notifications
    const { notifications: localNotifications, dismiss: dismissLocalNotification } = useNotifications();

    const notifications = [...taskNotifications, ...localNotifications];
    const dismiss = (id: string) => {
        dismissTaskNotification(id);
        dismissLocalNotification(id);
    };

    // Fetch full task details when viewing
    const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
    const { data: fullTaskDetails, isLoading: isLoadingTaskDetails } = useTask(viewingTaskId || '');

    // Update viewing task ID when modal opens
    useEffect(() => {
        if (viewModal.isOpen && viewModal.selectedItem) {
            const taskId = getTaskId(viewModal.selectedItem);
            setViewingTaskId(taskId);
        } else {
            setViewingTaskId(null);
        }
    }, [viewModal.isOpen, viewModal.selectedItem, getTaskId]);

    // Use full task details if available and loaded, otherwise use selected item
    // Prefer fullTaskDetails if it has transcription data, otherwise fall back to selectedItem
    const displayTask = React.useMemo(() => {
        // If we have full task details loaded, use it (it has complete data)
        if (fullTaskDetails && !isLoadingTaskDetails) {
            return fullTaskDetails;
        }
        // Otherwise use the selected item from the list
        return viewModal.selectedItem;
    }, [fullTaskDetails, isLoadingTaskDetails, viewModal.selectedItem]);

    // Get transcription from either source
    const transcription = displayTask?.transcription;
    const submissionUrl = displayTask?.submission;

    // Fetch output from submission URL if available
    const [submissionOutput, setSubmissionOutput] = useState<string | null>(null);
    const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

    useEffect(() => {
        if (submissionUrl && viewModal.isOpen && !transcription) {
            setIsLoadingSubmission(true);
            fetch(submissionUrl)
                .then(response => {
                    if (response.ok) {
                        return response.text();
                    }
                    throw new Error('Failed to fetch submission');
                })
                .then(text => {
                    setSubmissionOutput(text);
                    setIsLoadingSubmission(false);
                })
                .catch(error => {
                    console.error('Error fetching submission:', error);
                    setIsLoadingSubmission(false);
                    // If fetch fails, try to display the URL as output
                    setSubmissionOutput(submissionUrl);
                });
        } else {
            setSubmissionOutput(null);
        }
    }, [submissionUrl, viewModal.isOpen, transcription]);

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

    // Set filter to CANCELLED status and projectId on mount
    useEffect(() => {
        setFilterValues({
            status: 'CANCELLED',
            language: 'all',
            ...(projectId && { projectId }),
        });
    }, [projectId, setFilterValues]);

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

    // Create dynamic filters based on API data (only language filter, status is fixed to CANCELLED)
    const getDynamicFilters = React.useCallback(() => {
        return TASK_FILTERS.map(filter => {
            if (filter.key === 'status') {
                // Hide status filter since we're only showing CANCELLED tasks
                return null;
            }
            if (filter.key === 'language') {
                return {
                    ...filter,
                    options: [
                        { value: 'all', label: 'All Languages' },
                        ...LANGUAGE_OPTIONS
                    ]
                };
            }
            return filter;
        }).filter(Boolean) as typeof TASK_FILTERS;
    }, []);

    // Override handleResetFilters to keep status as CANCELLED
    const handleResetFiltersOverride = React.useCallback(() => {
        handleSearchChange('');
        setFilterValues({
            status: 'CANCELLED',
            language: 'all',
            ...(projectId && { projectId }),
        });
        setCurrentPage(1);
    }, [projectId, handleSearchChange, setFilterValues, setCurrentPage]);

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Trash</h1>
                    <p className="text-sm text-muted-foreground">
                        {projectId ? 'Rejected tasks for this project' : 'All rejected tasks'}
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <FilterBar
                searchQuery={searchQuery}
                onSearch={handleSearchChange}
                filters={getDynamicFilters()}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFiltersOverride}
                searchPlaceholder="Search rejected tasks..."
                resetLabel="Reset"
                showSort={false}
            />

            {/* Table Section */}
            <div className="flex-1 min-h-[calc(100vh-14rem)]">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-0 h-full flex flex-col">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">Loading rejected tasks...</div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">
                                    {searchQuery || filterValues.language !== 'all'
                                        ? 'No rejected tasks match your filters'
                                        : 'No rejected tasks found'
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
                                                            variant="destructive"
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
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete Permanently
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete Task Permanently</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure you want to permanently delete this rejected task? This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDeleteTask(getTaskId(task))}
                                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                >
                                                                                    Delete Permanently
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
                                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.totalTasks)} of {pagination.totalTasks} rejected tasks
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
                        <SheetTitle className="text-lg font-semibold">{displayTask?.title}</SheetTitle>
                        <SheetDescription>
                            Rejected task details and information
                        </SheetDescription>
                    </SheetHeader>
                    {displayTask && (
                        <div className="mt-6 space-y-6 pb-6">
                            <div className="space-y-4">
                                {/* Audio Player */}
                                {displayTask.audioUrl && (
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
                                                        onClick={() => displayTask?.audioUrl && handlePlayPause(displayTask.audioUrl)}
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
                                                        const audioUrl = displayTask?.audioUrl;
                                                        if (audioUrl && displayTask) {
                                                            try {
                                                                const taskId = getTaskId(displayTask);
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
                                                        const audioUrl = displayTask?.audioUrl;
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

                                {/* Output Section */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Output</h4>
                                    {isLoadingTaskDetails || isLoadingSubmission ? (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground">Loading output...</p>
                                        </div>
                                    ) : transcription ? (
                                        transcription.segments && Array.isArray(transcription.segments) && transcription.segments.length > 0 ? (
                                            <div className="p-4 bg-muted rounded-lg h-[60vh] overflow-y-auto">
                                                <div className="space-y-3">
                                                    {transcription.segments.map((segment: { timestamp: { start: number; end: number }; content: string; remark?: string; quality: number }, index: number) => (
                                                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                    {segment.timestamp?.start !== undefined && segment.timestamp?.end !== undefined
                                                                        ? `${Math.floor(segment.timestamp.start / 60)}:${(segment.timestamp.start % 60).toFixed(1).padStart(4, '0')} - ${Math.floor(segment.timestamp.end / 60)}:${(segment.timestamp.end % 60).toFixed(1).padStart(4, '0')}`
                                                                        : 'N/A'}
                                                                </span>
                                                                {segment.quality !== undefined && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Quality: {segment.quality}/5
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm mb-1">{segment.content || 'No content'}</p>
                                                            {segment.remark && (
                                                                <p className="text-xs text-blue-600 italic">Note: {segment.remark}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground">
                                                    {transcription.segments 
                                                        ? 'No transcription segments available' 
                                                        : 'Transcription data exists but no segments found'}
                                                </p>
                                            </div>
                                        )
                                    ) : submissionOutput ? (
                                        <div className="p-4 bg-muted rounded-lg h-[60vh] overflow-y-auto">
                                            <pre className="text-sm whitespace-pre-wrap font-mono">{submissionOutput}</pre>
                                        </div>
                                    ) : submissionUrl ? (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-2">Submission URL available:</p>
                                            <a 
                                                href={submissionUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline break-all"
                                            >
                                                {submissionUrl}
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground">No output available for this task</p>
                                        </div>
                                    )}
                                </div>

                                {/* Task Details - Two Column Layout */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Status</h4>
                                            <Badge
                                                variant="destructive"
                                                className="w-fit"
                                            >
                                                {getDisplayStatus(displayTask.status)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Price</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                ₹{displayTask.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Claimed By</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {getClaimedByDisplay(displayTask.claimedById)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Created At</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {displayTask.createdAt
                                                    ? formatDate(displayTask.createdAt)
                                                    : 'Unknown'}
                                            </p>
                                        </div>
                                        {displayTask.transcription && (
                                            <>
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Transcriber</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {displayTask.transcription.user?.name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Total Segments</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {displayTask.transcription.segments?.length || 0}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Language</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {capitalizeFirstLetter(displayTask.language)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Last Updated</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {displayTask.updatedAt
                                                    ? formatDate(displayTask.updatedAt)
                                                    : 'Unknown'}
                                            </p>
                                        </div>
                                        {displayTask.transcription && (
                                            <>
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Transcribed At</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {displayTask.transcription.createdAt
                                                            ? formatDate(displayTask.transcription.createdAt)
                                                            : 'Unknown'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-1">Average Quality</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {displayTask.transcription.segments?.length
                                                            ? (displayTask.transcription.segments.reduce((sum: number, seg: { quality: number }) => sum + seg.quality, 0) / displayTask.transcription.segments.length).toFixed(1)
                                                            : 'N/A'}
                                                        /5
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}
