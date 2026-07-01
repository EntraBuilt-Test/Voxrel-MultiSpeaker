"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/stores';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const { initializeAuth, isLoggedIn } = useUserStore();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            if (typeof window === 'undefined' || hasChecked) {
                return;
            }

            setHasChecked(true);

            // Initialize auth from localStorage first
            initializeAuth();

            // Small delay to let initializeAuth complete
            setTimeout(() => {
                const accessToken = localStorage.getItem('accessToken');
                const refreshToken = localStorage.getItem('refreshToken');
                const user = localStorage.getItem('user');



                // Check if we have all required authentication data
                if (accessToken && refreshToken && user && user !== 'null' && user !== 'undefined') {
                    try {
                        const parsedUser = JSON.parse(user);
                        // Check for both id and _id (API might use either)
                        if (parsedUser && (parsedUser.id || parsedUser._id)) {
                            setIsAuthenticated(true);
                            return;
                        } else {
                        }
                    } catch {
                    }
                }

                // No valid authentication found
                setIsAuthenticated(false);

                // Redirect to login immediately
                router.push('/login');
            }, 100);
        };

        checkAuth();
    }, [router, initializeAuth, isLoggedIn, hasChecked]);

    // Show loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If authenticated, render children
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // If not authenticated, show loading (redirect is in progress)
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
            </div>
        </div>
    );
}
