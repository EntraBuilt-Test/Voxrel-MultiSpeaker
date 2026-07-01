"use client";

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
import { AUTH_CONSTANTS, AUTH_INITIAL_STATES, AUTH_VALIDATION_RULES, RegisterFormData } from "@/constants/auth.constants";
import { useFormState, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils.lib";
import { useUserStore } from "@/stores";

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const { register, isLoading, clearError } = useUserStore();
    const { notifications, showSuccess, showError, dismiss } = useNotifications();

    const signupForm = useFormState<RegisterFormData>(
        AUTH_INITIAL_STATES.register,
        {
            name: AUTH_VALIDATION_RULES.name,
            email: AUTH_VALIDATION_RULES.email,
            password: AUTH_VALIDATION_RULES.password,
            confirmPassword: AUTH_VALIDATION_RULES.confirmPassword,
        }
    );

    const handleSignup = async (formData: RegisterFormData) => {
        try {
            clearError();
            console.log('SignupForm: Starting registration for:', formData.email);

            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            }); // Store action handles the API call

            console.log('SignupForm: Registration successful');
            showSuccess(AUTH_CONSTANTS.MESSAGES.REGISTER_SUCCESS);

            // Redirect to login after successful registration
            // Admin accounts need superadmin approval before they can log in
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 2000);

        } catch (authError: unknown) {
            console.error('SignupForm: Registration error:', authError);

            let errorMessage = 'Registration failed';

            if (authError instanceof Error) {
                errorMessage = authError.message;

                // Provide more user-friendly error messages
                if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch') || errorMessage.includes('Unable to connect')) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the backend server is running.';
                } else if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
                    errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
                } else if (errorMessage.includes('400') || errorMessage.includes('validation')) {
                    errorMessage = 'Invalid registration data. Please check your information and try again.';
                } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                    errorMessage = 'Server error occurred. Please try again later or contact support.';
                }
            }

            showError(errorMessage);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/kreativs-ai-logo.jpg" alt="KreativS AI Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <CardTitle className="text-xl">Create an Account</CardTitle>
                    <CardDescription>
                        Enter your details to create an admin account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)}>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={signupForm.values.name}
                                        onChange={signupForm.handleChange('name')}
                                        disabled={isLoading}
                                    />
                                    {signupForm.errors.name && (
                                        <p className="text-sm text-red-600">{signupForm.errors.name}</p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@kreactive.com"
                                        value={signupForm.values.email}
                                        onChange={signupForm.handleChange('email')}
                                        disabled={isLoading}
                                    />
                                    {signupForm.errors.email && (
                                        <p className="text-sm text-red-600">{signupForm.errors.email}</p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={signupForm.values.password}
                                        onChange={signupForm.handleChange('password')}
                                        disabled={isLoading}
                                    />
                                    {signupForm.errors.password && (
                                        <p className="text-sm text-red-600">{signupForm.errors.password}</p>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={signupForm.values.confirmPassword}
                                        onChange={signupForm.handleChange('confirmPassword')}
                                        disabled={isLoading}
                                    />
                                    {signupForm.errors.confirmPassword && (
                                        <p className="text-sm text-red-600">{signupForm.errors.confirmPassword}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !signupForm.isValid}
                                >
                                    {isLoading ? "Creating account..." : "Sign Up"}
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Already have an account?{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    Log in
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}
