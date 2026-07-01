import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to upload audio files to backend R2 storage
 * This proxies the upload to the backend API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const taskId = formData.get('taskId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Convert File to FormData for backend
    const backendFormData = new FormData();
    const arrayBuffer = await audioFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: audioFile.type });
    backendFormData.append('audio', blob, audioFile.name);
    backendFormData.append('taskId', taskId);

    // Upload to backend API - use environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://samhita-backend-nn5d.onrender.com';
    const uploadResponse = await fetch(`${apiUrl}/api/v1/freelancer/tasks/${taskId}/upload-audio`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Authorization': authHeader,
        // Don't set Content-Type - let fetch set it with boundary for FormData
      },
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({ 
        message: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}` 
      }));
      return NextResponse.json(
        { error: errorData.message || 'Failed to upload audio' },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    return NextResponse.json(uploadData);
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload audio file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
