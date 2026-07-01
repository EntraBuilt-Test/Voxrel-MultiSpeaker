"use client"

import { Edit, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react"
import * as React from "react"
import WaveSurfer from 'wavesurfer.js'

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type WaveformMode = 'view' | 'edit'
export type WaveformSize = 'compact' | 'standard' | 'professional'

/**
 * Converts external URLs to use the audio proxy to avoid CORS issues
 * NOTE: This function is now a pass-through because URLs are already proxied
 * by the SmartWaveform component using the backend media proxy.
 * @param url - The original audio URL (already proxied if needed)
 * @returns The URL as-is
 */
const getProxiedAudioUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // URLs are already proxied by SmartWaveform component if needed
  // Just return as-is to avoid double-proxying
  return url;
}

export interface ProfessionalWaveformRef {
  play: () => Promise<void>
  pause: () => void
  seekTo: (time: number) => void
  skipToStart: () => void
  skipToEnd: () => void
  rewind: (seconds: number) => void
  fastForward: (seconds: number) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  setMode: (mode: WaveformMode) => void
  setSize: (size: WaveformSize) => void
  zoomIn: () => void
  zoomOut: () => void
  fitToView: () => void
  getCurrentTime: () => number
  getDuration: () => number
}

interface ProfessionalWaveformProps {
  className?: string
  audioUrl?: string | null
  mode?: WaveformMode
  size?: WaveformSize
  showControls?: boolean

  // Anchor A/B for flag sticks
  anchorA?: number
  anchorB?: number
  formatTime?: (time: number) => string

  // Temporal zoom props
  viewStartTime?: number
  viewEndTime?: number
  onTemporalZoom?: (startTime: number, endTime: number) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitToView?: () => void

  onPlayStateChange?: (isPlaying: boolean) => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onReady?: (duration: number) => void
  onModeChange?: (mode: WaveformMode) => void
  onSizeChange?: (size: WaveformSize) => void
  onAnchorAChange?: (time: number) => void
  onAnchorBChange?: (time: number) => void

  // Keyboard shortcuts integration
  showKeyboardShortcuts?: boolean
}

const ProfessionalWaveformSimple = React.forwardRef<ProfessionalWaveformRef, ProfessionalWaveformProps>(
  ({
    className,
    audioUrl,
    mode = 'view',
    onZoomIn: externalZoomIn,
    onZoomOut: externalZoomOut,
    onFitToView: externalFitToView,
    size = 'standard',
    showControls = true,

    // Anchor A/B props with defaults
    anchorA = 0,
    anchorB = 15,
    formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },

    // Temporal zoom props
    viewStartTime,
    viewEndTime,
    onTemporalZoom,

    onPlayStateChange,
    onTimeUpdate,
    onReady,
    onModeChange,
    onSizeChange,
    onAnchorAChange,
    onAnchorBChange,

    // Keyboard shortcuts props  
    showKeyboardShortcuts = false
  }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const waveformAreaRef = React.useRef<HTMLDivElement>(null)
    const wavesurferRef = React.useRef<WaveSurfer | null>(null)

    const [currentMode, setCurrentMode] = React.useState<WaveformMode>(mode)

    // Sync currentMode when mode prop changes from parent
    React.useEffect(() => {
      setCurrentMode(mode)
    }, [mode])
    const [currentSize, setCurrentSize] = React.useState<WaveformSize>(size)
    const [isInitialized, setIsInitialized] = React.useState(false)
    const [_zoomLevel, _setZoomLevel] = React.useState(1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isActuallyPlaying, setIsActuallyPlaying] = React.useState(false)

    // Flag drag state for individual flag dragging
    const [isDraggingA, setIsDraggingA] = React.useState(false)
    const [isDraggingB, setIsDraggingB] = React.useState(false)
    const [_dragStartX, _setDragStartX] = React.useState(0)
    const [_dragStartTime, _setDragStartTime] = React.useState(0)
    const [_snapToGrid, _setSnapToGrid] = React.useState(true)
    const [_snapInterval, _setSnapInterval] = React.useState(0.1) // Default 0.1 second snapping

    // Calculate control heights - waveform will be flexible
    const getControlHeight = React.useCallback((size: WaveformSize) => {
      if (!showControls) return 0;
      switch (size) {
        case 'compact':
          return 30
        case 'standard':
          return 40
        case 'professional':
          return 44
      }
    }, [showControls])

    const controlHeight = getControlHeight(currentSize)

    // Initialize Wavesurfer ONLY ONCE (fixed - no dependencies to avoid re-initialization)
    React.useEffect(() => {
      if (containerRef.current && !wavesurferRef.current) {
        // Don't show loading spinner during WaveSurfer init - only during audio load

        try {
        
          // Calculate initial pixels per second for temporal zoom
          const initialPixelsPerSecond = viewStartTime !== undefined && viewEndTime !== undefined && containerRef.current
            ? Math.max(10, containerRef.current.clientWidth / (viewEndTime - viewStartTime))
            : 50; // Default fallback

              wavesurferRef.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4F4A85', // Fixed color - will update via setOptions
            progressColor: '#383351',
            cursorColor: '#D0D0D0', // Fixed cursor - will update via setOptions
            barWidth: 2, // Fixed width
            barGap: 1,
            barRadius: 1,
            height: 80, // Fixed height to prevent re-initialization
            normalize: true,
            interact: true, // Always interactive - will update via setOptions
            hideScrollbar: true,
            minPxPerSec: initialPixelsPerSecond
          })

          // Setup event listeners - need to define it inline since we can't use it before declaration
          if (!wavesurferRef.current) return

          wavesurferRef.current.on('ready', () => {
            const duration = wavesurferRef.current?.getDuration() || 0
                  onTimeUpdate?.(0, duration)
            onReady?.(duration)
                  setIsLoading(false)

            // Apply temporal zoom after audio is ready
            setTimeout(() => {
              if (viewStartTime !== undefined && viewEndTime !== undefined && containerRef.current && wavesurferRef.current) {
                const viewDuration = viewEndTime - viewStartTime;
                const containerWidth = containerRef.current.getBoundingClientRect().width;

                if (containerWidth > 0 && duration > 0) {
                  const pixelsPerSecond = Math.max(10, containerWidth / viewDuration);

                  try {
                    wavesurferRef.current.setOptions({
                      minPxPerSec: pixelsPerSecond
                    });

                    const seekPosition = viewStartTime / duration;
                    wavesurferRef.current.seekTo(seekPosition);
                  } catch (error) {
                    console.warn('🎵 Initial temporal zoom failed:', error);
                  }
                }
              }
            }, 100);
          })

          wavesurferRef.current.on('audioprocess', () => {
            const currentTime = wavesurferRef.current?.getCurrentTime() || 0
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(currentTime, duration)
          })

          wavesurferRef.current.on('interaction', () => {
            const currentTime = wavesurferRef.current?.getCurrentTime() || 0
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(currentTime, duration)
          })

          wavesurferRef.current.on('seeking', () => {
            const currentTime = wavesurferRef.current?.getCurrentTime() || 0
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(currentTime, duration)
          })

          wavesurferRef.current.on('timeupdate', () => {
            const currentTime = wavesurferRef.current?.getCurrentTime() || 0
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(currentTime, duration)
          })

          wavesurferRef.current.on('play', () => {
                  setIsActuallyPlaying(true)
            onPlayStateChange?.(true)
          })

          wavesurferRef.current.on('pause', () => {
                  setIsActuallyPlaying(false)
            onPlayStateChange?.(false)
          })

          wavesurferRef.current.on('finish', () => {
                  setIsActuallyPlaying(false)
            onPlayStateChange?.(false)
          })

          wavesurferRef.current.on('error', (error: unknown) => {
            console.error('🎵 Wavesurfer error:', error)
            setIsLoading(false)

            // Check if it's a CORS error
            const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error')
            if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin') || errorMessage.includes('Access-Control')) {
              console.error('🎵 CORS error detected - audio server needs to allow cross-origin requests')
              // Note: We keep isInitialized true so the component can retry if URL changes
            } else {
              // Only set isInitialized to false for non-CORS errors
              setIsInitialized(false)
            }
          })

          wavesurferRef.current.on('loading', (percent) => {
                })

          // Mark as initialized so audio can be loaded
          setIsInitialized(true)
    
        } catch (error) {
          console.error('🎵 Failed to initialize Wavesurfer:', error)
          setIsLoading(false)
        }
      }

      // Only cleanup on unmount, not on prop changes
      return () => {
        if (wavesurferRef.current) {
              wavesurferRef.current.destroy()
          wavesurferRef.current = null
        }
        setIsInitialized(false)
        setIsLoading(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // ✅ EMPTY DEPENDENCY ARRAY - ONLY INITIALIZE ONCE!

    // Event listeners are set up during initialization - no need for separate effect

    // Update waveform appearance without reinitializing
    React.useEffect(() => {
      if (wavesurferRef.current && isInitialized) {
          wavesurferRef.current.setOptions({
          waveColor: currentMode === 'edit' ? '#4F4A85' : '#8B8B8B',
          cursorColor: currentMode === 'edit' ? '#D0D0D0' : 'transparent',
          interact: currentMode === 'edit'
        })
      }
    }, [currentMode, isInitialized])

    // Load audio when URL changes (more robust)
    React.useEffect(() => {

      // Get the proxied URL if needed (for external URLs to avoid CORS)
      const urlToLoad = getProxiedAudioUrl(audioUrl)

      if (wavesurferRef.current && urlToLoad) {
          setIsLoading(true)
        wavesurferRef.current.load(urlToLoad)
      } else if (!wavesurferRef.current && urlToLoad) {
        // WaveSurfer not ready yet, retry shortly
        const timer = setTimeout(() => {
          if (wavesurferRef.current && urlToLoad) {
            setIsLoading(true)
            wavesurferRef.current.load(urlToLoad)
          }
        }, 300)
        return () => clearTimeout(timer)
      }
    }, [audioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

    // Single temporal zoom handler
    const applyTemporalZoom = React.useCallback(() => {
      if (!wavesurferRef.current || !containerRef.current || !isInitialized) return;
      if (viewStartTime === undefined || viewEndTime === undefined) return;

      const duration = wavesurferRef.current.getDuration();
      if (duration <= 0) {
        console.log('🎵 Skipping temporal zoom - no audio duration yet');
        return;
      }

      const viewDuration = viewEndTime - viewStartTime;
      const containerWidth = containerRef.current.getBoundingClientRect().width;

      if (containerWidth <= 0) {
        console.log('🎵 Skipping temporal zoom - container has no width');
        return;
      }

      const pixelsPerSecond = Math.max(10, containerWidth / viewDuration);

      try {
        wavesurferRef.current.setOptions({
          minPxPerSec: pixelsPerSecond
        });

        // Seek to the start of the view window
        const seekPosition = viewStartTime / duration;
        wavesurferRef.current.seekTo(seekPosition);

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🎵 Temporal zoom failed:', error);
        }
      }
    }, [viewStartTime, viewEndTime, isInitialized]);

    // Apply temporal zoom when view window changes
    React.useEffect(() => {
      applyTemporalZoom();
    }, [applyTemporalZoom]);

    // Monitor container size changes (sidebar responsive)
    React.useEffect(() => {
      if (!containerRef.current) return;

      let resizeTimeout: NodeJS.Timeout;
      const resizeObserver = new ResizeObserver(() => {
        // Debounce resize events to prevent excessive re-renders
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          applyTemporalZoom();
        }, 100);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        clearTimeout(resizeTimeout);
        resizeObserver.disconnect();
      };
    }, [applyTemporalZoom]);

    // Event listeners are set up inline during initialization

    // Handle mode changes
    const handleModeChange = (newMode: WaveformMode) => {
      setCurrentMode(newMode)
      onModeChange?.(newMode)

      if (wavesurferRef.current) {
        wavesurferRef.current.setOptions({
          waveColor: newMode === 'edit' ? '#4F4A85' : '#8B8B8B',
          cursorColor: newMode === 'edit' ? '#D0D0D0' : 'transparent',
          interact: newMode === 'edit'
        })
      }
    }

    // Handle size changes
    const handleSizeChange = (newSize: WaveformSize) => {
      setCurrentSize(newSize)
      onSizeChange?.(newSize)
    }

    // Temporal Zoom controls - use external callbacks if provided, otherwise use local logic
    const handleZoomIn = () => {
      if (externalZoomIn) {
        externalZoomIn();
      } else if (onTemporalZoom && wavesurferRef.current) {
        const currentTime = wavesurferRef.current.getCurrentTime();
        const currentViewDuration = (viewEndTime || 60) - (viewStartTime || 0);
        const newViewDuration = Math.max(5, currentViewDuration * 0.5); // Min 5 seconds

        const newStart = Math.max(0, currentTime - newViewDuration / 2);
        const newEnd = newStart + newViewDuration;
        onTemporalZoom(newStart, newEnd);
      }
    }

    const handleZoomOut = () => {
      if (externalZoomOut) {
        externalZoomOut();
      } else if (onTemporalZoom && wavesurferRef.current) {
        const currentTime = wavesurferRef.current.getCurrentTime();
        const duration = wavesurferRef.current.getDuration();
        const currentViewDuration = (viewEndTime || 60) - (viewStartTime || 0);
        const newViewDuration = Math.min(duration, currentViewDuration * 2); // Max full audio

        let newStart = currentTime - newViewDuration / 2;
        let newEnd = currentTime + newViewDuration / 2;

        // Keep within audio bounds
        if (newStart < 0) {
          newStart = 0;
          newEnd = newViewDuration;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = Math.max(0, duration - newViewDuration);
        }

        onTemporalZoom(newStart, newEnd);
      }
    }

    const handleFitToView = () => {
      if (externalFitToView) {
        externalFitToView();
      } else if (onTemporalZoom && wavesurferRef.current) {
        const duration = wavesurferRef.current.getDuration();
        onTemporalZoom(0, duration);
      }
    }

    // Snap-to-grid functionality
    const snapTimeToGrid = React.useCallback((time: number, isShiftPressed: boolean = false) => {
      // If Shift is pressed, disable snapping for precision mode
      if (!_snapToGrid || isShiftPressed) return time

      return Math.round(time / _snapInterval) * _snapInterval
    }, [_snapInterval, _snapToGrid])

    // Flag drag handlers for individual flag dragging
    const handleFlagMouseDown = React.useCallback((flag: 'A' | 'B', e: React.MouseEvent) => {
      // Drag allowed in all modes
      e.preventDefault()
      e.stopPropagation()

      const area = waveformAreaRef.current || containerRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect()
      const startX = e.clientX - rect.left

      if (flag === 'A') {
        setIsDraggingA(true)
        _setDragStartX(startX)
        _setDragStartTime(anchorA)
      } else {
        setIsDraggingB(true)
        _setDragStartX(startX)
        _setDragStartTime(anchorB)
      }
    }, [currentMode, anchorA, anchorB])

    // Global mouse handlers for flag dragging
    React.useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if ((!isDraggingA && !isDraggingB) || !wavesurferRef.current) return
        const area = waveformAreaRef.current || containerRef.current;
        if (!area) return;
        const rect = area.getBoundingClientRect()
        const x = e.clientX - rect.left
        const duration = wavesurferRef.current.getDuration()
        const rawTime = Math.max(0, Math.min(duration, (x / rect.width) * duration))

        // Apply snapping (disabled when Shift is held)
        const snappedTime = snapTimeToGrid(rawTime, e.shiftKey)

        if (isDraggingA) {
          // Constrain Anchor A to not exceed Anchor B
          const constrainedTime = Math.min(snappedTime, anchorB - _snapInterval)
          onAnchorAChange?.(constrainedTime)
        } else if (isDraggingB) {
          // Constrain Anchor B to not go before Anchor A
          const constrainedTime = Math.max(snappedTime, anchorA + _snapInterval)
          onAnchorBChange?.(constrainedTime)
        }
      }

      const handleGlobalMouseUp = () => {
        if (isDraggingA) {
          console.log('🚩 Finished dragging Anchor A to:', anchorA.toFixed(2) + 's')
          setIsDraggingA(false)
        }
        if (isDraggingB) {
          console.log('🚩 Finished dragging Anchor B to:', anchorB.toFixed(2) + 's')
          setIsDraggingB(false)
        }
      }

      if (isDraggingA || isDraggingB) {
        document.addEventListener('mousemove', handleGlobalMouseMove)
        document.addEventListener('mouseup', handleGlobalMouseUp)
        document.body.style.userSelect = 'none' // Prevent text selection during drag
      }

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
        document.body.style.userSelect = ''
      }
    }, [isDraggingA, isDraggingB, anchorA, anchorB, onAnchorAChange, onAnchorBChange, snapTimeToGrid, _snapInterval])

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      play: async () => {
        if (wavesurferRef.current) {
          await wavesurferRef.current.play()
        }
      },
      pause: () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.pause()
        }
      },
      seekTo: (time: number) => {
        const duration = wavesurferRef.current?.getDuration() || 0
        if (duration > 0) {
          wavesurferRef.current?.seekTo(time / duration)
        }
      },
      skipToStart: () => wavesurferRef.current?.seekTo(0),
      skipToEnd: () => wavesurferRef.current?.seekTo(1),
      rewind: (seconds: number) => {
        if (wavesurferRef.current) {
          const current = wavesurferRef.current.getCurrentTime()
          const duration = wavesurferRef.current.getDuration()
          const newTime = Math.max(0, current - seconds)
          wavesurferRef.current.seekTo(newTime / duration)
        }
      },
      fastForward: (seconds: number) => {
        if (wavesurferRef.current) {
          const current = wavesurferRef.current.getCurrentTime()
          const duration = wavesurferRef.current.getDuration()
          const newTime = Math.min(duration, current + seconds)
          wavesurferRef.current.seekTo(newTime / duration)
        }
      },
      setVolume: (volume: number) => wavesurferRef.current?.setVolume(volume),
      setPlaybackRate: (rate: number) => wavesurferRef.current?.setPlaybackRate(rate),
      setMode: handleModeChange,
      setSize: handleSizeChange,
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      fitToView: handleFitToView,
      getCurrentTime: () => wavesurferRef.current?.getCurrentTime() || 0,
      getDuration: () => wavesurferRef.current?.getDuration() || 0
    }))

    return (
      <div
        className={cn("relative w-full h-full bg-background rounded-lg border flex flex-col", className)}
      >
        {/* Control Bar */}
        {showControls && (
          <div
            className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b bg-muted/5"
            style={{ height: `${controlHeight}px` }}
          >
            <div className="flex items-center gap-2">
              <Button
                variant={currentMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('view')}
                className="h-6 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant={currentMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('edit')}
                className="h-6 px-2 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            {/* Keyboard Shortcuts Section */}
            {showKeyboardShortcuts && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono">Space</kbd>
                  <span className="text-muted-foreground">Play</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono">A</kbd>
                  <span className="text-muted-foreground">Start</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="bg-background px-1.5 py-0.5 rounded border text-xs font-mono">B</kbd>
                  <span className="text-muted-foreground">End</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              {currentSize !== 'professional' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSizeChange('professional')}
                  className="h-6 w-6 p-0"
                  title="Expand to professional view"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}

              <span className="text-xs text-muted-foreground mx-2">
                {viewStartTime !== undefined && viewEndTime !== undefined
                  ? `${Math.round(viewEndTime - viewStartTime)}s view`
                  : `${Math.round(_zoomLevel * 100)}%`}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={viewStartTime !== undefined && viewEndTime !== undefined
                  ? (viewEndTime - viewStartTime) >= (wavesurferRef.current?.getDuration() || 60)
                  : _zoomLevel <= 1}
                className="h-6 w-6 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={viewStartTime !== undefined && viewEndTime !== undefined
                  ? (viewEndTime - viewStartTime) <= 5
                  : _zoomLevel >= 10}
                className="h-6 w-6 p-0"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFitToView}
                disabled={viewStartTime !== undefined && viewEndTime !== undefined
                  ? (viewStartTime === 0 && viewEndTime >= (wavesurferRef.current?.getDuration() || 60))
                  : _zoomLevel === 1}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Waveform Container - FIXED */}
        <div ref={waveformAreaRef} className="relative flex-1 overflow-hidden" style={{ minHeight: '80px' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div
              ref={containerRef}
              className="h-full w-full relative cursor-pointer"
              style={{
                maxWidth: '100%',
                minWidth: '100%',
                minHeight: '80px'
              }}
            />
          </div>


          {/* Anchor A/B Flag Sticks - ALWAYS visible (fixed positioning) */}
          {(isInitialized || wavesurferRef.current) && currentMode === 'edit' && (() => {
            const viewStart = viewStartTime ?? 0;
            const viewEnd = viewEndTime ?? (wavesurferRef.current?.getDuration() ?? 60);
            const viewDuration = Math.max(1, viewEnd - viewStart);
            const posA = Math.max(0, Math.min(100, ((anchorA - viewStart) / viewDuration) * 100));
            const posB = Math.max(0, Math.min(100, ((anchorB - viewStart) / viewDuration) * 100));
            const selLeft = Math.min(posA, posB);
            const selWidth = Math.abs(posB - posA);
            return (
              <>
                {/* Selection highlight bar */}
                <div
                  className="absolute top-0 z-10 bg-gradient-to-r from-green-500/20 to-red-500/20 border-t-2 border-b-2 border-dashed border-green-500/40 pointer-events-none"
                  style={{ left: `${selLeft}%`, width: `${selWidth}%`, height: '80px' }}
                />

                {/* Anchor A - drag from the flag box */}
                <div
                  className={cn(
                    "absolute top-0 z-30 flex flex-col items-center select-none",
                    isDraggingA ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ left: `${posA}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const area = waveformAreaRef.current || containerRef.current;
                    if (!area) return;
                    const rect = area.getBoundingClientRect();
                    _setDragStartX(e.clientX - rect.left);
                    _setDragStartTime(anchorA);
                    setIsDraggingA(true);
                  }}
                >
                  <div className={cn(
                    "text-white text-xs font-bold px-2 py-0.5 rounded shadow-md transition-all z-10",
                    isDraggingA ? "bg-green-400 scale-110" : "bg-green-500 hover:bg-green-400"
                  )}>A</div>
                  <div className={cn("w-0.5", isDraggingA ? "bg-green-400" : "bg-green-500")} style={{ height: '72px' }} />
                  <div className="absolute -top-5 bg-green-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap pointer-events-none text-center" style={{ fontSize: '10px' }}>
                    {formatTime(anchorA)}
                  </div>
                </div>

                {/* Anchor B - drag from the flag box */}
                <div
                  className={cn(
                    "absolute top-0 z-30 flex flex-col items-center select-none",
                    isDraggingB ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ left: `${posB}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const area = waveformAreaRef.current || containerRef.current;
                    if (!area) return;
                    const rect = area.getBoundingClientRect();
                    _setDragStartX(e.clientX - rect.left);
                    _setDragStartTime(anchorB);
                    setIsDraggingB(true);
                  }}
                >
                  <div className={cn(
                    "text-white text-xs font-bold px-2 py-0.5 rounded shadow-md transition-all z-10",
                    isDraggingB ? "bg-red-400 scale-110" : "bg-red-500 hover:bg-red-400"
                  )}>B</div>
                  <div className={cn("w-0.5", isDraggingB ? "bg-red-400" : "bg-red-500")} style={{ height: '72px' }} />
                  <div className="absolute -top-5 bg-red-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap pointer-events-none text-center" style={{ fontSize: '10px' }}>
                    {formatTime(anchorB)}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading audio...</span>
              </div>
            </div>
          )}

          {/* Mode Indicator */}
          <div className="absolute top-2 right-2 z-30">
            <div className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              currentMode === 'edit'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}>
              {currentMode.toUpperCase()}
            </div>
          </div>
        </div>

      </div>
    )
  }
)

ProfessionalWaveformSimple.displayName = "ProfessionalWaveformSimple"

export { ProfessionalWaveformSimple }
