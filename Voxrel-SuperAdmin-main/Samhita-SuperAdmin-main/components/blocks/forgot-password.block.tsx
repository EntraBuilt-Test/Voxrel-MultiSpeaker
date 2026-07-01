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
import { AUTH_CONSTANTS, AUTH_INITIAL_STATES, AUTH_VALIDATION_RULES, ForgotPasswordFormData } from "@/constants/auth.constants";
import { useFormState, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils.lib";
import { useUserStore } from "@/stores";



export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const { forgotPassword, isLoading, clearError } = useUserStore();

    // New hooks for better state management
    const { notifications, showSuccess, showError, dismiss } = useNotifications();

    const forgotPasswordForm = useFormState<ForgotPasswordFormData>(
        AUTH_INITIAL_STATES.forgotPassword,
        {
            email: AUTH_VALIDATION_RULES.email,
        }
    );

    // Handle forgot password submission
    const handleForgotPassword = async (formData: ForgotPasswordFormData) => {
        try {
            clearError();
            const result = await forgotPassword(formData.email);

            // Store email and OTP in localStorage for the next step (OTP verification)
            if (typeof window !== 'undefined') {
                localStorage.setItem('resetPasswordEmail', formData.email);
                // Store OTP for development mode - will be shown on verify page
                if (result.otp) {
                    localStorage.setItem('resetPasswordOTP', result.otp);
                    localStorage.setItem('resetPasswordOTPTime', Date.now().toString());
                }
            }

            // Show success message
            if (result.otp) {
                showSuccess(`${AUTH_CONSTANTS.MESSAGES.FORGOT_PASSWORD_SUCCESS} You'll see your OTP on the next page.`);
            } else {
                showSuccess(AUTH_CONSTANTS.MESSAGES.FORGOT_PASSWORD_SUCCESS);
            }

            // Redirect to verify OTP page
            setTimeout(() => {
                router.push('/verify-otp');
            }, 1000);

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
                    <div className="flex justify-center mb-4">
                        <Image src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" width={64} height={64} className="object-contain" />
                    </div>
                    <CardTitle className="text-xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you an OTP to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@kreactive.com"
                                        value={forgotPasswordForm.values.email}
                                        onChange={forgotPasswordForm.handleChange('email')}
                                        disabled={isLoading}
                                    />
                                    {forgotPasswordForm.errors.email && (
                                        <p className="text-sm text-red-600">{forgotPasswordForm.errors.email}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !forgotPasswordForm.isValid}
                                >
                                    {isLoading ? "Sending OTP..." : "Send Reset OTP"}
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Remember your password?{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    Back to Login
                                </a>
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
