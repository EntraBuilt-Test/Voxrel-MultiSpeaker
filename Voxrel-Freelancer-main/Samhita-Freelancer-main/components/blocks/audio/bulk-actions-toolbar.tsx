"use client";

import { Trash2, User, X, Download } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkUpdateSpeaker: (speaker: string) => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onBulkDelete,
  onBulkUpdateSpeaker,
  onClearSelection,
  onBulkExport
}) => {
  if (selectedCount === 0) return null;

  const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Narrator'];

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <Badge variant="secondary">
        {selectedCount} selected
      </Badge>

      <div className="flex gap-1 ml-auto">
        {/* Speaker Assignment */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <User className="h-3 w-3 mr-1" />
              Assign Speaker
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {speakers.map(speaker => (
              <DropdownMenuItem
                key={speaker}
                onClick={() => onBulkUpdateSpeaker(speaker)}
              >
                {speaker}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        {onBulkExport && (
          <Button size="sm" variant="outline" onClick={onBulkExport} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        )}

        {/* Delete */}
        <Button size="sm" variant="destructive" onClick={onBulkDelete} className="h-7 text-xs">
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>

        {/* Clear Selection */}
        <Button size="sm" variant="ghost" onClick={onClearSelection} className="h-7 text-xs">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
