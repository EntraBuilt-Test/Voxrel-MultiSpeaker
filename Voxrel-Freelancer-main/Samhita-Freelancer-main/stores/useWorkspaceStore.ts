import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { taskService } from '@/services/task.service';
import { Task } from '@/types';

export interface AudioConfig {
  autoplay: boolean;
  mediaControls: boolean;
  preload: string;
  defaultVolume: string;
  defaultPlaybackRate: string;
}

export interface TranscriptSegment {
  id: string;
  segmentId: string; // Unique chunk ID (same as id for now)
  startTime: string; // Formatted time like "1:23"
  endTime: string; // Formatted time like "1:38"
  startTimeSeconds: number; // Raw seconds for sorting
  endTimeSeconds: number; // Raw seconds for sorting
  speaker: string;
  text: string;
  createdAt: string; // When this chunk was created
}

export interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  label?: string;
  speaker?: string;
}

export type WaveformMode = 'view' | 'edit';
export type WaveformSize = 'compact' | 'standard' | 'professional';

// Enhanced interfaces for validation and saving
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SaveResult {
  success: boolean;
  segmentId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface SegmentUpdateData {
  text?: string;
  startTime?: string;
  endTime?: string;
  speaker?: string;
}

interface WorkspaceState {
  // Task Management
  currentTask: Task | null;
  isLoadingTask: boolean;
  taskError: string | null;
  isSavingTranscript: boolean;
  lastSavedAt: string | null;
  autoSaveEnabled: boolean;

  // Audio Player States
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;

  // Audio URL Management
  audioUrl: string | null;
  isAudioLoading: boolean;
  audioError: string | null;

  // Professional Waveform States
  waveformMode: WaveformMode;
  waveformSize: WaveformSize;
  waveformZoom: number;
  waveformRegions: WaveformRegion[];
  selectedRegion: string | null;
  showTimeline: boolean;
  enableRegions: boolean;

  // Temporal Zoom States
  viewStartTime: number;
  viewEndTime: number;
  viewDuration: number;

  // Transcription Control States
  anchorA: number;
  anchorB: number;
  currentSegment: number;
  totalSegments: number;
  isLooping: boolean;
  segmentLength: number;

  // UI States
  transcriptText: string;
  isShortcutsModalOpen: boolean;
  isConfigModalOpen: boolean;

  // Transcript Data
  transcripts: TranscriptSegment[];

  // Selection Management
  selectedSegments: string[];
  selectionMode: 'single' | 'multiple';

  // Inline Editing State
  editingSegmentId: string | null;

  // Configuration
  audioConfig: AudioConfig;

  // Text Recording Mode API
  isTextRecordingMode: boolean;
  textContent: string | null;
  recordedAudioBlob: Blob | null;
  recordedAudioUrl: string | null;

  // Task Management Actions
  loadTask: (taskId: string) => Promise<void>;
  loadTranscript: (taskId: string) => Promise<void>;
  saveTranscriptToBackend: (taskId: string) => Promise<void>;
  saveDraftToBackend: (taskId: string) => Promise<void>;
  clearTask: () => void;
  setAutoSave: (enabled: boolean) => void;

  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setAudioUrl: (url: string | null) => void;
  setIsAudioLoading: (loading: boolean) => void;
  setAudioError: (error: string | null) => void;

  // Professional Waveform Actions
  setWaveformMode: (mode: WaveformMode) => void;
  setWaveformSize: (size: WaveformSize) => void;
  setWaveformZoom: (zoom: number) => void;
  addWaveformRegion: (region: WaveformRegion) => void;
  updateWaveformRegion: (id: string, updates: Partial<WaveformRegion>) => void;
  removeWaveformRegion: (id: string) => void;
  setSelectedRegion: (id: string | null) => void;
  toggleTimeline: () => void;
  toggleRegions: () => void;

  // Temporal Zoom Actions
  setTimeWindow: (startTime: number, endTime: number) => void;
  zoomInTemporal: (centerTime?: number) => void;
  zoomOutTemporal: (centerTime?: number) => void;
  fitToFullAudio: () => void;

  setAnchorA: (time: number) => void;
  setAnchorB: (time: number) => void;
  setCurrentSegment: (segment: number) => void;
  setTotalSegments: (total: number) => void;
  setIsLooping: (looping: boolean) => void;
  setTranscriptText: (text: string) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  setIsConfigModalOpen: (open: boolean) => void;
  setAudioConfig: (config: AudioConfig) => void;

  // Text Recording Mode Actions
  setTextRecordingMode: (enabled: boolean) => void;
  setTextContent: (text: string | null) => void;
  setRecordedAudio: (blob: Blob | null, url: string | null) => void;

  // Transcript Management
  deleteTranscript: (segmentId: string) => void;
  getTranscriptBySegmentId: (segmentId: string) => TranscriptSegment | undefined;
  saveCurrentSegment: (selectedSpeaker?: string) => void;

  // Utility Actions
  nextSegment: () => void;
  previousSegment: () => void;
  formatTime: (time: number) => string;
  getTotalTranscribedDuration: () => number;

  // Enhanced Validation & Save
  validateSegment: (anchorA: number, anchorB: number, text: string) => ValidationResult;
  updateTranscript: (segmentId: string, updates: SegmentUpdateData) => SaveResult;
  saveCurrentSegmentEnhanced: (selectedSpeaker?: string) => SaveResult;

  // Selection Management
  toggleSegmentSelection: (segmentId: string) => void;
  selectAllSegments: () => void;
  clearSelection: () => void;
  selectSegmentRange: (startId: string, endId: string) => void;
  bulkDeleteSelected: () => void;
  bulkUpdateSelectedSpeaker: (speaker: string) => void;

  // Editing
  setEditingSegmentId: (segmentId: string | null) => void;

  // Timeline Utilities
  getChunksByTimeRange: (startTime: number, endTime: number) => TranscriptSegment[];
  getOverlappingChunks: (startTime: number, endTime: number) => TranscriptSegment[];
  getTranscriptionGaps: () => { start: number; end: number; duration: number }[];
  getChunkAtTime: (time: number) => TranscriptSegment | null;
}

const useWorkspaceStore = create<WorkspaceState>()(
  immer((set, get) => ({
    // --- STATE ---
    // Task Management
    currentTask: null,
    isLoadingTask: false,
    taskError: null,
    isSavingTranscript: false,
    lastSavedAt: null,
    autoSaveEnabled: true,

    // Audio Player States
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1,
    volume: 75,

    // Audio URL Management
    audioUrl: null,
    isAudioLoading: false,
    audioError: null,

    // Professional Waveform States
    waveformMode: 'view',
    waveformSize: 'standard',
    waveformZoom: 1,
    waveformRegions: [],
    selectedRegion: null,
    showTimeline: true,
    enableRegions: true,

    // Temporal Zoom States
    viewStartTime: 0,
    viewEndTime: 60,
    viewDuration: 60,

    // Transcription Control States
    anchorA: 0,
    anchorB: 15,
    currentSegment: 1,
    totalSegments: 1,
    isLooping: false,
    segmentLength: 15,

    // UI States
    transcriptText: "",
    isShortcutsModalOpen: false,
    isConfigModalOpen: false,

    // Transcript Data
    transcripts: [],

    // Selection State
    selectedSegments: [],
    selectionMode: 'single',

    // Inline Editing
    editingSegmentId: null,

    // Configuration
    audioConfig: {
      autoplay: false,
      mediaControls: true,
      preload: "auto",
      defaultVolume: "75",
      defaultPlaybackRate: "1",
    },

    // Text Recording Mode State
    isTextRecordingMode: false,
    textContent: null as string | null,
    recordedAudioBlob: null as Blob | null,
    recordedAudioUrl: null as string | null,

    // --- ACTIONS ---
    setTextRecordingMode: (enabled: boolean) => {
      set(state => {
        state.isTextRecordingMode = enabled;
      });
    },

    setTextContent: (text: string | null) => {
      set(state => {
        state.textContent = text;
      });
    },

    setRecordedAudio: (blob: Blob | null, url: string | null) => {
      set(state => {
        state.recordedAudioBlob = blob;
        state.recordedAudioUrl = url;
      });
    },
    setIsPlaying: (playing: boolean) => {
      set(state => {
        state.isPlaying = playing;
      });
    },

    setCurrentTime: (time: number) => {
      set(state => {
        state.currentTime = time;
      });
    },

    setDuration: (duration: number) => {
      set(state => {
        state.duration = duration;
      });
    },

    setVolume: (volume: number) => {
      set(state => {
        state.volume = volume;
      });
    },

    setAudioUrl: (url: string | null) => {
      set(state => {
        state.audioUrl = url;
      });
    },

    setIsAudioLoading: (loading: boolean) => {
      set(state => {
        state.isAudioLoading = loading;
      });
    },

    setAudioError: (error: string | null) => {
      set(state => {
        state.audioError = error;
      });
    },

    // Professional Waveform Actions Implementation
    setWaveformMode: (mode: WaveformMode) => {
      set(state => {
        state.waveformMode = mode;
      });
    },

    setWaveformSize: (size: WaveformSize) => {
      set(state => {
        state.waveformSize = size;
      });
    },

    setWaveformZoom: (zoom: number) => {
      set(state => {
        state.waveformZoom = zoom;
      });
    },

    addWaveformRegion: (region: WaveformRegion) => {
      set(state => {
        state.waveformRegions.push(region);
      });
    },

    updateWaveformRegion: (id: string, updates: Partial<WaveformRegion>) => {
      set(state => {
        const index = state.waveformRegions.findIndex(r => r.id === id);
        if (index !== -1) {
          state.waveformRegions[index] = { ...state.waveformRegions[index], ...updates };
        }
      });
    },

    removeWaveformRegion: (id: string) => {
      set(state => {
        state.waveformRegions = state.waveformRegions.filter(r => r.id !== id);
        if (state.selectedRegion === id) {
          state.selectedRegion = null;
        }
      });
    },

    setSelectedRegion: (id: string | null) => {
      set(state => {
        state.selectedRegion = id;
      });
    },

    toggleTimeline: () => {
      set(state => {
        state.showTimeline = !state.showTimeline;
      });
    },

    toggleRegions: () => {
      set(state => {
        state.enableRegions = !state.enableRegions;
      });
    },

    setAnchorA: (time: number) => {
      set(state => {
        state.anchorA = time;
      });
    },

    setAnchorB: (time: number) => {
      set(state => {
        state.anchorB = time;
      });
    },

    setCurrentSegment: (segment: number) => {
      set(state => {
        state.currentSegment = segment;
      });
    },

    setTotalSegments: (total: number) => {
      set(state => {
        state.totalSegments = total;
      });
    },

    setIsLooping: (looping: boolean) => {
      set(state => {
        state.isLooping = looping;
      });
    },

    setTranscriptText: (text: string) => {
      set(state => {
        state.transcriptText = text;
      });
    },

    setIsShortcutsModalOpen: (open: boolean) => {
      set(state => {
        state.isShortcutsModalOpen = open;
      });
    },

    setIsConfigModalOpen: (open: boolean) => {
      set(state => {
        state.isConfigModalOpen = open;
      });
    },

    setAudioConfig: (config: AudioConfig) => {
      set(state => {
        state.audioConfig = config;
      });
    },

    // --- TRANSCRIPT MANAGEMENT ---
    deleteTranscript: (segmentId: string) => {
      set(state => {
        state.transcripts = state.transcripts.filter(t => t.segmentId !== segmentId);
      });
    },

    getTranscriptBySegmentId: (segmentId: string) => {
      return get().transcripts.find(t => t.segmentId === segmentId);
    },

    saveCurrentSegment: (selectedSpeaker?: string) => {
      set(state => {
        const { anchorA, anchorB, transcriptText } = state;

        if (anchorA === anchorB || !transcriptText.trim()) {
          return;
        }

        const formatTime = (time: number) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          return `${minutes}:${String(seconds).padStart(2, '0')}`;
        };

        const uniqueId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

        const newChunk: TranscriptSegment = {
          id: uniqueId,
          segmentId: uniqueId, // Each chunk gets unique ID
          startTime: formatTime(anchorA),
          endTime: formatTime(anchorB),
          startTimeSeconds: anchorA,
          endTimeSeconds: anchorB,
          speaker: selectedSpeaker || "Speaker 1", // Use selected speaker
          text: transcriptText,
          createdAt: new Date().toISOString(),
        };

        // ACCUMULATE - don't replace, just add to the list
        state.transcripts.push(newChunk);

        // Sort by actual start time (chronological order)
        state.transcripts.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

        // Clear current transcript text
        state.transcriptText = "";
      });
    },

    // --- UTILITY ACTIONS ---
    nextSegment: () => {
      set(state => {
        const { currentSegment, totalSegments, segmentLength } = state;
        if (currentSegment < totalSegments) {
          const newSegment = currentSegment + 1;
          state.currentSegment = newSegment;
          state.anchorA = (newSegment - 1) * segmentLength;
          state.anchorB = Math.min(newSegment * segmentLength, state.duration);
          state.transcriptText = "";
        }
      });
    },

    previousSegment: () => {
      set(state => {
        const { currentSegment, segmentLength } = state;
        if (currentSegment > 1) {
          const newSegment = currentSegment - 1;
          state.currentSegment = newSegment;
          state.anchorA = (newSegment - 1) * segmentLength;
          state.anchorB = newSegment * segmentLength;
          state.transcriptText = "";
        }
      });
    },

    formatTime: (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },

    getTotalTranscribedDuration: () => {
      const { transcripts } = get();
      // Return the maximum end time among all segments (furthest point transcribed)
      // This prevents counting overlapping segments multiple times
      if (transcripts.length === 0) return 0;
      return Math.max(...transcripts.map(transcript => transcript.endTimeSeconds));
    },

    // --- ENHANCED VALIDATION & SAVE ---
    validateSegment: (anchorA: number, anchorB: number, text: string) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Time validation
      if (anchorA === anchorB) {
        errors.push("Please select segment range first (A-B anchors)");
      }
      if (anchorB - anchorA < 1) {
        warnings.push("Very short segment (less than 1 second)");
      }
      if (anchorB - anchorA > 60) {
        warnings.push("Long segment (over 60 seconds) - consider splitting");
      }

      // Text validation
      if (!text.trim()) {
        errors.push("Please enter transcript text");
      }
      if (text.trim().length < 3) {
        warnings.push("Very short transcript text");
      }
      if (text.length > 1000) {
        warnings.push("Very long transcript text - consider splitting segment");
      }

      // Check for overlaps with existing segments (now using seconds for accuracy)
      const { transcripts, duration } = get();
      const overlapping = transcripts.find(t => {
        return (anchorA < t.endTimeSeconds && anchorB > t.startTimeSeconds);
      });

      if (overlapping) {
        warnings.push(`Overlaps with existing chunk (${overlapping.startTime}-${overlapping.endTime})`);
      }

      // Check if beyond audio duration
      if (anchorB > duration) {
        errors.push("Segment end time exceeds audio duration");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    },

    saveCurrentSegmentEnhanced: (selectedSpeaker?: string) => {
      const { anchorA, anchorB, transcriptText, validateSegment } = get();

      // Validate first
      const validation = validateSegment(anchorA, anchorB, transcriptText);

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Get transcript count before save to calculate which chunk was added
      const transcriptsBefore = get().transcripts.length;

      // Call existing saveCurrentSegment (now accumulative)
      get().saveCurrentSegment(selectedSpeaker);

      // Get the newly added chunk
      const transcriptsAfter = get().transcripts;
      const newChunk = transcriptsAfter[transcriptsAfter.length - 1]; // Last added after sorting

      return {
        success: true,
        segmentId: newChunk?.segmentId || 'unknown',
        warnings: validation.warnings
      };
    },

    updateTranscript: (segmentId: string, updates: SegmentUpdateData) => {
      const state = get();
      const index = state.transcripts.findIndex(t => t.segmentId === segmentId);

      if (index === -1) {
        return {
          success: false,
          errors: ['Segment not found']
        };
      }

      set(draft => {
        const transcript = draft.transcripts[index];

        // Apply updates
        if (updates.text !== undefined) transcript.text = updates.text;
        if (updates.speaker !== undefined) transcript.speaker = updates.speaker;

        // Handle time updates (need to update both formatted and seconds)
        if (updates.startTime !== undefined) {
          transcript.startTime = updates.startTime;
          // Parse back to seconds for sorting
          const [mins, secs] = updates.startTime.split(':').map(Number);
          transcript.startTimeSeconds = mins * 60 + secs;
        }
        if (updates.endTime !== undefined) {
          transcript.endTime = updates.endTime;
          // Parse back to seconds for sorting
          const [mins, secs] = updates.endTime.split(':').map(Number);
          transcript.endTimeSeconds = mins * 60 + secs;
        }

        // Re-sort by actual time if time changed
        if (updates.startTime || updates.endTime) {
          draft.transcripts.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
        }
      });

      return {
        success: true,
        segmentId
      };
    },

    // --- SELECTION MANAGEMENT ---
    toggleSegmentSelection: (segmentId: string) => {
      set(state => {
        const isSelected = state.selectedSegments.includes(segmentId);

        if (state.selectionMode === 'single') {
          state.selectedSegments = isSelected ? [] : [segmentId];
        } else {
          if (isSelected) {
            state.selectedSegments = state.selectedSegments.filter(id => id !== segmentId);
          } else {
            state.selectedSegments.push(segmentId);
          }
        }
      });
    },

    selectAllSegments: () => {
      set(state => {
        state.selectedSegments = state.transcripts.map(t => t.segmentId);
      });
    },

    clearSelection: () => {
      set(state => {
        state.selectedSegments = [];
      });
    },

    selectSegmentRange: (startId: string, endId: string) => {
      set(state => {
        const startIndex = state.transcripts.findIndex(t => t.segmentId === startId);
        const endIndex = state.transcripts.findIndex(t => t.segmentId === endId);

        if (startIndex !== -1 && endIndex !== -1) {
          const start = Math.min(startIndex, endIndex);
          const end = Math.max(startIndex, endIndex);
          state.selectedSegments = state.transcripts
            .slice(start, end + 1)
            .map(t => t.segmentId);
        }
      });
    },

    bulkDeleteSelected: () => {
      set(state => {
        state.transcripts = state.transcripts.filter(
          t => !state.selectedSegments.includes(t.segmentId)
        );
        state.selectedSegments = [];
      });
    },

    bulkUpdateSelectedSpeaker: (speaker: string) => {
      set(state => {
        state.transcripts.forEach(transcript => {
          if (state.selectedSegments.includes(transcript.segmentId)) {
            transcript.speaker = speaker;
          }
        });
      });
    },

    // --- EDITING ---
    setEditingSegmentId: (segmentId: string | null) => {
      set(state => {
        state.editingSegmentId = segmentId;
      });
    },

    // --- TEMPORAL ZOOM ---
    setTimeWindow: (startTime: number, endTime: number) => {
      set(state => {
        state.viewStartTime = Math.max(0, startTime);
        state.viewEndTime = Math.min(state.duration, endTime);
        state.viewDuration = state.viewEndTime - state.viewStartTime;
      });
    },

    zoomInTemporal: (centerTime?: number) => {
      const { viewStartTime, viewEndTime, currentTime, duration } = get();
      const currentViewDuration = viewEndTime - viewStartTime;
      const newViewDuration = Math.max(5, currentViewDuration * 0.5); // Min 5 seconds

      const center = centerTime ?? currentTime;
      let newStart = center - newViewDuration / 2;
      let newEnd = center + newViewDuration / 2;

      // Keep within audio bounds
      if (newStart < 0) {
        newStart = 0;
        newEnd = newViewDuration;
      }
      if (newEnd > duration) {
        newEnd = duration;
        newStart = Math.max(0, duration - newViewDuration);
      }

      get().setTimeWindow(newStart, newEnd);
    },

    zoomOutTemporal: (centerTime?: number) => {
      const { viewStartTime, viewEndTime, currentTime, duration } = get();
      const currentViewDuration = viewEndTime - viewStartTime;
      const newViewDuration = Math.min(duration, currentViewDuration * 2); // Max full audio

      const center = centerTime ?? currentTime;
      let newStart = center - newViewDuration / 2;
      let newEnd = center + newViewDuration / 2;

      // Keep within audio bounds
      if (newStart < 0) {
        newStart = 0;
        newEnd = newViewDuration;
      }
      if (newEnd > duration) {
        newEnd = duration;
        newStart = Math.max(0, duration - newViewDuration);
      }

      get().setTimeWindow(newStart, newEnd);
    },

    fitToFullAudio: () => {
      const { duration } = get();
      get().setTimeWindow(0, duration);
    },

    // --- TIMELINE UTILITIES ---
    getChunksByTimeRange: (startTime: number, endTime: number) => {
      const { transcripts } = get();
      return transcripts.filter(chunk =>
        chunk.startTimeSeconds < endTime && chunk.endTimeSeconds > startTime
      );
    },

    getOverlappingChunks: (startTime: number, endTime: number) => {
      const { transcripts } = get();
      return transcripts.filter(chunk =>
        chunk.startTimeSeconds < endTime && chunk.endTimeSeconds > startTime
      );
    },

    getTranscriptionGaps: () => {
      const { transcripts, duration } = get();
      if (transcripts.length === 0) {
        return duration > 0 ? [{ start: 0, end: duration, duration }] : [];
      }

      const gaps: { start: number; end: number; duration: number }[] = [];

      // Sort by start time
      const sortedChunks = [...transcripts].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

      // Check gap at beginning
      if (sortedChunks[0].startTimeSeconds > 0) {
        const gapDuration = sortedChunks[0].startTimeSeconds;
        gaps.push({ start: 0, end: sortedChunks[0].startTimeSeconds, duration: gapDuration });
      }

      // Check gaps between chunks
      for (let i = 0; i < sortedChunks.length - 1; i++) {
        const currentEnd = sortedChunks[i].endTimeSeconds;
        const nextStart = sortedChunks[i + 1].startTimeSeconds;

        if (nextStart > currentEnd) {
          const gapDuration = nextStart - currentEnd;
          gaps.push({ start: currentEnd, end: nextStart, duration: gapDuration });
        }
      }

      // Check gap at end
      const lastChunk = sortedChunks[sortedChunks.length - 1];
      if (lastChunk.endTimeSeconds < duration) {
        const gapDuration = duration - lastChunk.endTimeSeconds;
        gaps.push({ start: lastChunk.endTimeSeconds, end: duration, duration: gapDuration });
      }

      return gaps;
    },

    getChunkAtTime: (time: number) => {
      const { transcripts } = get();
      return transcripts.find(chunk =>
        time >= chunk.startTimeSeconds && time <= chunk.endTimeSeconds
      ) || null;
    },

    // --- TASK MANAGEMENT ACTIONS ---
    loadTask: async (taskId: string) => {
      set(state => {
        state.isLoadingTask = true;
        state.taskError = null;
      });

      try {
        const response = await taskService.getTaskById(taskId);

        if (response.success) {
          set(state => {
            state.currentTask = response.data;
            state.isLoadingTask = false;
            state.taskError = null;

            // Set audio URL from task - support both audioUrl (string) and audioUrls (array) from backend
            const audioUrlFromTask = response.data.audioUrl ??
              (Array.isArray(response.data.audioUrls) && response.data.audioUrls.length > 0
                ? response.data.audioUrls[0]
                : null);

            if (audioUrlFromTask) {
              state.audioUrl = audioUrlFromTask;
            } else {
              // No audio available - set to null
              state.audioUrl = null;
            }
          });
        } else {
          throw new Error(response.message || 'Failed to load task');
        }
      } catch (error) {
        // Fallback: Try to get task data from "My Tasks" list
        try {
          console.log('Individual task API failed, trying to get from My Tasks list...');
          const myTasksResponse = await taskService.getMyTasks(1, 100);

          if (myTasksResponse.success && myTasksResponse.data.tasks) {
            const task = myTasksResponse.data.tasks.find((t: any) => t._id === taskId);

            if (task) {
              set(state => {
                state.currentTask = task;
                state.isLoadingTask = false;
                state.taskError = null;

                // Set audio URL from task - support both audioUrl (string) and audioUrls (array) from backend
                const audioUrlFromTask = task.audioUrl ??
                  (Array.isArray(task.audioUrls) && task.audioUrls.length > 0
                    ? task.audioUrls[0]
                    : null);

                if (audioUrlFromTask) {
                  state.audioUrl = audioUrlFromTask;
                } else {
                  // No audio available - set to null
                  state.audioUrl = null;
                }
              });
              console.log('Task loaded from My Tasks list:', task.title);
              return;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback task loading also failed:', fallbackError);
        }

        set(state => {
          state.taskError = error instanceof Error ? error.message : 'Failed to load task';
          state.isLoadingTask = false;
        });
        console.error('Failed to load task:', error);
        throw error;
      }
    },

    loadTranscript: async (taskId: string) => {
      try {
        const response = await taskService.getTranscript(taskId);

        if (response.success && response.data.segments) {
          // Convert backend transcript format to frontend format
          const convertedTranscripts = response.data.segments.map((segment: any, index: number) => ({
            id: `segment_${index}`,
            segmentId: `segment_${index}`,
            startTime: get().formatTime(segment.timestamp.start),
            endTime: get().formatTime(segment.timestamp.end),
            startTimeSeconds: segment.timestamp.start,
            endTimeSeconds: segment.timestamp.end,
            speaker: "Speaker 1", // Default speaker
            text: segment.content,
            createdAt: new Date().toISOString(),
          }));

          set(state => {
            state.transcripts = convertedTranscripts;
          });
        }
      } catch (error) {
        console.error('Failed to load transcript:', error);
        // Don't throw error - transcript might not exist yet
      }
    },

    saveTranscriptToBackend: async (taskId: string) => {
      const { transcripts } = get();

      if (transcripts.length === 0) {
        console.warn('No transcripts to save');
        return;
      }

      set(state => {
        state.isSavingTranscript = true;
      });

      try {
        // Convert frontend transcript format to backend format
        const backendSegments = transcripts.map(transcript => ({
          timestamp: {
            start: transcript.startTimeSeconds,
            end: transcript.endTimeSeconds,
          },
          content: transcript.text,
          remark: '', // Could be enhanced later
          quality: 100, // Default quality score
        }));

        const response = await taskService.saveTranscript(taskId, {
          segments: backendSegments,
        });

        if (response.success) {
          set(state => {
            state.lastSavedAt = new Date().toISOString();
            state.isSavingTranscript = false;
          });
          console.log('Transcript saved successfully');
        } else {
          throw new Error(response.message || 'Failed to save transcript');
        }
      } catch (error) {
        set(state => {
          state.isSavingTranscript = false;
        });
        console.error('Failed to save transcript:', error);
        throw error;
      }
    },

    saveDraftToBackend: async (taskId: string) => {
      const { transcripts, getTotalTranscribedDuration, duration } = get();

      if (transcripts.length === 0) {
        console.warn('No draft to save');
        return;
      }

      try {
        // Calculate progress percentage
        const progress = duration > 0 ? Math.round((getTotalTranscribedDuration() / duration) * 100) : 0;

        // Convert frontend transcript format to backend format
        const backendSegments = transcripts.map(transcript => ({
          timestamp: {
            start: transcript.startTimeSeconds,
            end: transcript.endTimeSeconds,
          },
          content: transcript.text,
          remark: '', // Could be enhanced later
          quality: 100, // Default quality score
        }));

        const response = await taskService.saveDraft(taskId, {
          progress,
          segments: backendSegments,
          lastSavedAt: new Date().toISOString(),
        });

        if (response.success) {
          set(state => {
            state.lastSavedAt = new Date().toISOString();
          });
          console.log('Draft saved successfully');
        } else {
          throw new Error(response.message || 'Failed to save draft');
        }
      } catch (error) {
        console.error('Failed to save draft:', error);
        throw error;
      }
    },

    clearTask: () => {
      set(state => {
        state.currentTask = null;
        state.taskError = null;
        state.transcripts = [];
        state.audioUrl = null;
        state.lastSavedAt = null;
        state.transcriptText = '';
        state.anchorA = 0;
        state.anchorB = 15;
        state.currentTime = 0;
        state.duration = 0;
      });
    },

    setAutoSave: (enabled: boolean) => {
      set(state => {
        state.autoSaveEnabled = enabled;
      });
    },
  }))
);

export default useWorkspaceStore;
