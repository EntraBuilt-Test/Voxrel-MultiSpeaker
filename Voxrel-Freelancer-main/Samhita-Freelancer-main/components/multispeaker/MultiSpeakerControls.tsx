"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MultiSpeakerControlsProps {
  isMicEnabled: boolean;
  onToggleMicrophone: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export function MultiSpeakerControls({
  isMicEnabled,
  onToggleMicrophone,
  onDisconnect,
  isConnected,
}: MultiSpeakerControlsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4 justify-center">
          <Button
            variant={isMicEnabled ? "default" : "outline"}
            size="lg"
            onClick={onToggleMicrophone}
            disabled={!isConnected}
            className="flex items-center gap-2"
          >
            {isMicEnabled ? (
              <>
                <Mic className="h-5 w-5" />
                Mute
              </>
            ) : (
              <>
                <MicOff className="h-5 w-5" />
                Unmute
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onDisconnect}
            disabled={!isConnected}
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            Leave Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
