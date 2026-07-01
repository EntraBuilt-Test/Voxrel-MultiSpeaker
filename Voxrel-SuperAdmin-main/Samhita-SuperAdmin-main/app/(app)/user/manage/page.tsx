'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Eye, Trash2, ChevronLeft, ChevronRight, Check, X, Ban, UserCheck, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, Plus, EyeOff, Loader2, UserPlus, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

import { NotificationToast, FilterBar } from '@/components/shared';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog.ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.ui';
import { Badge } from '@/components/ui/badge.ui';
import { Button } from '@/components/ui/button.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.ui';
import { Input } from '@/components/ui/input.ui';
import { Label } from '@/components/ui/label.ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet.ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.ui';
import { CURRENCY_SYMBOL, USER_FILTERS } from '@/constants';
import { useCreateUser } from '@/hooks/mutations';
import { useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/mutations/project-mutations.hook';
import { useProject } from '@/hooks/queries/project-queries.hook';
import { queryKeys } from '@/lib/query-client.lib';
import { useUserManagement } from '@/mixins/user';
import { projectService } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { User } from '@/types';

export default function ManageUserPage() {
    const {
        // State
        searchQuery,
        filterValues,
        currentPage,

        // Modals
        viewModal,

        // Data
        users,
        pagination,
        isLoading,

        // Notifications
        notifications,
        dismiss,

        // Helper functions
        getVisiblePageNumbers,
        formatDate,
        getStatusBadgeVariant,
        getDisplayStatus,
        handleSort,
        getSortIcon,

        // Event handlers
        handleViewUser,
        handleUnbanUser,
        handleRejectUser,
        handleDeleteUser,
        handleApproveUser,
        handleBanUser,
        handleFilterChange,
        handleResetFilters,

        // Setters
        setCurrentPage,
        setSearchQuery,
    } = useUserManagement();

    // Add User Modal State
    const [showAddUserModal, setShowAddUserModal] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'FREELANCER' as 'ADMIN' | 'FREELANCER',
        status: 'ACTIVE' as 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED',
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

    // Password visibility states
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const createUserMutation = useCreateUser();

    // Project context
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { data: project } = useProject(projectId || '', { enabled: !!projectId });
    const approveRequestMutation = useApproveJoinRequest();
    const rejectRequestMutation = useRejectJoinRequest();
    const queryClient = useQueryClient();

    const handleApproveRequest = (userId: string) => {
        if (projectId) approveRequestMutation.mutate({ projectId, userId });
    };

    const handleRejectRequest = (userId: string) => {
        if (projectId) rejectRequestMutation.mutate({ projectId, userId });
    };

    // Assign Freelancer Dialog State
    const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
    const [freelancers, setFreelancers] = React.useState<User[]>([]);
    const [isFreelancersLoading, setIsFreelancersLoading] = React.useState(false);
    const [freelancerSearchQuery, setFreelancerSearchQuery] = React.useState("");
    const [assignActionLoading, setAssignActionLoading] = React.useState<string | null>(null);

    // Fetch freelancers for assignment
    const fetchFreelancers = React.useCallback(async () => {
        setIsFreelancersLoading(true);
        try {
            const response = await userService.getAllUsers(1, 200, {
                search: freelancerSearchQuery,
                status: 'ACTIVE',
                role: 'FREELANCER',
            });

            if (response.success && response.data) {
                setFreelancers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch freelancers:", error);
            toast.error("Failed to load freelancers");
        } finally {
            setIsFreelancersLoading(false);
        }
    }, [freelancerSearchQuery]);

    // Assign freelancer to project
    const handleAssignFreelancer = async (userId: string) => {
        if (!projectId) return;
        setAssignActionLoading(userId);
        try {
            await projectService.addUserToProject(projectId, userId);
            toast.success("Freelancer assigned to project successfully");
            setIsAssignDialogOpen(false);
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        } catch (error: unknown) {
            console.error("Failed to assign freelancer:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to assign freelancer";
            toast.error(errorMessage);
        } finally {
            setAssignActionLoading(null);
        }
    };

    // Fetch freelancers when dialog opens
    React.useEffect(() => {
        if (isAssignDialogOpen) {
            fetchFreelancers();
        }
    }, [isAssignDialogOpen, fetchFreelancers]);

    // Handle Add User
    const handleAddUser = async () => {
        // Reset errors
        setFormErrors({});

        // Validation
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        if (!formData.password) errors.password = 'Password is required';
        else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            await createUserMutation.mutateAsync({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                status: formData.status,
            });

            // Reset form and close modal
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'FREELANCER',
                status: 'ACTIVE',
            });
            setShowAddUserModal(false);
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };

    const handleCloseModal = () => {
        if (!createUserMutation.isPending) {
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'FREELANCER',
                status: 'ACTIVE',
            });
            setFormErrors({});
            setShowAddUserModal(false);
        }
    };


    const userListContent = (
        <div className="flex flex-col gap-3 h-full">
            {/* Add User Button Section */}
            <div className="flex justify-end gap-2">
                {projectId && (
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Freelancer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Assign Freelancer to Project</DialogTitle>
                                <DialogDescription>
                                    Select a freelancer to add to this project. You can search by name or email.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                                <Input
                                    placeholder="Search freelancers..."
                                    value={freelancerSearchQuery}
                                    onChange={(e) => setFreelancerSearchQuery(e.target.value)}
                                />
                                <div className="flex-1 overflow-y-auto border rounded-md">
                                    {isFreelancersLoading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : freelancers.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No freelancers found.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {freelancers.map((freelancer) => (
                                                <div
                                                    key={freelancer.id || freelancer._id}
                                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>{freelancer.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{freelancer.name}</p>
                                                            <p className="text-sm text-muted-foreground">{freelancer.email}</p>
                                                            {freelancer.stats && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {freelancer.stats.totalTasksCompleted || 0} tasks completed
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            const freelancerId = freelancer.id || freelancer._id;
                                                            if (freelancerId) {
                                                                handleAssignFreelancer(freelancerId);
                                                            }
                                                        }}
                                                        disabled={assignActionLoading === (freelancer.id || freelancer._id) || !(freelancer.id || freelancer._id)}
                                                    >
                                                        {assignActionLoading === (freelancer.id || freelancer._id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus className="h-4 w-4 mr-1" />
                                                                Assign
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {!isFreelancersLoading && freelancers.length > 0 && (
                                    <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                                        Showing {freelancers.length} freelancers
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                <Button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Filter Section */}
            <FilterBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                filters={USER_FILTERS}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                searchPlaceholder="Search users..."
                resetLabel="Reset all filters"
            />

            {/* Table Section */}
            <div className="flex-1 min-h-[calc(100vh-14rem)]">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-0 h-full flex flex-col">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">Loading users...</div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-muted-foreground">
                                    {searchQuery || filterValues.status !== 'all' || filterValues.role !== 'all'
                                        ? 'No users match your filters'
                                        : 'No users found'
                                    }
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 relative">
                                <div className="absolute inset-0 overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort('name')}
                                                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        Name
                                                        {getSortIcon('name') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                                            getSortIcon('name') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                                                    </Button>
                                                </th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[220px]">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort('email')}
                                                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        Email
                                                        {getSortIcon('email') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                                            getSortIcon('email') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                                                    </Button>
                                                </th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Role</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[180px]">Status</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Completed</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">In Progress</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Revenue</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[140px]">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSort('createdAt')}
                                                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        Join Date
                                                        {getSortIcon('createdAt') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                                            getSortIcon('createdAt') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                                                    </Button>
                                                </th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[80px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {users.map((user) => (
                                                <tr key={user._id || user.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium max-w-[200px] truncate">
                                                        {user.name}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {user.email}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant="outline">
                                                            {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={getStatusBadgeVariant(user.status)}>
                                                            {getDisplayStatus(user.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {user.stats?.totalTasksCompleted || user.tasksCompleted || 0}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {user.stats?.tasksInProgress || 0}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm font-medium">
                                                            {CURRENCY_SYMBOL}{(user.stats?.totalRevenueEarned || user.revenue || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="text-sm">
                                                            {user.createdAt ? formatDate(user.createdAt) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-48" align="end">
                                                                <div className="grid gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleViewUser(user)}
                                                                        className="justify-start h-8 px-2"
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                    </Button>

                                                                    {user.status === 'ACTIVE' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleBanUser(user._id || user.id)}
                                                                            className="justify-start h-8 px-2 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                                                        >
                                                                            <Ban className="mr-2 h-4 w-4" />
                                                                            Ban User
                                                                        </Button>
                                                                    )}

                                                                    {user.status === 'BANNED' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleUnbanUser(user._id || user.id)}
                                                                            className="justify-start h-8 px-2 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                                                                        >
                                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                                            Unban User
                                                                        </Button>
                                                                    )}

                                                                    {user.status === 'PENDING_VERIFICATION' && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleApproveUser(user._id || user.id)}
                                                                                className="justify-start h-8 px-2 text-green-600 hover:text-green-600 hover:bg-green-50"
                                                                            >
                                                                                <Check className="mr-2 h-4 w-4" />
                                                                                Approve
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleRejectUser(user._id || user.id)}
                                                                                className="justify-start h-8 px-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                                                                            >
                                                                                <X className="mr-2 h-4 w-4" />
                                                                                Reject
                                                                            </Button>
                                                                        </>
                                                                    )}

                                                                    {user.status !== 'PENDING_VERIFICATION' && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    Delete
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure you want to delete this user? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteUser(user._id || user.id)}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pagination Controls */}
            {pagination.totalUsers > 0 && (
                <div className="shrink-0">
                    <Card>
                        <CardContent className="px-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.totalUsers)} of {pagination.totalUsers} users
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newPage = Math.max(1, currentPage - 1);
                                            setCurrentPage(newPage);
                                        }}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {getVisiblePageNumbers().map((page) => (
                                            <Button
                                                key={page}
                                                variant={page === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                }}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newPage = Math.min(pagination.totalPages, currentPage + 1);
                                            setCurrentPage(newPage);
                                        }}
                                        disabled={currentPage === pagination.totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );

    const requestsContent = (
        <Card>
            <CardContent className="p-0">
                <table className="w-full caption-bottom text-sm">
                    <thead className="border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {project?.joinRequests?.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                    No pending join requests
                                </td>
                            </tr>
                        ) : (
                            project?.joinRequests?.map((request: User) => (
                                <tr key={request.id || request._id} className="transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{request.name}</td>
                                    <td className="p-4 align-middle">{request.email}</td>
                                    <td className="p-4 align-middle text-right gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 mr-2"
                                            onClick={() => handleApproveRequest(request.id || request._id || '')}
                                            disabled={approveRequestMutation.isPending}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRejectRequest(request.id || request._id || '')}
                                            disabled={rejectRequestMutation.isPending}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-h-screen flex flex-col px-4 gap-3">
            {projectId ? (
                <Tabs defaultValue="active" className="flex-1 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="active">Active Members</TabsTrigger>
                            <TabsTrigger value="requests">
                                Join Requests ({project?.joinRequests?.length || 0})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="flex-1 flex flex-col gap-3 h-full mt-0 data-[state=active]:flex">
                        {userListContent}
                    </TabsContent>

                    <TabsContent value="requests" className="flex-1 mt-0">
                        {requestsContent}
                    </TabsContent>
                </Tabs>
            ) : (
                userListContent
            )}

            {/* View User Sheet */}
            <Sheet open={viewModal.isOpen} onOpenChange={(open) => !open && viewModal.close()}>
                <SheetContent className="w-full sm:max-w-[600px]">
                    <SheetHeader>
                        <SheetTitle>{viewModal.selectedItem?.name}</SheetTitle>
                        <SheetDescription>
                            User details and information
                        </SheetDescription>
                    </SheetHeader>
                    {viewModal.selectedItem && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Email</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {viewModal.selectedItem.email}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Status</h4>
                                        <Badge variant={getStatusBadgeVariant(viewModal.selectedItem.status)}>
                                            {getDisplayStatus(viewModal.selectedItem.status)}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Phone</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {viewModal.selectedItem.phone || 'Not provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Join Date</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {viewModal.selectedItem.createdAt
                                                ? formatDate(viewModal.selectedItem.createdAt)
                                                : 'Not available'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Tasks Completed</h4>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {viewModal.selectedItem.stats?.totalTasksCompleted || viewModal.selectedItem.tasksCompleted || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Tasks In Progress</h4>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {viewModal.selectedItem.stats?.tasksInProgress || 0}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Total Revenue Earned</h4>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {CURRENCY_SYMBOL}{(viewModal.selectedItem.stats?.totalRevenueEarned || viewModal.selectedItem.revenue || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Add User Modal */}
            <Sheet open={showAddUserModal} onOpenChange={handleCloseModal}>
                <SheetContent className="w-full sm:max-w-[600px]">
                    <SheetHeader>
                        <SheetTitle>Add New User</SheetTitle>
                        <SheetDescription>
                            Create a new user account with the required information.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter user name"
                                disabled={createUserMutation.isPending}
                            />
                            {formErrors.name && (
                                <p className="text-sm text-red-600">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter user email"
                                disabled={createUserMutation.isPending}
                            />
                            {formErrors.email && (
                                <p className="text-sm text-red-600">{formErrors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password (min. 8 characters)"
                                    className="pr-10"
                                    disabled={createUserMutation.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formErrors.password && (
                                <p className="text-sm text-red-600">{formErrors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Re-enter password"
                                    className="pr-10"
                                    disabled={createUserMutation.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formErrors.confirmPassword && (
                                <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Role and Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value as 'ADMIN' | 'FREELANCER' })}
                                    disabled={createUserMutation.isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FREELANCER">Freelancer</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value as 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED' })}
                                    disabled={createUserMutation.isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                                        <SelectItem value="BANNED">Banned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseModal}
                                disabled={createUserMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddUser}
                                disabled={createUserMutation.isPending}
                            >
                                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Notification Toast */}
            <NotificationToast notifications={notifications} onDismiss={dismiss} />
        </div>
    );
}