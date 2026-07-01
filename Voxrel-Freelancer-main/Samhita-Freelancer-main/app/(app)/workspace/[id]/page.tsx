"use client";

import { CircleCheckBig, Keyboard, Save, Settings, Play, User, FileText, Trash2, Edit, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useRef, useEffect } from "react";

import { BulkActionsToolbar } from "@/components/blocks/audio/bulk-actions-toolbar";
import { MetadataModal, SpeakerMetadata } from "@/components/blocks/audio/metadata-modal";
import { ConfigModal } from "@/components/blocks/audio/config-modal";
import { EnhancedWaveform } from "@/components/blocks/audio/enhanced-waveform";
import { FloatingControls } from "@/components/blocks/audio/floating-controls";
import { InlineTranscriptEditor } from "@/components/blocks/audio/inline-transcript-editor";
import { SmartWaveformRef } from "@/components/blocks/audio/smart-waveform";
import { TextRecorderInterface } from "@/components/blocks/audio/text-recorder-interface";
import { TimelineInfo } from "@/components/blocks/audio/timeline-info";
import { TranscriptEditor } from "@/components/blocks/audio/transcript-editor";
import { NotificationToast } from "@/components/notification-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useNotifications } from "@/hooks/use-notifications";
import { useResponsiveWaveform } from "@/hooks/use-responsive-waveform";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, TranscriptSegment, WaveformMode, WaveformSize } from "@/stores";

// Note: WaveformRegion interface removed - not currently used

export default function EditorPage() {
  // Speaker management state
  const [selectedSpeaker, setSelectedSpeaker] = React.useState("Speaker 1");
  const [isMetadataModalOpen, setIsMetadataModalOpen] = React.useState(false);
  const [speakerMetadata, setSpeakerMetadata] = React.useState<SpeakerMetadata[]>([]);
  const SPEAKERS = ["Speaker 1", "Speaker 2", "Speaker 3", "Narrator"];

  // Sidebar state for responsive positioning
  const { state: sidebarState, isMobile } = useSidebar();

  // Responsive waveform configuration
  const responsiveConfig = useResponsiveWaveform();

  // Notifications hook
  const { notifications, showSuccess, showError, showWarning, dismiss } = useNotifications();

  // Get task ID from URL params
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  // Zustand store for all state management
  const {
    // Task Management
    currentTask,
    isLoadingTask,
    taskError,
    isSavingTranscript,
    lastSavedAt,
    autoSaveEnabled,
    loadTask,
    loadTranscript,
    saveTranscriptToBackend,
    saveDraftToBackend,
    clearTask,

    // Audio Player States
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    playbackSpeed,
    volume, setVolume,

    // Audio URL Management
    audioUrl, setAudioUrl,
    isAudioLoading, setIsAudioLoading,
    audioError, setAudioError,

    // Professional Waveform States (temporarily simplified)
    waveformMode, setWaveformMode,
    setWaveformSize,

    // Temporal Zoom States
    viewStartTime,
    viewEndTime,
    setTimeWindow,
    zoomInTemporal,
    zoomOutTemporal,
    fitToFullAudio,

    // Transcription Control States
    anchorA, setAnchorA,
    anchorB, setAnchorB,
    currentSegment,
    totalSegments, setTotalSegments,
    isLooping, setIsLooping,
    segmentLength,

    // UI States
    transcriptText, setTranscriptText,
    isShortcutsModalOpen, setIsShortcutsModalOpen,
    isConfigModalOpen, setIsConfigModalOpen,

    // Transcript Data
    transcripts,
    deleteTranscript,
    getTranscriptBySegmentId,

    // Configuration
    audioConfig, setAudioConfig,

    // Utility Actions
    nextSegment,
    previousSegment,
    saveCurrentSegmentEnhanced,
    formatTime,
    getTotalTranscribedDuration,

    // Enhanced Features
    selectedSegments,
    toggleSegmentSelection,
    selectAllSegments,
    clearSelection,
    bulkDeleteSelected,
    bulkUpdateSelectedSpeaker,
    updateTranscript,

    // Editing
    editingSegmentId,
    setEditingSegmentId,

    // Text Recording Mode
    isTextRecordingMode, setTextRecordingMode,
    textContent, setTextContent,
    recordedAudioBlob, recordedAudioUrl, setRecordedAudio
  } = useWorkspaceStore();



  // Review State
  const [reviewFeedback, setReviewFeedback] = React.useState("");

  // Debug store state (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎵 Workspace Store State:', {
        audioUrl,
        waveformMode,
        waveformSize: responsiveConfig.size,
        duration,
        isPlaying
      });
    }
  }, [audioUrl, waveformMode, responsiveConfig.size, duration, isPlaying]);

  const waveformRef = useRef<SmartWaveformRef>(null!);

  // No need for sidebar effect - ResizeObserver in waveform handles this

  const getTaskTitle = () => {
    return currentTask?.title || "Loading Task...";
  };

  // Load task data when component mounts
  useEffect(() => {
    if (taskId) {
      const initializeTask = async () => {
        try {
          await loadTask(taskId);
          await loadTranscript(taskId);
        } catch (error) {
          console.error('Failed to initialize task:', error);
          showError('Failed to load task. Please try again.');
          router.push('/tasks/draft');
        }
      };

      initializeTask();
       
    }

    // Cleanup when component unmounts
    return () => {
      clearTask();
      // Reset text recording state
      setTextRecordingMode(false);
      setTextContent(null);
      setRecordedAudio(null, null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]); // Only depend on taskId, functions are stable from Zustand

  // Check if task is pending approval after it loads
  useEffect(() => {
    if (!isLoadingTask && currentTask?.status === 'PENDING_APPROVAL') {
      showError('This task is pending admin approval. You will be notified when it\'s approved and ready for work.');
      router.push('/tasks/draft');
    }
     
  }, [isLoadingTask, currentTask?.status, showError, router]); // Check after task loads

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !taskId || transcripts.length === 0) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveDraftToBackend(taskId);
        console.log('Auto-saved draft');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveEnabled, taskId, transcripts.length]); // Function is stable from Zustand

  // Media control handlers
  const handlePlayPause = useCallback(async () => {
    // Read directly from waveform ref to avoid stale isPlaying state
    if (waveformRef.current && 'getCurrentTime' in waveformRef.current) {
      const ws = (waveformRef.current as any);
      // Check actual wavesurfer playing state
      if (isPlaying) {
        waveformRef.current?.pause();
      } else {
        await waveformRef.current?.play();
      }
    } else {
      if (isPlaying) {
        waveformRef.current?.pause();
      } else {
        await waveformRef.current?.play();
      }
    }
  }, [isPlaying]);

  const handleSkipToStart = useCallback(() => {
    waveformRef.current?.skipToStart();
  }, []);

  const handleRewind = useCallback(() => {
    waveformRef.current?.rewind(10); // Rewind 10 seconds
  }, []);

  const handleFastForward = useCallback(() => {
    waveformRef.current?.fastForward(10); // Fast forward 10 seconds
  }, []);

  const handleSkipToEnd = useCallback(() => {
    waveformRef.current?.skipToEnd();
  }, []);

  // Speed and volume control handlers
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    waveformRef.current?.setVolume(newVolume / 100); // Convert to 0-1 range
  }, [setVolume]);

  // Enhanced transcription handlers
  const setAnchorAHandler = useCallback(() => {
    // Get actual time directly from waveform ref (works even when paused)
    const actualTime = (waveformRef.current && 'getCurrentTime' in waveformRef.current)
      ? (waveformRef.current as any).getCurrentTime?.() ?? currentTime
      : currentTime;
    setAnchorA(actualTime);
    const newB = Math.min(actualTime + segmentLength, duration);
    setAnchorB(newB);
    // Zoom view to show both markers clearly
    const padding = Math.max(5, segmentLength * 0.5);
    setTimeWindow(Math.max(0, actualTime - padding), Math.min(duration, newB + padding));
  }, [currentTime, segmentLength, duration, setAnchorA, setAnchorB, setTimeWindow]);

  const setAnchorBHandler = useCallback(() => {
    // Get actual time directly from waveform ref (works even when paused)
    const actualTime = (waveformRef.current && 'getCurrentTime' in waveformRef.current)
      ? (waveformRef.current as any).getCurrentTime?.() ?? currentTime
      : currentTime;
    setAnchorB(actualTime);
    // Zoom view to show both markers clearly
    const padding = Math.max(5, segmentLength * 0.5);
    setTimeWindow(Math.max(0, anchorA - padding), Math.min(duration, actualTime + padding));
  }, [currentTime, anchorA, segmentLength, duration, setAnchorB, setTimeWindow]);

  const toggleLooping = useCallback(() => {
    setIsLooping(!isLooping);
    // TODO: Implement actual looping logic
  }, [isLooping, setIsLooping]);

  const handleConfigChange = (config: typeof audioConfig) => {
    setAudioConfig(config);
  };

  const handleSaveConfig = () => {
    // Here you would typically save to backend or local storage
    if (process.env.NODE_ENV === 'development') {
      console.log("Saved audio configuration:", audioConfig);
    }
    // Apply these settings to the WaveSurfer instance
    if (waveformRef.current) {
      waveformRef.current.setVolume(parseInt(audioConfig.defaultVolume) / 100);
      waveformRef.current.setPlaybackRate(
        parseFloat(audioConfig.defaultPlaybackRate)
      );
    }
  };

  // Calculate progress and total segments
  useEffect(() => {
    if (duration > 0) {
      setTotalSegments(Math.ceil(duration / segmentLength));
    }
  }, [duration, segmentLength, setTotalSegments]);

  // Initialize default segment (0-15 seconds) when component mounts
  useEffect(() => {
    // Ensure we have a valid default segment range
    if (anchorA === anchorB && anchorA === 0) {
      setAnchorB(15);
    }
  }, [anchorA, anchorB, setAnchorB]);

  // Enhanced audio loading functions
  const getErrorMessage = useCallback((error: unknown, context: string): string => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Check if it's a CORS error
      const errorString = error.toString().toLowerCase();
      if (errorString.includes('cors') || errorString.includes('cross-origin') || errorString.includes('access-control')) {
        return 'CORS Error: Audio server is blocking cross-origin requests. The backend needs to configure CORS headers on the R2 bucket or provide a proxy endpoint.';
      }
      return 'Network connection error. Please check your internet connection.';
    }
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('cors') || errorMsg.includes('cross-origin') || errorMsg.includes('access-control')) {
        return 'CORS Error: Audio server is blocking cross-origin requests. The backend needs to configure CORS headers on the R2 bucket or provide a proxy endpoint.';
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        return 'Audio file not found. Please contact support if this persists.';
      }
      if (error.message.includes('403') || error.message.includes('unauthorized')) {
        return 'Access denied. You may not have permission to access this audio file.';
      }
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again or check your connection.';
      }
      return `${context}: ${error.message}`;
    }
    return `${context}: Unknown error occurred`;
  }, []);

  const validateAudioFormat = useCallback((url: string): boolean => {
    const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'];
    const fileExtension = url.toLowerCase().substring(url.lastIndexOf('.'));

    if (!supportedFormats.includes(fileExtension)) {
      return false;
    }

    // Browser compatibility check
    const audio = document.createElement('audio');

    switch (fileExtension) {
      case '.mp3':
        return audio.canPlayType('audio/mpeg') !== '';
      case '.wav':
        return audio.canPlayType('audio/wav') !== '';
      case '.ogg':
        return audio.canPlayType('audio/ogg') !== '';
      case '.m4a':
        return audio.canPlayType('audio/mp4') !== '';
      case '.aac':
        return audio.canPlayType('audio/aac') !== '';
      case '.webm':
        return audio.canPlayType('audio/webm') !== '' || audio.canPlayType('video/webm') !== '';
      default:
        return false;
    }
  }, []);

  const loadAudioWithRetry = useCallback(async (attempt: number = 0): Promise<void> => {
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

    try {
      setIsAudioLoading(true);
      setAudioError(null);

      const urlToLoad = audioUrl;
      if (!urlToLoad) {
        setAudioError('No audio file available for this task');
        setIsAudioLoading(false);
        return;
      }

      // Validate audio format first
      // Enhanced detection for Text Recording Tasks (.txt files)
      // Check path without query params to handle signed URLs
      const urlPath = urlToLoad.split('?')[0].toLowerCase();
      if (urlPath.endsWith('.txt')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📄 Workspace: Detected text file, switching to Text Recording Mode:', urlToLoad);
        }
        try {
          setIsAudioLoading(true);
          const response = await fetch(urlToLoad);
          if (!response.ok) throw new Error('Failed to load text script');
          const text = await response.text();
          setTextContent(text);
          setTextRecordingMode(true);
          setIsAudioLoading(false);
          return; // Stop here, don't load into wavesurfer
        } catch (error) {
          console.error("Failed to load text:", error);
          setAudioError("Failed to load text script: " + (error as Error).message);
          setIsAudioLoading(false);
          return;
        }
      }

      // Check if URL is from external domain (e.g., R2/CDN) that might have CORS restrictions
      // For external URLs, skip HEAD validation and let Wavesurfer handle loading directly
      // This avoids CORS preflight issues for AUDIO, but we might need it for text detection if extension is missing
      const isExternalUrl = urlToLoad.startsWith('http://') || urlToLoad.startsWith('https://');
      const _isSameOrigin = isExternalUrl && typeof window !== 'undefined'
        ? new URL(urlToLoad).origin === window.location.origin
        : false;

      // Use a HEAD request to validate and check Content-Type
      // We try this even for external URLs if the extension check failed, to catch text files without extensions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(urlToLoad, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');

          // Fallback: If Content-Type is text, switch to Text Mode (handles signed URLs without extension)
          if (contentType && contentType.toLowerCase().includes('text/')) {
            if (process.env.NODE_ENV === 'development') {
              console.log('📄 Workspace: Detected text content-type, switching to Text Recording Mode:', contentType);
            }
            try {
              setIsAudioLoading(true);
              // Retrieve full content
              const textResponse = await fetch(urlToLoad);
              const text = await textResponse.text();
              setTextContent(text);
              setTextRecordingMode(true);
              setIsAudioLoading(false);
              return; // Stop audio loading
            } catch (err) {
              console.error("Failed to load text content:", err);
              // If text fetch fails, we might as well stop or handle error, but let's fallthrough to audio logic just in case? 
              // No, if it was text/plain, it's definitely not audio.
              setAudioError("Failed to load text script: " + (err as Error).message);
              setIsAudioLoading(false);
              return;
            }
          }
        }
      } catch (headError) {
        // If HEAD fails (e.g. CORS), we ignore it and proceed to assume it's audio (Wavesurfer handles CORS better)
        // unless validAudioFormat failed too.
        console.warn("HEAD request failed, proceeding with audio assumption:", headError);
      } // End of HEAD check block

      if (!validateAudioFormat(urlToLoad)) {
        // Only error out if we are sure it's not text (extension was not .txt) AND it's not a supported audio format
        // But if it has NO extension, validateAudioFormat might say false.
        // If HEAD failed and no extension, we are guessing.
        // Let's rely on standard logic: if extension is unknown, warn but try loading? 
        // validateAudioFormat is strict list. 
        // If extension is missing, validateAudioFormat returns false.
        // We throw here.
        const fileExtension = urlToLoad.toLowerCase().substring(urlToLoad.lastIndexOf('.'));
        throw new Error(`Audio format ${fileExtension} is not supported by your browser. Try MP3 or WAV files.`);
      }

      // Existing validation logic for same-origin (optional, since we just did HEAD)
      // We can skip the second HEAD block or keep it for status code checks (404/403)


      if (process.env.NODE_ENV === 'development') {
        console.log('🎵 Workspace: Audio validation successful, using URL:', urlToLoad);
      }
      setIsAudioLoading(false);

    } catch (error) {
      console.error(`🔥 Audio loading attempt ${attempt + 1} failed:`, error);

      const errorMessage = getErrorMessage(error, 'Failed to load audio');

      // Retry logic for network errors
      if (attempt < RETRY_DELAYS.length &&
        (error instanceof TypeError ||
          (error instanceof Error && error.message.includes('timeout')))) {

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        }

        setAudioError(`${errorMessage} (Retrying in ${Math.ceil(RETRY_DELAYS[attempt] / 1000)}s...)`);

        setTimeout(() => {
          loadAudioWithRetry(attempt + 1);
        }, RETRY_DELAYS[attempt]);

        return; // Don't set loading false when retrying
      }

      // Final failure
      setAudioError(errorMessage);
      setAudioUrl(null);
      setIsAudioLoading(false);
    }
  }, [audioUrl, setIsAudioLoading, setAudioError, getErrorMessage, validateAudioFormat, setAudioUrl]);

  // Bind audioUrl from currentTask whenever it becomes available (supports audioUrls)
  useEffect(() => {
    const fromTask = currentTask?.audioUrl ?? (currentTask?.audioUrls?.[0]);
    if (fromTask && audioUrl !== fromTask) {
      setAudioUrl(fromTask);
      setAudioError(null);
      setIsAudioLoading(false);
    }
  }, [currentTask, audioUrl, setAudioUrl, setAudioError, setIsAudioLoading]);

  // Enhanced audio loading with comprehensive error handling
  useEffect(() => {
    // Attempt audio loading when an audioUrl exists
    if (audioUrl) {
      loadAudioWithRetry();
    }
  }, [audioUrl, loadAudioWithRetry]);

  // Manual retry function for the retry button
  const retryAudioLoading = useCallback(() => {
    loadAudioWithRetry(0);
  }, [loadAudioWithRetry]);

  // Progress calculation available via getTranscriptionProgress() if needed

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, [setIsPlaying]);

  const handleTimeUpdate = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, [setCurrentTime, setDuration]);

  // Handle audio ready with enhanced validation
  const handleAudioReady = useCallback((audioDuration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎵 Workspace: Audio ready callback, duration:', audioDuration + 's');
    }

    if (audioDuration <= 0) {
      setAudioError('Invalid audio file: Duration is zero or negative');
      return;
    }

    // Allow up to 2 hours (7200 seconds) with buffer for encoding differences
    // 7500 seconds = 2 hours, 5 minutes (buffer for rounding/encoding variations)
    if (audioDuration > 7500) {
      setAudioError('Audio file too long: Maximum duration is 2 hours');
      return;
    }

    if (isNaN(audioDuration) || !isFinite(audioDuration)) {
      setAudioError('Invalid audio file: Duration is not a valid number');
      return;
    }

    // Audio is valid
    setDuration(audioDuration);
    setAudioError(null); // Clear any previous errors when audio loads successfully

    // Start with a 30-second view so markers are visible
    setTimeWindow(0, Math.min(30, audioDuration));

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Workspace: Audio file validated successfully');
    }
  }, [setDuration, setAudioError, setTimeWindow]);

  // Professional waveform event handlers (simplified)
  const handleModeChange = useCallback((mode: WaveformMode) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎵 Workspace: Mode changed to:', mode);
    }
    setWaveformMode(mode);
    showSuccess(`Switched to ${mode} mode`);
  }, [setWaveformMode, showSuccess]);

  const handleSizeChange = useCallback((size: WaveformSize) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎵 Workspace: Size changed to:', size);
    }
    setWaveformSize(size);
    showSuccess(`Waveform view: ${size}`);
  }, [setWaveformSize, showSuccess]);

  // Handle individual anchor changes from flag dragging
  const handleAnchorAChange = useCallback((time: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚩 Workspace: Anchor A dragged to:', time.toFixed(2) + 's');
    }
    setAnchorA(time);
  }, [setAnchorA]);

  const handleAnchorBChange = useCallback((time: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚩 Workspace: Anchor B dragged to:', time.toFixed(2) + 's');
    }
    setAnchorB(time);
  }, [setAnchorB]);

  // Use formatTime from store (no need to redefine)
  // const formatTime is already available from the store

  // Show shortcut feedback using notifications
  const showShortcutFeedback = useCallback((message: string) => {
    showSuccess(message, {
      timeout: 1500,
    });
  }, [showSuccess]);

  // Edit transcript chunk (load into main editor)
  const handleEditSegment = useCallback((segmentId: string) => {
    const chunk = getTranscriptBySegmentId(segmentId);
    if (chunk) {
      // Load chunk data into editor for re-editing
      setAnchorA(chunk.startTimeSeconds);
      setAnchorB(chunk.endTimeSeconds);
      setTranscriptText(chunk.text);

      showShortcutFeedback(`Loaded chunk (${chunk.startTime}-${chunk.endTime}) for editing`);
    }
  }, [getTranscriptBySegmentId, setAnchorA, setAnchorB, setTranscriptText, showShortcutFeedback]);

  // Delete transcript chunk
  const handleDeleteSegment = useCallback((segmentId: string) => {
    const chunk = getTranscriptBySegmentId(segmentId);
    const timeRange = chunk ? `${chunk.startTime}-${chunk.endTime}` : segmentId;

    deleteTranscript(segmentId);
    showShortcutFeedback(`Chunk deleted (${timeRange})`);
  }, [deleteTranscript, getTranscriptBySegmentId, showShortcutFeedback]);

  // Inline editing handlers
  const handleInlineEdit = useCallback((segmentId: string) => {
    setEditingSegmentId(segmentId);
  }, [setEditingSegmentId]);

  const handleInlineSave = useCallback((segmentId: string, updates: Record<string, unknown>) => {
    const result = updateTranscript(segmentId, updates);

    if (result.success) {
      showSuccess(`Segment ${segmentId} updated`);
      setEditingSegmentId(null);
    } else {
      showError("Failed to update segment");
    }
  }, [updateTranscript, setEditingSegmentId, showSuccess, showError]);

  const handleInlineCancel = useCallback(() => {
    setEditingSegmentId(null);
  }, [setEditingSegmentId]);

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    if (selectedSegments.length === 0) return;

    // Confirm deletion
    if (window.confirm(`Delete ${selectedSegments.length} selected segments?`)) {
      bulkDeleteSelected();
      showSuccess(`${selectedSegments.length} segments deleted`);
    }
  }, [selectedSegments.length, bulkDeleteSelected, showSuccess]);

  const handleBulkUpdateSpeaker = useCallback((speaker: string) => {
    if (selectedSegments.length === 0) return;

    bulkUpdateSelectedSpeaker(speaker);
    showSuccess(`Updated ${selectedSegments.length} segments to ${speaker}`);
  }, [selectedSegments.length, bulkUpdateSelectedSpeaker, showSuccess]);

  // Temporal zoom handler
  const handleTemporalZoom = useCallback((startTime: number, endTime: number) => {
    setTimeWindow(startTime, endTime);
  }, [setTimeWindow]);

  // Navigation and segment functions are now provided by the store
  // saveCurrentSegment, nextSegment, previousSegment are available from useWorkspaceStore
  
  // Enhanced segment navigation that also seeks waveform and updates view
  const handleNextSegment = useCallback(() => {
    if (currentSegment < totalSegments && duration > 0) {
      // Calculate the new segment values
      const newSegment = currentSegment + 1;
      const newAnchorA = (newSegment - 1) * segmentLength;
      const newAnchorB = Math.min(newSegment * segmentLength, duration);
      
      // Update segment in store (this updates currentSegment, anchorA, anchorB)
      nextSegment();
      
      // Update view window first
      const segmentDuration = newAnchorB - newAnchorA;
      const viewPadding = Math.max(5, segmentDuration * 0.2);
      const viewStart = Math.max(0, newAnchorA - viewPadding);
      const viewEnd = Math.min(duration, newAnchorB + viewPadding);
      setTimeWindow(viewStart, viewEnd);
      
      // Seek waveform to the start of the new segment
      // Try multiple times to ensure it works (waveform might need time to update)
      const attemptSeek = (attempts = 0) => {
        if (waveformRef.current && duration > 0) {
          try {
            // Check if seekTo method exists (it should exist on both ref types)
            if ('seekTo' in waveformRef.current && typeof waveformRef.current.seekTo === 'function') {
              // Validate the time is within bounds
              if (newAnchorA >= 0 && newAnchorA <= duration) {
                waveformRef.current.seekTo(newAnchorA);
                // Also update currentTime in store to reflect the new position
                setCurrentTime(newAnchorA);
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ Successfully seeked to segment:', newSegment, 'at time:', newAnchorA);
                }
              } else if (attempts < 3) {
                // Retry if time is out of bounds (might be a timing issue)
                setTimeout(() => attemptSeek(attempts + 1), 100);
              }
            } else if (attempts < 3) {
              // Retry if method doesn't exist yet (component might not be ready)
              setTimeout(() => attemptSeek(attempts + 1), 100);
            }
          } catch (error) {
            console.error('Failed to seek waveform:', error);
            if (attempts < 3) {
              setTimeout(() => attemptSeek(attempts + 1), 100);
            }
          }
        } else if (attempts < 3) {
          // Retry if ref isn't ready yet or duration is 0
          setTimeout(() => attemptSeek(attempts + 1), 100);
        }
      };
      
      // Start seeking after a small delay to ensure state updates are processed
      setTimeout(() => attemptSeek(), 50);
    }
  }, [currentSegment, totalSegments, segmentLength, duration, nextSegment, setTimeWindow, setCurrentTime]);
  
  const handlePreviousSegment = useCallback(() => {
    if (currentSegment > 1 && duration > 0) {
      // Calculate the new segment values
      const newSegment = currentSegment - 1;
      const newAnchorA = (newSegment - 1) * segmentLength;
      const newAnchorB = Math.min(newSegment * segmentLength, duration);
      
      // Update segment in store (this updates currentSegment, anchorA, anchorB)
      previousSegment();
      
      // Update view window first
      const segmentDuration = newAnchorB - newAnchorA;
      const viewPadding = Math.max(5, segmentDuration * 0.2);
      const viewStart = Math.max(0, newAnchorA - viewPadding);
      const viewEnd = Math.min(duration, newAnchorB + viewPadding);
      setTimeWindow(viewStart, viewEnd);
      
      // Seek waveform to the start of the new segment
      // Try multiple times to ensure it works (waveform might need time to update)
      const attemptSeek = (attempts = 0) => {
        if (waveformRef.current && duration > 0) {
          try {
            // Check if seekTo method exists (it should exist on both ref types)
            if ('seekTo' in waveformRef.current && typeof waveformRef.current.seekTo === 'function') {
              // Validate the time is within bounds
              if (newAnchorA >= 0 && newAnchorA <= duration) {
                waveformRef.current.seekTo(newAnchorA);
                // Also update currentTime in store to reflect the new position
                setCurrentTime(newAnchorA);
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ Successfully seeked to segment:', newSegment, 'at time:', newAnchorA);
                }
              } else if (attempts < 3) {
                // Retry if time is out of bounds (might be a timing issue)
                setTimeout(() => attemptSeek(attempts + 1), 100);
              }
            } else if (attempts < 3) {
              // Retry if method doesn't exist yet (component might not be ready)
              setTimeout(() => attemptSeek(attempts + 1), 100);
            }
          } catch (error) {
            console.error('Failed to seek waveform:', error);
            if (attempts < 3) {
              setTimeout(() => attemptSeek(attempts + 1), 100);
            }
          }
        } else if (attempts < 3) {
          // Retry if ref isn't ready yet or duration is 0
          setTimeout(() => attemptSeek(attempts + 1), 100);
        }
      };
      
      // Start seeking after a small delay to ensure state updates are processed
      setTimeout(() => attemptSeek(), 50);
    }
  }, [currentSegment, segmentLength, duration, previousSegment, setTimeWindow, setCurrentTime]);

  // Configuration handlers
  const toggleConfigModal = () => {
    setIsConfigModalOpen(!isConfigModalOpen);
  };

  const toggleShortcutsModal = useCallback(() => {
    const wasOpen = isShortcutsModalOpen;
    setIsShortcutsModalOpen(!wasOpen);

    // Focus management for accessibility
    if (!wasOpen) {
      // Opening modal - focus will be handled by the modal content
      setTimeout(() => {
        const closeButton = document.querySelector('[aria-label="Close keyboard shortcuts dialog"]') as HTMLElement;
        if (closeButton) {
          closeButton.focus();
        }
      }, 100);
    }
  }, [isShortcutsModalOpen, setIsShortcutsModalOpen]);

  // Enhanced save segment handler
  const handleSaveSegment = useCallback(() => {
    const result = saveCurrentSegmentEnhanced(selectedSpeaker);

    if (!result.success) {
      // Show errors
      result.errors?.forEach(error => showError(error));
      return;
    }

    // Show success with timestamp info
    const timeRange = `${formatTime(anchorA)}-${formatTime(anchorB)}`;
    showSuccess(`Transcript chunk saved (${timeRange})`);

    // Show warnings if any
    result.warnings?.forEach(warning => showWarning(warning));
  }, [saveCurrentSegmentEnhanced, anchorA, anchorB, formatTime, showSuccess, showError, showWarning]);

  // Save draft to backend (API call placeholder)
  const handleSaveDraft = useCallback(async () => {
    if (transcripts.length === 0) {
      showError("No segments to save as draft");
      return;
    }

    if (!taskId) {
      showError("No task ID available");
      return;
    }

    try {
      await saveDraftToBackend(taskId);
      showSuccess("Draft saved successfully");
    } catch (error) {
      console.error('Failed to save draft:', error);
      showError("Failed to save draft. Please try again.");
    }
  }, [transcripts.length, taskId, saveDraftToBackend, showError, showSuccess]);

  // Submit task for review
  const handleSubmitTask = useCallback(async () => {
    // Prevent double submission
    if (isSavingTranscript) return;

    if (transcripts.length === 0) {
      showError("No segments to submit");
      return;
    }

    if (!taskId) {
      showError("No task ID available");
      return;
    }

    try {
      // First save the final transcript
      await saveTranscriptToBackend(taskId);

      // Then submit the task
      const { taskService } = await import('@/services/task.service');
      const submissionText = [...transcripts]
        .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
        .map(t => `[${t.startTime}-${t.endTime}] ${t.speaker}: ${t.text}`)
        .join('\n\n');

      await taskService.submitTask(taskId, { submission: submissionText });

      showSuccess("Task submitted successfully!");
      router.push('/tasks/completed');
    } catch (error) {
      console.error('Failed to submit task:', error);
      showError("Failed to submit task. Please try again.");
    }
  }, [transcripts, taskId, saveTranscriptToBackend, router, isSavingTranscript, showError, showSuccess]);

  // Text Recording Handlers
  const handleSaveRecording = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setRecordedAudio(blob, url);
  }, [setRecordedAudio]);

  const handleClearRecording = useCallback(() => {
    setRecordedAudio(null, null);
  }, [setRecordedAudio]);

  const handleSubmitRecording = useCallback(async () => {
    if (!recordedAudioBlob || !taskId) {
      showError("No recording to submit");
      return;
    }

    try {
      const { taskService } = await import('@/services/task.service');

      // 1. Upload the audio file
      const uploadResult = await taskService.uploadAudio(taskId, recordedAudioBlob);

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Failed to upload audio");
      }

      // 2. Submit the task
      await taskService.submitTask(taskId, { submission: "Audio Recorded and Uploaded" });

      showSuccess("Recording submitted successfully!");
      router.push('/tasks/completed');

    } catch (error) {
      console.error("Failed to submit recording:", error);
      showError("Failed to submit recording. Please try again.");
    }
  }, [recordedAudioBlob, taskId, showError, showSuccess, router]);

  // Handle Review Decision (Approve/Reject)
  const handleReviewDecision = useCallback(async (decision: 'APPROVE' | 'REJECT') => {
    const reviewId = currentTask?.review?._id || currentTask?.review?.id;
    if (!reviewId) {
      showError("Review ID not found. Cannot submit review.");
      return;
    }

    try {
      const { taskService } = await import('@/services/task.service');

      await taskService.submitReview(reviewId, {
        rating: decision === 'APPROVE' ? 5 : 1,
        feedback: reviewFeedback || (decision === 'APPROVE' ? "Approved" : "Rejected"),
        decision
      });

      showSuccess(`Task ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
      router.push('/tasks/draft');
    } catch (error) {
      console.error("Review submission failed:", error);
      showError("Failed to submit review. Please try again.");
    }
  }, [currentTask, reviewFeedback, showError, showSuccess, router]);

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Special handling for Tab key - allow it to work even in input fields for segment navigation
      if (event.code === 'Tab') {
        event.preventDefault(); // Always prevent default Tab behavior (focus change)
        if (event.shiftKey) {
          handlePreviousSegment();
          showShortcutFeedback("Previous Segment");
        } else {
          handleNextSegment();
          showShortcutFeedback("Next Segment");
        }
        return; // Exit early after handling Tab
      }

      // Ignore other keyboard events when user is typing in input fields
      if (isInputField) {
        return;
      }

      // Prevent default behavior for our shortcuts
      const shortcutKeys = ['Space', 'KeyA', 'KeyB', 'KeyL', 'Tab', 'KeyS', 'KeyK', 'Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0'];
      if (shortcutKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          if (audioError) {
            showError("Cannot play: Audio failed to load");
            return;
          }
          if (!audioUrl) {
            showError("Cannot play: No audio loaded");
            return;
          }
          handlePlayPause();
          showShortcutFeedback(isPlaying ? "Paused" : "Playing");
          break;
        case 'KeyA':
          setAnchorAHandler();
          showShortcutFeedback("Anchor A Set");
          break;
        case 'KeyB':
          setAnchorBHandler();
          showShortcutFeedback("Anchor B Set");
          break;
        case 'KeyL':
          toggleLooping();
          showShortcutFeedback(isLooping ? "Loop Off" : "Loop On");
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            handleSkipToStart();
            showShortcutFeedback("Skip to Start");
          } else {
            handleRewind();
            showShortcutFeedback("Rewind 10s");
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            handleSkipToEnd();
            showShortcutFeedback("Skip to End");
          } else {
            handleFastForward();
            showShortcutFeedback("Fast Forward 10s");
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          const newVolumeUp = Math.min(100, volume + 5);
          setVolume(newVolumeUp);
          handleVolumeChange([newVolumeUp]);
          showShortcutFeedback(`Volume: ${newVolumeUp}%`);
          break;
        case 'ArrowDown':
          event.preventDefault();
          const newVolumeDown = Math.max(0, volume - 5);
          setVolume(newVolumeDown);
          handleVolumeChange([newVolumeDown]);
          showShortcutFeedback(`Volume: ${newVolumeDown}%`);
          break;
        case 'KeyK':
          // Alternative play/pause shortcut (YouTube-style) OR shortcuts modal
          if (event.shiftKey) {
            // Shift+K opens shortcuts modal
            toggleShortcutsModal();
            showShortcutFeedback("Shortcuts modal opened");
          } else {
            // K alone plays/pauses
            if (audioError) {
              showError("Cannot play: Audio failed to load");
              return;
            }
            if (!audioUrl) {
              showError("Cannot play: No audio loaded");
              return;
            }
            handlePlayPause();
            showShortcutFeedback(isPlaying ? "Paused" : "Playing");
          }
          break;
        case 'KeyS':
          // Save current segment (Ctrl+S)
          if (event.ctrlKey || event.metaKey) {
            handleSaveSegment();
          }
          break;
        case 'Equal': // + key for temporal zoom in
        case 'NumpadAdd':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomInTemporal(currentTime);
          }
          break;
        case 'Minus': // - key for temporal zoom out  
        case 'NumpadSubtract':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOutTemporal(currentTime);
          }
          break;
        case 'Digit0': // 0 key for fit to view
        case 'Numpad0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            fitToFullAudio();
          }
          break;
        case 'Escape':
          // Close shortcuts modal if open
          if (isShortcutsModalOpen) {
            setIsShortcutsModalOpen(false);
            showShortcutFeedback("Shortcuts Closed");
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isPlaying,
    isLooping,
    volume,
    currentSegment,
    totalSegments,
    isShortcutsModalOpen,
    handlePlayPause,
    setAnchorAHandler,
    setAnchorBHandler,
    toggleLooping,
    nextSegment,
    previousSegment,
    handleNextSegment,
    handlePreviousSegment,
    handleSkipToStart,
    handleSkipToEnd,
    handleRewind,
    handleFastForward,
    handleVolumeChange,
    handleSaveSegment,
    setVolume,
    setIsShortcutsModalOpen,
    audioError,
    audioUrl,
    toggleShortcutsModal,
    zoomInTemporal,
    zoomOutTemporal,
    fitToFullAudio,
    currentTime,
    showError,
    showShortcutFeedback
  ]);

  // Show loading state while task is being loaded
  if (isLoadingTask) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold">Loading Task...</div>
          <div className="text-sm text-muted-foreground">Please wait while we fetch the task details</div>
        </div>
      </div>
    );
  }

  // Show error state if task failed to load
  if (taskError) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive mb-2">Failed to Load Task</div>
          <div className="text-sm text-muted-foreground mb-4">{taskError}</div>
          <Button onClick={() => router.push('/tasks/draft')}>
            Back to My Tasks
          </Button>
        </div>
      </div>
    );
  }

  // Block access if task is pending approval
  if (currentTask?.status === 'PENDING_APPROVAL') {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-lg font-semibold mb-2">Task Pending Approval</div>
          <div className="text-sm text-muted-foreground mb-4">
            This task is currently pending admin approval. You will be notified when it&apos;s approved and ready for work.
          </div>
          <Button onClick={() => router.push('/tasks/draft')}>
            Back to My Tasks
          </Button>
        </div>
      </div>
    );
  }

  // Render Text Recording Interface if active
  if (isTextRecordingMode) {
    return (
      <div className="h-[calc(100vh-theme(spacing.16))] w-full bg-background flex flex-col overflow-auto">
        <div className="flex-shrink-0 px-6 py-4 border-b">
          <h1 className="text-xl font-semibold text-foreground">
            {getTaskTitle()}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">Audio Recording</Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {currentTask?.language || 'Language'}
            </Badge>
          </div>
        </div>
        <TextRecorderInterface
          textContent={textContent}
          onSave={handleSaveRecording}
          onSubmit={handleSubmitRecording}
          isSubmitting={isSavingTranscript} // re-using existing loading state var if appropriate or simply relying on router push
          recordedBlob={recordedAudioBlob}
          recordedUrl={recordedAudioUrl}
          onClearRecording={handleClearRecording}
        />
      </div>
    );
  }

  // Check if this is a review task (has submission field populated)
  const isReviewTask = currentTask?.submission && currentTask.submission.trim().length > 0;

  // Render specialized UI for review tasks
  if (isReviewTask) {
    return (
      <div className="relative flex h-[calc(100vh-theme(spacing.16))] w-full flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500 text-white">
                <CircleCheckBig className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Review Task</h1>
                <p className="text-sm text-muted-foreground">{currentTask?.title || 'Untitled Task'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentTask?.status || 'ASSIGNED'}
              </Badge>
              <Badge variant="default" className="text-xs bg-blue-500">
                MEDIUM
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column: Input (Original) */}
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <CardTitle className="text-base">Input (Original)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Original content provided for this task
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">Audio File</span>
                  </div>
                  {audioUrl ? (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <audio
                        controls
                        className="w-full"
                        src={audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                      No audio file available
                    </div>
                  )}
                </div>

                {/* Task Description */}
                {currentTask?.description && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Task Description</div>
                    <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      {currentTask.description}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column: Output (Submitted Work) */}
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CircleCheckBig className="h-4 w-4" />
                  <CardTitle className="text-base">Output (Submitted Work)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Work submitted by the freelancer for review
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {currentTask?.submission ? (
                  <ScrollArea className="h-full w-full rounded-lg border bg-muted/10">
                    <div className="p-4 whitespace-pre-wrap text-sm font-mono">
                      {currentTask.submission}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-muted-foreground mb-2">
                      No submission available for review yet.
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The freelancer may not have submitted the work yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer: Review Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/20">
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              Provide your feedback for this submission
            </div>

            <textarea
              className="w-full min-h-[80px] p-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter your feedback here... (optional for approval, required for rejection)"
              value={reviewFeedback}
              onChange={(e) => setReviewFeedback(e.target.value)}
            />

            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/tasks/draft')}
              >
                Back to Tasks
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReviewDecision('REJECT')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleReviewDecision('APPROVE')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CircleCheckBig className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular transcription workspace UI
  return (
    <div
      className="relative flex h-[calc(100vh-theme(spacing.16))] w-full flex-col overflow-hidden"
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      {/* Redesigned Header Section */}
      <div className="flex-shrink-0 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Task Title & Progress */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {getTaskTitle()}
            </h1>
            <Badge variant="secondary" className="text-xs font-medium">
              {formatTime(getTotalTranscribedDuration())} / {formatTime(duration)}
            </Badge>
            {lastSavedAt && (
              <Badge variant="outline" className="text-xs">
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </Badge>
            )}
            {isSavingTranscript && (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMetadataModalOpen(true)}
              className="h-8 text-xs"
              aria-label="Open speaker metadata"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Metadata
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleConfigModal}
              className="h-8 text-xs"
              aria-label="Open audio configuration settings"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="h-8 text-xs"
              aria-label="Save current transcripts as draft"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Draft
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs"
              aria-label="Submit completed transcription for review"
              onClick={handleSubmitTask}
              disabled={isSavingTranscript || transcripts.length === 0}
            >
              <CircleCheckBig className="h-3.5 w-3.5 mr-1.5" />
              {isSavingTranscript ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Flexible Content Area - Width Constrained */}
      <div
        className="flex flex-1 flex-col overflow-hidden px-4 pb-3 w-full"
        style={{ maxWidth: '100%' }}
      >
        <div className="flex flex-1 flex-col gap-2 py-1">

          {/* Transcript Segments Section - Fixed 290px height */}
          <div className="flex-shrink-0" style={{ height: '290px' }}>
            <div className="flex flex-col h-full border rounded-lg bg-background">
              {/* Compact Header */}
              <div className="flex-shrink-0 px-3 py-1.5 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium" id="transcript-segments-heading">
                    Transcript Timeline
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {transcripts.length} chunks
                    </Badge>
                    {transcripts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatTime(getTotalTranscribedDuration())} transcribed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Info */}
              <TimelineInfo chunksCount={transcripts.length} />

              {/* Bulk Actions Toolbar */}
              {selectedSegments.length > 0 && (
                <div className="px-3 pb-2">
                  <BulkActionsToolbar
                    selectedCount={selectedSegments.length}
                    onBulkDelete={handleBulkDelete}
                    onBulkUpdateSpeaker={handleBulkUpdateSpeaker}
                    onClearSelection={clearSelection}
                  />
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full w-full">
                  {transcripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-3">
                      {/* Compact Empty State */}
                      <div className="bg-primary/10 rounded-full p-3 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>

                      <h3 className="text-base font-semibold mb-1">No transcript chunks yet</h3>
                      <p className="text-muted-foreground text-sm mb-2 max-w-xs">
                        Start transcribing! Each save creates a new timeline chunk ordered by timestamp.
                      </p>

                      {/* Quick Start Actions */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="w-8 text-xs" scope="col">
                            <input
                              type="checkbox"
                              checked={selectedSegments.length === transcripts.length && transcripts.length > 0}
                              onChange={(e) => e.target.checked ? selectAllSegments() : clearSelection()}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead className="w-20 text-xs" scope="col">Timeline</TableHead>
                          <TableHead className="w-16 text-xs" scope="col">Speaker</TableHead>
                          <TableHead className="text-xs" scope="col">Text</TableHead>
                          <TableHead className="w-20 text-xs" scope="col">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transcripts.map((transcript: TranscriptSegment) => (
                          <TableRow
                            key={transcript.id}
                            className={cn(
                              "hover:bg-muted/30 h-12",
                              selectedSegments.includes(transcript.segmentId) && "bg-blue-50 border-blue-200"
                            )}
                          >
                            <TableCell className="text-xs">
                              <input
                                type="checkbox"
                                checked={selectedSegments.includes(transcript.segmentId)}
                                onChange={() => toggleSegmentSelection(transcript.segmentId)}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Play className="h-2.5 w-2.5" aria-hidden="true" />
                                <span className="font-mono">
                                  {transcript.startTime}→{transcript.endTime}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <User className="h-2.5 w-2.5 text-muted-foreground" aria-hidden="true" />
                                <span className="truncate text-muted-foreground">
                                  {transcript.speaker}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <InlineTranscriptEditor
                                segmentId={transcript.segmentId}
                                initialText={transcript.text}
                                initialSpeaker={transcript.speaker}
                                initialStartTime={transcript.startTime}
                                initialEndTime={transcript.endTime}
                                isEditing={editingSegmentId === transcript.segmentId}
                                onSave={handleInlineSave}
                                onCancel={handleInlineCancel}
                                onEdit={() => handleInlineEdit(transcript.segmentId)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-700"
                                  onClick={() => handleEditSegment(transcript.segmentId)}
                                  aria-label={`Edit segment ${transcript.segmentId}`}
                                >
                                  <Edit className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                                  onClick={() => handleDeleteSegment(transcript.segmentId)}
                                  aria-label={`Delete segment ${transcript.segmentId}`}
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

          {/* Editor Interface Section - Takes all remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: '220px' }}>
            <div className="flex flex-col h-full overflow-hidden">
              {/* Waveform Section - Fixed optimal height with strict width containment */}
              <div
                className="flex-shrink-0 mb-1 overflow-hidden w-full"
                style={{
                  height: '130px',
                  maxWidth: '100%',
                  width: '100%'
                }}
              >
                <div
                  className="h-full w-full overflow-hidden"
                  style={{ maxWidth: '100%' }}
                >
                  {/* Enhanced Waveform with Loading States */}
                  {isAudioLoading ? (
                    <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading audio...</span>
                      </div>
                    </div>
                  ) : audioError ? (
                    <div className="flex items-center justify-center h-full bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="text-center max-w-md px-4">
                        <p className="text-sm text-destructive mb-2 font-semibold">Failed to load audio</p>
                        <p className="text-xs text-muted-foreground mb-3">{audioError}</p>
                        {audioError.toLowerCase().includes('cors') || audioError.toLowerCase().includes('cross-origin') || audioError.toLowerCase().includes('access-control') ? (
                          <p className="text-xs text-muted-foreground mb-3 italic">
                            CORS issue detected. The audio server needs to allow cross-origin requests.
                            Please configure CORS headers on your R2 bucket or use a backend proxy endpoint.
                          </p>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={retryAudioLoading}
                        >
                          Retry Loading
                        </Button>
                      </div>
                    </div>
                  ) : !audioUrl ? (
                    <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg border border-muted">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">No Audio Available</p>
                        <p className="text-xs text-muted-foreground">
                          This task doesn&apos;t have an audio file attached. You can still work on transcription using the text editor below.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full overflow-hidden">
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
                        onModeChange={handleModeChange}
                        onSizeChange={handleSizeChange}
                        onAnchorAChange={handleAnchorAChange}
                        onAnchorBChange={handleAnchorBChange}
                        viewStartTime={viewStartTime}
                        viewEndTime={viewEndTime}
                        onTemporalZoom={handleTemporalZoom}
                        onZoomIn={() => zoomInTemporal(currentTime)}
                        onZoomOut={() => zoomOutTemporal(currentTime)}
                        onFitToView={fitToFullAudio}
                        _forceMode="professional"
                        showKeyboardShortcuts={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript Editor - Takes all remaining space */}
              <div className="flex-1 overflow-hidden" style={{ minHeight: '160px' }}>
                <TranscriptEditor
                  currentSegment={currentSegment}
                  totalSegments={totalSegments}
                  anchorA={anchorA}
                  anchorB={anchorB}
                  segmentLength={segmentLength}
                  selectedSpeaker={selectedSpeaker}
                  transcriptText={transcriptText}
                  onTranscriptChange={setTranscriptText}
                  onPreviousSegment={previousSegment}
                  onNextSegment={nextSegment}
                  onSaveSegment={handleSaveSegment}
                  formatTime={formatTime}
                />
              </div>

              {/* Save button moved to TranscriptEditor header */}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Pill Controls */}
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
            onSkipToStart={handleSkipToStart}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onSkipToEnd={handleSkipToEnd}
            onSetAnchorA={setAnchorAHandler}
            onSetAnchorB={setAnchorBHandler}
            onToggleLooping={toggleLooping}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={(speed: number) => {
              // TODO: Implement speed change handler
              if (process.env.NODE_ENV === 'development') {
                console.log("Speed changed:", speed);
              }
            }}
            onSpeakerChange={(speaker: string) => {
              setSelectedSpeaker(speaker);
            }}
            onOpenShortcuts={toggleShortcutsModal}
          />
        </div>
      </div>

      {/* Metadata Modal - Issue 5 */}
      <MetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        speakers={SPEAKERS}
        onSave={async (metadata) => {
          setSpeakerMetadata(metadata);
          if (taskId) {
            try {
              const { taskService } = await import('@/services/task.service');
              await taskService.saveSpeakerMetadata(taskId, metadata);
            } catch (error) {
              console.error('Failed to save metadata:', error);
            }
          }
        }}
        existingMetadata={speakerMetadata}
      />

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={toggleConfigModal}
        config={audioConfig}
        onConfigChange={handleConfigChange}
        onSaveConfig={handleSaveConfig}
      />

      {/* Shortcut feedback is now handled by Sonner toasts */}

      {/* Shortcuts Modal */}
      <div
        className={isShortcutsModalOpen ? "block" : "hidden"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        aria-describedby="shortcuts-modal-description"
      >
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={toggleShortcutsModal}
          aria-hidden="true"
        >
          <div
            className="bg-background fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="flex flex-col space-y-1.5 text-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2 flex-1">
                  <Keyboard className="text-primary h-4 w-4" aria-hidden="true" />
                  <h2 id="shortcuts-modal-title" className="text-lg font-semibold">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShortcutsModal}
                  aria-label="Close keyboard shortcuts dialog"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <p id="shortcuts-modal-description" className="text-muted-foreground text-sm">
                Speed up your transcription workflow with these keyboard shortcuts.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm" role="list" aria-label="Keyboard shortcuts list">
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Play / Pause</span>
                <div className="flex gap-1">
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">Space</kbd>
                  <span className="text-muted-foreground">or</span>
                  <kbd className="bg-muted rounded px-2 py-1 text-xs">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Open Shortcuts (this dialog)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Shift + K</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Set Anchor A (Start)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">A</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Set Anchor B (End)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">B</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Toggle Loop</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">L</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Next Segment</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Tab</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Previous Segment</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Shift + Tab</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Rewind 10s</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">← Left</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Fast Forward 10s</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">→ Right</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Skip to Start</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + ←</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Skip to End</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + →</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Volume Up</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">↑ Up</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Volume Down</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">↓ Down</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Save Segment (Ctrl+Enter)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Save Segment (to table)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Zoom In (Time)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + +</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Zoom Out (Time)</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + -</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 py-2" role="listitem">
                <span>Fit to Full Audio</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl + 0</kbd>
              </div>
              <div className="flex items-center justify-between py-2" role="listitem">
                <span>Close Dialog</span>
                <kbd className="bg-muted rounded px-2 py-1 text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
