"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
} from "livekit-client";
import { ParticipantList } from "./ParticipantList";
import { MultiSpeakerControls } from "./MultiSpeakerControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Mic, MicOff, PhoneOff, CircleDot, StopCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";

// Module-level storage to persist rooms across Fast Refresh
// Key: roomName, Value: { room: Room, mountCount: number }
const roomStorage = new Map<string, { room: Room; mountCount: number }>();

// Connection lock to prevent multiple simultaneous connection attempts
const connectionLocks = new Map<string, Promise<Room>>();

interface LiveKitRoomProps {
  token: string;
  url: string;
  roomName: string;
  identity: string;
  taskId: string; // Task ID for recording API calls
  onDisconnect?: () => void;
}

export function LiveKitRoom({
  token,
  url,
  roomName,
  identity,
  taskId,
  onDisconnect,
}: LiveKitRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    (LocalParticipant | RemoteParticipant)[]
  >([]);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const isMountedRef = useRef(true);
  
  // Recording state (server-side recording via API)
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartedRef = useRef(false);

  // Define updateParticipants before useEffect so it's accessible
  const updateParticipants = () => {
    if (roomRef.current) {
      const allParticipants = [
        roomRef.current.localParticipant,
        ...Array.from(roomRef.current.remoteParticipants.values()),
      ];
      setParticipants(allParticipants);
    }
  };

  // Start server-side recording via API
  const startRecording = async () => {
    if (recordingStartedRef.current || isRecording) {
      console.log('Recording already started');
      return;
    }

    try {
      console.log('🎙️ Starting server-side recording for task:', taskId);
      
      if (!taskId) {
        throw new Error('Task ID is missing');
      }
      
      recordingStartedRef.current = true;
      setIsRecording(true);
      
      // Wait a bit for participants to be fully connected
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📤 Calling startRecording API with taskId:', taskId);
      const response = await taskService.startRecording(taskId);
      if (response.success) {
        console.log('✅ Recording started successfully, egressId:', response.data.egressId);
        toast.success('Recording started');
      } else {
        throw new Error(response.message || 'Failed to start recording');
      }
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      recordingStartedRef.current = false;
      setIsRecording(false);
      toast.error(err.message || 'Failed to start recording');
      // Don't fail the connection if recording fails
    }
  };

  // Stop server-side recording via API
  const stopRecording = async () => {
    if (!isRecording) {
      console.log('No recording in progress');
      return;
    }

    try {
      console.log('🛑 Stopping server-side recording for task:', taskId);
      const response = await taskService.stopRecording(taskId);
      if (response.success) {
        console.log('✅ Recording stop command sent successfully');
        setIsRecording(false);
        toast.success('Recording stopped. File will be processed and stored.');
      } else {
        throw new Error(response.message || 'Failed to stop recording');
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      toast.error(err.message || 'Failed to stop recording');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Check if we have an existing room in storage
    const stored = roomStorage.get(roomName);
    if (stored) {
      const existingRoom = stored.room;
      const existingState = existingRoom.state;
      
      // Increment mount count
      stored.mountCount += 1;
      
      // If room is connecting or connected, reuse it
      if (existingState === ConnectionState.Connecting || existingState === ConnectionState.Connected) {
        console.log('✅ Reusing existing room from storage:', existingState, 'mountCount:', stored.mountCount);
        roomRef.current = existingRoom;
        setRoom(existingRoom);
        setIsConnected(existingState === ConnectionState.Connected);
        setConnectionState(existingState);
        setError(null);
        
        // Re-attach event listeners (remove old ones first to avoid duplicates)
        existingRoom.removeAllListeners();
        
        existingRoom.on(RoomEvent.Connected, () => {
          if (!isMountedRef.current || roomRef.current !== existingRoom) return;
          console.log("✅ Connected to room:", roomName);
          setIsConnected(true);
          setConnectionState(ConnectionState.Connected);
          setError(null); // Clear any previous errors
          updateParticipants();
          
          // Recording is now manual - removed automatic start
        });

        existingRoom.on(RoomEvent.Disconnected, (reason?: any) => {
          if (!isMountedRef.current || roomRef.current !== existingRoom) return;
          console.log("Disconnected from room:", reason);
          setIsConnected(false);
          setConnectionState(ConnectionState.Disconnected);
          
          // Stop server-side recording when disconnected
          if (isRecording) {
            stopRecording();
          }
          
          // DON'T remove from storage here - might be React Strict Mode
          // Only remove on explicit user disconnect
        });

        existingRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (!isMountedRef.current || roomRef.current !== existingRoom) return;
          console.log("Connection state changed:", state);
          setConnectionState(state);
          setIsConnected(state === ConnectionState.Connected);
        });

        existingRoom.on(RoomEvent.ParticipantConnected, () => {
          if (isMountedRef.current && roomRef.current === existingRoom) {
            updateParticipants();
          }
        });
        
        existingRoom.on(RoomEvent.ParticipantDisconnected, () => {
          if (isMountedRef.current && roomRef.current === existingRoom) {
            updateParticipants();
          }
        });
        
        existingRoom.on(RoomEvent.TrackSubscribed, () => {
          if (isMountedRef.current && roomRef.current === existingRoom) {
            updateParticipants();
          }
        });
        
        existingRoom.on(RoomEvent.TrackUnsubscribed, () => {
          if (isMountedRef.current && roomRef.current === existingRoom) {
            updateParticipants();
          }
        });
        
        if (existingState === ConnectionState.Connected) {
          updateParticipants();
          const micTrack = existingRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
          setIsMicEnabled(micTrack ? !micTrack.isMuted : false);
        }
        
        return; // Exit early - reuse existing room
      } else {
        // Room is disconnected - only remove if mountCount is 0 (no active mounts)
        // This handles the case where React Strict Mode unmounted but we're remounting
        if (stored.mountCount <= 1) {
          console.log('Existing room disconnected and no active mounts, removing from storage');
          roomStorage.delete(roomName);
        } else {
          console.log('Existing room disconnected but mounts active, keeping in storage');
        }
      }
    }
    
    // Check if there's already a connection attempt in progress
    const existingConnection = connectionLocks.get(roomName);
    if (existingConnection) {
      console.log('⏳ Waiting for existing connection attempt to complete...');
      existingConnection
        .then((connectedRoom) => {
          if (!isMountedRef.current) return;
          // Connection completed, reuse the room
          if (connectedRoom && roomRef.current === null) {
            const stored = roomStorage.get(roomName);
            if (stored) {
              stored.mountCount += 1;
            }
            roomRef.current = connectedRoom;
            setRoom(connectedRoom);
            setIsConnected(connectedRoom.state === ConnectionState.Connected);
            setConnectionState(connectedRoom.state);
            if (connectedRoom.state === ConnectionState.Connected) {
              updateParticipants();
            }
          }
        })
        .catch(() => {
          // Connection failed, will try again
          connectionLocks.delete(roomName);
        });
      return;
    }
    
    // Create new room
    const connectToRoom = async () => {
      let newRoom: Room | null = null;
      try {
        newRoom = new Room();
        roomRef.current = newRoom;
        roomStorage.set(roomName, { room: newRoom, mountCount: 1 });
        
        // Create connection promise and store as lock
        const connectionPromise = (async () => {
          // Set up event listeners
          newRoom!.on(RoomEvent.Connected, () => {
            if (!isMountedRef.current || roomRef.current !== newRoom) {
              console.log('Connected event for old room, ignoring');
              return;
            }
            console.log("✅ Connected to room:", roomName);
            setIsConnected(true);
            setConnectionState(ConnectionState.Connected);
            setError(null); // Clear any previous errors
            updateParticipants();
            
            // Enable microphone (with user gesture handling)
            // Use setTimeout to ensure this happens after connection is fully established
            setTimeout(async () => {
              if (!isMountedRef.current || roomRef.current !== newRoom) return;
              try {
                await newRoom!.localParticipant.setMicrophoneEnabled(true);
                if (isMountedRef.current && roomRef.current === newRoom) {
                  setIsMicEnabled(true);
                }
              } catch (err: any) {
                console.warn('Failed to enable microphone:', err);
                // Don't fail the connection if mic fails - might need user gesture
              }
            }, 500);

            // Recording is now manual - removed automatic start
          });

          newRoom!.on(RoomEvent.Disconnected, (reason) => {
            if (!isMountedRef.current || roomRef.current !== newRoom) return;
            console.log("Disconnected from room:", reason);
            setIsConnected(false);
            setConnectionState(ConnectionState.Disconnected);
            connectionLocks.delete(roomName);
            
            // Stop recording when disconnected
            stopRecording();
            
            // DON'T remove from storage - might be React Strict Mode
          });

          newRoom!.on(RoomEvent.ConnectionStateChanged, (state) => {
            if (!isMountedRef.current || roomRef.current !== newRoom) return;
            console.log("Connection state changed:", state);
            setConnectionState(state);
            setIsConnected(state === ConnectionState.Connected);
          });

          newRoom!.on(RoomEvent.ParticipantConnected, () => {
            if (isMountedRef.current && roomRef.current === newRoom) {
              updateParticipants();
            }
          });
          
          newRoom!.on(RoomEvent.ParticipantDisconnected, () => {
            if (isMountedRef.current && roomRef.current === newRoom) {
              updateParticipants();
            }
          });
          
          newRoom!.on(RoomEvent.TrackSubscribed, () => {
            if (isMountedRef.current && roomRef.current === newRoom) {
              updateParticipants();
            }
          });
          
          newRoom!.on(RoomEvent.TrackUnsubscribed, () => {
            if (isMountedRef.current && roomRef.current === newRoom) {
              updateParticipants();
            }
          });

          // Connect to room
          console.log('🔌 Connecting to room:', roomName);
          await newRoom!.connect(url, token);
          
          // Check if room is still ours (not replaced by Fast Refresh)
          if (!isMountedRef.current || roomRef.current !== newRoom) {
            console.log('Room ref reassigned during connection, new mount will handle it');
            return newRoom;
          }
          
          // Update state
          setRoom(newRoom);
          if (newRoom.state === ConnectionState.Connected) {
            setIsConnected(true);
            setConnectionState(ConnectionState.Connected);
            setError(null); // Clear any previous errors
            updateParticipants();
          }
          
          return newRoom;
        })();
        
        // Store connection promise as lock
        connectionLocks.set(roomName, connectionPromise);
        
        // Wait for connection
        await connectionPromise;
        
        // Clear lock after successful connection
        connectionLocks.delete(roomName);
      } catch (err: any) {
        console.error("Failed to connect to room:", err);
        connectionLocks.delete(roomName);
        if (isMountedRef.current) {
          setError(err.message || "Failed to connect to LiveKit room");
        }
        
        // Only remove from storage if this was our room and we're still mounted
        if (roomRef.current === newRoom) {
          const stored = roomStorage.get(roomName);
          if (stored && stored.mountCount <= 1) {
            roomStorage.delete(roomName);
          } else if (stored) {
            stored.mountCount -= 1;
          }
          roomRef.current = null;
        }
      }
    };

    connectToRoom();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      
      // Decrement mount count
      const stored = roomStorage.get(roomName);
      if (stored) {
        stored.mountCount -= 1;
        console.log('Component unmounting, mountCount:', stored.mountCount);
        
        // Only remove from storage if no active mounts
        // This handles React Strict Mode - if we remount quickly, we keep the room
        if (stored.mountCount <= 0) {
          // Use a delayed cleanup to allow React Strict Mode remount
          setTimeout(() => {
            const stillStored = roomStorage.get(roomName);
            if (stillStored && stillStored.mountCount <= 0) {
              console.log('No active mounts, removing room from storage');
              // Only disconnect if room is still active
              if (stillStored.room.state !== ConnectionState.Disconnected) {
                stillStored.room.disconnect().catch(() => {});
              }
              roomStorage.delete(roomName);
            }
          }, 2000); // 2 second delay to allow Strict Mode remount
        }
      }
      
      // Clear ref
      roomRef.current = null;
    };
  }, [token, url, roomName, identity]);

  const toggleMicrophone = async () => {
    if (!roomRef.current) return;

    try {
      const enabled = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setIsMicEnabled(enabled);
    } catch (err: any) {
      console.error("Failed to toggle microphone:", err);
      setError(err.message || "Failed to toggle microphone");
    }
  };

  const disconnect = async () => {
    // Stop server-side recording before disconnecting
    if (isRecording) {
      await stopRecording();
    }
    
    const currentRoom = roomRef.current || roomStorage.get(roomName)?.room;
    if (currentRoom) {
      await currentRoom.disconnect();
      roomStorage.delete(roomName);
      roomRef.current = null;
      setRoom(null);
      setIsConnected(false);
      if (onDisconnect) {
        onDisconnect();
      }
    }
  };

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Connecting to room...</span>
      </div>
    );
  }

  // Only show error if we're disconnected and have an error
  if (error && !isConnected && connectionState === ConnectionState.Disconnected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isConnected || !room) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Initializing connection...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Sidebar - Connection Settings */}
      <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🎵</span>
              <span>Stotra Audio</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Session ID / Room Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomName}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm font-mono"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <input
                type="text"
                value={url}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-muted text-sm font-mono"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Token</label>
              <textarea
                value={token.substring(0, 50) + "..."}
                readOnly
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-muted text-xs font-mono"
              />
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publishMic"
                  checked={isMicEnabled}
                  onChange={toggleMicrophone}
                  className="rounded"
                />
                <label htmlFor="publishMic" className="text-sm">Publish Mic</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="subscribe"
                  checked={true}
                  readOnly
                  className="rounded"
                />
                <label htmlFor="subscribe" className="text-sm">Subscribe</label>
              </div>
            </div>
          </CardContent>
        </Card>

        <ParticipantList participants={participants} />
      </div>

      {/* Right Panel - Audio Room */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Audio Room</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col relative bg-muted/30 rounded-lg p-8">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-3xl font-semibold">{roomName}</div>
                <div className="text-sm text-muted-foreground">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} connected
                </div>
              </div>
            </div>
            
            {/* Recording Controls - Top Right */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={recordingStartedRef.current}
                >
                  <CircleDot className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="sm"
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Floating controls at bottom center */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-4">
                <Button
                  variant={isMicEnabled ? "default" : "outline"}
                  size="lg"
                  onClick={toggleMicrophone}
                  className="rounded-full w-16 h-16 p-0"
                  title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {isMicEnabled ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={disconnect}
                  className="rounded-full w-16 h-16 p-0"
                  title="Leave session"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
