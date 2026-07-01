"use client";

import {
  ChevronDown,
  FastForward,
  FlagTriangleLeft,
  FlagTriangleRight,
  Gauge,
  Keyboard,
  Pause,
  Play,
  Plus,
  Rewind,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  User,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface FloatingControlsProps {
  isPlaying: boolean;
  selectedSpeaker: string;
  playbackSpeed: number;
  volume: number;
  isLooping: boolean;
  isMobile?: boolean;
  onPlayPause: () => void;
  onSkipToStart: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSkipToEnd: () => void;
  onSetAnchorA: () => void;
  onSetAnchorB: () => void;
  onToggleLooping: () => void;
  onVolumeChange: (value: number[]) => void;
  onSpeedChange?: (speed: number) => void;
  onSpeakerChange?: (speaker: string) => void;
  onOpenShortcuts?: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  isPlaying,
  selectedSpeaker,
  playbackSpeed,
  volume,
  isLooping,
  isMobile = false,
  onPlayPause,
  onSkipToStart,
  onRewind,
  onFastForward,
  onSkipToEnd,
  onSetAnchorA,
  onSetAnchorB,
  onToggleLooping,
  onVolumeChange,
  onSpeedChange,
  onSpeakerChange,
  onOpenShortcuts,
}) => {
  const [speakers, setSpeakers] = useState([
    "Speaker 1",
    "Speaker 2",
    "Speaker 3",
    "Narrator",
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newSpeakerInput, setNewSpeakerInput] = useState("");
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  // Mobile-friendly sizing
  const buttonSize = isMobile ? "h-10 w-10" : "h-8 w-8";
  const playButtonSize = isMobile ? "h-12 w-12" : "h-9 w-9";
  const textButtonSize = isMobile ? "h-10 px-3 text-sm" : "h-8 px-2 text-xs";
  const sliderWidth = isMobile ? "w-20" : "w-16";

  const filteredSpeakers = speakers.filter((speaker) =>
    speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNewSpeaker = () => {
    if (newSpeakerInput.trim() && !speakers.includes(newSpeakerInput.trim())) {
      setSpeakers((prev) => [...prev, newSpeakerInput.trim()]);
      onSpeakerChange?.(newSpeakerInput.trim());
      setNewSpeakerInput("");
      setSearchTerm("");
    }
  };
  return (
    <div className="flex items-center gap-2">
        {/* Speaker Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(textButtonSize)}
              title="Select speaker"
            >
              <User className="mr-1 h-4 w-4" />
              <span className="text-muted-foreground">
                {selectedSpeaker || "Select Speaker"}
              </span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-none">
            <div className="p-2">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search speakers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8"
                />
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {filteredSpeakers.map((speaker) => (
                <DropdownMenuItem
                  key={speaker}
                  onClick={() => {
                    onSpeakerChange?.(speaker);
                    setSearchTerm("");
                  }}
                  className={selectedSpeaker === speaker ? "bg-accent" : ""}
                >
                  {speaker}
                </DropdownMenuItem>
              ))}
            </div>
            {searchTerm && filteredSpeakers.length === 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new speaker"
                      value={newSpeakerInput}
                      onChange={(e) => setNewSpeakerInput(e.target.value)}
                      className="h-8 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddNewSpeaker();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleAddNewSpeaker}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Segment Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(buttonSize, "px-2")}
            onClick={onSetAnchorA}
            title="Set start point (A key)"
          >
            <FlagTriangleLeft className="text-primary h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(buttonSize, "px-2")}
            onClick={onSetAnchorB}
            title="Set end point (B key)"
          >
            <FlagTriangleRight className="text-accent-foreground h-4 w-4" />
          </Button>
          <Button
            variant={isLooping ? "default" : "ghost"}
            size="sm"
            className={cn(buttonSize, "p-0")}
            onClick={onToggleLooping}
            title="Loop segment (L key)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Playback Controls */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(buttonSize, "p-0")}
          onClick={onSkipToStart}
          title="Skip to start"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(buttonSize, "p-0")}
          onClick={onRewind}
          title="Rewind 10s"
        >
          <Rewind className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          className={cn("bg-primary hover:bg-primary/90 rounded-full p-0", playButtonSize)}
          onClick={onPlayPause}
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(buttonSize, "p-0")}
          onClick={onFastForward}
          title="Fast forward 10s"
        >
          <FastForward className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(buttonSize, "p-0")}
          onClick={onSkipToEnd}
          title="Skip to end"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="text-muted-foreground h-4 w-4" />
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className={sliderWidth}
          />
          <span className="text-muted-foreground w-8 text-xs">{volume}%</span>
        </div>

        {/* Speed Control */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(textButtonSize)}
              title="Playback speed"
            >
              <Gauge className="mr-1 h-4 w-4" />
              <span>{playbackSpeed}x</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-none">
            {speeds.map((speed) => (
              <DropdownMenuItem
                key={speed}
                onClick={() => onSpeedChange?.(speed)}
                className={playbackSpeed === speed ? "bg-accent" : ""}
              >
                {speed}x
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Shortcuts */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(buttonSize, "p-0")}
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>
  );
};
