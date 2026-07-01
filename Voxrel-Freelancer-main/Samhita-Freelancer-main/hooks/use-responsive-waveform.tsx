"use client"

import * as React from "react"
import { WaveformSize } from "@/stores/useWorkspaceStore"

export interface ResponsiveWaveformConfig {
  size: WaveformSize
  showTimeline: boolean
  showControls: boolean
  enableRegions: boolean
  compactMode: boolean
}

export const useResponsiveWaveform = (): ResponsiveWaveformConfig => {
  const [config, setConfig] = React.useState<ResponsiveWaveformConfig>({
    size: 'standard',
    showTimeline: true,
    showControls: true,
    enableRegions: true,
    compactMode: false
  })

  React.useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const availableHeight = height * 0.6 // Editor section is 60% of viewport

      // Define breakpoints
      const breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1366,
        large: 1920
      }

      let newConfig: ResponsiveWaveformConfig

      if (width < breakpoints.mobile) {
        // Mobile: Minimal space, simplified interface
        newConfig = {
          size: 'compact',
          showTimeline: false,
          showControls: false,
          enableRegions: false,
          compactMode: true
        }
      } else if (width < breakpoints.tablet) {
        // Small tablets: Limited space
        newConfig = {
          size: 'compact',
          showTimeline: true,
          showControls: true,
          enableRegions: true,
          compactMode: true
        }
      } else if (width < breakpoints.desktop) {
        // Large tablets/small laptops: Standard interface
        newConfig = {
          size: availableHeight < 500 ? 'compact' : 'standard',
          showTimeline: true,
          showControls: true,
          enableRegions: true,
          compactMode: availableHeight < 500
        }
      } else if (width < breakpoints.large) {
        // Standard desktop: Full features with size based on available height
        newConfig = {
          size: availableHeight < 400 ? 'compact' : availableHeight < 600 ? 'standard' : 'professional',
          showTimeline: true,
          showControls: true,
          enableRegions: true,
          compactMode: availableHeight < 400
        }
      } else {
        // Large desktop: Full professional interface
        newConfig = {
          size: 'professional',
          showTimeline: true,
          showControls: true,
          enableRegions: true,
          compactMode: false
        }
      }

      setConfig(newConfig)
    }

    // Initial check
    updateConfig()

    // Listen for resize events
    window.addEventListener('resize', updateConfig)
    
    // Listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(updateConfig, 100) // Small delay for orientation change to complete
    })

    return () => {
      window.removeEventListener('resize', updateConfig)
      window.removeEventListener('orientationchange', updateConfig)
    }
  }, [])

  return config
}

// Hook for manual viewport size detection
export const useViewportSize = () => {
  const [viewport, setViewport] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })

  React.useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return viewport
}
