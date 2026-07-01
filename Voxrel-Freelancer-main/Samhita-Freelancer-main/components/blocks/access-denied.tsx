"use client";

import { AlertTriangle, Mail, LogOut } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores";

export function AccessDenied() {
  const { user, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-lg">
            Your account has been suspended. Please contact support for assistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Information */}
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Account Suspended
              </p>
              <p className="text-sm text-destructive/80">
                Your account access has been restricted
              </p>
            </div>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What does this mean?</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your account has been suspended due to a violation of our terms of service 
                or community guidelines. This action was taken by our admin team.
              </p>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error or would like to appeal this decision, 
                please contact our support team.
              </p>
            </div>
          </div>

          {/* User Information */}
          {user && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Account Information</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-destructive">Account Suspended</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="mailto:support@kreativ.com">
                Contact Support
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Support Information */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Need assistance?</strong> Our support team is here to help. 
              Contact us at{" "}
              <a 
                href="mailto:support@kreativ.com" 
                className="text-primary hover:underline"
              >
                support@kreativ.com
              </a>{" "}
              for more information about your account status.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
