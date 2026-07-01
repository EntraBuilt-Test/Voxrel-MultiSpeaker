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
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores";

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const { forgotPassword, isLoading, error, clearError } = useUserStore();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();

    const [email, setEmail] = useState("");

    // Handle errors silently - logged to console but show user-friendly toast
    useEffect(() => {
        if (error) {
            console.error('Forgot password error:', error);
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            showError('Please enter your email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        try {
            await forgotPassword(email);

            // Store email in localStorage as backup
            if (typeof window !== 'undefined') {
                localStorage.setItem('resetPasswordEmail', email);
            }

            showSuccess('Reset instructions sent to your email');
            setTimeout(() => {
                router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
            }, 1000);
        } catch (error) {
            console.error("Forgot password failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reset instructions. Please try again.';
            showError(errorMessage);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);

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
                    <CardTitle className="text-xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you a OTP to reset your password.
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
                                        value={email}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Sending..." : "Send Reset Instructions"}
                                </Button>
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
