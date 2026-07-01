"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

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
import { AUTH_CONSTANTS, AUTH_INITIAL_STATES, AUTH_VALIDATION_RULES, VerifyOtpFormData } from "@/constants/auth.constants";
import { useFormState, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils.lib";
import { useUserStore } from "@/stores";



function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VerifyOTPForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const { resetPassword, forgotPassword, isLoading, clearError } = useUserStore();
    const [timer, setTimer] = useState(AUTH_CONSTANTS.OTP_RESEND_TIME);
    const [canResend, setCanResend] = useState(false);
    const [email, setEmail] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // New hooks for better state management
    const { notifications, showSuccess, showError, showInfo, dismiss } = useNotifications();

    const verifyOtpForm = useFormState<VerifyOtpFormData>(
        AUTH_INITIAL_STATES.verifyOtp,
        {
            otp: AUTH_VALIDATION_RULES.otp,
            newPassword: AUTH_VALIDATION_RULES.newPassword,
            confirmPassword: AUTH_VALIDATION_RULES.confirmPassword,
        }
    );

    // Get email and show OTP from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedEmail = localStorage.getItem('resetPasswordEmail');
            if (storedEmail) {
                setEmail(storedEmail);

                // Check for stored OTP (development mode)
                const storedOTP = localStorage.getItem('resetPasswordOTP');
                const otpTime = localStorage.getItem('resetPasswordOTPTime');

                if (storedOTP && otpTime) {
                    const timeDiff = Date.now() - parseInt(otpTime);
                    // Show OTP if it's less than 10 minutes old (600000 ms)
                    if (timeDiff < 600000) {
                        showInfo(`Development Mode - Your OTP: ${storedOTP} (Auto-filled from previous page)`, {
                            persistent: true,
                            timeout: 30000 // 30 seconds
                        });
                    } else {
                        // OTP expired, clean up
                        localStorage.removeItem('resetPasswordOTP');
                        localStorage.removeItem('resetPasswordOTPTime');
                    }
                }
            } else {
                // If no email found, redirect back to forgot password
                router.push('/forgot-password');
            }
        }
    }, [router, showInfo, showSuccess]);

    // Timer logic for OTP resend
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

    // Handle password reset submission
    const handleVerifyOtp = async (formData: VerifyOtpFormData) => {
        try {
            clearError();

            // Verify password confirmation
            if (formData.newPassword !== formData.confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            await resetPassword(email, formData.otp, formData.newPassword);

            showSuccess(AUTH_CONSTANTS.MESSAGES.RESET_PASSWORD_SUCCESS);

            // Clear the stored email and OTP data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('resetPasswordEmail');
                localStorage.removeItem('resetPasswordOTP');
                localStorage.removeItem('resetPasswordOTPTime');
            }

            // Redirect to login page
            setTimeout(() => {
                router.push('/login');
            }, 1000);

        } catch (authError: unknown) {
            const errorMessage = authError instanceof Error
                ? authError.message
                : AUTH_CONSTANTS.MESSAGES.RESET_PASSWORD_ERROR;
            showError(errorMessage);
        }
    };

    const handleResend = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!canResend || !email) return;

        try {
            clearError();
            const result = await forgotPassword(email);

            setTimer(AUTH_CONSTANTS.OTP_RESEND_TIME);
            setCanResend(false);

            // In development mode, show OTP in toast and store it
            if (result.otp) {
                // Update localStorage with new OTP
                if (typeof window !== 'undefined') {
                    localStorage.setItem('resetPasswordOTP', result.otp);
                    localStorage.setItem('resetPasswordOTPTime', Date.now().toString());
                }

                showInfo(`Development Mode - New OTP: ${result.otp} (Resent)`, {
                    persistent: true,
                    timeout: 30000 // 30 seconds
                });
            } else {
                showInfo(AUTH_CONSTANTS.MESSAGES.OTP_RESENT);
            }

        } catch (authError: unknown) {
            const errorMessage = authError instanceof Error
                ? authError.message
                : AUTH_CONSTANTS.MESSAGES.FORGOT_PASSWORD_ERROR;
            showError(errorMessage);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter the OTP sent to <strong>{email}</strong> and your new password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={verifyOtpForm.handleSubmit(handleVerifyOtp)}>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="otp">OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={verifyOtpForm.values.otp}
                                        onChange={verifyOtpForm.handleChange('otp')}
                                        disabled={isLoading}
                                        maxLength={6}
                                    />
                                    {verifyOtpForm.errors.otp && (
                                        <p className="text-sm text-red-600">{verifyOtpForm.errors.otp}</p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={verifyOtpForm.values.newPassword}
                                        onChange={verifyOtpForm.handleChange('newPassword')}
                                        disabled={isLoading}
                                    />
                                    {verifyOtpForm.errors.newPassword && (
                                        <p className="text-sm text-red-600">{verifyOtpForm.errors.newPassword}</p>
                                    )}
                                    {!verifyOtpForm.errors.newPassword && verifyOtpForm.values.newPassword && (
                                        <p className="text-sm text-muted-foreground">
                                            Password must be at least 8 characters long
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={verifyOtpForm.values.confirmPassword}
                                        onChange={verifyOtpForm.handleChange('confirmPassword')}
                                        disabled={isLoading}
                                    />
                                    {verifyOtpForm.errors.confirmPassword && (
                                        <p className="text-sm text-red-600">{verifyOtpForm.errors.confirmPassword}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !verifyOtpForm.isValid}
                                >
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
