'use client';

import { Save } from 'lucide-react';
import React from 'react';


import { NotificationToast } from '@/components/shared';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Separator } from '@/components/ui/separator.ui';
import { useProfileSettings } from '@/mixins/settings';

export default function ProfileSettingPage() {
    const {
        // Form state
        profileForm,
        
        // Loading state
        isLoading,
        
        // Notifications
        notifications,
        dismiss,
        
        // Event handlers
        handleSaveProfile,
    } = useProfileSettings();

    return (
        <div className="flex flex-col px-3 py-4">
            <div className="max-w-4xl mx-auto w-full">
                <Card className="bg-white dark:bg-card border shadow-sm">
                    <CardContent className="p-4 space-y-6">
                        <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-6">

                            {/* Password Change Settings */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-base font-medium">Change Password</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave password fields empty if you don&apos;t want to change your password
                                    </p>
                                </div>

                                {/* Current Password */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Current Password</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enter your current password to verify changes
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            type="password"
                                            value={profileForm.values.currentPassword}
                                            onChange={profileForm.handleChange('currentPassword')}
                                            className="w-[300px]"
                                            placeholder="Enter current password"
                                            disabled={isLoading}
                                        />
                                        {profileForm.errors.currentPassword && (
                                            <p className="text-xs text-red-600 w-[300px]">{profileForm.errors.currentPassword}</p>
                                        )}
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">New Password</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Choose a new password (minimum 6 characters)
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            type="password"
                                            value={profileForm.values.newPassword}
                                            onChange={profileForm.handleChange('newPassword')}
                                            className="w-[300px]"
                                            placeholder="Enter new password"
                                            disabled={isLoading}
                                        />
                                        {profileForm.errors.newPassword && (
                                            <p className="text-xs text-red-600 w-[300px]">{profileForm.errors.newPassword}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Confirm Password</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Re-enter your new password to confirm
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            type="password"
                                            value={profileForm.values.confirmPassword}
                                            onChange={profileForm.handleChange('confirmPassword')}
                                            className="w-[300px]"
                                            placeholder="Confirm new password"
                                            disabled={isLoading}
                                        />
                                        {profileForm.errors.confirmPassword && (
                                            <p className="text-xs text-red-600 w-[300px]">{profileForm.errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Save Button */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Changes will be saved to your profile immediately
                                </p>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !profileForm.isValid}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {isLoading ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}