"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { userService } from "@/services/user.service";
import { useUserStore } from "@/stores";
import { RegisterData } from "@/types";

interface SignupFormData extends RegisterData {
  confirmPassword: string;
}

type RegistrationStep = 'details' | 'otp';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { } = useUserStore();
  const { notifications, showSuccess, showError, dismiss } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('details');

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "FREELANCER", // Default role for regular signup
  });

  const [otp, setOtp] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    [K in keyof SignupFormData]?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { [K in keyof SignupFormData]?: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);

    // Log validation errors silently
    if (Object.keys(errors).length > 0) {
      console.error('Form validation errors:', errors);
    }

    return Object.keys(errors).length === 0;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show validation errors as toasts
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    try {
      setIsLoading(true);

      // Remove confirmPassword before sending to API
      const { confirmPassword: _confirmPassword, ...registerData } = formData;
      const response = await userService.registerStart(registerData);

      if (response.success) {
        showSuccess('Verification code sent to your email');
        setStep('otp');
      }
    } catch (error) {
      console.error("Registration start failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);

      // Verify email with OTP (no auto-login)
      const { success: _success, message: _message } = await userService.registerVerify(
        formData.email,
        otp
      );

      // After OTP verification, user should always be in PENDING_VERIFICATION status
      // They should not be able to login until admin approves them
      // Store a flag to indicate user just completed OTP verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('justVerifiedOTP', 'true');
        localStorage.setItem('verifiedEmail', formData.email);
      }

      showSuccess('Account verified successfully!');
      setTimeout(() => {
        router.push("/profile-review");
      }, 1000);
    } catch (error) {
      console.error("OTP verification failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

  };

  // Render details form (step 1)
  if (step === 'details') {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" className="w-16 h-16 object-contain" />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    disabled={isLoading}
                    className={validationErrors.name ? "border-red-500" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500">{validationErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    disabled={isLoading}
                    className={validationErrors.email ? "border-red-500" : ""}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    disabled={isLoading}
                    className={validationErrors.password ? "border-red-500" : ""}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    disabled={isLoading}
                    className={validationErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending Code..." : "Continue"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Notification Toast */}
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
      </div>
    );
  }

  // Render OTP verification form (step 2)
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit verification code to {formData.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the verification code
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    💡 Development: Use OTP <code className="bg-amber-100 px-1 rounded">123456</code>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? "Verifying..." : "Verify Account"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('details')}
                disabled={isLoading}
              >
                Back to Registration
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              className="text-primary underline underline-offset-4 hover:no-underline"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const { confirmPassword: _confirmPassword, ...registerData } = formData;
                  await userService.registerStart(registerData);
                  showSuccess('Verification code sent to your email');
                } catch {
                  showError('Failed to resend code');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              Resend verification code
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Toast */}
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
