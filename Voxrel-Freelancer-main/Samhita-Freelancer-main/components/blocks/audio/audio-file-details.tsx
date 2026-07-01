"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  FileAudio,
  HardDrive,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AudioFileInfo {
  name: string;
  format: string;
  size: string;
  sampleRate: string;
  bitrate: string;
  channels: string;
}

interface AudioFileDetailsProps {
  audioFileInfo: AudioFileInfo;
  duration: number;
  progressPercentage: number;
  currentSegment: number;
  totalSegments: number;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  formatTime: (time: number) => string;
}

export const AudioFileDetails: React.FC<AudioFileDetailsProps> = ({
  audioFileInfo,
  duration,
  progressPercentage,
  currentSegment,
  totalSegments,
  isMinimized,
  onToggleMinimize,
  formatTime,
}) => {
  return (
    <div className="mb-3 w-full">
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          {/* Audio File Header */}
          <div
            className="hover:bg-accent/30 border-border/30 flex cursor-pointer items-center justify-between border-b p-3 transition-colors"
            onClick={onToggleMinimize}
          >
            <div className="flex items-center gap-3">
              <FileAudio className="text-primary h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {audioFileInfo.name}
                </span>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                    {audioFileInfo.format}
                  </Badge>
                  <span>{audioFileInfo.size}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="mr-2 text-right">
                <div className="text-primary text-xs font-medium">
                  {Math.round(progressPercentage)}% Complete
                </div>
              </div>
              {isMinimized ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Collapsible Audio Details */}
          {!isMinimized && (
            <div className="bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">Quality:</span>
                    <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
                      High
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">Sample Rate:</span>
                    <span className="font-mono">
                      {audioFileInfo.sampleRate}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Bitrate:</span>
                    <span className="font-mono">{audioFileInfo.bitrate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Channels:</span>
                    <span className="font-mono">{audioFileInfo.channels}</span>
                  </div>
                </div>
              </div>

              {/* Compact Progress Section */}
              <div className="border-border/30 mt-3 border-t pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    Transcription Progress
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Segment {currentSegment} of {totalSegments}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
