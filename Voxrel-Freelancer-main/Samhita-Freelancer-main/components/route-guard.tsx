"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUserStore } from "@/stores";

interface RouteGuardProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export function RouteGuard({ children, requireActive = true }: RouteGuardProps) {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useUserStore();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Check if user is logged in
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    // If user exists, check their status
    if (user) {
      if (user.status === 'BANNED') {
        router.push('/access-denied');
        return;
      }

      // Check user status based on actual backend response
      if (requireActive && user.status === 'PENDING') {
        router.push('/profile-review');
        return;
      }
    }
  }, [user, isLoggedIn, isLoading, router, requireActive]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not properly authenticated
  if (!isLoggedIn() || !user) {
    return null;
  }

  // Don't render children if user status doesn't meet requirements
  if (requireActive && user.status !== 'ACTIVE') {
    return null;
  }

  return <>{children}</>;
}
