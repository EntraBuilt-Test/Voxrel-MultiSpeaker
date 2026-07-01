'use client';

import { Save, RefreshCw } from 'lucide-react';
import React from 'react';

import { NotificationToast } from '@/components/shared';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { Separator } from '@/components/ui/separator.ui';
import { Switch } from '@/components/ui/switch.ui';
import { REGISTRATION_MODE_OPTIONS } from '@/constants/settings.constants';
import { useApplicationSettings } from '@/mixins/settings';

export default function ApplicationSettingPage() {
    const {
        // Form state
        applicationForm,

        // Loading state
        isLoading,

        // System status
        systemStatus,

        // Notifications
        notifications,
        dismiss,

        // Utility functions
        formatStorageUsage,
        formatAverageFileSize,
        getStatusColor,
        getRegistrationDescription,

        // Event handlers
        handleSaveSettings,
        handleRefreshStorage,
    } = useApplicationSettings();

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {/* Settings Card */}
            <div className="flex-1 min-h-[calc(100vh-14rem)]">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-4 space-y-4 h-full overflow-y-auto flex flex-col">
                        <form onSubmit={applicationForm.handleSubmit(handleSaveSettings)} className="space-y-4 flex-1 flex flex-col">
                            {/* Task Management Settings */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold">Task Management</h3>
                                </div>

                                {/* Max Tasks per User */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Maximum Tasks per User *</Label>
                                        <p className="text-xs text-muted-foreground">
                                            How many tasks a user can claim simultaneously
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={applicationForm.values.maxTasksPerUser}
                                                onChange={applicationForm.handleChange('maxTasksPerUser')}
                                                className="w-20"
                                                disabled={isLoading}
                                            />
                                            <span className="text-sm text-muted-foreground">tasks</span>
                                        </div>
                                        {applicationForm.errors.maxTasksPerUser && (
                                            <p className="text-xs text-red-600">{applicationForm.errors.maxTasksPerUser}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Auto Assignment */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Auto Assignment for Peer Review</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically assign tasks to qualified reviewers
                                        </p>
                                    </div>
                                    <Switch
                                        checked={applicationForm.values.autoAssignmentEnabled}
                                        onCheckedChange={(checked) => applicationForm.setValue('autoAssignmentEnabled', checked)}
                                        disabled={true}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* User Management Settings */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold">User Management</h3>
                                </div>

                                {/* Registration Mode */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Registration Mode *</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {getRegistrationDescription(applicationForm.values.registrationMode)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Select
                                            value={applicationForm.values.registrationMode}
                                            onValueChange={applicationForm.handleSelectChange('registrationMode')}
                                            disabled={true}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {REGISTRATION_MODE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {applicationForm.errors.registrationMode && (
                                            <p className="text-xs text-red-600 w-[200px]">{applicationForm.errors.registrationMode}</p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <Separator />

                            {/* System Status (Read-only) */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold">System Status</h3>
                                    <p className="text-sm text-muted-foreground">Real-time system health monitoring</p>
                                </div>

                                {/* Frontend Status */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Frontend Service</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Response time: {systemStatus.frontend.responseTime}ms
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${systemStatus.frontend.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-sm font-medium ${getStatusColor(systemStatus.frontend.online)}`}>
                                            {systemStatus.frontend.online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                {/* Backend Status */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Backend Service</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Response time: {systemStatus.backend.responseTime}ms
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${systemStatus.backend.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-sm font-medium ${getStatusColor(systemStatus.backend.online)}`}>
                                            {systemStatus.backend.online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Storage Information (Read-only) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Storage Usage</h3>
                                        <p className="text-sm text-muted-foreground">Current storage utilization</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefreshStorage}
                                        disabled={isLoading}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>

                                {/* Storage Usage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">Storage Used</Label>
                                        <div className="text-2xl font-bold">
                                            {systemStatus.storage.isLoading ? (
                                                <span className="text-gray-400">Loading...</span>
                                            ) : systemStatus.storage.hasData ? (
                                                formatStorageUsage().usedDisplay
                                            ) : (
                                                <span className="text-gray-400">No data</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {systemStatus.storage.isLoading ? (
                                                "Fetching storage data..."
                                            ) : systemStatus.storage.hasData ? (
                                                `of ${formatStorageUsage().totalDisplay} total (${formatStorageUsage().percentage}%)`
                                            ) : (
                                                "Click refresh to load data"
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">Total Files</Label>
                                        <div className="text-2xl font-bold">
                                            {systemStatus.storage.isLoading ? (
                                                <span className="text-gray-400">Loading...</span>
                                            ) : systemStatus.storage.hasData ? (
                                                systemStatus.storage.files.toLocaleString()
                                            ) : (
                                                <span className="text-gray-400">No data</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {systemStatus.storage.isLoading ? "Fetching file count..." : "audio files"}
                                        </p>
                                    </div>
                                </div>

                                {/* Storage Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                    {systemStatus.storage.isLoading ? (
                                        <div className="bg-gray-400 h-2.5 rounded-full animate-pulse"></div>
                                    ) : systemStatus.storage.hasData ? (
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: formatStorageUsage().visualPercentage }}
                                        ></div>
                                    ) : (
                                        <div className="bg-gray-300 h-2.5 rounded-full"></div>
                                    )}
                                </div>

                                {/* Additional Storage Metrics */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Avg File Size</div>
                                        <div className="text-sm font-bold">
                                            {systemStatus.storage.averageFileSizeMB > 0
                                                ? formatAverageFileSize(systemStatus.storage.averageFileSizeMB)
                                                : '0MB'
                                            }
                                        </div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Efficiency</div>
                                        <div className="text-sm font-bold text-green-600">
                                            {systemStatus.storage.files > 0 ? 'Good' : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Updated</div>
                                        <div className="text-sm font-bold">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Save Button - Pushed to bottom */}
                            <div className="flex items-center justify-between pt-6 mt-auto">
                                <p className="text-sm text-muted-foreground">
                                    Changes will affect all users and take effect immediately
                                </p>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !applicationForm.isValid}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {isLoading ? 'Saving...' : 'Save Settings'}
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