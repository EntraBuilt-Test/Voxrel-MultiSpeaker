"use client"

import { FlagTriangleLeft, FlagTriangleRight } from "lucide-react";
import React from "react";

import { ProfessionalWaveformSimple, ProfessionalWaveformRef } from "@/components/ui/professional-waveform-simple";
import { Waveform, WaveformRef } from "@/components/ui/waveform";
import { useResponsiveWaveform } from "@/hooks/use-responsive-waveform";
import { getProxiedMediaUrl } from "@/lib/media-proxy";
import { WaveformMode, WaveformSize } from "@/stores/useWorkspaceStore";

// Note: WaveformRegion interface removed - not currently used

interface SmartWaveformProps {
  waveformRef: React.RefObject<WaveformRef | ProfessionalWaveformRef>;
  audioUrl?: string | null;
  duration: number;
  anchorA: number;
  anchorB: number;

  // Professional waveform props (simplified)
  mode?: WaveformMode;
  size?: WaveformSize;
  formatTime?: (time: number) => string;

  // Temporal zoom props
  viewStartTime?: number;
  viewEndTime?: number;
  onTemporalZoom?: (startTime: number, endTime: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToView?: () => void;

  // Event handlers
  onPlayStateChange: (isPlaying: boolean) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onReady?: (duration: number) => void;
  onModeChange?: (mode: WaveformMode) => void;
  onSizeChange?: (size: WaveformSize) => void;
  onAnchorAChange?: (time: number) => void;
  onAnchorBChange?: (time: number) => void;

  // Keyboard shortcuts integration
  showKeyboardShortcuts?: boolean;

  // Override responsive behavior (for testing/preferences)
  _forceMode?: 'simple' | 'professional';
}

export const SmartWaveform: React.FC<SmartWaveformProps> = ({
  waveformRef,
  audioUrl,
  duration,
  anchorA,
  anchorB,
  mode = 'view',
  size = 'standard',
  formatTime,
  viewStartTime,
  viewEndTime,
  onTemporalZoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onPlayStateChange,
  onTimeUpdate,
  onReady,
  onModeChange,
  onSizeChange,
  onAnchorAChange,
  onAnchorBChange,
  showKeyboardShortcuts,
  _forceMode
}) => {
  const responsiveConfig = useResponsiveWaveform();

  // Proxy the audio URL to avoid CORS issues
  const proxiedAudioUrl = React.useMemo(() => {
    const proxied = getProxiedMediaUrl(audioUrl);
    console.log('🎵 Smart Waveform: Original URL:', audioUrl);
    console.log('🎵 Smart Waveform: Proxied URL:', proxied);
    return proxied;
  }, [audioUrl]);

  // Determine which waveform to use
  const shouldUseProfessional = React.useMemo(() => {
    if (_forceMode === 'simple') {
      console.log('🎵 Smart Waveform: Using simple mode (forced)')
      return false;
    }
    if (_forceMode === 'professional') {
      console.log('🎵 Smart Waveform: Using professional mode (forced)')
      return true;
    }

    // Use professional waveform for tablet+ with sufficient space
    const usePro = !responsiveConfig.compactMode && responsiveConfig.showControls;
    console.log('🎵 Smart Waveform: Auto-deciding -', usePro ? 'PROFESSIONAL' : 'SIMPLE',
      '(compact:', responsiveConfig.compactMode, 'controls:', responsiveConfig.showControls, ')')
    return usePro;
  }, [responsiveConfig, _forceMode]);

  // Use the responsive size unless explicitly overridden
  const effectiveSize = size === 'standard' ? responsiveConfig.size : size;

  if (shouldUseProfessional) {
    console.log('🎵 Smart Waveform: Rendering PROFESSIONAL waveform')
    console.log('🎵 Smart Waveform: audioUrl =', proxiedAudioUrl)
    console.log('🎵 Smart Waveform: All props =', { mode, size, anchorA, anchorB, viewStartTime, viewEndTime })
    return (
      <div className="relative h-full">
        <ProfessionalWaveformSimple
          ref={waveformRef as React.RefObject<ProfessionalWaveformRef>}
          audioUrl={proxiedAudioUrl}
          mode={mode}
          size={effectiveSize}
          showControls={responsiveConfig.showControls}
          anchorA={anchorA}
          anchorB={anchorB}
          formatTime={formatTime}
          viewStartTime={viewStartTime}
          viewEndTime={viewEndTime}
          onTemporalZoom={onTemporalZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitToView={onFitToView}
          onPlayStateChange={onPlayStateChange}
          onTimeUpdate={onTimeUpdate}
          onReady={onReady}
          onModeChange={onModeChange}
          onSizeChange={onSizeChange}
          onAnchorAChange={onAnchorAChange}
          onAnchorBChange={onAnchorBChange}
          showKeyboardShortcuts={showKeyboardShortcuts}
        />
      </div>
    );
  }

  // Fallback to simple waveform with anchor overlays
  console.log('🎵 Smart Waveform: Rendering SIMPLE waveform with URL:', proxiedAudioUrl)
  return (
    <div className="bg-muted/30 border-border/40 relative rounded-xl border p-3"
      style={{ height: effectiveSize === 'compact' ? '80px' : '100px' }}>
      <Waveform
        ref={waveformRef as React.RefObject<WaveformRef>}
        audioUrl={proxiedAudioUrl}
        onPlayStateChange={onPlayStateChange}
        onTimeUpdate={onTimeUpdate}
        onReady={onReady}
        className="h-full"
      />

      {/* A-B Anchor Markers - Always Visible */}
      <>
        {/* Anchor A */}
        <div
          className="bg-primary absolute top-0 z-20 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full p-1 shadow-sm"
          style={{
            left: duration > 0
              ? `${(anchorA / duration) * 100}%`
              : `${(anchorA / Math.max(anchorB, 60)) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <FlagTriangleLeft className="text-background size-2" />
        </div>

        {/* Anchor B */}
        <div
          className="bg-primary absolute top-0 z-20 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full p-1 shadow-sm"
          style={{
            left: duration > 0
              ? `${(anchorB / duration) * 100}%`
              : `${(anchorB / Math.max(anchorB, 60)) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <FlagTriangleRight className="text-background size-2" />
        </div>

        {/* Selected Segment Highlight - Always Visible */}
        <div
          className="bg-primary/20 border-primary pointer-events-none absolute top-3 z-10 border-r-2 border-l-2"
          style={{
            left: duration > 0
              ? `${(anchorA / duration) * 100}%`
              : `${(anchorA / Math.max(anchorB, 60)) * 100}%`,
            width: duration > 0
              ? `${((anchorB - anchorA) / duration) * 100}%`
              : `${((anchorB - anchorA) / Math.max(anchorB, 60)) * 100}%`,
            height: effectiveSize === 'compact' ? '56px' : '76px'
          }}
        />
      </>

      {/* Mode indicator for simple waveform */}
      <div className="absolute top-2 right-2 z-30">
        <div className="text-xs px-2 py-1 rounded-full font-medium bg-secondary text-secondary-foreground">
          {mode.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// Export the ref type for consumers
export type SmartWaveformRef = WaveformRef | ProfessionalWaveformRef;
