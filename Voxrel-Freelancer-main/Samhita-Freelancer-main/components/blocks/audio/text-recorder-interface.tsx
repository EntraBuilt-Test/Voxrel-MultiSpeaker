
import { Mic, Square, Play, Pause, RefreshCw, Upload, Loader2, FileText } from "lucide-react";
import React, { useState, useRef, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface TextRecorderInterfaceProps {
    textContent: string | null;
    onSave: (blob: Blob) => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    recordedBlob: Blob | null;
    recordedUrl: string | null;
    onClearRecording: () => void;
}

export function TextRecorderInterface({
    textContent,
    onSave,
    onSubmit,
    isSubmitting,
    recordedBlob,
    recordedUrl,
    onClearRecording
}: TextRecorderInterfaceProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Recording Timer
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Use webm for browser compatibility
                onSave(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure you have granted permission.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Audio Playback
    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;

            const updateTime = () => setCurrentTime(audio.currentTime);
            const updateDuration = () => setDuration(audio.duration);
            const onEnded = () => setIsPlaying(false);

            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', onEnded);

            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', onEnded);
            };
        }
    }, [recordedUrl]);

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full gap-4 max-w-4xl mx-auto p-4">
            {/* Text Display */}
            <Card className="flex-1 min-h-[400px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Script to Record
                    </CardTitle>
                    <CardDescription>
                        Read the text below clearly and at a natural pace.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-full">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-muted/20 text-lg leading-relaxed whitespace-pre-wrap">
                        {textContent || "No text content available."}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Recording Controls */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-6">

                        {!recordedBlob ? (
                            // Recording Mode
                            <div className="flex flex-col items-center gap-4 w-full">
                                <div className="text-4xl font-mono font-bold tabular-nums">
                                    {formatTime(recordingTime)}
                                </div>

                                {isRecording ? (
                                    <div className="flex items-center gap-4">
                                        <Button
                                            size="lg"
                                            variant="destructive"
                                            className="h-16 w-16 rounded-full animate-pulse"
                                            onClick={stopRecording}
                                        >
                                            <Square className="h-8 w-8 fill-current" />
                                        </Button>
                                        <span className="text-sm text-muted-foreground animate-pulse">Recording...</span>
                                    </div>
                                ) : (
                                    <Button
                                        size="lg"
                                        variant="default"
                                        className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                                        onClick={startRecording}
                                    >
                                        <Mic className="h-8 w-8" />
                                    </Button>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    {isRecording ? "Click square to stop" : "Click microphone to start recording"}
                                </p>
                            </div>
                        ) : (
                            // Review Mode
                            <div className="flex flex-col items-center gap-4 w-full">
                                <audio ref={audioRef} src={recordedUrl || undefined} className="hidden" />

                                <div className="w-full flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
                                    <Button size="icon" variant="ghost" onClick={togglePlayback}>
                                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                                    </Button>

                                    <div className="text-xs font-mono w-12">{formatTime(currentTime)}</div>

                                    <Slider
                                        value={[currentTime]}
                                        max={duration || 100}
                                        step={0.1}
                                        onValueChange={(val) => {
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = val[0];
                                                setCurrentTime(val[0]);
                                            }
                                        }}
                                        className="flex-1"
                                    />

                                    <div className="text-xs font-mono w-12">{formatTime(duration)}</div>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                    <Button variant="outline" onClick={onClearRecording} disabled={isSubmitting}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Re-record
                                    </Button>

                                    <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="px-8">
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Submit Recording
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
