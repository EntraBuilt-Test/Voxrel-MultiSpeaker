import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/tasks',
  '/projects',
  '/profile',
  '/settings',
  '/workspace',
];

// Define auth routes that should redirect if already authenticated
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-otp',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/profile-review',
  '/access-denied',
];

// Define routes that require active status (not pending verification)
const activeOnlyRoutes = [
  '/tasks',
  '/projects',
  '/workspace',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if the current path requires active status
  const requiresActiveStatus = activeOnlyRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Get tokens from cookies (we'll set these in the auth flow)
  const accessToken = request.cookies.get('accessToken')?.value;
  const userData = request.cookies.get('user')?.value;

  let user = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse user data from cookie:', error);
    }
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If accessing protected routes without authentication
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Use actual user status from backend (no hardcoded workarounds)
  const userStatus = user?.status;

  // If accessing auth routes while authenticated
  if (isAuthRoute && accessToken && user) {
    // Redirect based on actual user status from backend
    if (userStatus === 'ACTIVE') {
      return NextResponse.redirect(new URL('/projects/manage', request.url));
    } else if (userStatus === 'PENDING') {
      return NextResponse.redirect(new URL('/profile-review', request.url));
    }
  }

  // If accessing active-only routes with pending status
  if (requiresActiveStatus && userStatus === 'PENDING') {
    return NextResponse.redirect(new URL('/profile-review', request.url));
  }

  // If user is banned, redirect to access denied
  if (user?.status === 'BANNED') {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
