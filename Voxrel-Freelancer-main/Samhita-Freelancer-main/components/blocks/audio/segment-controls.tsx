"use client";

import { RotateCcw, Square } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

interface SegmentControlsProps {
  currentSegment: number;
  anchorA: number;
  anchorB: number;
  isLooping: boolean;
  segmentLength: number;
  onSetAnchorA: () => void;
  onSetAnchorB: () => void;
  onToggleLooping: () => void;
  onAdjustSegmentLength: (delta: number) => void;
  formatTime: (time: number) => string;
}

export const SegmentControls: React.FC<SegmentControlsProps> = ({
  currentSegment,
  anchorA,
  anchorB,
  isLooping,
  segmentLength,
  onSetAnchorA,
  onSetAnchorB,
  onToggleLooping,
  onAdjustSegmentLength,
  formatTime,
}) => {
  return (
    <div className="bg-accent/30 border-border/40 mb-2 rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Segment #{currentSegment}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSetAnchorA}
            >
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Square className="h-3 w-3" />
                  <span className="absolute top-0 left-0 flex h-3 w-3 items-center justify-center text-[8px] font-bold">
                    A
                  </span>
                </div>
                {formatTime(anchorA)}
              </div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSetAnchorB}
            >
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Square className="h-3 w-3" />
                  <span className="absolute top-0 left-0 flex h-3 w-3 items-center justify-center text-[8px] font-bold">
                    B
                  </span>
                </div>
                {formatTime(anchorB)}
              </div>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLooping ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onToggleLooping}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Loop
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onAdjustSegmentLength(-5)}
            >
              -
            </Button>
            <span className="w-8 text-center font-mono text-xs">
              {segmentLength}s
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onAdjustSegmentLength(5)}
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
