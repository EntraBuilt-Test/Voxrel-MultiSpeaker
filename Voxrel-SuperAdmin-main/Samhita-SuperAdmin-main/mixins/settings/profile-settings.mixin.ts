import { useState, useCallback } from 'react';
import { useFormState, useNotifications } from '@/hooks';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import {
    PROFILE_INITIAL_STATE,
    PROFILE_VALIDATION_RULES,
    SETTINGS_MESSAGES,
} from '@/constants/settings.constants';

export interface ProfileSettingsState {
    // Form state
    profileForm: ReturnType<typeof useFormState<typeof PROFILE_INITIAL_STATE>>;
    
    // Loading state
    isLoading: boolean;
    
    // Notifications
    notifications: any[];
    dismiss: (id: string) => void;
    
    // Event handlers
    handleSaveProfile: (formData: typeof PROFILE_INITIAL_STATE) => Promise<void>;
}

export const useProfileSettings = (): ProfileSettingsState => {
    const { notifications, showSuccess, showError, dismiss } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    const profileForm = useFormState(
        PROFILE_INITIAL_STATE,
        PROFILE_VALIDATION_RULES
    );

    // Handle form submission
    const handleSaveProfile = useCallback(async (formData: typeof PROFILE_INITIAL_STATE) => {
        setIsLoading(true);

        try {
            // Check if password change is requested
            const hasPasswordChange = formData.currentPassword && formData.newPassword && formData.confirmPassword;
            
            if (hasPasswordChange) {
                // Validate password confirmation
                if (formData.newPassword !== formData.confirmPassword) {
                    showError('New password and confirm password do not match');
                    return;
                }

                // Validate password strength
                if (formData.newPassword.length < 6) {
                    showError('New password must be at least 6 characters long');
                    return;
                }

                // Verify user is authenticated before attempting password change
                try {
                    const currentUser = await userService.getCurrentUser();
                } catch (authError) {
                    console.error('Authentication verification failed:', authError);
                    showError('You must be logged in to change your password. Please log in again.');
                    return;
                }

                // Call change password API
                const result = await authService.changePassword({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                });
            }

            // Reset password fields after successful save
            profileForm.setValue('currentPassword', '');
            profileForm.setValue('newPassword', '');
            profileForm.setValue('confirmPassword', '');

            showSuccess(hasPasswordChange ? 'Password changed successfully!' : SETTINGS_MESSAGES.PROFILE_SAVED);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || SETTINGS_MESSAGES.SAVE_ERROR;
            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [profileForm, showSuccess, showError]);

    return {
        // Form state
        profileForm,
        
        // Loading state
        isLoading,
        
        // Notifications
        notifications,
        dismiss,
        
        // Event handlers
        handleSaveProfile,
    };
};
