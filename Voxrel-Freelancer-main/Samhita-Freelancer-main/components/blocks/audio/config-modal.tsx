"use client";

import { Gauge, Play, Save, Settings, ToggleLeft, Volume2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioConfig {
  autoplay: boolean;
  mediaControls: boolean;
  preload: string;
  defaultVolume: string;
  defaultPlaybackRate: string;
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudioConfig;
  onConfigChange: (config: AudioConfig) => void;
  onSaveConfig: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onSaveConfig,
}) => {
  const handleConfigUpdate = (
    key: keyof AudioConfig,
    value: string | boolean
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleSave = () => {
    onSaveConfig();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="text-primary h-5 w-5" />
            Audio Configuration
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure audio playback and control settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Autoplay */}
          <div className="border-border/30 flex items-center justify-between border-b py-3">
            <div className="flex items-center gap-3">
              <Play className="text-primary h-4 w-4" />
              <div>
                <h3 className="text-sm font-medium">Autoplay</h3>
                <p className="text-muted-foreground text-xs">
                  Start playing automatically when loaded
                </p>
              </div>
            </div>
            <div className="w-44">
              <Select
                value={config.autoplay ? "true" : "false"}
                onValueChange={(value) =>
                  handleConfigUpdate("autoplay", value === "true")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Disabled</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Media Controls */}
          <div className="border-border/30 flex items-center justify-between border-b py-3">
            <div className="flex items-center gap-3">
              <ToggleLeft className="text-primary h-4 w-4" />
              <div>
                <h3 className="text-sm font-medium">Native Media Controls</h3>
                <p className="text-muted-foreground text-xs">
                  Show browser&apos;s native audio controls
                </p>
              </div>
            </div>
            <div className="w-44">
              <Select
                value={config.mediaControls ? "true" : "false"}
                onValueChange={(value) =>
                  handleConfigUpdate("mediaControls", value === "true")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Hidden</SelectItem>
                  <SelectItem value="true">Visible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preload */}
          <div className="border-border/30 flex items-center justify-between border-b py-3">
            <div className="flex items-center gap-3">
              <Settings className="text-primary h-4 w-4" />
              <div>
                <h3 className="text-sm font-medium">Preload Strategy</h3>
                <p className="text-muted-foreground text-xs">
                  How much audio to preload
                </p>
              </div>
            </div>
            <div className="w-44">
              <Select
                value={config.preload}
                onValueChange={(value) => handleConfigUpdate("preload", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="metadata">Metadata Only</SelectItem>
                  <SelectItem value="auto">Auto (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default Volume */}
          <div className="border-border/30 flex items-center justify-between border-b py-3">
            <div className="flex items-center gap-3">
              <Volume2 className="text-primary h-4 w-4" />
              <div>
                <h3 className="text-sm font-medium">Default Volume</h3>
                <p className="text-muted-foreground text-xs">
                  Initial volume level (0-100%)
                </p>
              </div>
            </div>
            <div className="w-44">
              <Select
                value={config.defaultVolume}
                onValueChange={(value) =>
                  handleConfigUpdate("defaultVolume", value)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default Playback Rate */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Gauge className="text-primary h-4 w-4" />
              <div>
                <h3 className="text-sm font-medium">Default Playback Speed</h3>
                <p className="text-muted-foreground text-xs">
                  Initial playback rate
                </p>
              </div>
            </div>
            <div className="w-44">
              <Select
                value={config.defaultPlaybackRate}
                onValueChange={(value) =>
                  handleConfigUpdate("defaultPlaybackRate", value)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x (Slow)</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="border-border/30 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
