"use client";

import { Check, X, Edit } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InlineTranscriptEditorProps {
  segmentId: string;
  initialText: string;
  initialSpeaker: string;
  initialStartTime: string;
  initialEndTime: string;
  isEditing: boolean;
  onSave: (segmentId: string, updates: {
    text?: string;
    speaker?: string;
    startTime?: string;
    endTime?: string;
  }) => void;
  onCancel: () => void;
  onEdit: () => void;
  className?: string;
}

export const InlineTranscriptEditor: React.FC<InlineTranscriptEditorProps> = ({
  segmentId,
  initialText,
  initialSpeaker,
  initialStartTime,
  initialEndTime,
  isEditing,
  onSave,
  onCancel,
  onEdit,
  className
}) => {
  const [text, setText] = useState(initialText);
  const [speaker, setSpeaker] = useState(initialSpeaker);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Reset values when editing is cancelled or segment changes
  useEffect(() => {
    setText(initialText);
    setSpeaker(initialSpeaker);
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
  }, [initialText, initialSpeaker, initialStartTime, initialEndTime, segmentId]);

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    
    if (text !== initialText) updates.text = text;
    if (speaker !== initialSpeaker) updates.speaker = speaker;
    if (startTime !== initialStartTime) updates.startTime = startTime;
    if (endTime !== initialEndTime) updates.endTime = endTime;

    onSave(segmentId, updates);
  };

  const handleCancel = () => {
    setText(initialText);
    setSpeaker(initialSpeaker);
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2 p-2 border rounded bg-blue-50", className)}>
        {/* Time and Speaker Row */}
        <div className="flex gap-2 text-xs">
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-16 h-6 text-xs"
            placeholder="0:00"
          />
          <span className="self-center">→</span>
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-16 h-6 text-xs"
            placeholder="0:00"
          />
          <Input
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
            className="flex-1 h-6 text-xs"
            placeholder="Speaker"
          />
        </div>

        {/* Text Area */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-16 text-xs resize-none"
          placeholder="Transcript text..."
        />

        {/* Action Buttons */}
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-6 text-xs px-2"
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-6 text-xs px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group", className)}>
      <div className="line-clamp-2 leading-tight text-xs">
        {initialText}
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-4 w-4 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
};
