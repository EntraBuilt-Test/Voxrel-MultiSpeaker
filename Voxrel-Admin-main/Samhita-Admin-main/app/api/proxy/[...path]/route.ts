import { NextRequest, NextResponse } from 'next/server';

// Get API base URL from environment or use default
function getApiBaseUrl(): string {
  // Always use environment variable - no hardcoded URLs
  return process.env.NEXT_PUBLIC_API_URL || 'https://samhita-backend-nn5d.onrender.com';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const path = params.path.join('/');
    const url = `${apiBaseUrl}/api/v1/${path}`;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;
    
    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        // No body present
      }
    }
    
    // Get headers from request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward other important headers
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      headers['Content-Type'] = contentType;
    }
    
    console.log('Proxy: Forwarding request:', {
      method,
      url: fullUrl,
      hasBody: !!body,
      hasAuth: !!authHeader,
    });
    
    // Make request to backend
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body || undefined,
    });
    
    // Get response data
    const responseText = await response.text();
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { message: responseText };
    }
    
    console.log('Proxy: Response received:', {
      status: response.status,
      ok: response.ok,
      hasData: !!responseData,
    });
    
    // Return response with CORS headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy: Error forwarding request:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Proxy request failed',
        error: 'Failed to connect to backend server',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

