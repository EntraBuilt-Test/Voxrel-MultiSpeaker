'use client';

import { Eye, Check, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, FileText, Mic, Star } from 'lucide-react';
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
import { CURRENCY_SYMBOL, TASK_REVIEW_FILTERS } from '@/constants';
import { useTask } from '@/hooks/queries/tasks-queries.hook';
import { getProxiedMediaUrl } from '@/lib/media-proxy';
import { useTaskReview } from '@/mixins/task';

export default function ReviewTaskPage() {
    const {
        // State
        searchQuery,
        filterValues,
        currentPage,
        
        // Modals
        viewModal,
        transcriptionModal,
        
        // Data
        tasks,
        pagination,
        isLoading,
        
        // Notifications
        notifications,
        dismiss,
        
        // Helper functions
        getVisiblePageNumbers,
        formatDate,
        getTaskId,
        getClaimedByDisplay,
        getReviewedByDisplay,
        capitalizeFirstLetter,
        handleSort,
        getSortIcon,
        
        // Event handlers
        handleViewTask,
        handleApproveTask,
        handleRejectTask,
        handleFilterChange,
        handleResetFilters,
        
        // Setters
        setCurrentPage,
        setSearchQuery,
    } = useTaskReview();

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
    const displayTask = React.useMemo(() => {
        if (fullTaskDetails && !isLoadingTaskDetails) {
            return fullTaskDetails;
        }
        return viewModal.selectedItem;
    }, [fullTaskDetails, isLoadingTaskDetails, viewModal.selectedItem]);

    // Get transcription from either source
    const transcription = displayTask?.transcription;
    const submissionUrl = displayTask?.submission;

    // Audio player state (UI only) - separate for input and output
    const [inputAudioRef, setInputAudioRef] = useState<HTMLAudioElement | null>(null);
    const [outputAudioRef, setOutputAudioRef] = useState<HTMLAudioElement | null>(null);
    const [inputIsPlaying, setInputIsPlaying] = useState(false);
    const [outputIsPlaying, setOutputIsPlaying] = useState(false);
    const [_inputCurrentTime, setInputCurrentTime] = useState(0);
    const [_outputCurrentTime, setOutputCurrentTime] = useState(0);
    const [inputDuration, setInputDuration] = useState(0);
    const [outputDuration, setOutputDuration] = useState(0);

    // Initialize Audio on client side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setInputAudioRef(new Audio());
            setOutputAudioRef(new Audio());
        }
    }, []);

    // Audio player functions (UI only) - kept for potential future use
    const _formatTime = React.useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const _handleInputPlayPause = React.useCallback((audioUrl: string) => {
        if (!inputAudioRef) return;

        // For R2 public buckets, use the URL directly (they should have CORS configured)
        // Only use proxy for non-R2 URLs or if proxy is needed
        let audioSrc = audioUrl;
        
        // Check if it's an R2 public bucket URL
        if (audioUrl.includes('.r2.dev') || audioUrl.includes('pub-')) {
            // Use R2 URL directly - public buckets should have CORS configured
            audioSrc = audioUrl;
            inputAudioRef.crossOrigin = 'anonymous';
        } else {
            // Use proxied URL for other sources
            audioSrc = getProxiedMediaUrl(audioUrl) || audioUrl;
            inputAudioRef.crossOrigin = 'anonymous';
        }

        if (inputAudioRef.src !== audioSrc) {
            inputAudioRef.src = audioSrc;
            // Reset time when changing source
            setInputCurrentTime(0);
            setInputDuration(0);
        }

        if (inputIsPlaying) {
            inputAudioRef.pause();
            setInputIsPlaying(false);
        } else {
            inputAudioRef.play().catch(error => {
                console.error('Error playing audio:', error);
                setInputIsPlaying(false);
            });
            setInputIsPlaying(true);
        }
    }, [inputAudioRef, inputIsPlaying]);

    const _handleOutputPlayPause = React.useCallback(async (audioUrl: string) => {
        if (!outputAudioRef) return;

        // For R2 public buckets, use the URL directly without crossOrigin
        // R2 public buckets should work without CORS headers if accessed directly
        let audioSrc = audioUrl;
        
        // Check if it's an R2 public bucket URL
        const isR2Url = audioUrl.includes('.r2.dev') || audioUrl.includes('pub-');
        
        if (isR2Url) {
            // Use R2 URL directly - don't set crossOrigin for public buckets
            audioSrc = audioUrl;
            // Remove crossOrigin attribute for R2 URLs
            outputAudioRef.removeAttribute('crossOrigin');
        } else {
            // Use proxied URL for other sources
            audioSrc = getProxiedMediaUrl(audioUrl) || audioUrl;
            outputAudioRef.crossOrigin = 'anonymous';
        }

        // If source changed, load the new source
        if (outputAudioRef.src !== audioSrc) {
            // Pause and reset first
            outputAudioRef.pause();
            outputAudioRef.src = '';
            outputAudioRef.load();
            
            // Set new source
            outputAudioRef.src = audioSrc;
            
            // Reset time when changing source
            setOutputCurrentTime(0);
            setOutputDuration(0);
            setOutputIsPlaying(false);
            
            // Wait for the audio to be ready before allowing play
            try {
                await new Promise((resolve, reject) => {
                    if (!outputAudioRef) {
                        reject(new Error('Audio ref not available'));
                        return;
                    }
                    
                    const timeout = setTimeout(() => {
                        outputAudioRef.removeEventListener('canplay', handleCanPlay);
                        outputAudioRef.removeEventListener('error', handleError);
                        reject(new Error('Audio load timeout'));
                    }, 10000); // 10 second timeout
                    
                    const handleCanPlay = () => {
                        clearTimeout(timeout);
                        outputAudioRef?.removeEventListener('canplay', handleCanPlay);
                        outputAudioRef?.removeEventListener('error', handleError);
                        resolve(true);
                    };
                    const handleError = (e: Event) => {
                        clearTimeout(timeout);
                        outputAudioRef?.removeEventListener('canplay', handleCanPlay);
                        outputAudioRef?.removeEventListener('error', handleError);
                        console.error('Audio load error:', e);
                        reject(e);
                    };
                    outputAudioRef.addEventListener('canplay', handleCanPlay);
                    outputAudioRef.addEventListener('error', handleError);
                    
                    // If already can play, resolve immediately
                    if (outputAudioRef.readyState >= 2) {
                        clearTimeout(timeout);
                        outputAudioRef.removeEventListener('canplay', handleCanPlay);
                        outputAudioRef.removeEventListener('error', handleError);
                        resolve(true);
                    }
                });
            } catch (error) {
                console.error('Error loading audio:', error);
                return;
            }
        }

        if (outputIsPlaying) {
            outputAudioRef.pause();
            setOutputIsPlaying(false);
        } else {
            try {
                await outputAudioRef.play();
                setOutputIsPlaying(true);
            } catch (error) {
                console.error('Error playing audio:', error);
                setOutputIsPlaying(false);
            }
        }
    }, [outputAudioRef, outputIsPlaying]);

    const _handleInputSeek = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!inputAudioRef) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * inputDuration;
        inputAudioRef.currentTime = newTime;
        setInputCurrentTime(newTime);
    }, [inputAudioRef, inputDuration]);

    const _handleOutputSeek = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!outputAudioRef) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * outputDuration;
        outputAudioRef.currentTime = newTime;
        setOutputCurrentTime(newTime);
    }, [outputAudioRef, outputDuration]);

    // Input audio event listeners
    useEffect(() => {
        if (!inputAudioRef) return;
        const audio = inputAudioRef;
        const updateTime = () => setInputCurrentTime(audio.currentTime);
        const updateDuration = () => setInputDuration(audio.duration);
        const handleEnded = () => setInputIsPlaying(false);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [inputAudioRef]);

    // Output audio event listeners
    useEffect(() => {
        if (!outputAudioRef) return;
        const audio = outputAudioRef;
        const updateTime = () => setOutputCurrentTime(audio.currentTime);
        const updateDuration = () => setOutputDuration(audio.duration);
        const handleEnded = () => setOutputIsPlaying(false);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outputAudioRef]);

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Filter Section */}
            <FilterBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                filters={TASK_REVIEW_FILTERS}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                searchPlaceholder="Search tasks..."
                resetLabel="Reset all filters"
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
                                    {searchQuery || filterValues.language !== 'all'
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
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Language</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Claimed By</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reviewed By</th>
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
                                                            {getReviewedByDisplay(task.review)}
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
                                                            {task.transcription && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => transcriptionModal.open(task)}
                                                                    className="justify-start h-8 px-2 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    View Transcription
                                                                </Button>
                                                            )}
                                                            {task.status === 'SUBMITTED' && (
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
                                    Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, pagination.totalTasks)} of {pagination.totalTasks} tasks
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
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
                            Review task details and approve or reject
                        </SheetDescription>
                    </SheetHeader>
                    {displayTask && (
                        <div className="mt-6 space-y-6 pb-6">
                            <div className="space-y-4">
                                {/* Review Workspace - Different layouts based on task type */}
                                <div className="pt-4 border-t">
                                    {/* Determine task type and show appropriate workspace */}
                                    {transcription ? (
                                        /* TRANSCRIPTION REVIEW WORKSPACE */
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Input: Source Audio */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Input (Original)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <Mic className="h-4 w-4" />
                                                        <span>Source Audio</span>
                                                    </div>
                                                    {displayTask.audioUrl ? (
                                                        <div className="space-y-2">
                                                            <audio controls className="w-full">
                                                                <source src={displayTask.audioUrl} type="audio/mpeg" />
                                                                <source src={displayTask.audioUrl} type="audio/wav" />
                                                                <source src={displayTask.audioUrl} type="audio/ogg" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={displayTask.audioUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline block"
                                                            >
                                                                Download Audio
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No audio file available</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Output: Transcribed Text */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Output (Submitted Work)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>Transcribed Text</span>
                                                    </div>
                                                    {transcription.segments && transcription.segments.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {transcription.segments.map((segment: { timestamp: { start: number; end: number }; content: string; remark?: string; quality: number }, index: number) => (
                                                                <div key={index} className="text-sm">
                                                                    <span className="text-xs text-muted-foreground font-mono mr-2">
                                                                        [{Math.floor(segment.timestamp.start / 60)}:{(segment.timestamp.start % 60).toFixed(0).padStart(2, '0')}]
                                                                    </span>
                                                                    {segment.content}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No transcription available</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : displayTask.type === 'multi' ? (
                                        /* MULTI-SPEAKER AUDIO REVIEW WORKSPACE */
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Input: Task Instructions */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Input (Original)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>Task Instructions/Description</span>
                                                    </div>
                                                    {displayTask.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {displayTask.description}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No instructions provided</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Output: Multi-Speaker Recorded Audio */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Output (Submitted Work)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <Mic className="h-4 w-4" />
                                                        <span>Multi-Speaker Recorded Audio</span>
                                                    </div>
                                                    {(() => {
                                                        // For multi-speaker tasks, check recordingUrl first, then submission
                                                        const audioUrl = displayTask.recordingUrl || displayTask.submission;
                                                        if (audioUrl) {
                                                            // Check if it's a valid audio URL (supports .m4a.mp4 extension too)
                                                            // Match URLs ending with audio extensions, including .m4a.mp4
                                                            const isValidAudio = audioUrl.match(/^https?:\/\//i) &&
                                                                (audioUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i) ||
                                                                 audioUrl.match(/\.m4a\.mp4(\?|$)/i) ||
                                                                 audioUrl.match(/\.mp4(\?|$)/i));
                                                            if (isValidAudio) {
                                                                return (
                                                                    <div className="space-y-2">
                                                                        <audio controls className="w-full">
                                                                            <source src={audioUrl} type="audio/mpeg" />
                                                                            <source src={audioUrl} type="audio/wav" />
                                                                            <source src={audioUrl} type="audio/ogg" />
                                                                            <source src={audioUrl} type="audio/mp4" />
                                                                            <source src={audioUrl} type="audio/m4a" />
                                                                            Your browser does not support the audio element.
                                                                        </audio>
                                                                        <a
                                                                            href={audioUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:underline block"
                                                                        >
                                                                            Download Recorded Audio
                                                                        </a>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return <p className="text-sm text-muted-foreground">Invalid audio submission</p>;
                                                            }
                                                        } else {
                                                            return <p className="text-sm text-muted-foreground">No submission yet</p>;
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ) : displayTask.audioUrl ? (
                                        /* SCRIPTED AUDIO REVIEW WORKSPACE (Audio task with script) */
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Input: Script/Original Content */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Input (Original)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>Script to Read</span>
                                                    </div>
                                                    {displayTask.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {displayTask.description}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground mb-2">Original Script Audio:</p>
                                                            <audio controls className="w-full">
                                                                <source src={displayTask.audioUrl} type="audio/mpeg" />
                                                                <source src={displayTask.audioUrl} type="audio/wav" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={displayTask.audioUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline block"
                                                            >
                                                                Download Script Audio
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Output: Recorded Audio */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Output (Submitted Work)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <Mic className="h-4 w-4" />
                                                        <span>Recorded Audio</span>
                                                    </div>
                                                    {submissionUrl ? (
                                                        submissionUrl.match(/^https?:\/\//i) &&
                                                            submissionUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i) ? (
                                                            <div className="space-y-2">
                                                                <audio controls className="w-full">
                                                                    <source src={submissionUrl} type="audio/mpeg" />
                                                                    <source src={submissionUrl} type="audio/wav" />
                                                                    <source src={submissionUrl} type="audio/ogg" />
                                                                    Your browser does not support the audio element.
                                                                </audio>
                                                                <a
                                                                    href={submissionUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline block"
                                                                >
                                                                    Download Recorded Audio
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">Invalid audio submission</p>
                                                        )
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No submission yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* OPEN AUDIO REVIEW WORKSPACE (Self-recorded audio without script) */
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Input: Task Instructions */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Input (Original)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>Task Instructions/Description</span>
                                                    </div>
                                                    {displayTask.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {displayTask.description}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No instructions provided</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Output: Recorded Audio */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold mb-3">Output (Submitted Work)</h4>
                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                        <Mic className="h-4 w-4" />
                                                        <span>Freelancer&apos;s Recorded Audio</span>
                                                    </div>
                                                    {submissionUrl ? (
                                                        submissionUrl.match(/^https?:\/\//i) &&
                                                            submissionUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i) ? (
                                                            <div className="space-y-2">
                                                                <audio controls className="w-full">
                                                                    <source src={submissionUrl} type="audio/mpeg" />
                                                                    <source src={submissionUrl} type="audio/wav" />
                                                                    <source src={submissionUrl} type="audio/ogg" />
                                                                    Your browser does not support the audio element.
                                                                </audio>
                                                                <a
                                                                    href={submissionUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline block"
                                                                >
                                                                    Download Recorded Audio
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">Invalid audio submission</p>
                                                        )
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No submission yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Speaker Metadata Section */}
                                {(displayTask.speakerName || displayTask.speakerAge || displayTask.speakerLocation ||
                                  (displayTask.speakersMetadata && displayTask.speakersMetadata.length > 0)) && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold mb-3">Speaker Information</h4>
                                        {displayTask.type === 'multi' && displayTask.speakersMetadata && displayTask.speakersMetadata.length > 0 ? (
                                            <div className="space-y-3">
                                                {displayTask.speakersMetadata.map((speaker: { freelancerId: string; name: string; age: number; location: string }, index: number) => (
                                                    <div key={index} className="border rounded-lg p-3 bg-muted/30">
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium">Name:</span>
                                                                <p className="text-muted-foreground">{speaker.name}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Age:</span>
                                                                <p className="text-muted-foreground">{speaker.age}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Location:</span>
                                                                <p className="text-muted-foreground">{speaker.location}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg p-3 bg-muted/30">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    {displayTask.speakerName && (
                                                        <div>
                                                            <span className="font-medium">Name:</span>
                                                            <p className="text-muted-foreground">{displayTask.speakerName}</p>
                                                        </div>
                                                    )}
                                                    {displayTask.speakerAge && (
                                                        <div>
                                                            <span className="font-medium">Age:</span>
                                                            <p className="text-muted-foreground">{displayTask.speakerAge}</p>
                                                        </div>
                                                    )}
                                                    {displayTask.speakerLocation && (
                                                        <div>
                                                            <span className="font-medium">Location:</span>
                                                            <p className="text-muted-foreground">{displayTask.speakerLocation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Task Details - Two Column Layout */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Price</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {CURRENCY_SYMBOL}{displayTask.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Assigned To</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {getClaimedByDisplay(displayTask.claimedById)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Created</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(displayTask.createdAt)}
                                            </p>
                                        </div>
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
                                            <h4 className="text-sm font-semibold mb-1">Created By</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {displayTask.createdBy?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Details Section */}
                                {displayTask.review && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">RATING</h4>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`h-5 w-5 ${
                                                            displayTask.review?.rating && star <= displayTask.review.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {displayTask.review?.feedback && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">FEEDBACK</h4>
                                                <p className="text-sm text-muted-foreground">{displayTask.review.feedback}</p>
                                            </div>
                                        )}
                                        {displayTask.review?.reviewer && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1">Reviewed by</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {displayTask.review.reviewer.name || 'Unknown'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Review Actions */}
                                {displayTask.status === 'SUBMITTED' && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Approve Task
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Approve Task</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to approve this task? This action will mark it as completed.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => {
                                                            handleApproveTask(getTaskId(displayTask));
                                                            viewModal.close();
                                                        }}
                                                        className="bg-green-500 text-white hover:bg-green-600"
                                                    >
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Approve Task
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button
                                            onClick={() => {
                                                handleRejectTask(getTaskId(displayTask));
                                                viewModal.close();
                                            }}
                                            variant="destructive"
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject Task
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Transcription View Sheet */}
            <Sheet open={transcriptionModal.isOpen} onOpenChange={(open) => !open && transcriptionModal.close()}>
                <SheetContent className="w-full sm:max-w-[700px]">
                    <SheetHeader>
                        <SheetTitle>Transcription Details</SheetTitle>
                        <SheetDescription>
                            View transcription data, remarks, and feedback for this task
                        </SheetDescription>
                    </SheetHeader>
                    {transcriptionModal.selectedItem && transcriptionModal.selectedItem.transcription && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Transcription Text</h4>
                                    <div className="p-4 bg-muted rounded-lg h-[60vh] overflow-y-auto">
                                        {transcriptionModal.selectedItem.transcription.segments && transcriptionModal.selectedItem.transcription.segments.length > 0 ? (
                                            <div className="space-y-3">
                                                {transcriptionModal.selectedItem.transcription.segments.map((segment, index) => (
                                                    <div key={index} className="border-l-2 border-blue-200 pl-3">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {Math.floor(segment.timestamp.start / 60)}:{(segment.timestamp.start % 60).toFixed(1).padStart(4, '0')} - {Math.floor(segment.timestamp.end / 60)}:{(segment.timestamp.end % 60).toFixed(1).padStart(4, '0')}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Quality: {segment.quality}/5
                                                            </span>
                                                        </div>
                                                        <p className="text-sm mb-1">{segment.content}</p>
                                                        {segment.remark && (
                                                            <p className="text-xs text-blue-600 italic">Note: {segment.remark}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No transcription segments available</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Transcriber</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {transcriptionModal.selectedItem.transcription.user?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Transcribed At</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {transcriptionModal.selectedItem.transcription.createdAt 
                                                ? formatDate(transcriptionModal.selectedItem.transcription.createdAt)
                                                : 'Unknown'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Total Segments</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {transcriptionModal.selectedItem.transcription.segments?.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Average Quality</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {transcriptionModal.selectedItem.transcription.segments?.length 
                                                ? (transcriptionModal.selectedItem.transcription.segments.reduce((sum, seg) => sum + seg.quality, 0) / transcriptionModal.selectedItem.transcription.segments.length).toFixed(1)
                                                : 'N/A'
                                            }/5
                                        </p>
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