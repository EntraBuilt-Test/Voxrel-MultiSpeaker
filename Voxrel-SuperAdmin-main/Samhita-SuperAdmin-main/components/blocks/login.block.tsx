"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

import { NotificationToast } from "@/components/shared";
import { Button } from "@/components/ui/button.ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { AUTH_CONSTANTS, AUTH_INITIAL_STATES, AUTH_VALIDATION_RULES, LoginFormData } from "@/constants/auth.constants";
import { useFormState, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils.lib";
import { useUserStore } from "@/stores";



export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useUserStore();

  // New hooks for better state management
  const { notifications, showSuccess, showError, dismiss } = useNotifications();

  const loginForm = useFormState<LoginFormData>(
    AUTH_INITIAL_STATES.login,
    {
      email: AUTH_VALIDATION_RULES.email,
      password: AUTH_VALIDATION_RULES.password,
    }
  );

  // Handle login submission
  const handleLogin = async (formData: LoginFormData) => {
    try {
      clearError();

      await login(formData);


      // Verify tokens were stored
      const accessToken = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');

      if (accessToken && user) {
        showSuccess(AUTH_CONSTANTS.MESSAGES.LOGIN_SUCCESS);

        // Small delay to show success message before redirect
        setTimeout(() => {
          // SUPER ADMIN EXTENSION: Check role and redirect accordingly
          try {
            const parsedUser = JSON.parse(user);
            if (parsedUser?.role === 'SUPER_ADMIN') {
              router.push('/super-admin');
            } else {
              router.push(AUTH_CONSTANTS.REDIRECT_AFTER_LOGIN);
            }
          } catch {
            // Fallback to default redirect if parsing fails
            router.push(AUTH_CONSTANTS.REDIRECT_AFTER_LOGIN);
          }
        }, 1000);
      } else {
        throw new Error('Login succeeded but tokens were not stored properly');
      }
    } catch (authError: unknown) {
      const errorMessage = authError instanceof Error
        ? authError.message
        : AUTH_CONSTANTS.MESSAGES.LOGIN_ERROR;
      showError(errorMessage);
    }
  };

  // Clear error when user starts typing (but don't show error here to avoid duplicates)
  React.useEffect(() => {
    if (error) {
      // Error is already shown in handleLogin catch block
    }
  }, [error]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" width={64} height={64} className="object-contain" />
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@kreactive.com"
                    value={loginForm.values.email}
                    onChange={loginForm.handleChange('email')}
                    disabled={isLoading}
                  />
                  {loginForm.errors.email && (
                    <p className="text-sm text-red-600">{loginForm.errors.email}</p>
                  )}
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
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.values.password}
                    onChange={loginForm.handleChange('password')}
                    disabled={isLoading}
                  />
                  {loginForm.errors.password && (
                    <p className="text-sm text-red-600">{loginForm.errors.password}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !loginForm.isValid}
                >
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
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
