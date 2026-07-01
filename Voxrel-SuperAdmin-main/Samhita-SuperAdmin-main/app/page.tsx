"use client";

// SUPER ADMIN EXTENSION: Root page with role-based redirect
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect based on role
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user && user !== 'null' && user !== 'undefined') {
        try {
          const parsedUser = JSON.parse(user);
          if (parsedUser?.role === 'SUPER_ADMIN') {
            router.push('/super-admin');
            return;
          }
        } catch {
          // If parsing fails, continue with default redirect
        }
      }
      // Default redirect for other roles
      router.push('/projects');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}


