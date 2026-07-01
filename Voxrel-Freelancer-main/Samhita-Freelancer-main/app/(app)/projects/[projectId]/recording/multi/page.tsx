"use client";

import { ArrowLeft, Loader2, Users, Play, Pause, Send } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveKitRoom } from "@/components/multispeaker";
import { taskService } from "@/services/task.service";
import { Task } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EnhancedWaveform } from "@/components/blocks/audio/enhanced-waveform";
import { SmartWaveformRef } from "@/components/blocks/audio/smart-waveform";

export default function MultiSpeakerRecordingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const taskIdFromUrl = searchParams.get('taskId');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tokenData, setTokenData] = useState<{
    token: string;
    url: string;
    identity: string;
    roomName: string;
  } | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  // If taskId is in URL, start with loading token state to show loading screen immediately
  const [isLoadingToken, setIsLoadingToken] = useState(!!taskIdFromUrl);
  const [error, setError] = useState<string | null>(null);

  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  // Recording state (from server-side recording)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef<SmartWaveformRef>(null);

  // Only load task list if there's no taskId in URL (user manually navigated to selection page)
  useEffect(() => {
    if (!taskIdFromUrl) {
      loadMultiSpeakerTasks();
    }
  }, [projectId, taskIdFromUrl]);

  // Auto-start session if taskId is provided in URL (only once)
  useEffect(() => {
    // Prevent infinite loop: only auto-start once per taskId
    if (hasAutoStarted || !taskIdFromUrl) return;
    
    // If we already have token data, don't auto-start again
    if (tokenData || selectedTask) return;
    
    // Auto-start immediately when taskId is in URL - fetch task and token directly
    const autoStartSession = async () => {
      console.log('Auto-starting session for task from URL:', taskIdFromUrl);
      setHasAutoStarted(true); // Mark as started to prevent re-triggering
      setIsLoadingToken(true);
      setError(null);

      try {
        // First, fetch the task to verify it's a multi-speaker task
        const taskResponse = await taskService.getTaskById(taskIdFromUrl);
        if (!taskResponse.success || !taskResponse.data) {
          throw new Error('Task not found');
        }

        const task = taskResponse.data;
        if (task.type !== 'multi') {
          toast.error('This task is not a multi-speaker task');
          setError('This task is not a multi-speaker task');
          return;
        }

        // Set the task
        setSelectedTask(task);

        // Then fetch the token
        const tokenResponse = await taskService.getRoomToken(taskIdFromUrl);
        if (tokenResponse.success && tokenResponse.data) {
          setTokenData(tokenResponse.data);
          toast.success("Connected to multi-speaker session");
        } else {
          throw new Error(tokenResponse.message || "Failed to get room token");
        }
      } catch (err: any) {
        console.error("Error auto-starting session:", err);
        const errorMessage = err.message || "Failed to connect to session. Please ensure you are assigned to this task.";
        setError(errorMessage);
        toast.error(errorMessage);
        // Reset so user can try again
        setHasAutoStarted(false);
        setSelectedTask(null);
      } finally {
        setIsLoadingToken(false);
      }
    };

    autoStartSession();
  }, [taskIdFromUrl, hasAutoStarted, tokenData, selectedTask]);

  // Reset auto-start flag when taskId changes
  useEffect(() => {
    if (taskIdFromUrl) {
      setHasAutoStarted(false);
    }
  }, [taskIdFromUrl]);

  const loadMultiSpeakerTasks = async () => {
    try {
      setIsLoadingTasks(true);
      setError(null);
      const response = await taskService.getMultiSpeakerTasks(projectId);
      if (response.success && response.data.tasks) {
        setTasks(response.data.tasks);
        if (response.data.tasks.length === 0) {
          setError("No multi-speaker tasks found for this project. Please contact an admin to create a multi-speaker task.");
        }
      } else {
        setError("Failed to load multi-speaker tasks");
      }
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load multi-speaker tasks");
      toast.error("Failed to load tasks");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleStartSession = async (task: Task) => {
    if (!task._id && !task.id) {
      toast.error("Invalid task ID");
      return;
    }

    const taskId = task._id || task.id!;
    setIsLoadingToken(true);
    setError(null);

    try {
      const response = await taskService.getRoomToken(taskId);
      if (response.success && response.data) {
        setTokenData(response.data);
        setSelectedTask(task);
        toast.success("Connected to multi-speaker session");
      } else {
        throw new Error(response.message || "Failed to get room token");
      }
    } catch (err: any) {
      console.error("Error getting room token:", err);
      const errorMessage =
        err.message || "Failed to connect to session. Please ensure you are assigned to this task.";
      setError(errorMessage);
      toast.error(errorMessage);
      // On error, mark as auto-started to prevent infinite retry loop
      setHasAutoStarted(true);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDisconnect = useCallback(async () => {
    setTokenData(null);
    // Don't reset selectedTask or hasAutoStarted - we need them for the recording playback view
    toast.info("Disconnected from session");
    
    // Check for recording URL after disconnect
    // The recording might still be processing, so we'll poll for it
    if (taskIdFromUrl || selectedTask?._id || selectedTask?.id) {
      const taskId = taskIdFromUrl || selectedTask?._id || selectedTask?.id;
      if (taskId) {
        // Poll for recording URL (already handled by the useEffect that checks for recording)
        console.log('Disconnected, checking for recording URL...');
      }
    }
  }, [taskIdFromUrl, selectedTask]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = useCallback(async () => {
    if (!recordingUrl) {
      toast.error("No recording to play");
      return;
    }
    if (isPlaying) {
      waveformRef.current?.pause();
    } else {
      await waveformRef.current?.play();
    }
  }, [isPlaying, recordingUrl]);

  const handleTimeUpdate = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, []);

  const handleAudioReady = useCallback((audioDuration: number) => {
    setDuration(audioDuration);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // Check for recording URL in task when component mounts, task changes, or after disconnect
  useEffect(() => {
    const checkForRecording = async () => {
      // Need either selectedTask or taskIdFromUrl to check
      if (!taskIdFromUrl && !selectedTask) return;
      
      const taskId = taskIdFromUrl || selectedTask?._id || selectedTask?.id;
      if (!taskId) return;

      try {
        const taskResponse = await taskService.getTaskById(taskId);
        if (taskResponse.success && taskResponse.data) {
          const task = taskResponse.data;
          // Check if task has a recording URL (from server-side recording)
          if (task.recordingUrl) {
            console.log('Found recording URL in task:', task.recordingUrl);
            setRecordingUrl(task.recordingUrl);
            // Update selectedTask if we don't have it yet
            if (!selectedTask) {
              setSelectedTask(task);
            }
            // Only show toast if we just found it (not on every poll)
            if (!recordingUrl) {
              toast.success("Recording is available! You can now listen to the session.");
            }
          }
        }
      } catch (err) {
        console.error('Error checking for recording:', err);
      }
    };

    checkForRecording();
    
    // Poll for recording URL every 5 seconds if we're waiting for it
    // Stop polling once we have the recording URL
    const interval = setInterval(() => {
      if (!recordingUrl) {
        checkForRecording();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedTask, taskIdFromUrl, recordingUrl]);

  // If taskId is in URL, NEVER show task selection - only show loading, error, or audio room
  if (taskIdFromUrl) {
    // Show error if auto-start failed
    if (error && !tokenData && !selectedTask && !isLoadingToken) {
      return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push(`/projects/${projectId}/recording`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recording Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">Multi-Speaker Recording</h1>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    // Show LiveKit room if token is available and no recording yet
    if (tokenData && selectedTask && !recordingUrl) {
      return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Task Selection
            </Button>
            <h1 className="text-3xl font-bold mb-2">Multi-Speaker Session</h1>
            <p className="text-muted-foreground">
              Task: {selectedTask.title}
            </p>
          </div>

          <LiveKitRoom
            token={tokenData.token}
            url={tokenData.url}
            roomName={tokenData.roomName}
            identity={tokenData.identity}
            taskId={taskIdFromUrl || selectedTask._id || selectedTask.id!}
            onDisconnect={handleDisconnect}
          />
        </div>
      );
    }

    // Show recording playback if recording is available
    if (recordingUrl && selectedTask) {
      const handleSubmit = async () => {
        const taskId = taskIdFromUrl || selectedTask._id || selectedTask.id;
        if (!taskId) {
          toast.error("Task ID is missing");
          return;
        }

        setIsSubmitting(true);
        try {
          // Submit the task with the recording URL as submission
          const response = await taskService.submitTask(taskId, {
            submission: recordingUrl, // Use recording URL as the submission
          });

          if (response.success) {
            toast.success("Task submitted for review successfully!");
            // Redirect to tasks page or project page
            router.push(`/projects/${projectId}/recording`);
          } else {
            throw new Error(response.message || "Failed to submit task");
          }
        } catch (err: any) {
          console.error("Error submitting task:", err);
          toast.error(err.message || "Failed to submit task for review");
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push(`/projects/${projectId}/recording`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recording Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">Session Recording</h1>
            <p className="text-muted-foreground">
              Task: {selectedTask.title} • {duration > 0 ? formatTime(duration) : 'Loading...'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recorded Session</CardTitle>
              <CardDescription>
                Listen to the multi-speaker session recording. Once you're satisfied, submit it for review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 w-full">
                <EnhancedWaveform
                  waveformRef={waveformRef}
                  audioUrl={recordingUrl}
                  duration={duration}
                  anchorA={0}
                  anchorB={duration}
                  mode="view"
                  size="professional"
                  formatTime={formatTime}
                  onPlayStateChange={handlePlayStateChange}
                  onTimeUpdate={handleTimeUpdate}
                  onReady={handleAudioReady}
                />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Play
                    </>
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Still loading or connecting - show loading state
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Connecting to multi-speaker session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show task selection (only when no taskId in URL - user manually navigated here)
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/recording`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recording Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2">Multi-Speaker Recording</h1>
        <p className="text-muted-foreground">
          Select a multi-speaker task to start a collaborative recording session
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoadingTasks ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Multi-Speaker Tasks</h3>
              <p className="text-muted-foreground mb-4">
                There are no multi-speaker tasks available for this project.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact an admin to create a multi-speaker task.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {tasks.length} multi-speaker task{tasks.length !== 1 ? "s" : ""} available
          </div>
          {tasks.map((task) => (
            <Card
              key={task._id || task.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>
                  {task.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Status: {task.status}</div>
                    <div>Language: {task.language}</div>
                    {task.roomName && (
                      <div className="font-mono text-xs">Room: {task.roomName}</div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleStartSession(task)}
                    disabled={isLoadingToken}
                    className="flex items-center gap-2"
                  >
                    {isLoadingToken ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        Start Session
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
