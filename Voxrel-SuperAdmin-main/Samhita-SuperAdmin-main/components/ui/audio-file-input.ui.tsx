import React from 'react';

interface AudioFileInputProps {
    onFileChange: (file: File | null) => void;
    disabled?: boolean;
    selectedFile?: File | null;
    className?: string;
}

export function AudioFileInput({
    onFileChange,
    disabled = false,
    selectedFile,
    className
}: AudioFileInputProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileChange(file);
    };

    return (
        <div className={className}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {selectedFile ? 'Replace audio file' : 'Upload audio file'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Required • Supports MP3, WAV, M4A, OGG
                        </p>
                    </div>
                </div>
            </div>

            {selectedFile && (
                <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-blue-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
