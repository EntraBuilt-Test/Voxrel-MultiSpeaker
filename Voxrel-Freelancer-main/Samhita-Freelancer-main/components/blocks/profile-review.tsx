"use client";

import { Clock, Mail, Shield, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores";

export function ProfileReview() {
  const { user, logout } = useUserStore();
  const [pendingUser, setPendingUser] = useState<{
    id: string;
    name: string;
    email: string;
    status: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  } | null>(null);

  // Check for pending user in localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPendingUser = localStorage.getItem('pendingUser');
      if (storedPendingUser) {
        try {
          setPendingUser(JSON.parse(storedPendingUser));
        } catch (error) {
          console.error('Failed to parse pending user:', error);
        }
      }
    }
  }, []);

  // Use pending user if no regular user is available
  const displayUser = user || pendingUser;

  const handleLogout = async () => {
    try {
      await logout();
      // Clear pending user data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingUser');
        // Clear all auth tokens and user data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      setPendingUser(null);
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      window.location.href = '/login';
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Profile Under Review</CardTitle>
          <CardDescription className="text-lg">
            Thank you for joining Kreactive! Your profile is currently under review by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Information */}
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Review in Progress
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                We&apos;ll notify you via email once your account is approved
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium">Profile Review</p>
                  <p className="text-sm text-muted-foreground">
                    Our admin team will review your profile and credentials
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive an email notification once your account is approved
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium">Start Working</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you can start browsing and claiming tasks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Information */}
          {displayUser && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Your Account Details</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{displayUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">Pending Verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>

          {/* Support Information */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Need help?</strong> If you have any questions about the review process, 
              please contact our support team at{" "}
              <a 
                href="mailto:support@kreativ.com" 
                className="text-primary hover:underline"
              >
                support@kreativ.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
