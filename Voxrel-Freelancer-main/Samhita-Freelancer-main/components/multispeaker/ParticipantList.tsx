"use client";

import { Participant, LocalParticipant, RemoteParticipant, Track } from "livekit-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParticipantListProps {
  participants: (LocalParticipant | RemoteParticipant)[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  const getParticipantInfo = (participant: Participant) => {
    const isLocal = participant instanceof LocalParticipant;
    const micTrack = participant.getTrackPublication(Track.Source.Microphone);
    const isMicEnabled = micTrack && !micTrack.isMuted && micTrack.isSubscribed;

    return {
      identity: participant.identity,
      isLocal,
      isMicEnabled: !!isMicEnabled,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant) => {
            const info = getParticipantInfo(participant);
            return (
              <div
                key={participant.identity}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{info.identity}</span>
                      {info.isLocal && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {info.isMicEnabled ? (
                    <Mic className="h-4 w-4 text-green-500" />
                  ) : (
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
