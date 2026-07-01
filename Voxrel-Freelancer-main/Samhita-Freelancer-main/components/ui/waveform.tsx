"use client"

import * as React from "react"
import WaveSurfer from 'wavesurfer.js'

import { cn } from "@/lib/utils"

/**
 * Converts external URLs to use the audio proxy to avoid CORS issues
 * @param url - The original audio URL
 * @returns The proxied URL if external, or the original URL if same-origin
 */
const getProxiedAudioUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  try {
    const audioUrl = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // If it's the same origin, return as-is
    if (audioUrl.origin === currentOrigin) {
      return url;
    }
    
    // For external URLs (including R2), use the proxy to avoid CORS issues
    // Only proxy http/https URLs
    if (['http:', 'https:'].includes(audioUrl.protocol)) {
      const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
      return proxyUrl;
    }
    
    // For other protocols (data:, blob:, etc.), return as-is
    return url;
  } catch {
    // If URL parsing fails, return original (might be a relative path)
    console.warn('Failed to parse audio URL, using as-is:', url);
    return url;
  }
}

export interface WaveformRef {
  play: () => Promise<void>
  pause: () => void
  skipToStart: () => void
  skipToEnd: () => void
  rewind: (seconds: number) => void
  fastForward: (seconds: number) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
}

interface WaveformProps {
  className?: string
  audioUrl?: string | null
  onPlayStateChange?: (isPlaying: boolean) => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onReady?: (duration: number) => void
}

const Waveform = React.forwardRef<WaveformRef, WaveformProps>(
  ({ className, audioUrl, onPlayStateChange, onTimeUpdate, onReady }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const wavesurferRef = React.useRef<WaveSurfer | null>(null)
    const [isInitialized, setIsInitialized] = React.useState(false)

    // Initialize Wavesurfer
    React.useEffect(() => {
      if (containerRef.current && !wavesurferRef.current) {
        try {
          wavesurferRef.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgb(79, 74, 133)', // matches your theme primary color
            progressColor: 'rgb(56, 51, 81)', // slightly darker for contrast
            cursorColor: 'rgb(56, 51, 81)',
            barWidth: 2,
            barRadius: 1,
            height: 60,
            normalize: true,
            backend: 'WebAudio',
            mediaControls: false,
            interact: true,
            hideScrollbar: true,
          })

          // Event listeners
          wavesurferRef.current.on('ready', () => {
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(0, duration)
            onReady?.(duration)
            setIsInitialized(true)
            console.log('Wavesurfer ready, duration:', duration)
          })

          wavesurferRef.current.on('audioprocess', () => {
            const currentTime = wavesurferRef.current?.getCurrentTime() || 0
            const duration = wavesurferRef.current?.getDuration() || 0
            onTimeUpdate?.(currentTime, duration)
          })

          // Note: 'seek' event temporarily disabled due to type compatibility
          // wavesurferRef.current.on('seek', () => {
          //   const currentTime = wavesurferRef.current?.getCurrentTime() || 0      
          //   const duration = wavesurferRef.current?.getDuration() || 0
          //   onTimeUpdate?.(currentTime, duration)
          // })

          wavesurferRef.current.on('play', () => {
            onPlayStateChange?.(true)
          })

          wavesurferRef.current.on('pause', () => {
            onPlayStateChange?.(false)
          })

          wavesurferRef.current.on('error', (error) => {
            console.error('Wavesurfer error:', error)
            setIsInitialized(false)
          })

        } catch (error) {
          console.error('Failed to initialize Wavesurfer:', error)
        }
      }

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy()
          wavesurferRef.current = null
          setIsInitialized(false)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Load audio when URL changes
    React.useEffect(() => {
      // Get the proxied URL if needed (for external URLs to avoid CORS)
      const urlToLoad = getProxiedAudioUrl(audioUrl)
      
      if (wavesurferRef.current && urlToLoad) {
        console.log('Loading audio from URL:', urlToLoad, audioUrl !== urlToLoad ? `(proxied from ${audioUrl})` : '(direct)')
        wavesurferRef.current.load(urlToLoad).catch(error => {
          console.error('Failed to load audio:', error)
        })
      }
    }, [audioUrl])

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      play: async () => {
        if (wavesurferRef.current) {
          await wavesurferRef.current.play()
        }
      },
      pause: () => {
        wavesurferRef.current?.pause()
      },
      skipToStart: () => {
        wavesurferRef.current?.seekTo(0)
      },
      skipToEnd: () => {
        if (wavesurferRef.current) {
          const duration = wavesurferRef.current.getDuration()
          wavesurferRef.current.seekTo(duration)
        }
      },
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
      setVolume: (volume: number) => {
        wavesurferRef.current?.setVolume(volume)
      },
      setPlaybackRate: (rate: number) => {
        wavesurferRef.current?.setPlaybackRate(rate)
      },
    }))

    return (
      <div className={cn("relative w-full h-16 bg-muted/30 rounded-lg overflow-hidden", className)}>
        <div ref={containerRef} className="w-full h-full" />
        {!isInitialized && audioUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-sm text-muted-foreground">Loading audio...</div>
          </div>
        )}
      </div>
    )
  }
)

Waveform.displayName = "Waveform"

export { Waveform }

