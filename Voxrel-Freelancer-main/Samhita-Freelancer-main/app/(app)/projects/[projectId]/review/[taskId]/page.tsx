"use client";

import { ArrowLeft, Loader2, FileText, Mic, CheckCircle2, XCircle } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { NotificationToast } from "@/components/notification-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { freelancerService } from "@/services/freelancer.service";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import { Task, Review } from "@/types";



export default function ReviewWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  // Get taskId from params first, then from searchParams as fallback
  const taskId = (params.taskId as string) || searchParams.get('taskId');

  // Debug logging
  console.log('ReviewWorkspacePage - Route params:', {
    projectId,
    taskId,
    params,
    allParams: Object.keys(params),
    searchParams: searchParams.toString()
  });

  const { notifications, showSuccess, showError, dismiss } = useNotifications();
  const [task, setTask] = useState<Task | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Rating removed as it is inferred from decision
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [sourceTask, setSourceTask] = useState<Task | null>(null);

  // Script content state for Audio Recording Review
  const [scriptContent, setScriptContent] = useState<string>("");
  const [_isScriptLoading, setIsScriptLoading] = useState(false);

  // Load script content if applicable
  useEffect(() => {
    // Extract review type from task tags
    let reviewType: string | null = null;
    if (task && task.tags && Array.isArray(task.tags)) {
      for (const tag of task.tags) {
        try {
          const parsedTag = typeof tag === 'string' ? JSON.parse(tag) : tag;
          if (parsedTag && parsedTag.reviewType) {
            reviewType = parsedTag.reviewType;
            break;
          }
        } catch {
          // Not JSON, continue
        }
      }
    }

    const isAudioReview = project?.type === 'AUDIO_RECORDING' || reviewType === 'AUDIO_REVIEW' || (project?.type === 'REVIEW' && project?.metadata?.originalProjectType === 'AUDIO_RECORDING');

    if (sourceTask?.audioUrl && isAudioReview) {
      const url = sourceTask.audioUrl;
      const isTxt = /\.txt($|\?)/i.test(url);

      if (isTxt) {
        setIsScriptLoading(true);
        console.log('[Review] Attempting to load script from:', url);
        fetch(url)
          .then(res => {
            console.log('[Review] Fetch response:', res.status, res.statusText);
            if (!res.ok) throw new Error(`Failed to load script: ${res.status} ${res.statusText}`);
            return res.text();
          })
          .then(text => {
            setScriptContent(text);
            console.log('[Review] Script content loaded:', text.substring(0, 100));
          })
          .catch(err => {
            console.error('[Review] Error loading script:', err);
            // Set a fallback message indicating CORS issue
            setScriptContent(`Unable to load script content directly due to browser security restrictions.\n\nPlease use the "Download Script" button above to view the script file.`);
          })
          .finally(() => {
            setIsScriptLoading(false);
          });
      }
    }
  }, [sourceTask, project, task]);

  // Debug: Log transcript state whenever it changes (must be before any conditional returns)
  useEffect(() => {
    console.log('[Review UI] Transcript state:', {
      hasTranscript: !!transcript,
      hasSegments: !!(transcript?.segments),
      segmentsCount: transcript?.segments?.length || 0,
      isLoading: isLoadingTranscript,
      transcriptData: transcript
    });
  }, [transcript, isLoadingTranscript]);

  // Debug: Log task submission status when task changes (must be before any conditional returns)
  useEffect(() => {
    if (task) {
      console.log('[Review UI] Task state updated:', {
        taskId: task._id || task.id,
        hasSubmission: !!task.submission,
        submissionLength: task.submission?.length || 0,
        submissionType: typeof task.submission,
        submissionValue: task.submission,
        taskStatus: task.status,
        allTaskKeys: Object.keys(task)
      });
    }
  }, [task]);

  useEffect(() => {
    const finalTaskId = (params.taskId as string) || searchParams.get('taskId');

    console.log('ReviewWorkspacePage mounted:', {
      projectId,
      taskId: finalTaskId,
      params: Object.keys(params),
      taskIdFromParams: params.taskId,
      allParams: params,
      searchParams: searchParams.toString(),
      currentPath: window.location.pathname
    });

    if (finalTaskId) {
      loadTask(finalTaskId);
    } else {
      console.error('No taskId found in route, redirecting to review dashboard');
      showError("Task ID not found in URL");
      setTimeout(() => {
        router.push(`/projects/${projectId}/review`);
      }, 2000);
    }
  }, [projectId, params, searchParams]);

  const loadTask = async (taskIdToLoad?: string) => {
    const idToUse = taskIdToLoad || taskId;
    if (!idToUse) {
      showError("Task ID is required");
      return;
    }

    // Load project to determine type
    try {
      const projectResponse = await projectService.getProject(projectId);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
        console.log('[Review] Project loaded:', {
          id: projectResponse.data._id || projectResponse.data.id,
          name: projectResponse.data.name,
          type: projectResponse.data.type
        });
      }
    } catch (error) {
      console.error('[Review] Failed to load project:', error);
    }

    setIsLoading(true);
    try {
      let foundTask: Task | null = null;
      let taskReview: Review | null = null;
      let allAssignedReviews: any[] = [];

      // Strategy 0: First, load assigned reviews to get the review and its taskId
      // This ensures we have the correct taskId even if the URL param is different
      // The review.taskId points to the ORIGINAL TASK that needs to be reviewed
      let originalTaskId: string | null = null;
      try {
        console.log('[Review] Loading assigned reviews to find review for taskId:', idToUse);
        const reviewsResponse = await freelancerService.getAssignedReviews();
        console.log('[Review] Reviews response:', {
          success: reviewsResponse.success,
          reviewsCount: reviewsResponse.data?.reviews?.length || 0,
          reviews: reviewsResponse.data?.reviews
        });

        if (reviewsResponse.success && reviewsResponse.data.reviews) {
          allAssignedReviews = reviewsResponse.data.reviews;
          // Try to find review by matching taskId or review ID
          taskReview = reviewsResponse.data.reviews.find(
            (r: Review) => {
              // Handle taskId as string, object with _id/id, or nested structure
              const reviewTaskId = typeof r.taskId === 'object' && r.taskId !== null
                ? (r.taskId as any)._id || (r.taskId as any).id || (r.taskId as any).toString()
                : r.taskId || (r as any).taskId;
              const reviewId = r.id || r._id;

              // Match by review's taskId OR by review ID (in case URL has review ID)
              const taskIdMatch = reviewTaskId === idToUse ||
                reviewTaskId?.toString() === idToUse;
              const reviewIdMatch = reviewId === idToUse ||
                reviewId?.toString() === idToUse;

              console.log('[Review] Checking review:', {
                reviewId,
                reviewTaskId,
                idToUse,
                taskIdMatch,
                reviewIdMatch
              });

              return taskIdMatch || reviewIdMatch;
            }
          ) || null;

          console.log('[Review] Found matching review:', taskReview);

          if (taskReview) {
            setReview(taskReview);
            // Pre-fill feedback if review already exists
            if (taskReview.feedback) setFeedback(taskReview.feedback);

            // CRITICAL: Get the original task ID from the review
            // This is the task that was assigned for review - we need to show its submission
            // Handle taskId as string, object with _id/id, or nested structure
            const rawTaskId = taskReview.taskId || (taskReview as any).taskId;
            if (rawTaskId) {
              if (typeof rawTaskId === 'object' && rawTaskId !== null) {
                // taskId is an object (populated), extract the ID
                originalTaskId = (rawTaskId as any)._id || (rawTaskId as any).id || rawTaskId.toString();
              } else {
                // taskId is a string
                originalTaskId = rawTaskId.toString();
              }

              console.log('[Review] Extracted original task ID:', {
                rawTaskId,
                originalTaskId,
                rawTaskIdType: typeof rawTaskId,
                isObject: typeof rawTaskId === 'object'
              });
              console.log('[Review] URL taskId was:', idToUse, 'but using original taskId:', originalTaskId);
            } else {
              console.warn('[Review] WARNING: Review found but taskId is missing or null!', taskReview);
            }
          } else {
            console.warn('[Review] No matching review found for taskId:', idToUse);
            console.log('[Review] Available reviews:', reviewsResponse.data.reviews.map((r: any) => ({
              reviewId: r.id || r._id,
              taskId: r.taskId,
              taskIdType: typeof r.taskId
            })));
          }
        }
      } catch (error) {
        console.error('[Review] Failed to load reviews:', error);
      }

      // Use the original task ID from review if available, otherwise use the URL param
      const taskIdToLoad = originalTaskId || idToUse;

      console.log('[Review] Task ID to load:', {
        originalTaskId,
        idToUse,
        taskIdToLoad,
        willUseOriginal: !!originalTaskId
      });

      // Strategy 1: Try to get the ORIGINAL TASK by ID directly (most complete data including submission)
      // This is the task that was assigned for review - we need its submission
      try {
        console.log('[Review] Attempting to load task by ID:', taskIdToLoad);
        const taskResponse = await taskService.getTaskById(taskIdToLoad);
        console.log('[Review] Task response:', {
          success: taskResponse.success,
          statusCode: taskResponse.statusCode,
          message: taskResponse.message,
          hasData: !!taskResponse.data,
          taskId: taskResponse.data?._id || taskResponse.data?.id,
          hasSubmission: !!taskResponse.data?.submission,
          submissionLength: taskResponse.data?.submission?.length || 0
        });

        if (taskResponse.success && taskResponse.data) {
          foundTask = taskResponse.data;
          console.log('[Review] ✅ Original task loaded by ID, submission:', foundTask.submission ? 'Present' : 'Missing', {
            taskId: foundTask._id || foundTask.id,
            status: foundTask.status,
            hasSubmission: !!foundTask.submission,
            submissionLength: foundTask.submission?.length || 0,
            submissionPreview: foundTask.submission?.substring(0, 100) || 'N/A',
            fullSubmission: foundTask.submission
          });
        } else {
          console.warn('[Review] Task response was not successful:', taskResponse);
        }
      } catch (error: any) {
        console.error('[Review] Failed to load original task by ID:', {
          error,
          message: error?.message,
          status: error?.status,
          statusCode: error?.statusCode,
          response: error?.response
        });
      }

      // Strategy 2: Try to get task from Project Tasks (try IN_REVIEW first, then all statuses)
      if (!foundTask) {
        try {
          // First try with IN_REVIEW status
          let projectTasksResponse = await projectService.getProjectTasks(projectId, 1, 100, {
            status: 'IN_REVIEW'
          });
          if (projectTasksResponse.success && projectTasksResponse.data.tasks) {
            foundTask = projectTasksResponse.data.tasks.find(
              (t: Task) => (t._id === taskIdToLoad || t.id === taskIdToLoad) ||
                (t._id === idToUse || t.id === idToUse)
            ) || null;
          }

          // If not found, try without status filter (to catch ASSIGNED tasks with reviews)
          if (!foundTask) {
            projectTasksResponse = await projectService.getProjectTasks(projectId, 1, 100, {});
            if (projectTasksResponse.success && projectTasksResponse.data.tasks) {
              foundTask = projectTasksResponse.data.tasks.find(
                (t: Task) => (t._id === taskIdToLoad || t.id === taskIdToLoad) ||
                  (t._id === idToUse || t.id === idToUse)
              ) || null;
            }
          }
        } catch (error) {
          console.log('[Review] Failed to load from Project Tasks:', error);
        }
      }

      // Strategy 3: Try to get task from My Tasks (most reliable for assigned tasks)
      if (!foundTask) {
        try {
          const myTasksResponse = await taskService.getMyTasks(1, 100);
          if (myTasksResponse.success && myTasksResponse.data.tasks) {
            foundTask = myTasksResponse.data.tasks.find(
              (t: Task) => (t._id === taskIdToLoad || t.id === taskIdToLoad) ||
                (t._id === idToUse || t.id === idToUse)
            ) || null;
          }
        } catch (error) {
          console.log('[Review] Failed to load from My Tasks:', error);
        }
      }

      // Strategy 4: Try to get task from Available Tasks (if not in My Tasks)
      if (!foundTask) {
        try {
          const availableTasksResponse = await taskService.getAvailableTasks(1, 100);
          if (availableTasksResponse.success && availableTasksResponse.data.tasks) {
            foundTask = availableTasksResponse.data.tasks.find(
              (t: Task) => (t._id === taskIdToLoad || t.id === taskIdToLoad) ||
                (t._id === idToUse || t.id === idToUse)
            ) || null;
          }
        } catch (error) {
          console.log('[Review] Failed to load from Available Tasks:', error);
        }
      }

      // Load transcript segments (for transcription tasks) - This is critical for review
      // Use the original task ID to load the transcript (the task being reviewed)
      setIsLoadingTranscript(true);
      try {
        console.log('[Review] Fetching transcript for original task ID:', taskIdToLoad);
        const transcriptResponse = await taskService.getTranscript(taskIdToLoad);
        console.log('[Review] Transcript API response:', {
          success: transcriptResponse.success,
          statusCode: transcriptResponse.statusCode,
          message: transcriptResponse.message,
          hasData: !!transcriptResponse.data,
          dataType: typeof transcriptResponse.data,
          dataKeys: transcriptResponse.data ? Object.keys(transcriptResponse.data) : [],
          segmentsCount: transcriptResponse.data?.segments?.length || 0,
          segments: transcriptResponse.data?.segments,
          fullResponse: JSON.stringify(transcriptResponse, null, 2)
        });

        if (transcriptResponse.success && transcriptResponse.data) {
          const segments = transcriptResponse.data.segments || [];
          console.log('[Review] Segments array:', {
            isArray: Array.isArray(segments),
            length: segments.length,
            firstSegment: segments[0],
            allSegments: segments
          });

          if (segments.length > 0) {
            console.log('[Review] Transcript loaded successfully:', segments.length, 'segments');
            setTranscript(transcriptResponse.data);
          } else {
            console.warn('[Review] Transcript API returned success but segments array is empty');
            console.warn('[Review] Response data structure:', transcriptResponse.data);
            // Try draft as fallback
            try {
              console.log('[Review] Trying to load draft as fallback...');
              const draftResponse = await taskService.getDraft(taskIdToLoad);
              if (draftResponse.success && draftResponse.data?.segments && draftResponse.data.segments.length > 0) {
                console.log('[Review] Draft segments loaded as fallback:', draftResponse.data.segments.length, 'segments');
                setTranscript({ segments: draftResponse.data.segments });
              } else {
                console.warn('[Review] No draft segments found either');
                setTranscript(null);
              }
            } catch (draftError: any) {
              console.error('[Review] Failed to load draft as fallback:', draftError);
              setTranscript(null);
            }
          }
        } else {
          console.warn('[Review] Transcript API returned unsuccessful response:', transcriptResponse);
          setTranscript(null);
        }
      } catch (error: any) {
        console.error('[Review] Failed to load transcript:', error);
        console.error('[Review] Error details:', {
          message: error?.message,
          response: error?.response,
          status: error?.status,
          statusCode: error?.statusCode
        });
        setTranscript(null);
        // Show error to user if it's an authorization or network error
        if (error?.message?.includes('403') || error?.message?.includes('authorized')) {
          console.warn('[Review] Not authorized to view transcript - this might be expected for non-transcription tasks');
        } else if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          console.warn('[Review] Transcript not found - freelancer may not have submitted transcription yet');
        } else {
          // Only show error for unexpected errors
          console.error('[Review] Unexpected error loading transcript:', error);
        }
      } finally {
        setIsLoadingTranscript(false);
      }

      if (foundTask) {
        console.log('[Review] ✅ Final task data (original task being reviewed):', {
          id: foundTask._id || foundTask.id,
          title: foundTask.title,
          status: foundTask.status,
          hasSubmission: !!foundTask.submission,
          submissionLength: foundTask.submission?.length || 0,
          submissionPreview: foundTask.submission?.substring(0, 100) || 'N/A',
          submissionValue: foundTask.submission,
          submissionType: typeof foundTask.submission,
          originalTaskId: taskIdToLoad,
          urlTaskId: idToUse,
          fullTaskObject: JSON.stringify(foundTask, null, 2)
        });

        // CRITICAL CHECK: If submission is missing, log warning
        if (!foundTask.submission) {
          console.error('[Review] ⚠️ WARNING: Task loaded but submission is MISSING!', {
            taskId: foundTask._id || foundTask.id,
            taskStatus: foundTask.status,
            taskTitle: foundTask.title,
            allTaskKeys: Object.keys(foundTask)
          });
        } else {
          console.log('[Review] ✅ Submission found:', {
            length: foundTask.submission.length,
            preview: foundTask.submission.substring(0, 200),
            isURL: foundTask.submission.match(/^https?:\/\//i) !== null
          });
        }

        setTask(foundTask);

        // Extract sourceTaskId from review task tags if available
        let sourceTaskId: string | null = null;
        if (foundTask && foundTask.tags && Array.isArray(foundTask.tags)) {
          for (const tag of foundTask.tags) {
            try {
              const parsedTag = typeof tag === 'string' ? JSON.parse(tag) : tag;
              if (parsedTag && parsedTag.sourceTaskId) {
                sourceTaskId = parsedTag.sourceTaskId;
                console.log('[Review] Found sourceTaskId in tags:', sourceTaskId);
                break;
              }
            } catch {
              // Not JSON, continue
            }
          }
        }

        // Load source task if we have sourceTaskId (for review tasks)
        if (sourceTaskId) {
          // Fallback: If we didn't find the review earlier (e.g. because we're viewing the review task, not the original),
          // try to find it now using the sourceTaskId (which IS the original task ID)
          if (!taskReview && allAssignedReviews.length > 0) {
            console.log('[Review] Attempting to find review using sourceTaskId:', sourceTaskId);
            const reviewBySource = allAssignedReviews.find(
              (r: any) => {
                const rTaskId = typeof r.taskId === 'object' && r.taskId !== null
                  ? (r.taskId as any)._id || (r.taskId as any).id || (r.taskId as any).toString()
                  : r.taskId;
                return rTaskId === sourceTaskId || rTaskId?.toString() === sourceTaskId;
              }
            );

            if (reviewBySource) {
              console.log('[Review] Found review using sourceTaskId:', reviewBySource);
              taskReview = reviewBySource;
              setReview(reviewBySource);
              // if (reviewBySource.rating) setRating(reviewBySource.rating); // State removed
              if (reviewBySource.feedback) setFeedback(reviewBySource.feedback);
            }
          }

          try {
            const sourceTaskResponse = await taskService.getTaskById(sourceTaskId);
            if (sourceTaskResponse.success && sourceTaskResponse.data) {
              setSourceTask(sourceTaskResponse.data);
              console.log('[Review] Source task loaded:', {
                id: sourceTaskResponse.data._id || sourceTaskResponse.data.id,
                title: sourceTaskResponse.data.title,
                hasDescription: !!sourceTaskResponse.data.description,
                hasAudioUrl: !!sourceTaskResponse.data.audioUrl
              });
            }
          } catch (error) {
            console.error('[Review] Failed to load source task:', error);
          }
        } else {
          // If no sourceTaskId, the current task is the source task
          setSourceTask(foundTask);
        }
      } else {
        // Final attempt: if we still don't have the task, try to load it directly using the original task ID
        try {
          const directTaskResponse = await taskService.getTaskById(taskIdToLoad);
          if (directTaskResponse.success) {
            setTask(directTaskResponse.data);
            foundTask = directTaskResponse.data;
            setSourceTask(directTaskResponse.data);
            console.log('[Review] Task loaded in final attempt, submission:', foundTask.submission ? 'Present' : 'Missing');
          }
        } catch (error) {
          console.log('[Review] Failed to load task directly:', error);
        }
      }

      if (!foundTask) {
        showError("Task not found. It may not be assigned to you yet.");
        setTimeout(() => {
          router.push(`/projects/${projectId}/review`);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to load task:", error);
      showError("Failed to load task. Please try again.");
      setTimeout(() => {
        router.push(`/projects/${projectId}/review`);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewDecision = async (decision: 'APPROVE' | 'REJECT') => {
    // Validation for REJECT: Feedback is required
    if (decision === 'REJECT' && !feedback.trim()) {
      showError("Please provide feedback for rejection");
      return;
    }

    // Validation for APPROVE: Feedback is optional, default to "Approved"
    const finalFeedback = feedback.trim() || (decision === 'APPROVE' ? "Approved" : "");

    // If we don't have a review object, try to find it one more time
    if (!review) {
      showError("Review assignment not found. Please contact support or try refreshing the page.");
      console.error('[Review Submit] No review object found. Cannot submit without review ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewId = review.id || review._id;
      if (!reviewId) {
        showError("Review ID not found");
        console.error('[Review Submit] Review object exists but has no ID:', review);
        return;
      }

      console.log('[Review Submit] Submitting review decision:', {
        reviewId,
        decision,
        feedbackLength: finalFeedback.length
      });

      // Set rating to 5 for Approve, 1 for Reject (backend handles actual status update)
      const ratingValue = decision === 'APPROVE' ? 5 : 1;

      await freelancerService.submitReview(reviewId, ratingValue, finalFeedback, decision);
      showSuccess(`Task ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully!`);

      // Navigate to completed tasks page after a short delay
      setTimeout(() => {
        router.push("/tasks/completed");
      }, 1500);
    } catch (error) {
      console.error("Failed to submit review:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit review. Please try again.";
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Task not found</p>
          <Button onClick={() => router.push(`/projects/${projectId}/review`)} className="mt-4">
            Back to Review Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const hasAudio = task?.audioUrl || (task?.audioUrls && task.audioUrls.length > 0);
  const audioUrl = task?.audioUrl || (task?.audioUrls && task.audioUrls.length > 0 ? task.audioUrls[0] : null);

  // Determine project type and workspace mode
  const projectType = project?.type;

  // Extract review type from task tags if available
  let reviewType: 'AUDIO_REVIEW' | 'TRANSCRIPTION_REVIEW' | null = null;
  if (task && task.tags && Array.isArray(task.tags)) {
    for (const tag of task.tags) {
      try {
        const parsedTag = typeof tag === 'string' ? JSON.parse(tag) : tag;
        if (parsedTag && parsedTag.reviewType) {
          reviewType = parsedTag.reviewType;
          console.log('[Review] Found reviewType in tags:', reviewType);
          break;
        }
      } catch {
        // Not JSON, continue
      }
    }
  }

  // Determine if this is an audio or transcription project/review
  const originalProjectType = project?.metadata?.originalProjectType;

  // Check source task to help determine type (transcription tasks have audioUrl but submission is text/transcript)
  const sourceTaskHasAudio = !!(sourceTask?.audioUrl || (sourceTask?.audioUrls && sourceTask.audioUrls.length > 0));
  const sourceTaskSubmissionIsText = sourceTask?.submission && 
    !sourceTask.submission.match(/^https?:\/\//i) && 
    !sourceTask.submission.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)/i);
  const hasTranscriptSegments = transcript && transcript.segments && Array.isArray(transcript.segments) && transcript.segments.length > 0;
  
  // Check task submission format for transcription patterns (e.g., "[0:00-0:03] Speaker 1: text")
  // Pattern matches: [0:00-0:03] or [1:23-1:45] format, or "Speaker 1:" or "Speaker 2:" format
  const taskSubmissionIsTranscriptionFormat = task?.submission && 
    typeof task.submission === 'string' &&
    (task.submission.match(/\[\d+:\d{2}-\d+:\d{2}\]/) || // Matches [0:00-0:03] or [1:23-1:45] format
     task.submission.match(/\[\d+:\d+-\d+:\d+\]/) || // Fallback: matches [0:00-0:03] with flexible digits
     task.submission.match(/Speaker \d+:/i)); // Matches "Speaker 1:" format
  
  // Also check source task submission format
  const sourceTaskSubmissionIsTranscriptionFormat = sourceTask?.submission && 
    typeof sourceTask.submission === 'string' &&
    (sourceTask.submission.match(/\[\d+:\d{2}-\d+:\d{2}\]/) || // Matches [0:00-0:03] or [1:23-1:45] format
     sourceTask.submission.match(/\[\d+:\d+-\d+:\d+\]/) || // Fallback: matches [0:00-0:03] with flexible digits
     sourceTask.submission.match(/Speaker \d+:/i)); // Matches "Speaker 1:" format

  // Determine if this is an audio or transcription project/review
  // Priority: reviewType from tags > originalProjectType from metadata > source task characteristics
  const isAudioProject =
    projectType === 'AUDIO_RECORDING' ||
    reviewType === 'AUDIO_REVIEW' ||
    (projectType === 'REVIEW' && originalProjectType === 'AUDIO_RECORDING') ||
    // Fallback: if reviewType is not set and we have a submission that looks like audio (URL with audio extension)
    (projectType === 'REVIEW' && !reviewType && !originalProjectType && 
     sourceTask?.submission && sourceTask.submission.match(/^https?:\/\//i) && 
     sourceTask.submission.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)/i));

  const isTranscriptionProject =
    projectType === 'TRANSCRIPTION' ||
    reviewType === 'TRANSCRIPTION_REVIEW' ||
    (projectType === 'REVIEW' && originalProjectType === 'TRANSCRIPTION') ||
    // Fallback: if reviewType is not set, check if we have transcript segments, source task characteristics, or submission format
    (projectType === 'REVIEW' && !reviewType && !originalProjectType && 
     (hasTranscriptSegments || 
      (sourceTaskHasAudio && sourceTaskSubmissionIsText) ||
      taskSubmissionIsTranscriptionFormat ||
      sourceTaskSubmissionIsTranscriptionFormat));

  console.log('[Review] Project type detection:', {
    projectType,
    originalProjectType,
    reviewType,
    isAudioProject,
    isTranscriptionProject,
    sourceTaskHasAudio,
    sourceTaskSubmissionIsText,
    hasTranscriptSegments,
    taskSubmissionIsTranscriptionFormat,
    sourceTaskSubmissionIsTranscriptionFormat,
    taskSubmission: task?.submission?.substring(0, 100),
    sourceTaskSubmission: sourceTask?.submission?.substring(0, 100)
  });

  // Get source task data
  const sourceAudioUrl = sourceTask?.audioUrl || (sourceTask?.audioUrls && sourceTask.audioUrls.length > 0 ? sourceTask.audioUrls[0] : null);
  const sourceDescription = sourceTask?.description;

  // Identify distinct Review Workspace Modes
  // CRITICAL: If we have transcript segments, ALWAYS treat as transcription review (highest priority)
  // This overrides reviewType tags because transcript segments are definitive proof of transcription
  const hasTranscriptionIndicators = hasTranscriptSegments || 
    taskSubmissionIsTranscriptionFormat || 
    sourceTaskSubmissionIsTranscriptionFormat;
  
  // Prioritize transcript segments - if they exist, it's definitely a transcription review
  const finalIsTranscriptionProject = hasTranscriptSegments || // Highest priority: transcript segments exist
    isTranscriptionProject || 
    (projectType === 'REVIEW' && originalProjectType === 'TRANSCRIPTION') ||
    (projectType === 'REVIEW' && hasTranscriptionIndicators);
  
  // If we have clear transcription indicators (especially transcript segments), don't treat as audio
  const finalIsAudioProject = isAudioProject && !finalIsTranscriptionProject && !hasTranscriptionIndicators;

  const hasScriptFile = finalIsAudioProject && sourceAudioUrl && /\.(txt|pdf|doc|docx)$/i.test(sourceAudioUrl.split('?')[0]);

  const isTranscriptionReview = finalIsTranscriptionProject;
  const isScriptedAudioReview = finalIsAudioProject && hasScriptFile;
  const isOpenAudioReview = finalIsAudioProject && !hasScriptFile;

  console.log('[Review] Final workspace mode:', {
    isTranscriptionReview,
    isScriptedAudioReview,
    isOpenAudioReview,
    hasTranscriptSegments,
    transcriptSegmentsCount: transcript?.segments?.length || 0,
    finalIsTranscriptionProject,
    finalIsAudioProject,
    hasTranscriptionIndicators
  });

  // Helper function to format timestamp (seconds to M:SS.S format like admin page)
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1).padStart(4, '0');
    return `${mins}:${secs}`;
  };

  // Calculate average quality from segments
  const calculateAverageQuality = (segments: any[]): number => {
    if (!segments || segments.length === 0) return 0;
    const sum = segments.reduce((acc, seg) => acc + (seg.quality || 0), 0);
    return sum / segments.length;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/tasks/draft")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tasks
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Review Task</h1>
            <p className="text-muted-foreground">{task.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{task.status}</Badge>
          <Badge variant="outline">{task.language}</Badge>
          {task.priority && (
            <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}>
              {task.priority}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input Section (Left) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isScriptedAudioReview ? "Input (Original Script)" :
                isOpenAudioReview ? "Input (Task Instructions)" :
                  isTranscriptionReview ? "Input (Source Audio)" : "Input (Original)"}
            </CardTitle>
            <CardDescription>
              {isScriptedAudioReview
                ? "Original script provided for the recording."
                : isOpenAudioReview
                  ? "Instructions provided for the recording task."
                  : isTranscriptionReview
                    ? "Audio file provided for transcription."
                    : "Original content provided for this task."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {isScriptedAudioReview ? (
              // SCRIPT MODE UI
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Script Content</Label>
                  {/* Download Button for Script */}
                  <a
                    href={sourceAudioUrl!}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" /> Download Script
                  </a>
                </div>

                {/* TXT File Display */}
                {/\.txt$/i.test(sourceAudioUrl!.split('?')[0]) ? (
                  <div className="space-y-2">
                    {scriptContent && !scriptContent.includes('Unable to load script content') ? (
                      <div className="border rounded-lg p-4 bg-white dark:bg-zinc-950 h-[400px] overflow-y-auto font-mono text-sm shadow-inner whitespace-pre-wrap">
                        {scriptContent}
                      </div>
                    ) : scriptContent && scriptContent.includes('Unable to load script content') ? (
                      <div className="border rounded-lg overflow-hidden h-[400px] bg-white dark:bg-zinc-950">
                        <iframe
                          src={sourceAudioUrl!}
                          className="w-full h-full"
                          title="Script Content"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-white dark:bg-zinc-950 h-[400px] overflow-y-auto font-mono text-sm shadow-inner whitespace-pre-wrap flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading script content...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) :
                  /* PDF File Display */
                  /\.pdf$/i.test(sourceAudioUrl!.split('?')[0]) ? (
                    <div className="border rounded-lg overflow-hidden h-[400px] bg-zinc-100 dark:bg-zinc-900">
                      <iframe
                        src={sourceAudioUrl!}
                        className="w-full h-full"
                        title="Script PDF"
                      />
                    </div>
                  ) : (
                    /* DOC/DOCX Display */
                    <div className="border rounded-lg p-8 bg-muted/50 text-center flex flex-col items-center justify-center h-[200px]">
                      <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Document Preview Not Available</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        Please download the file to view the script.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={sourceAudioUrl!} target="_blank" rel="noopener noreferrer">
                          Download File
                        </a>
                      </Button>
                    </div>
                  )}
              </div>
            ) : isOpenAudioReview ? (
              // SELF-RECORDING / NO SCRIPT UI
              sourceDescription ? (
                <div className="space-y-2">
                  <Label>Task Instructions / Content</Label>
                  <div className="border rounded-lg p-4 bg-muted/50 text-sm whitespace-pre-wrap">
                    {sourceDescription}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No instructions provided for this task.
                </div>
              )
            ) : isTranscriptionReview ? (
              // For TRANSCRIPTION: Show the audio file that was provided
              sourceAudioUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mic className="h-4 w-4" />
                    <span>Audio File</span>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <audio controls className="w-full">
                      <source src={sourceAudioUrl} type="audio/mpeg" />
                      <source src={sourceAudioUrl} type="audio/wav" />
                      <source src={sourceAudioUrl} type="audio/ogg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No audio file provided for this task.
                </div>
              )
            ) : (
              // Fallback: Show whatever is available
              <>
                {hasAudio && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mic className="h-4 w-4" />
                      <span>Audio File</span>
                    </div>
                    {audioUrl && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <audio controls className="w-full">
                          <source src={audioUrl} type="audio/mpeg" />
                          <source src={audioUrl} type="audio/wav" />
                          <source src={audioUrl} type="audio/ogg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                )}
                {task.description && (
                  <div className="space-y-2">
                    <Label>Task Description</Label>
                    <div className="border rounded-lg p-4 bg-muted/50 text-sm">
                      {task.description}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Output Section (Right) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {isScriptedAudioReview || isOpenAudioReview ? "Output (Recorded Audio)" :
                isTranscriptionReview ? "Output (Transcription)" : "Output (Submitted Work)"}
            </CardTitle>
            <CardDescription>
              {isScriptedAudioReview || isOpenAudioReview
                ? "Audio recording submitted by the freelancer"
                : isTranscriptionReview
                  ? "Transcription text submitted by the freelancer"
                  : "Work submitted by the freelancer for review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTranscript ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading transcript...
              </div>
            ) : (isTranscriptionReview || (transcript && transcript.segments && Array.isArray(transcript.segments) && transcript.segments.length > 0)) && transcript && transcript.segments && Array.isArray(transcript.segments) && transcript.segments.length > 0 ? (
              // Priority 1: Show transcript segments (for transcription tasks) - matching admin page style
              // Show transcript segments if they exist, regardless of detection (safety fallback)
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Transcription Text</h4>
                  <div className="p-4 bg-muted rounded-lg max-h-[500px] overflow-y-auto">
                    <div className="space-y-3">
                      {transcript.segments.map((segment: any, index: number) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatTimestamp(segment.timestamp.start)} - {formatTimestamp(segment.timestamp.end)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Quality: {segment.quality || 0}/5
                            </span>
                          </div>
                          <p className="text-sm mb-1">{segment.content}</p>
                          {segment.remark && (
                            <p className="text-xs text-blue-600 italic">Note: {segment.remark}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Total Segments</h4>
                    <p className="text-sm text-muted-foreground">
                      {transcript.segments.length}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Average Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      {calculateAverageQuality(transcript.segments).toFixed(1)}/5
                    </p>
                  </div>
                </div>
              </div>
            ) : (isScriptedAudioReview || isOpenAudioReview) ? (
              // For AUDIO_RECORDING: Show the audio recording submitted by freelancer
              // Source: sourceTask.submission (preferred) OR task.audioUrl (from admin creation) OR task.submission
              (() => {
                const submissionUrl = sourceTask?.submission || task.audioUrl || task.submission;

                console.log('[Review Output] Checking submission:', {
                  sourceTaskSubmission: sourceTask?.submission,
                  taskAudioUrl: task.audioUrl,
                  taskSubmission: task.submission,
                  finalSubmissionUrl: submissionUrl,
                  isURL: submissionUrl ? submissionUrl.match(/^https?:\/\//i) !== null : false,
                  isAudio: submissionUrl ? (
                    submissionUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)/i) !== null ||
                    submissionUrl.includes('/audio/') ||
                    submissionUrl.includes('audio')
                  ) : false
                });

                if (submissionUrl) {
                  return (
                    <div className="space-y-4">
                      {/* Check if submission is a URL (audio file) */}
                      {submissionUrl.match(/^https?:\/\//i) ? (
                        // Submission is a URL - check if it's an audio file
                        // Improved regex to match audio files with or without query parameters
                        submissionUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)/i) ||
                          submissionUrl.includes('/audio/') ||
                          submissionUrl.includes('audio') ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mic className="h-4 w-4" />
                              <span>Submitted Audio File</span>
                            </div>
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <audio controls className="w-full">
                                <source src={submissionUrl} type="audio/mpeg" />
                                <source src={submissionUrl} type="audio/wav" />
                                <source src={submissionUrl} type="audio/ogg" />
                                <source src={submissionUrl} type="audio/webm" />
                                <source src={submissionUrl} type="audio/mp4" />
                                Your browser does not support the audio element.
                              </audio>
                              <a
                                href={submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm mt-2 block"
                              >
                                Download Audio File
                              </a>
                            </div>
                          </div>
                        ) : (
                          // Submission is a URL but not audio - treat as file link
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Submitted File</span>
                            </div>
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <a
                                href={submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View Submitted File
                              </a>
                            </div>
                          </div>
                        )
                      ) : (
                        // Submission is plain text
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Submitted Work</span>
                          </div>
                          <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                            <div className="whitespace-pre-wrap text-sm">{submissionUrl}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // No submission found
                  return (
                    <div className="text-sm text-muted-foreground text-center py-8 space-y-2">
                      <p>No audio recording available for review yet.</p>
                      <p className="text-xs text-muted-foreground/70">
                        The freelancer may not have submitted the audio recording yet.
                      </p>
                    </div>
                  );
                }
              })()
            ) : isTranscriptionReview ? (
              // For TRANSCRIPTION: Show transcript segments if available, otherwise show submission text
              (() => {
                const submissionText = sourceTask?.submission || task?.submission;
                if (submissionText && typeof submissionText === 'string' && !submissionText.match(/^https?:\/\//i)) {
                  // Show submission text if it's not a URL (transcription text)
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Submitted Transcription</span>
                      </div>
                      <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                        <div className="whitespace-pre-wrap text-sm">{submissionText}</div>
                      </div>
                    </div>
                  );
                } else {
                  // No submission text available
                  return (
                    <div className="text-sm text-muted-foreground text-center py-8 space-y-2">
                      <p>No transcription available for review yet.</p>
                      {!isLoadingTranscript && (
                        <p className="text-xs text-muted-foreground/70">
                          {transcript === null
                            ? "The freelancer may not have submitted the transcription yet."
                            : "Waiting for transcription submission..."}
                        </p>
                      )}
                    </div>
                  );
                }
              })()
            ) : (isScriptedAudioReview || isOpenAudioReview) ? (
              // For AUDIO_RECORDING: Show message if no audio recording found
              <div className="text-sm text-muted-foreground text-center py-8 space-y-2">
                <p>No audio recording available for review yet.</p>
                <p className="text-xs text-muted-foreground/70">
                  The freelancer may not have submitted the audio recording yet.
                </p>
              </div>
            ) : (
              // Fallback: Generic message
              <div className="text-sm text-muted-foreground text-center py-8 space-y-2">
                <p>No submission available for review yet.</p>
                {!isLoadingTranscript && (
                  <p className="text-xs text-muted-foreground/70">
                    {transcript === null
                      ? "The freelancer may not have submitted the work yet."
                      : "Waiting for submission..."}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Review</CardTitle>
          <CardDescription>
            Provide your rating and feedback for this submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback {feedback.trim() ? '' : '(Optional for Approval)'}</Label>
            <Textarea
              id="feedback"
              placeholder="Provide feedback about the submission (required for rejection)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/review`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => handleReviewDecision('REJECT')}
                disabled={isSubmitting || review?.status === 'COMPLETED'}
                className="min-w-[120px]"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject
              </Button>

              <Button
                onClick={() => handleReviewDecision('APPROVE')}
                disabled={isSubmitting || review?.status === 'COMPLETED'}
                className="min-w-[120px] bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </Button>
            </div>
          </div>

          {/* Warning if review object not found */}
          {!review && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-500">⚠️</span>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-300">Review Assignment Not Found</div>
                  <div className="text-yellow-700 dark:text-yellow-400 mt-1">
                    The review assignment record could not be loaded. This may prevent submission.
                    Please contact support if the issue persists.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info - Shows why button might be disabled */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs space-y-1">
              <div className="font-semibold mb-2">Debug Info:</div>
              <div>Feedback: {feedback.trim() ? `"${feedback.substring(0, 30)}..."` : 'Empty'} {feedback.trim() ? '✓' : '✗'}</div>
              <div>Review Object: {review ? 'Found' : 'NOT FOUND'} {review ? '✓' : '✗'}</div>
              <div>Review ID: {review?.id || review?._id || 'N/A'}</div>
              <div>Review Status: {review?.status || 'N/A'}</div>
              <div>Is Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
              <div className="font-semibold mt-2">
                Button state depends on decision (Approve/Reject)
              </div>
              {!review && (
                <div className="text-orange-500 font-semibold mt-2">
                  ⚠️ WARNING: Review object not found! Button is enabled but submission may fail.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}

