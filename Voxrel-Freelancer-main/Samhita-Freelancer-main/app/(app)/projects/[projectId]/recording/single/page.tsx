"use client";

import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  Settings,
  CircleCheckBig,
  FileText,
  Trash2,
  Mic,
  Loader2,
  User,
  Keyboard
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { EnhancedWaveform } from "@/components/blocks/audio/enhanced-waveform";
import { FloatingControls } from "@/components/blocks/audio/floating-controls";
import { SmartWaveformRef } from "@/components/blocks/audio/smart-waveform";
import { TimelineInfo } from "@/components/blocks/audio/timeline-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


type RecordingState = "idle" | "recording" | "paused" | "recorded";

interface RecordingChunk {
  id: string;
  startTime: string;
  endTime: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  duration: number;
  notes?: string;
  createdAt: Date;
}

export default function SingleSpeakerRecordingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const taskId = searchParams.get('taskId') || null;
  const { state: sidebarState, isMobile } = useSidebar();

  // Script/Task State
  const [task, setTask] = useState<any>(null);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(false);

  // Determine if we should use the "Simple Recorder" (Script Mode) UI
  // This applies if it's a script file OR if there is no file at all (self-generated content)
  const isScriptMode = !task?.audioUrl || (task?.audioUrl && /\.(txt|pdf|doc|docx)$/i.test(task.audioUrl.split('?')[0]));
  const hasScript = task?.audioUrl && /\.(txt|pdf|doc|docx)$/i.test(task.audioUrl.split('?')[0]);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingChunks, setRecordingChunks] = useState<RecordingChunk[]>([]);
  const [currentNotes, setCurrentNotes] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("Speaker 1");

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  // UI state
  const [_isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Waveform state
  const [waveformMode, setWaveformMode] = useState<"view" | "edit">("view");
  const [viewStartTime, setViewStartTime] = useState(0);
  const [viewEndTime, setViewEndTime] = useState(60);
  const [anchorA, setAnchorA] = useState(0);
  const [anchorB, setAnchorB] = useState(15);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const _audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<SmartWaveformRef>(null!);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  // Fetch Task and Script Content
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;
      try {
        const { taskService } = await import('@/services/task.service');
        const response = await taskService.getTaskById(taskId);

        if (response.success && response.data) {
          const taskData = response.data;
          setTask(taskData);

          // If script file, try to fetch content
          const url = taskData.audioUrl;
          if (url && /\.(txt)$/i.test(url.split('?')[0])) {
            setIsScriptLoading(true);
            try {
              const response = await fetch(url);
              if (response.ok) {
                const text = await response.text();
                setScriptContent(text);
              }
            } catch (error) {
              console.error("Failed to load script content", error);
            } finally {
              setIsScriptLoading(false);
            }
          }
        } else {
          toast.error("Failed to load task details");
        }
      } catch (error) {
        console.error("Failed to load task", error);
        toast.error("Failed to load task details");
      }
    };
    loadTask();
  }, [taskId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error(error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState("recorded");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setRecordingState("idle");
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    setCurrentNotes("");
  };

  const saveRecordingChunk = useCallback(() => {
    if (!audioBlob || recordingTime === 0) {
      toast.error("No recording to save");
      return;
    }

    const chunk: RecordingChunk = {
      id: `chunk-${Date.now()}`,
      startTime: "0:00",
      endTime: formatTime(recordingTime),
      startTimeSeconds: 0,
      endTimeSeconds: recordingTime,
      duration: recordingTime,
      notes: currentNotes || undefined,
      createdAt: new Date(),
    };

    setRecordingChunks((prev) => [...prev, chunk].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds));
    setCurrentNotes("");
    toast.success(`Recording chunk saved (${chunk.startTime}→${chunk.endTime})`);
  }, [audioBlob, recordingTime, currentNotes, formatTime]);

  const handleSaveDraft = async () => {
    if (recordingChunks.length === 0 && !audioBlob) {
      toast.error("No recordings to save");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement backend save
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSavedAt(new Date().toISOString());
      toast.success("Draft saved successfully");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error("No recording to submit. Please record audio first.");
      return;
    }

    if (!taskId) {
      toast.error("Task ID is required. Please access this page from a task.");
      return;
    }

    setIsSaving(true);
    try {
      // Use the audio blob from the recording
      const finalAudioBlob = audioBlob;

      // Upload audio file to backend
      const formData = new FormData();
      const audioFile = new File([finalAudioBlob], `recording-${taskId}-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      formData.append('audio', audioFile);
      formData.append('taskId', taskId);

      // Upload audio file
      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type - let browser set it with boundary for FormData
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to upload audio file');
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.url || uploadData.data?.url;

      if (!audioUrl) {
        throw new Error('Audio URL not returned from upload');
      }

      // Submit task with audio URL as submission
      const { taskService } = await import('@/services/task.service');
      await taskService.submitTask(taskId, { submission: audioUrl });

      toast.success("Recording submitted successfully!");
      router.push('/tasks/completed');
    } catch (error) {
      console.error('Failed to submit recording:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit recording");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteChunk = (chunkId: string) => {
    setRecordingChunks((prev) => prev.filter((chunk) => chunk.id !== chunkId));
    toast.success("Recording chunk deleted");
  };

  const handlePlayPause = useCallback(async () => {
    if (!audioUrl) {
      toast.error("No audio to play");
      return;
    }
    if (isPlaying) {
      waveformRef.current?.pause();
    } else {
      await waveformRef.current?.play();
    }
  }, [isPlaying, audioUrl]);

  const handleTimeUpdate = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, []);

  const handleAudioReady = useCallback((audioDuration: number) => {
    setDuration(audioDuration);
    setViewEndTime(Math.min(60, audioDuration));
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    waveformRef.current?.setVolume(newVolume / 100);
  }, []);

  const getTotalRecordedDuration = () => {
    return recordingChunks.reduce((total, chunk) => total + chunk.duration, 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+Enter for saving
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          if (recordingState === "recorded") {
            event.preventDefault();
            saveRecordingChunk();
          }
          return;
        }
        return;
      }

      const shortcutKeys = ['Space', 'KeyR', 'KeyS', 'KeyK', 'Escape'];
      if (shortcutKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          if (recordingState === "recording") {
            pauseRecording();
          } else if (recordingState === "paused") {
            resumeRecording();
          } else if (audioUrl) {
            handlePlayPause();
          }
          break;
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            if (recordingState === "idle") {
              startRecording();
            } else if (recordingState === "recorded") {
              resetRecording();
            }
          }
          break;
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (recordingState === "recorded") {
              saveRecordingChunk();
            } else {
              handleSaveDraft();
            }
          }
          break;
        case 'KeyK':
          if (event.shiftKey) {
            setIsShortcutsModalOpen(!isShortcutsModalOpen);
          } else if (audioUrl) {
            handlePlayPause();
          }
          break;
        case 'Escape':
          if (isShortcutsModalOpen) {
            setIsShortcutsModalOpen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [recordingState, audioUrl, handlePlayPause, saveRecordingChunk, handleSaveDraft, isShortcutsModalOpen]);

  return (
    <div
      className="relative flex h-[calc(100vh-theme(spacing.16))] w-full flex-col overflow-hidden"
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      {/* Header Section */}
      <div className="flex-shrink-0 px-6 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/recording`)}
              className="h-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">
              Single Speaker Recording
            </h1>
            {!isScriptMode && audioUrl && (
              <Badge variant="secondary" className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            )}
            {lastSavedAt && (
              <Badge variant="outline" className="text-xs">
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </Badge>
            )}
            {isSaving && (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
              className="h-8 text-xs"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="h-8 text-xs"
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Draft
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSubmit}
              disabled={isSaving || (!audioBlob && recordingChunks.length === 0)}
            >
              <CircleCheckBig className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Task Info Banner */}
      {task && (
        <div className="flex-shrink-0 px-6 py-3 border-b bg-muted/10 transition-all animate-in fade-in slide-in-from-top-2">
          <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-4xl whitespace-pre-wrap leading-relaxed">{task.description}</p>
          )}
        </div>
      )}



      {/* Script Mode UI */}
      {
        isScriptMode ? (
          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-3 w-full">
            <div className={cn("grid gap-4 h-full py-1", hasScript ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto w-full")}>
              {/* Left Column: Script Viewer - Only show if hasScript is true */}
              {hasScript && (
                <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden relative">
                  <div className="flex-shrink-0 px-3 py-2 border-b bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <h2 className="text-sm font-medium">Script Preview</h2>
                    </div>
                    {task?.audioUrl && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => window.open(task.audioUrl, '_blank')}>
                          Open New Tab
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-white">
                    {isScriptLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : scriptContent ? (
                      <ScrollArea className="h-full w-full p-4">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono text-foreground">{scriptContent}</p>
                      </ScrollArea>
                    ) : /\.(txt|pdf)$/i.test(task?.audioUrl?.split('?')[0] || '') ? (
                      <iframe
                        src={task?.audioUrl}
                        className="w-full h-full border-none"
                        title="Script Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                        <p className="text-sm">Preview not available for this file type.</p>
                        <Button variant="link" size="sm" onClick={() => window.open(task?.audioUrl, '_blank')}>
                          Download File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right Column: Simple Recorder */}
              <div className="flex flex-col h-full gap-4 w-full">
                <div className="flex-1 flex flex-col border rounded-lg bg-background overflow-hidden">
                  <div className="flex-shrink-0 px-3 py-2 border-b bg-muted/10">
                    <h2 className="text-sm font-medium">Recording</h2>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                    {/* status */}
                    <div className="text-center">
                      <div className={cn("text-4xl font-mono tabular-nums font-semibold tracking-wider mb-2", recordingState === "recording" ? "text-red-500" : "text-foreground")}>
                        {formatTime(recordingTime)}
                      </div>
                      <Badge variant={recordingState === "recording" ? "destructive" : "secondary"}>
                        {recordingState === "idle" && "Ready"}
                        {recordingState === "recording" && "Recording..."}
                        {recordingState === "paused" && "Paused"}
                        {recordingState === "recorded" && "Recorded"}
                      </Badge>
                    </div>

                    {/* Waveform Visualization (Simple) */}
                    {recordingState === "recording" && (
                      <div className="w-full max-w-md h-12 bg-muted/30 rounded-full overflow-hidden flex items-center justify-center">
                        <div className="flex items-end justify-center gap-1 h-6">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                      {recordingState === "idle" && (
                        <Button size="lg" className="h-14 w-14 rounded-full" onClick={startRecording}>
                          <Mic className="h-6 w-6" />
                        </Button>
                      )}
                      {recordingState === "recording" && (
                        <>
                          <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={pauseRecording}>
                            <Pause className="h-6 w-6" />
                          </Button>
                          <Button size="lg" variant="destructive" className="h-14 w-14 rounded-full" onClick={stopRecording}>
                            <Square className="h-6 w-6 fill-current" />
                          </Button>
                        </>
                      )}
                      {recordingState === "paused" && (
                        <>
                          <Button size="lg" className="h-14 w-14 rounded-full" onClick={resumeRecording}>
                            <Play className="h-6 w-6" />
                          </Button>
                          <Button size="lg" variant="destructive" className="h-14 w-14 rounded-full" onClick={stopRecording}>
                            <Square className="h-6 w-6 fill-current" />
                          </Button>
                        </>
                      )}
                      {recordingState === "recorded" && (
                        <div className="flex gap-4">
                          <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={handlePlayPause}>
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                          </Button>
                          <Button size="lg" variant="outline" className="h-14 w-14 rounded-full text-destructive hover:bg-destructive/10" onClick={resetRecording}>
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {recordingState === "recorded" && audioUrl && (
                      <div className="w-full max-w-md bg-card border rounded-lg p-3">
                        <div className="h-12 w-full">
                          {/* Reuse EnhancedWaveform for playback */}
                          <EnhancedWaveform
                            waveformRef={waveformRef}
                            audioUrl={audioUrl}
                            duration={Math.min(recordingTime, 600)} // Approx duration
                            anchorA={anchorA}
                            anchorB={anchorB}
                            mode="view"
                            size="compact"
                            formatTime={formatTime}
                            onPlayStateChange={setIsPlaying}
                            onTimeUpdate={() => { }}
                            onReady={() => { }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Recording Content Area */
          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-3 w-full">
            <div className="flex flex-1 flex-col gap-2 py-1">

              {/* Recording Timeline Section */}
              <div className="flex-shrink-0" style={{ height: '290px' }}>
                <div className="flex flex-col h-full border rounded-lg bg-background">
                  <div className="flex-shrink-0 px-3 py-1.5 border-b bg-muted/10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium">Recording Timeline</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {recordingChunks.length} chunks
                        </Badge>
                        {recordingChunks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {formatTime(getTotalRecordedDuration())} recorded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <TimelineInfo chunksCount={recordingChunks.length} />

                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full w-full">
                      {recordingChunks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-3">
                          <div className="bg-primary/10 rounded-full p-3 mb-2">
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-base font-semibold mb-1">No recording chunks yet</h3>
                          <p className="text-muted-foreground text-sm mb-2 max-w-xs">
                            Start recording! Each save creates a new timeline chunk ordered by timestamp.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="h-8">
                              <TableHead className="w-20 text-xs">Timeline</TableHead>
                              <TableHead className="w-16 text-xs">Speaker</TableHead>
                              <TableHead className="text-xs">Notes</TableHead>
                              <TableHead className="w-20 text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recordingChunks.map((chunk) => (
                              <TableRow key={chunk.id} className="hover:bg-muted/30 h-12">
                                <TableCell className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Play className="h-2.5 w-2.5" />
                                    <span className="font-mono">
                                      {chunk.startTime}→{chunk.endTime}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex items-center gap-1">
                                    <User className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span className="truncate text-muted-foreground">
                                      {selectedSpeaker}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {chunk.notes || <span className="text-muted-foreground italic">No notes</span>}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                                      onClick={() => deleteChunk(chunk.id)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {/* Editor Interface Section */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">

                  {/* Waveform Section */}
                  {audioUrl && (
                    <div
                      className="flex-shrink-0 mb-1 overflow-hidden w-full"
                      style={{ height: '130px' }}
                    >
                      <div className="h-full w-full overflow-hidden">
                        <EnhancedWaveform
                          waveformRef={waveformRef}
                          audioUrl={audioUrl}
                          duration={duration}
                          anchorA={anchorA}
                          anchorB={anchorB}
                          mode={waveformMode}
                          size="professional"
                          formatTime={formatTime}
                          onPlayStateChange={handlePlayStateChange}
                          onTimeUpdate={handleTimeUpdate}
                          onReady={handleAudioReady}
                          onModeChange={setWaveformMode}
                          onSizeChange={() => { }}
                          onAnchorAChange={setAnchorA}
                          onAnchorBChange={setAnchorB}
                          viewStartTime={viewStartTime}
                          viewEndTime={viewEndTime}
                          onTemporalZoom={(start, end) => {
                            setViewStartTime(start);
                            setViewEndTime(end);
                          }}
                          _forceMode="professional"
                          showKeyboardShortcuts={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Recording Editor */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="flex flex-col h-full border rounded-lg bg-background">
                      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b bg-muted/5">
                        <div className="flex items-center gap-2">
                          <Mic className="text-primary h-3.5 w-3.5" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {recordingState === "idle" && "Ready to Record"}
                            {recordingState === "recording" && `Recording • ${formatTime(recordingTime)}`}
                            {recordingState === "paused" && `Paused • ${formatTime(recordingTime)}`}
                            {recordingState === "recorded" && `Recorded • ${formatTime(recordingTime)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {recordingState === "idle" && (
                            <Button onClick={startRecording} size="sm" className="h-6 text-xs">
                              <Play className="h-3 w-3 mr-1" />
                              Start Recording
                            </Button>
                          )}
                          {recordingState === "recording" && (
                            <>
                              <Button onClick={pauseRecording} variant="outline" size="sm" className="h-6 text-xs">
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                              <Button onClick={stopRecording} variant="destructive" size="sm" className="h-6 text-xs">
                                <Square className="h-3 w-3 mr-1" />
                                Stop
                              </Button>
                            </>
                          )}
                          {recordingState === "paused" && (
                            <>
                              <Button onClick={resumeRecording} size="sm" className="h-6 text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                Resume
                              </Button>
                              <Button onClick={stopRecording} variant="destructive" size="sm" className="h-6 text-xs">
                                <Square className="h-3 w-3 mr-1" />
                                Stop
                              </Button>
                            </>
                          )}
                          {recordingState === "recorded" && (
                            <>
                              <Button onClick={saveRecordingChunk} size="sm" className="h-6 text-xs">
                                <Save className="h-3 w-3 mr-1" />
                                Save Chunk
                              </Button>
                              <Button onClick={resetRecording} variant="outline" size="sm" className="h-6 text-xs">
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Record Again
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0">
                        <Textarea
                          value={currentNotes}
                          onChange={(e) => setCurrentNotes(e.target.value)}
                          placeholder={`${selectedSpeaker}: Add notes about this recording...

Use this space to add notes or comments about the recording. The notes will be saved with the recording chunk when you click "Save Chunk".

Tips:
• Add context or speaker information
• Note any background noise or interruptions
• Mark important sections for review`}
                          className="h-full w-full resize-none border-none bg-transparent p-3 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Floating Controls */}
      {
        audioUrl && (
          <div
            className={cn(
              "fixed z-50 transform -translate-x-1/2 transition-all duration-200 ease-linear",
              isMobile ? "bottom-2 left-1/2" : "bottom-1",
              !isMobile && sidebarState === "expanded" ? "left-[calc(50%+8rem)]" : "",
              !isMobile && sidebarState !== "expanded" ? "left-[calc(50%+1.5rem)]" : ""
            )}
          >
            <div className={cn(
              "bg-background/95 backdrop-blur-sm border shadow-lg rounded-full",
              isMobile ? "px-3 py-2" : "px-4 py-2"
            )}>
              <FloatingControls
                isPlaying={isPlaying}
                selectedSpeaker={selectedSpeaker}
                playbackSpeed={playbackSpeed}
                volume={volume}
                isLooping={isLooping}
                isMobile={isMobile}
                onPlayPause={handlePlayPause}
                onSkipToStart={() => waveformRef.current?.skipToStart()}
                onRewind={() => waveformRef.current?.rewind(10)}
                onFastForward={() => waveformRef.current?.fastForward(10)}
                onSkipToEnd={() => waveformRef.current?.skipToEnd()}
                onSetAnchorA={() => setAnchorA(currentTime)}
                onSetAnchorB={() => setAnchorB(currentTime)}
                onToggleLooping={() => setIsLooping(!isLooping)}
                onVolumeChange={handleVolumeChange}
                onSpeedChange={(speed) => {
                  setPlaybackSpeed(speed);
                  waveformRef.current?.setPlaybackRate(speed);
                }}
                onSpeakerChange={setSelectedSpeaker}
                onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
              />
            </div>
          </div>
        )
      }

      {/* Shortcuts Modal */}
      {
        isShortcutsModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setIsShortcutsModalOpen(false)}
          >
            <div
              className="bg-background rounded-lg border p-6 shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShortcutsModalOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b py-2">
                  <span>Start Recording</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + R</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Pause / Resume Recording</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Space</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Save Recording Chunk</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + S</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Save Chunk (from textarea)</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + Enter</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Play / Pause Audio</span>
                  <div className="flex gap-1">
                    <kbd className="bg-muted rounded px-2 py-1 text-xs">Space</kbd>
                    <span className="text-muted-foreground">or</span>
                    <kbd className="bg-muted rounded px-2 py-1 text-xs">K</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Open Shortcuts</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Shift + K</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Set Anchor A (Start)</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">A</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Set Anchor B (End)</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">B</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Rewind 10s</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">← Left</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Fast Forward 10s</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">→ Right</kbd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <span>Volume Up</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">↑ Up</kbd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Volume Down</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">↓ Down</kbd>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
