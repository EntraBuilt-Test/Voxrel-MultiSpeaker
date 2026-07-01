"use client";

import { Info, X, Clock, Plus, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimelineInfoProps {
  chunksCount: number;
  className?: string;
}

export const TimelineInfo: React.FC<TimelineInfoProps> = ({ 
  chunksCount, 
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || chunksCount > 3) return null;

  return (
    <div className={cn("px-3 pb-2", className)}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-blue-900">
                Timeline-Based Transcription
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="mt-1">
              <p className="text-xs text-blue-800">
                Each save creates a new chunk in the timeline, sorted chronologically.
              </p>
              
              {!isExpanded && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(true)}
                  className="h-5 mt-1 px-0 text-xs text-blue-700 hover:text-blue-900"
                >
                  Learn more <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-800">Chunks are sorted by start time, not save order</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Plus className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-800">Each save adds to the list (no replacement)</span>
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    <strong>Example:</strong> Save 0:10-0:20, then 0:05-0:15 → Timeline shows 0:05-0:15, then 0:10-0:20
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(false)}
                    className="h-5 mt-1 px-0 text-xs text-blue-700 hover:text-blue-900"
                  >
                    Got it
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
