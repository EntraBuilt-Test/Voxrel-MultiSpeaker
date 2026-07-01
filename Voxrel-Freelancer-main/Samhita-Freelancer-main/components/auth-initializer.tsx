"use client";

import { useEffect } from "react";

import { useUserStore } from "@/stores";

/**
 * AuthInitializer component
 * Initializes authentication state from localStorage on app load
 * This should be rendered once at the root layout level
 */
export function AuthInitializer() {
  const initializeAuth = useUserStore(state => state.initializeAuth);

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth();
  }, [initializeAuth]);

  // This component doesn't render anything
  return null;
}

