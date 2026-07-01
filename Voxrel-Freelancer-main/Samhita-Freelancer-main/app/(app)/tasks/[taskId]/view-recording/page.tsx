"use client";

import { ArrowLeft, Loader2, Play, Pause, Send, RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskService } from "@/services/task.service";
import { Task } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EnhancedWaveform } from "@/components/blocks/audio/enhanced-waveform";
import { SmartWaveformRef } from "@/components/blocks/audio/smart-waveform";
import { useUserStore } from "@/stores";

export default function ViewRecordingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params.taskId as string;
  // Optional: override playback URL when backend has stale/wrong recordingUrl for this task
  const recordingUrlOverride = searchParams.get("recordingUrl") || undefined;

  const { user } = useUserStore();
  const currentUserId = user?.id || user?._id;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Speaker metadata form state - all fields
  const [topic, setTopic] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [speakerAge, setSpeakerAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [qualification, setQualification] = useState("");
  const [occupation, setOccupation] = useState("");
  const [motherTongueCode, setMotherTongueCode] = useState("");
  const [nativePlace, setNativePlace] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [dialectZone, setDialectZone] = useState("");
  const [dialect, setDialect] = useState("");
  const [recordingDeviceType, setRecordingDeviceType] = useState<"PC" | "Mobile" | "">("");
  const [recordingEnvironment, setRecordingEnvironment] = useState<"Indoor" | "Outdoor" | "">("");
  
  const [hasSubmittedMetadata, setHasSubmittedMetadata] = useState(false);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef<SmartWaveformRef>(null);

  const effectiveRecordingUrl = recordingUrlOverride || task?.recordingUrl;

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Debug logging
        console.log('[ViewRecording] Loading task with ID:', taskId);
        
        const response = await taskService.getTaskById(taskId);
        if (response.success && response.data) {
          const taskData = response.data;
          
          // CRITICAL: Validate that the returned task ID matches the requested taskId
          const returnedTaskId = taskData.id || taskData._id;
          const normalizedRequestedId = taskId?.trim();
          const normalizedReturnedId = returnedTaskId?.toString().trim();
          
          // Strict validation - ensure IDs match exactly
          if (normalizedReturnedId !== normalizedRequestedId) {
            console.error('[ViewRecording] CRITICAL: Task ID mismatch!', {
              requestedId: normalizedRequestedId,
              returnedId: normalizedReturnedId,
              taskData: {
                id: taskData.id,
                _id: taskData._id,
                title: taskData.title,
                type: taskData.type,
                recordingUrl: taskData.recordingUrl
              }
            });
            setError(`Task ID mismatch. Expected task ${normalizedRequestedId} but got ${normalizedReturnedId}. This recording may belong to a different task.`);
            return;
          }
          
          // Debug logging
          console.log('[ViewRecording] Task loaded and validated:', {
            id: returnedTaskId,
            title: taskData.title,
            type: taskData.type,
            recordingUrl: taskData.recordingUrl,
            roomName: taskData.roomName,
            idMatch: normalizedReturnedId === normalizedRequestedId
          });
          
          if (taskData.type !== 'multi') {
            setError('This task is not a multi-speaker task');
            return;
          }
          
          // Ensure recordingUrl belongs to this specific task
          const hasRecording = !!taskData.recordingUrl || !!recordingUrlOverride;
          if (!hasRecording) {
            // Start polling to check for recording URL
            console.log('[ViewRecording] No recordingUrl found. Starting polling to check for file...');
            setIsPolling(true);
            setError(
              'Recording not available yet. Checking for recording file...'
            );
            // Set task anyway so we can poll for the recording URL
            setTask(taskData);
          } else {
            // Stop polling if we have a recording
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setTask(taskData);
          }
          
          // CRITICAL: Validate that the recordingUrl contains the correct taskId
          if (taskData.recordingUrl && !recordingUrlOverride) {
            const normalizedTaskId = normalizedReturnedId.toLowerCase();
            let urlTaskId: string | null = null;
            
            // Try to extract task ID from new format: .../project-{projectId}-task-{taskId}/...
            const newFormatMatch = taskData.recordingUrl.match(/task-([a-f0-9]{24})/i);
            if (newFormatMatch && newFormatMatch[1]) {
              urlTaskId = newFormatMatch[1].toLowerCase();
            } else {
              // Try old format: .../audios/{taskId}/{taskId}-...
              const oldFormatMatch = taskData.recordingUrl.match(/audios\/([a-f0-9]{24})\//i);
              if (oldFormatMatch && oldFormatMatch[1]) {
                urlTaskId = oldFormatMatch[1].toLowerCase();
              }
            }
            
            if (urlTaskId) {
              if (urlTaskId !== normalizedTaskId) {
                console.error('[ViewRecording] CRITICAL: Recording URL task ID mismatch!', {
                  taskId: normalizedTaskId,
                  urlTaskId: urlTaskId,
                  recordingUrl: taskData.recordingUrl
                });
                // Don't clear the URL locally - keep it so user can still see it
                // Start polling to find the correct one, but don't remove the existing URL
                console.warn('[ViewRecording] Recording URL mismatch detected. Searching for the correct recording file...');
                setIsPolling(true);
                setError(
                  'Recording URL mismatch detected. Searching for the correct recording file...'
                );
                // Keep the existing URL in taskData so it's still displayed
                // The polling will try to find the correct file and update if found
              } else {
                console.log('[ViewRecording] Recording URL validated - task ID matches:', {
                  taskId: normalizedTaskId,
                  urlTaskId: urlTaskId,
                  match: true
                });
              }
            } else {
              console.warn('[ViewRecording] Could not extract task ID from recording URL:', taskData.recordingUrl);
              // If we can't extract task ID, keep the URL but start polling to verify
              console.warn('[ViewRecording] Cannot validate recording URL. Starting polling to verify...');
              setIsPolling(true);
              setError('Validating recording file...');
              // Keep the existing URL - don't clear it
            }
          }
          
          setTask(taskData);
          
          // Load existing metadata if user has already submitted
          if (taskData.speakersMetadata && currentUserId) {
            const userMetadata = taskData.speakersMetadata.find((meta: any) => {
              const metaUserId = meta.freelancerId?.id || meta.freelancerId?._id || meta.freelancerId;
              return String(metaUserId) === String(currentUserId);
            });
            
            if (userMetadata) {
              setTopic(userMetadata.topic || "");
              setSpeakerName(userMetadata.name || "");
              setSpeakerId(userMetadata.speakerId || "");
              setSpeakerAge(userMetadata.age?.toString() || "");
              // Type-safe gender assignment
              const genderValue = userMetadata.gender;
              if (genderValue === "Male" || genderValue === "Female" || genderValue === "Other") {
                setGender(genderValue);
              } else {
                setGender("");
              }
              setQualification(userMetadata.qualification || "");
              setOccupation(userMetadata.occupation || "");
              setMotherTongueCode(userMetadata.motherTongueCode || "");
              setNativePlace(userMetadata.nativePlace || "");
              setCurrentLocation(userMetadata.currentLocation || userMetadata.location || "");
              setDistrict(userMetadata.district || "");
              setState(userMetadata.state || "");
              setDialectZone(userMetadata.dialectZone || "");
              setDialect(userMetadata.dialect || "");
              // Type-safe recordingDeviceType assignment
              const deviceType = userMetadata.recordingDeviceType;
              if (deviceType === "PC" || deviceType === "Mobile") {
                setRecordingDeviceType(deviceType);
              } else {
                setRecordingDeviceType("");
              }
              // Type-safe recordingEnvironment assignment
              const envType = userMetadata.recordingEnvironment;
              if (envType === "Indoor" || envType === "Outdoor") {
                setRecordingEnvironment(envType);
              } else {
                setRecordingEnvironment("");
              }
              setHasSubmittedMetadata(true);
            }
          }
        } else {
          setError('Task not found');
        }
      } catch (err: any) {
        console.error('[ViewRecording] Error loading task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [taskId, recordingUrlOverride, currentUserId]);

  // Polling effect to check for recording URL
  useEffect(() => {
    if (!isPolling || !taskId || recordingUrlOverride) {
      return;
    }

    console.log('[ViewRecording] Starting polling for recording URL...');
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('[ViewRecording] Polling: Checking for recording URL...');
        
        // First, try to check and refresh the recording URL from R2
        try {
          const checkResponse = await taskService.checkRecording(taskId);
          
          // Always refresh the task after calling checkRecording, as it may have cleared a wrong URL
          const response = await taskService.getTaskById(taskId);
          if (response.success && response.data) {
            const taskData = response.data;
            const normalizedRequestedId = taskId?.trim().toLowerCase();
            
            // Update the task state to reflect any changes (e.g., cleared wrong URL)
            setTask(taskData);
            
            // Check if recording URL was found and is valid
            if (checkResponse.success && checkResponse.data?.found && checkResponse.data?.recordingUrl) {
              const foundUrl = checkResponse.data.recordingUrl;
              console.log('[ViewRecording] Polling: Recording URL found via check endpoint!', foundUrl);
              
              // CRITICAL: Validate that the found URL contains the correct task ID
              const urlTaskIdMatch = foundUrl.match(/task-([a-f0-9]{24})/i);
              if (urlTaskIdMatch && urlTaskIdMatch[1]) {
                const urlTaskId = urlTaskIdMatch[1].toLowerCase();
                if (urlTaskId !== normalizedRequestedId) {
                  console.error('[ViewRecording] Polling: CRITICAL - Found URL has wrong task ID!', {
                    requestedTaskId: normalizedRequestedId,
                    urlTaskId: urlTaskId,
                    foundUrl: foundUrl
                  });
                  console.warn('[ViewRecording] Polling: Ignoring URL with wrong task ID, continuing to poll...');
                  // Don't use this URL - it's for a different task
                  // Continue polling
                  return;
                }
              }
              
              // Task ID matches - verify the task has the correct recording URL
              if (taskData.recordingUrl) {
                const taskUrlTaskIdMatch = taskData.recordingUrl.match(/task-([a-f0-9]{24})/i);
                if (taskUrlTaskIdMatch && taskUrlTaskIdMatch[1]) {
                  const taskUrlTaskId = taskUrlTaskIdMatch[1].toLowerCase();
                  if (taskUrlTaskId !== normalizedRequestedId) {
                    console.error('[ViewRecording] Polling: Task has wrong recording URL!', {
                      requestedTaskId: normalizedRequestedId,
                      taskUrlTaskId: taskUrlTaskId,
                      taskRecordingUrl: taskData.recordingUrl
                    });
                    // Continue polling - don't use wrong URL
                    return;
                  }
                }
                
                // Stop polling and update task
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                setIsPolling(false);
                setError(null);
                toast.success('Recording is now available!');
                return;
              }
            } else if (checkResponse.success && checkResponse.data?.message?.includes('cleared')) {
              // Backend cleared a wrong URL - log it and continue polling
              console.log('[ViewRecording] Polling: Backend cleared wrong recording URL:', checkResponse.data.message);
            }
          }
        } catch (checkErr) {
          console.log('[ViewRecording] Polling: Check endpoint failed, trying regular fetch...', checkErr);
        }
        
        // Fallback: Regular task fetch
        const response = await taskService.getTaskById(taskId);
        
        if (response.success && response.data) {
          const taskData = response.data;
          const returnedTaskId = taskData.id || taskData._id;
          const normalizedRequestedId = taskId?.trim();
          const normalizedReturnedId = returnedTaskId?.toString().trim();
          
          // Validate task ID matches
          if (normalizedReturnedId !== normalizedRequestedId) {
            console.warn('[ViewRecording] Polling: Task ID mismatch, stopping poll');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            return;
          }
          
          // Check if recording URL is now available
          if (taskData.recordingUrl) {
            console.log('[ViewRecording] Polling: Recording URL found!', taskData.recordingUrl);
            
            // Validate recording URL contains correct task ID
            const urlTaskIdMatch = taskData.recordingUrl.match(/task-([a-f0-9]{24})/i);
            if (urlTaskIdMatch && urlTaskIdMatch[1]) {
              const urlTaskId = urlTaskIdMatch[1].toLowerCase();
              if (urlTaskId !== normalizedReturnedId.toLowerCase()) {
                console.warn('[ViewRecording] Polling: Recording URL task ID mismatch');
                return; // Continue polling
              }
            }
            
            // Stop polling and update task
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
            setError(null);
            setTask(taskData);
            toast.success('Recording is now available!');
            return;
          }
          
          console.log('[ViewRecording] Polling: Recording URL still not available');
        }
      } catch (err: any) {
        console.error('[ViewRecording] Polling error:', err);
        // Continue polling even on error
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount or when polling stops
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, taskId, recordingUrlOverride]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = useCallback(async () => {
    if (!effectiveRecordingUrl) {
      toast.error("No recording to play");
      return;
    }
    if (isPlaying) {
      waveformRef.current?.pause();
    } else {
      await waveformRef.current?.play();
    }
  }, [isPlaying, effectiveRecordingUrl]);

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

  const handleRefresh = async () => {
    if (!taskId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[ViewRecording] Refreshing task with ID:', taskId);
      
      const response = await taskService.getTaskById(taskId);
      if (response.success && response.data) {
        const taskData = response.data;
        
        // CRITICAL: Validate that the returned task ID matches the requested taskId
        const returnedTaskId = taskData.id || taskData._id;
        const normalizedRequestedId = taskId?.trim();
        const normalizedReturnedId = returnedTaskId?.toString().trim();
        
        // Strict validation - ensure IDs match exactly
        if (normalizedReturnedId !== normalizedRequestedId) {
          console.error('[ViewRecording] CRITICAL: Task ID mismatch on refresh!', {
            requestedId: normalizedRequestedId,
            returnedId: normalizedReturnedId,
            taskData: {
              id: taskData.id,
              _id: taskData._id,
              title: taskData.title,
              type: taskData.type,
              recordingUrl: taskData.recordingUrl
            }
          });
          setError(`Task ID mismatch. Expected task ${normalizedRequestedId} but got ${normalizedReturnedId}. This recording may belong to a different task.`);
          toast.error('Task ID mismatch detected');
          return;
        }
        
        console.log('[ViewRecording] Task refreshed and validated:', {
          id: returnedTaskId,
          title: taskData.title,
          type: taskData.type,
          recordingUrl: taskData.recordingUrl,
          roomName: taskData.roomName,
          idMatch: normalizedReturnedId === normalizedRequestedId
        });
        
        if (taskData.type !== 'multi') {
          setError('This task is not a multi-speaker task');
          return;
        }
        const hasRecording = !!taskData.recordingUrl || !!recordingUrlOverride;
        if (!hasRecording) {
          setError(
            'Recording not available yet. Please wait for the recording to complete. ' +
            'If you have the direct recording link, open this page with ?recordingUrl=<url> to play it.'
          );
          return;
        }
        
        // CRITICAL: Validate that the recordingUrl contains the correct taskId
        if (taskData.recordingUrl && !recordingUrlOverride) {
          // Extract taskId from recordingUrl (format: .../task-{taskId}/...)
          const urlTaskIdMatch = taskData.recordingUrl.match(/task-([a-f0-9]{24})/i);
          if (urlTaskIdMatch && urlTaskIdMatch[1]) {
            const urlTaskId = urlTaskIdMatch[1].toLowerCase();
            const normalizedTaskId = normalizedReturnedId.toLowerCase();
            
            if (urlTaskId !== normalizedTaskId) {
              console.error('[ViewRecording] CRITICAL: Recording URL task ID mismatch on refresh!', {
                taskId: normalizedTaskId,
                urlTaskId: urlTaskId,
                recordingUrl: taskData.recordingUrl
              });
              setError(
                `Recording URL mismatch: The recording URL belongs to task ${urlTaskId} but this is task ${normalizedTaskId}. ` +
                `This recording may belong to a different task. Please contact support if this persists.`
              );
              toast.error('Recording URL mismatch detected');
              return;
            }
            
            console.log('[ViewRecording] Recording URL validated on refresh - task ID matches:', {
              taskId: normalizedTaskId,
              urlTaskId: urlTaskId,
              match: true
            });
          } else {
            console.warn('[ViewRecording] Could not extract task ID from recording URL on refresh:', taskData.recordingUrl);
            // Don't block, but log a warning
          }
        }
        
        setTask(taskData);
        toast.success('Task data refreshed');
      } else {
        setError('Task not found');
      }
    } catch (err: any) {
      console.error('[ViewRecording] Error refreshing task:', err);
      toast.error(err.message || 'Failed to refresh task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task) {
      toast.error("No task to submit");
      return;
    }

    // For multi-speaker tasks, use the task's recordingUrl (not the override)
    // The override is only for viewing, not for submission
    const submissionUrl = task.recordingUrl;
    
    if (!submissionUrl) {
      toast.error("No recording to submit. Please wait for the recording to be available.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await taskService.submitTask(task.id || task._id!, {
        submission: submissionUrl,
      });

      if (response.success) {
        toast.success("Task submitted for review successfully!");
        // Reload task to get updated status
        const updatedResponse = await taskService.getTaskById(taskId);
        if (updatedResponse.success && updatedResponse.data) {
          setTask(updatedResponse.data);
        }
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

  const handleSubmitMetadata = async () => {
    if (!task) {
      toast.error("Task not found");
      return;
    }

    // Validate required fields
    if (!speakerName.trim() || !speakerAge.trim()) {
      toast.error("Please provide at least Name and Age");
      return;
    }

    setIsSubmittingMetadata(true);
    try {
      const response = await taskService.submitSpeakerMetadata(task.id || task._id!, {
        topic: topic.trim() || undefined,
        speakerName: speakerName.trim(),
        speakerId: speakerId.trim() || undefined,
        speakerAge: parseInt(speakerAge),
        gender: gender || undefined,
        qualification: qualification.trim() || undefined,
        occupation: occupation.trim() || undefined,
        motherTongueCode: motherTongueCode.trim() || undefined,
        nativePlace: nativePlace.trim() || undefined,
        currentLocation: currentLocation.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        dialectZone: dialectZone.trim() || undefined,
        dialect: dialect.trim() || undefined,
        recordingDeviceType: recordingDeviceType || undefined,
        recordingEnvironment: recordingEnvironment || undefined,
      });

      if (response.success) {
        toast.success("Your metadata has been submitted successfully!");
        setHasSubmittedMetadata(true);
        // Reload task to get updated metadata
        const updatedResponse = await taskService.getTaskById(taskId);
        if (updatedResponse.success && updatedResponse.data) {
          setTask(updatedResponse.data);
        }
      } else {
        throw new Error(response.message || "Failed to submit metadata");
      }
    } catch (err: any) {
      console.error("Error submitting metadata:", err);
      toast.error(err.message || "Failed to submit metadata");
    } finally {
      setIsSubmittingMetadata(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/tasks/draft")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold mb-2">View Recording</h1>
        </div>
        <Alert variant={isPolling ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {isPolling && <Loader2 className="h-4 w-4 animate-spin" />}
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Task not found"}
              {isPolling && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Automatically checking for recording file every 5 seconds...
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
        {isPolling && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                setIsPolling(false);
              }}
            >
              Stop Checking
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/tasks/draft")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Session Recording</h1>
            <p className="text-muted-foreground">
              Task: {task.title} • {task.recordingDuration ? formatTime(task.recordingDuration) : 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Task ID: {task.id || task._id} • Room: {task.roomName || 'N/A'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Session</CardTitle>
          <CardDescription>
            {recordingUrlOverride
              ? "Using the recording URL you provided. Listen below and submit for review when ready."
              : "Listen to the multi-speaker session recording. Once you're satisfied, submit it for review."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {effectiveRecordingUrl ? (
            <>
              <div className="h-32 w-full">
                <EnhancedWaveform
                  waveformRef={waveformRef}
                  audioUrl={effectiveRecordingUrl}
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

              {/* Speaker Metadata Form - Always visible for multi-speaker tasks */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Your Speaker Metadata</h3>
                    <p className="text-sm text-muted-foreground">
                      Please provide your information for this recording. All assigned freelancers can submit their metadata independently.
                    </p>
                  </div>
                  {hasSubmittedMetadata && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Metadata Submitted</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Row 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="Enter topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speakerName">Name of the Speaker *</Label>
                    <Input
                      id="speakerName"
                      placeholder="Enter your name"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      disabled={isSubmittingMetadata}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speakerId">Speaker ID</Label>
                    <Input
                      id="speakerId"
                      placeholder="Enter speaker ID"
                      value={speakerId}
                      onChange={(e) => setSpeakerId(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  
                  {/* Row 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="speakerAge">Age *</Label>
                    <Input
                      id="speakerAge"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Enter your age"
                      value={speakerAge}
                      onChange={(e) => setSpeakerAge(e.target.value)}
                      disabled={isSubmittingMetadata}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={(value) => setGender(value as typeof gender)} disabled={isSubmittingMetadata}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      placeholder="Enter qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  
                  {/* Row 3 */}
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      placeholder="Enter occupation"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherTongueCode">Mother Tongue Code</Label>
                    <Input
                      id="motherTongueCode"
                      placeholder="Enter mother tongue code"
                      value={motherTongueCode}
                      onChange={(e) => setMotherTongueCode(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nativePlace">Native Place</Label>
                    <Input
                      id="nativePlace"
                      placeholder="Enter native place"
                      value={nativePlace}
                      onChange={(e) => setNativePlace(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  
                  {/* Row 4 */}
                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input
                      id="currentLocation"
                      placeholder="Enter current location"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      placeholder="Enter district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Enter state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  
                  {/* Row 5 */}
                  <div className="space-y-2">
                    <Label htmlFor="dialectZone">Dialect - Zone</Label>
                    <Input
                      id="dialectZone"
                      placeholder="Enter dialect zone"
                      value={dialectZone}
                      onChange={(e) => setDialectZone(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialect">Dialect</Label>
                    <Input
                      id="dialect"
                      placeholder="Enter dialect"
                      value={dialect}
                      onChange={(e) => setDialect(e.target.value)}
                      disabled={isSubmittingMetadata}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordingDeviceType">Recording Device Type</Label>
                    <Select value={recordingDeviceType} onValueChange={(value) => setRecordingDeviceType(value as typeof recordingDeviceType)} disabled={isSubmittingMetadata}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PC">PC</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Row 6 */}
                  <div className="space-y-2">
                    <Label htmlFor="recordingEnvironment">Recording Environment</Label>
                    <Select value={recordingEnvironment} onValueChange={(value) => setRecordingEnvironment(value as typeof recordingEnvironment)} disabled={isSubmittingMetadata}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indoor">Indoor</SelectItem>
                        <SelectItem value="Outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Submit Metadata Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSubmitMetadata}
                    disabled={isSubmittingMetadata || !speakerName.trim() || !speakerAge.trim()}
                    variant={hasSubmittedMetadata ? "outline" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isSubmittingMetadata ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : hasSubmittedMetadata ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Update Metadata
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Metadata
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || task.status === "SUBMITTED"}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : task.status === "SUBMITTED" ? (
                    "Already Submitted"
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Recording not available yet. Please wait for the recording to complete.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
