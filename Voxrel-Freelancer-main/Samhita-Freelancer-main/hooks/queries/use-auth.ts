import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user.service";
import { LoginCredentials, RegisterData } from "@/types";
import { toast } from "sonner";

// Query Keys
export const authKeys = {
    all: ["auth"] as const,
    currentUser: () => [...authKeys.all, "currentUser"] as const,
    users: () => [...authKeys.all, "users"] as const,
    user: (id: string) => [...authKeys.all, "user", id] as const,
};

// Get current user
export function useCurrentUser() {
    return useQuery({
        queryKey: authKeys.currentUser(),
        queryFn: () => userService.getCurrentUser(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Get all users (admin only) - TODO: Implement getAllUsers method in UserService
// export function useUsers(page = 1, limit = 10) {
//     return useQuery({
//         queryKey: [...authKeys.users(), { page, limit }],
//         queryFn: () => userService.getAllUsers(page, limit),
//     });
// }

// Get user by ID - TODO: Implement getUserById method in UserService
// export function useUser(id: string) {
//     return useQuery({
//         queryKey: authKeys.user(id),
//         queryFn: () => userService.getUserById(id),
//         enabled: !!id,
//     });
// }

// Login mutation
export function useLogin() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
        onSuccess: (data) => {
            // Tokens are already stored by userService.login()
            // Set user data in cache
            queryClient.setQueryData(authKeys.currentUser(), data.user);
            toast.success("Login successful!");
            router.push("/projects/manage");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Login failed");
        },
    });
}

// Register mutation
export function useRegister() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: RegisterData) => userService.register(userData),
        onSuccess: (data) => {
            // Tokens are already stored by userService.register()
            // Set user data in cache
            queryClient.setQueryData(authKeys.currentUser(), data.user);
            toast.success("Registration successful!");
            router.push("/projects/manage");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Registration failed");
        },
    });
}

// Logout mutation
export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userService.logout(),
        onSuccess: () => {
            // Tokens are already cleared by userService.logout()
            // Clear all queries
            queryClient.clear();
            toast.success("Logged out successfully!");
            router.push("/login");
        },
        onError: (error: Error) => {
            // Still clear local data even if API call fails
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
            }
            queryClient.clear();
            toast.error(error.message || "Logout failed");
            router.push("/login");
        },
    });
}

// Update profile mutation
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<any>) => userService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
            toast.success("Profile updated successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update profile");
        },
    });
}

// Change password mutation
export function useChangePassword() {
    return useMutation({
        mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
            userService.changePassword(oldPassword, newPassword),
        onSuccess: () => {
            toast.success("Password changed successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to change password");
        },
    });
}

// Forgot password mutation
export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => userService.forgotPassword(email),
        onSuccess: () => {
            toast.success("Password reset email sent!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to send reset email");
        },
    });
}

// Reset password mutation
export function useResetPassword() {
    const router = useRouter();

    return useMutation({
        mutationFn: ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }) =>
            userService.resetPassword(email, otp, newPassword),
        onSuccess: () => {
            toast.success("Password reset successful!");
            router.push("/login");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to reset password");
        },
    });
}

// Verify email mutation
export function useVerifyEmail() {
    const router = useRouter();

    return useMutation({
        mutationFn: (token: string) => userService.verifyEmail(token),
        onSuccess: () => {
            toast.success("Email verified successfully!");
            router.push("/login");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Email verification failed");
        },
    });
}
