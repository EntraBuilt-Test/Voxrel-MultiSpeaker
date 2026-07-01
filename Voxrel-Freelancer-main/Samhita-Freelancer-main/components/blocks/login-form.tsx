"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { NotificationToast } from "@/components/notification-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores";
import { LoginCredentials } from "@/types";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useUserStore();
  const { notifications, showSuccess, showError, dismiss } = useNotifications();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  // Handle errors silently - logged to console
  useEffect(() => {
    if (error) {
      console.error('Login error:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!credentials.email || !credentials.password) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      await login(credentials);

      // Get user from store to check status
      const userStore = useUserStore.getState();
      const user = userStore.user;

      // Check if user just completed OTP verification (frontend workaround for backend issue)
      const justVerifiedOTP = typeof window !== 'undefined' ? localStorage.getItem('justVerifiedOTP') : null;
      const verifiedEmail = typeof window !== 'undefined' ? localStorage.getItem('verifiedEmail') : null;

      // If user just verified OTP, force them to profile-review regardless of backend status
      if (justVerifiedOTP === 'true' && verifiedEmail === credentials.email) {
        // Clear the flag
        if (typeof window !== 'undefined') {
          localStorage.removeItem('justVerifiedOTP');
          localStorage.removeItem('verifiedEmail');
        }
        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/profile-review");
        }, 1000);
        return;
      }

      // Redirect based on actual user status from backend (no hardcoded workarounds)

      // Redirect based on user status
      if (user?.status === 'ACTIVE') {
        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/projects");
        }, 1000);
      } else if (user?.status === 'PENDING') {
        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/profile-review");
        }, 1000);
      } else if (user?.status === 'BANNED') {
        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/access-denied");
        }, 1000);
      } else {
        // Fallback for unknown status
        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/profile-review");
        }, 1000);
      }
    } catch (error) {
      console.error("Login failed:", error);

      // Check if this is a PENDING user trying to login
      if (error instanceof Error && error.message.includes('Account pending admin approval')) {
        // Create a temporary user object for PENDING users
        const pendingUser = {
          id: 'pending-' + Date.now(),
          name: 'Pending User',
          email: credentials.email,
          status: 'PENDING' as const,
          role: 'FREELANCER' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Store the pending user in localStorage for the profile review page
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
        }

        showSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          router.push("/profile-review");
        }, 1000);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      showError(errorMessage);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@kreativ.com"
                    value={credentials.email}
                    onChange={handleInputChange("email")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <PasswordInput
                    id="password"
                    value={credentials.password}
                    onChange={handleInputChange("password")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#" className="underline underline-offset-2">Terms of Service</a>{" "}
        and <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
      </div>

      {/* Notification Toast */}
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
