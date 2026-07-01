"use client";

import React from "react";

import { SmartWaveform, SmartWaveformRef } from "./smart-waveform";

import { WaveformMode, WaveformSize } from "@/stores/useWorkspaceStore";


// Note: WaveformRegion interface removed - not currently used

interface EnhancedWaveformProps {
  waveformRef: React.RefObject<SmartWaveformRef>;
  audioUrl?: string | null;
  duration: number;
  anchorA: number;
  anchorB: number;
  
  // Professional waveform features (simplified)
  mode?: WaveformMode;
  size?: WaveformSize;
  _forceMode?: 'simple' | 'professional';
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
}

export const EnhancedWaveform: React.FC<EnhancedWaveformProps> = ({
  waveformRef,
  audioUrl,
  duration,
  anchorA,
  anchorB,
  mode = 'view',
  size = 'standard',
  _forceMode,
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
  
  // Keyboard shortcuts props
  showKeyboardShortcuts,
}) => {
  return (
    <SmartWaveform
      waveformRef={waveformRef}
      audioUrl={audioUrl}
      duration={duration}
      anchorA={anchorA}
      anchorB={anchorB}
      mode={mode}
      size={size}
      _forceMode={_forceMode}
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
  );
};
