"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

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
import { useUserStore } from "@/stores";

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ResetFormData {
    otp: string;
    password: string;
    confirmPassword: string;
}

export function VerifyOTPForm({
    className,
    email: emailProp,
    ...props
}: React.ComponentProps<"div"> & { email?: string }) {
    const router = useRouter();
    const { resetPassword, isLoading, error, clearError } = useUserStore();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();
    
    // Get email from prop, URL search params, or localStorage
    const [email] = useState<string>(() => {
        if (emailProp) return emailProp;
        if (typeof window !== 'undefined') {
            // Try to get from URL search params
            const params = new URLSearchParams(window.location.search);
            const emailFromUrl = params.get('email');
            if (emailFromUrl) return emailFromUrl;
            // Fallback to localStorage
            const emailFromStorage = localStorage.getItem('resetPasswordEmail');
            if (emailFromStorage) return emailFromStorage;
        }
        return '';
    });
    
    const RESEND_OTP_SECONDS = 180; // 3 minutes
    const [timer, setTimer] = useState(RESEND_OTP_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const [formData, setFormData] = useState<ResetFormData>({
        otp: "",
        password: "",
        confirmPassword: "",
    });

    const [validationErrors, setValidationErrors] = useState<{
        [K in keyof ResetFormData]?: string;
    }>({});

    // Timer effect
    useEffect(() => {
        if (timer > 0) {
            setCanResend(false);
            intervalRef.current = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timer]);

    useEffect(() => {
        if (timer === 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, [timer]);

    // Handle errors silently - logged to console but show user-friendly toast
    useEffect(() => {
        if (error) {
            console.error('Password reset error:', error);
        }
    }, [error]);

    const validateForm = (): boolean => {
        const errors: { [K in keyof ResetFormData]?: string } = {};

        // OTP validation
        if (!formData.otp.trim()) {
            errors.otp = "OTP is required";
        } else if (formData.otp.trim().length !== 6 || !/^\d+$/.test(formData.otp)) {
            errors.otp = "Please enter a valid 6-digit OTP";
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
        
        // Log validation errors for debugging
        if (Object.keys(errors).length > 0) {
            console.error('Form validation errors:', errors);
        }

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            const firstError = Object.values(validationErrors)[0];
            if (firstError) {
                showError(firstError);
            }
            return;
        }

        try {
            // Ensure we have an email
            const emailToUse = email || (typeof window !== 'undefined' ? localStorage.getItem('resetPasswordEmail') : null) || '';
            
            if (!emailToUse) {
                showError('Email is required. Please go back to forgot password page.');
                return;
            }
            
            await resetPassword(emailToUse, formData.otp, formData.password);
            
            // Clear stored email on success
            if (typeof window !== 'undefined') {
                localStorage.removeItem('resetPasswordEmail');
            }
            
            showSuccess('Password reset successfully!');
            setTimeout(() => {
                router.push("/login");
            }, 1000);
        } catch (error) {
            console.error("Password reset failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please check your OTP and try again.';
            
            // Check if it's a "user not found" error - this shouldn't happen if email is correct
            // but handle it gracefully
            if (errorMessage.toLowerCase().includes('user not found')) {
                showError('Invalid email or OTP. Please check your email and OTP, or request a new OTP.');
            } else {
                showError(errorMessage);
            }
        }
    };

    const handleInputChange = (field: keyof ResetFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // Clear store error when user starts typing
        if (error) {
            clearError();
        }
    };

    const handleResend = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!canResend) return;

        try {
            // You'll need to store the email from forgot password step
            // For now, we'll show a message to go back to forgot password
            showError('Please go back to forgot password page to request a new OTP');
            
            setTimer(RESEND_OTP_SECONDS);
            setCanResend(false);
        } catch (error) {
            console.error("Resend OTP failed:", error);
            showError('Failed to resend OTP. Please try again.');
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter the OTP sent to your email and your new password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="otp">OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={handleInputChange("otp")}
                                        disabled={isLoading}
                                        className={validationErrors.otp ? "border-red-500" : ""}
                                        maxLength={6}
                                        required
                                    />
                                    {validationErrors.otp && (
                                        <p className="text-sm text-red-500">{validationErrors.otp}</p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="password">New Password</Label>
                                    <PasswordInput
                                        id="password"
                                        placeholder="Enter your new password"
                                        value={formData.password}
                                        onChange={handleInputChange("password")}
                                        disabled={isLoading}
                                        className={validationErrors.password ? "border-red-500" : ""}
                                        required
                                    />
                                    {validationErrors.password && (
                                        <p className="text-sm text-red-500">{validationErrors.password}</p>
                                    )}
                                    <PasswordStrengthIndicator password={formData.password} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        placeholder="Confirm your new password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange("confirmPassword")}
                                        disabled={isLoading}
                                        className={validationErrors.confirmPassword ? "border-red-500" : ""}
                                        required
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Resetting Password..." : "Reset Password"}
                                </Button>
                            </div>
                            <div className="text-center text-sm flex flex-col items-center gap-1">
                                <span className="flex flex-row items-center gap-1">
                                    Don&apos;t have an OTP?
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto underline underline-offset-4"
                                        onClick={handleResend}
                                        disabled={!canResend || isLoading}
                                        tabIndex={0}
                                        type="button"
                                    >
                                        Resend OTP
                                    </Button>
                                </span>

                                <span className="text-muted-foreground">
                                    {canResend
                                        ? "You can now resend the OTP."
                                        : `Resend OTP in ${formatTime(timer)}`}
                                </span>
                            </div>
                            <div className="text-center text-sm">
                                Remember your password?{" "}
                                <Link href="/login" className="underline underline-offset-4">
                                    Sign in
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
    )
}
