'use client';

import { Eye, Check, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, FileText, Mic } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';


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
import { Textarea } from '@/components/ui/textarea.ui';
import { CURRENCY_SYMBOL, TASK_REVIEW_FILTERS } from '@/constants';
import { useTaskReview } from '@/mixins/task';

export default function ReviewTaskPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') || undefined;

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
    } = useTaskReview(projectId);

    // Local state for feedback inputs
    const [approveFeedback, setApproveFeedback] = React.useState('');
    const [rejectFeedback, setRejectFeedback] = React.useState('');

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
                <SheetContent className="w-full sm:max-w-[600px]">
                    <SheetHeader>
                        <SheetTitle>{viewModal.selectedItem?.title}</SheetTitle>
                        <SheetDescription>
                            Review task details and approve or reject
                        </SheetDescription>
                    </SheetHeader>
                    {viewModal.selectedItem && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                {/* Task Details - Two Column Layout */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Price</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {CURRENCY_SYMBOL}{viewModal.selectedItem.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Assigned To</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {viewModal.selectedItem.claimedBy?.name || viewModal.selectedItem.assignedTo?.name || 'Unassigned'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Created</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(viewModal.selectedItem.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Language</h4>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {viewModal.selectedItem.language}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Status</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {capitalizeFirstLetter(viewModal.selectedItem.status.replace('_', ' '))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Speaker Metadata Section */}
                                {(viewModal.selectedItem.speakerName || viewModal.selectedItem.speakerAge || viewModal.selectedItem.speakerLocation ||
                                  (viewModal.selectedItem.speakersMetadata && viewModal.selectedItem.speakersMetadata.length > 0)) && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold mb-3">Speaker Information</h4>
                                        {viewModal.selectedItem.type === 'multi' && viewModal.selectedItem.speakersMetadata && viewModal.selectedItem.speakersMetadata.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewModal.selectedItem.speakersMetadata.map((speaker: any, index: number) => (
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
                                                    {viewModal.selectedItem.speakerName && (
                                                        <div>
                                                            <span className="font-medium">Name:</span>
                                                            <p className="text-muted-foreground">{viewModal.selectedItem.speakerName}</p>
                                                        </div>
                                                    )}
                                                    {viewModal.selectedItem.speakerAge && (
                                                        <div>
                                                            <span className="font-medium">Age:</span>
                                                            <p className="text-muted-foreground">{viewModal.selectedItem.speakerAge}</p>
                                                        </div>
                                                    )}
                                                    {viewModal.selectedItem.speakerLocation && (
                                                        <div>
                                                            <span className="font-medium">Location:</span>
                                                            <p className="text-muted-foreground">{viewModal.selectedItem.speakerLocation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Review Workspace - Different layouts based on task type */}
                                <div className="pt-4 border-t">
                                    {/* Determine task type and show appropriate workspace */}
                                    {viewModal.selectedItem.transcription ? (
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
                                                    {viewModal.selectedItem.audioUrl ? (
                                                        <div className="space-y-2">
                                                            <audio controls className="w-full">
                                                                <source src={viewModal.selectedItem.audioUrl} type="audio/mpeg" />
                                                                <source src={viewModal.selectedItem.audioUrl} type="audio/wav" />
                                                                <source src={viewModal.selectedItem.audioUrl} type="audio/ogg" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={viewModal.selectedItem.audioUrl}
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
                                                    {viewModal.selectedItem.transcription.segments && viewModal.selectedItem.transcription.segments.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {viewModal.selectedItem.transcription.segments.map((segment, index) => (
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
                                    ) : viewModal.selectedItem.type === 'multi' ? (
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
                                                    {viewModal.selectedItem.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {viewModal.selectedItem.description}
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
                                                        const audioUrl = viewModal.selectedItem.recordingUrl || viewModal.selectedItem.submission;
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
                                    ) : viewModal.selectedItem.audioUrl ? (
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
                                                    {viewModal.selectedItem.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {viewModal.selectedItem.description}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground mb-2">Original Script Audio:</p>
                                                            <audio controls className="w-full">
                                                                <source src={viewModal.selectedItem.audioUrl} type="audio/mpeg" />
                                                                <source src={viewModal.selectedItem.audioUrl} type="audio/wav" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={viewModal.selectedItem.audioUrl}
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
                                                    {viewModal.selectedItem.submission ? (
                                                        viewModal.selectedItem.submission.match(/^https?:\/\//i) &&
                                                            viewModal.selectedItem.submission.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i) ? (
                                                            <div className="space-y-2">
                                                                <audio controls className="w-full">
                                                                    <source src={viewModal.selectedItem.submission} type="audio/mpeg" />
                                                                    <source src={viewModal.selectedItem.submission} type="audio/wav" />
                                                                    <source src={viewModal.selectedItem.submission} type="audio/ogg" />
                                                                    Your browser does not support the audio element.
                                                                </audio>
                                                                <a
                                                                    href={viewModal.selectedItem.submission}
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
                                                    {viewModal.selectedItem.description ? (
                                                        <div className="text-sm whitespace-pre-wrap">
                                                            {viewModal.selectedItem.description}
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
                                                    {viewModal.selectedItem.submission ? (
                                                        viewModal.selectedItem.submission.match(/^https?:\/\//i) &&
                                                            viewModal.selectedItem.submission.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i) ? (
                                                            <div className="space-y-2">
                                                                <audio controls className="w-full">
                                                                    <source src={viewModal.selectedItem.submission} type="audio/mpeg" />
                                                                    <source src={viewModal.selectedItem.submission} type="audio/wav" />
                                                                    <source src={viewModal.selectedItem.submission} type="audio/ogg" />
                                                                    Your browser does not support the audio element.
                                                                </audio>
                                                                <a
                                                                    href={viewModal.selectedItem.submission}
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

                                {/* Review Details Section */}
                                {viewModal.selectedItem?.review && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold mb-3">Review Details</h4>
                                        <div className="space-y-4">
                                            <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                                                <div>
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Rating</span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <svg
                                                                key={star}
                                                                className={`h-5 w-5 ${star <= (viewModal.selectedItem?.review?.rating || 0)
                                                                    ? "text-yellow-400 fill-current"
                                                                    : "text-gray-300"
                                                                    }`}
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                        ))}
                                                        <span className="ml-2 text-sm font-medium">
                                                            {viewModal.selectedItem.review.rating}/5
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Feedback</span>
                                                    <p className="mt-1 text-sm whitespace-pre-wrap">
                                                        {viewModal.selectedItem.review.feedback ||
                                                            <span className="text-muted-foreground italic">No feedback provided</span>
                                                        }
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                                                    <span className="text-xs text-muted-foreground">Reviewed by:</span>
                                                    <span className="text-xs font-medium">
                                                        {viewModal.selectedItem.review.reviewer?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Actions */}
                                {viewModal.selectedItem.status === 'SUBMITTED' && (
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
                                                        Provide feedback for the freelancer (optional). This will be visible to them.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="py-4">
                                                    <Textarea
                                                        placeholder="Great work! The transcription is accurate and well-formatted..."
                                                        value={approveFeedback}
                                                        onChange={(e) => setApproveFeedback(e.target.value)}
                                                        rows={4}
                                                        maxLength={1000}
                                                        className="resize-none"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {approveFeedback.length}/1000 characters
                                                    </p>
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setApproveFeedback('')}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => {
                                                            handleApproveTask(getTaskId(viewModal.selectedItem!), approveFeedback || undefined);
                                                            setApproveFeedback('');
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Reject Task
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Reject Task</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Provide feedback explaining why this task is being rejected. This will help the freelancer improve.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="py-4">
                                                    <Textarea
                                                        placeholder="The transcription has several errors. Please review the audio carefully and ensure accuracy..."
                                                        value={rejectFeedback}
                                                        onChange={(e) => setRejectFeedback(e.target.value)}
                                                        rows={4}
                                                        maxLength={1000}
                                                        className="resize-none"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {rejectFeedback.length}/1000 characters
                                                    </p>
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setRejectFeedback('')}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => {
                                                            handleRejectTask(getTaskId(viewModal.selectedItem!), rejectFeedback || undefined);
                                                            setRejectFeedback('');
                                                            viewModal.close();
                                                        }}
                                                        className="bg-red-500 text-white hover:bg-red-600"
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Reject Task
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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