import { Upload, File, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils.lib';

interface DropzoneProps {
    onFilesChange: (files: File[]) => void;
    accept?: string;
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    clearFiles?: boolean;
}

export function Dropzone({
    onFilesChange,
    accept = "audio/*",
    maxFiles = 1,
    disabled = false,
    className,
    clearFiles = false
}: DropzoneProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clear files when clearFiles prop changes to true
    useEffect(() => {
        if (clearFiles) {
            setFiles([]);
            onFilesChange([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [clearFiles, onFilesChange]);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const fileArray = Array.from(newFiles);
        const validFiles = fileArray.filter(file => file.type.startsWith('audio/'));

        // For single file mode (maxFiles = 1), replace existing file
        const updatedFiles = maxFiles === 1 ? validFiles.slice(0, 1) : [...files, ...validFiles].slice(0, maxFiles);

        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesChange(newFiles);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!disabled) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && fileInputRef.current) {
            // Reset the input value to allow selecting the same file again
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Don't clear the input value immediately to allow file selection to work
    };

    return (
        <div className={cn('w-full', className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative rounded-lg border-2 border-dashed p-4 text-center transition-colors',
                    isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                    disabled && 'pointer-events-none opacity-50',
                    files.length > 0 ? 'border-primary bg-primary/5' : ''
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    multiple={maxFiles > 1}
                    disabled={disabled}
                />
                <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-center">
                        {isDragOver ? (
                            <p className="text-primary font-medium">Drop your audio files here</p>
                        ) : (
                            <>
                                <p className="font-medium mb-1">
                                    {maxFiles === 1 ? 'Upload Audio File' : `Upload Audio Files (max ${maxFiles})`}
                                </p>
                                <p className="text-muted-foreground mb-2">
                                    {maxFiles === 1 ? 'Required • Supports MP3, WAV, M4A, OGG' : 'Drag & drop multiple files or click to browse • Supports MP3, WAV, M4A, OGG'}
                                </p>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                    onClick={handleClick}
                                    disabled={disabled}
                                >
                                    {maxFiles === 1 ? 'Choose File' : 'Choose Files'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border"
                        >
                            <File className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                disabled={disabled}
                                className="p-1 hover:bg-destructive/10 rounded-sm"
                            >
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
