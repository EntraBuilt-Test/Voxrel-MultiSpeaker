"use client";

import { ChevronLeft, ChevronRight, FileText, Save } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TranscriptEditorProps {
  currentSegment: number;
  totalSegments: number;
  anchorA: number;
  anchorB: number;
  segmentLength: number;
  selectedSpeaker: string;
  transcriptText: string;
  onTranscriptChange: (value: string) => void;
  onPreviousSegment: () => void;
  onNextSegment: () => void;
  onSaveSegment?: () => void;
  formatTime: (time: number) => string;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  currentSegment,
  totalSegments,
  anchorA,
  anchorB,
  segmentLength: _segmentLength,
  selectedSpeaker,
  transcriptText,
  onTranscriptChange,
  onPreviousSegment,
  onNextSegment,
  onSaveSegment,
  formatTime,
}) => {
  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* Compact Header with Save Button */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b bg-muted/5">
        <div className="flex items-center gap-2">
          <FileText className="text-primary h-3.5 w-3.5" />
          <span className="text-xs font-medium text-muted-foreground">
            Segment #{currentSegment} • {formatTime(anchorA)}→{formatTime(anchorB)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Navigation */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onPreviousSegment}
            disabled={currentSegment <= 1}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onNextSegment}
            disabled={currentSegment >= totalSegments}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          {/* Save Button */}
          {onSaveSegment && (
            <Button
              size="sm"
              onClick={onSaveSegment}
              className="h-6 text-xs ml-2"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Maximized Textarea */}
      <div className="flex-1" style={{ minHeight: '120px' }}>
        <Textarea
          value={transcriptText}
          onChange={(e) => onTranscriptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onSaveSegment?.();
            }
          }}
          placeholder={`${selectedSpeaker}: Type your transcription here...

Use this space to write what you hear in the audio. The text will save when you press Ctrl+Enter or click the Save button above.

Tips:
• You can select the speaker in the floating controls
• Press Enter for line breaks
• Take your time to ensure accuracy
• Use the audio controls to replay sections as needed`}
          className="h-full w-full resize-none border-none bg-transparent p-3 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
};
