import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy audio files from external sources (e.g., R2 buckets)
 * This solves CORS issues by making server-to-server requests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate that the URL is a valid HTTP/HTTPS URL
    let audioUrl: URL;
    try {
      audioUrl = new URL(url);
      if (!['http:', 'https:'].includes(audioUrl.protocol)) {
        return NextResponse.json(
          { error: 'Invalid URL protocol. Only http and https are allowed.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the audio file from the external source
    const response = await fetch(audioUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Kreative-Audio-Proxy/1.0',
      },
      // Don't follow redirects automatically - handle them explicitly
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    
    // Get the content length if available
    const contentLength = response.headers.get('content-length');

    // Create headers for the response
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Enable CORS for the frontend
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cache control - allow caching for performance
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    // Get the audio data as a stream
    const audioData = await response.arrayBuffer();

    // Return the audio file with proper headers
    return new NextResponse(audioData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy audio file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

