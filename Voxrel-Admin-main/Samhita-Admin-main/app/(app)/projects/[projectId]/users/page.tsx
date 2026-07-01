"use client";

import { ArrowLeft, Loader2, MoreHorizontal, UserX, Check, X, Users, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar.ui";
import { Badge } from "@/components/ui/badge.ui";
import { Button } from "@/components/ui/button.ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.ui";
import { Input } from "@/components/ui/input.ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.ui";
import { projectService } from "@/services/project.service";
import { userService } from "@/services/user.service";
import { useProjectStore } from "@/stores";

interface ProjectUser {
    id: string;
    _id?: string;
    name: string;
    email: string;
    status: string;
    role: string;
    joinedAt?: string;
    tasksCompleted?: number;
    totalRevenue?: number;
    stats?: {
        totalTasksCompleted: number;
        totalRevenueEarned: number;
    };
}

export default function ProjectUsersPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;
    const { selectedProject } = useProjectStore();

    const [activeTab, setActiveTab] = useState("active");
    const [users, setUsers] = useState<ProjectUser[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Assign Freelancer Dialog State
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [isFreelancersLoading, setIsFreelancersLoading] = useState(false);
    const [freelancerSearchQuery, setFreelancerSearchQuery] = useState("");
    const [freelancerPage] = useState(1);
    const [freelancerPagination, setFreelancerPagination] = useState({
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false,
    });

    // Fetch active users (paginated)
    const fetchProjectUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await projectService.getProjectUsers(projectId, currentPage, 20, {
                search: searchQuery,
            });

            if (response.success && response.data) {
                setUsers(response.data.users.map((u: any) => ({
                    ...u,
                    id: u._id || u.id,
                })));
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch project users:", error);
            if (error instanceof Error && !error.message.includes("404")) {
                toast.error("Failed to load project users");
            }
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentPage, searchQuery]);

    // Fetch pending requests (via project details)
    const fetchPendingRequests = useCallback(async () => {
        setIsRequestsLoading(true);
        try {
            const response = await projectService.getProject(projectId);
            if (response.success && response.data) {
                setPendingRequests(response.data.joinRequests || []);
            }
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (activeTab === "active") {
            fetchProjectUsers();
        } else if (activeTab === "pending" || activeTab === "analytics") {
            fetchPendingRequests(); // Analytics might use requests length too
            // For analytics we might want to fetch stats, but currently we rely on loaded data or basic fetch
            if (activeTab === "analytics") {
                // Refresh users for analytics data if needed (e.g. filter by top performers)
                fetchProjectUsers();
            }
        }
    }, [fetchProjectUsers, fetchPendingRequests, activeTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProjectUsers();
    };

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            await projectService.approveJoinRequest(projectId, userId);
            toast.success("Request approved");
            fetchPendingRequests();
            // Optionally refresh users if we switch tabs
        } catch {
            toast.error("Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string) => {
        setActionLoading(userId);
        try {
            await projectService.rejectJoinRequest(projectId, userId);
            toast.success("Request rejected");
            fetchPendingRequests();
        } catch {
            toast.error("Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveUser = async (_userId: string) => {
        if (!confirm("Are you sure you want to remove this user from the project?")) return;

        // Assuming removeUserFromProject exists or we use a generic remove
        // Not implemented in service yet? specific 'removeUserFromProject' endpoint exists in backend controller
        // projectService.removeUserFromProject?
        // Let's assume it's not exposed in service wrapper yet, but endpoint exists. 
        // For now, disabling action or handle with TODO.
        toast.info("Remove user functionality coming soon");
    };

    // Fetch freelancers for assignment
    const fetchFreelancers = useCallback(async () => {
        setIsFreelancersLoading(true);
        try {
            const response = await userService.getAllUsers(freelancerPage, 200, {
                search: freelancerSearchQuery,
                status: 'ACTIVE',
                role: 'FREELANCER',
            });

            if (response.success && response.data) {
                setFreelancers(response.data.users);
                setFreelancerPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch freelancers:", error);
            toast.error("Failed to load freelancers");
        } finally {
            setIsFreelancersLoading(false);
        }
    }, [freelancerPage, freelancerSearchQuery]);

    // Assign freelancer to project
    const handleAssignFreelancer = async (userId: string) => {
        setActionLoading(userId);
        try {
            await projectService.addUserToProject(projectId, userId);
            toast.success("Freelancer assigned to project successfully");
            setIsAssignDialogOpen(false);
            fetchProjectUsers(); // Refresh the users list
        } catch (error: any) {
            console.error("Failed to assign freelancer:", error);
            toast.error(error?.message || "Failed to assign freelancer");
        } finally {
            setActionLoading(null);
        }
    };

    // Fetch freelancers when dialog opens
    useEffect(() => {
        if (isAssignDialogOpen) {
            fetchFreelancers();
        }
    }, [isAssignDialogOpen, fetchFreelancers]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE": return "default";
            case "PENDING":
            case "PENDING_VERIFICATION": return "secondary";
            case "BANNED":
            case "REJECTED": return "destructive";
            default: return "outline";
        }
    };


    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{selectedProject?.name || "Project Details"}</h1>
                        <p className="text-muted-foreground">Manage users and track project progress</p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="active" className="relative">
                            Active Members
                            {pagination.totalUsers > 0 && (
                                <Badge variant="secondary" className="ml-2 px-1 py-0 min-w-[20px] justify-center">
                                    {pagination.totalUsers}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="relative">
                            Requests
                            {pendingRequests.length > 0 && (
                                <Badge variant="destructive" className="ml-2 px-1 py-0 min-w-[20px] justify-center">
                                    {pendingRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Members</CardTitle>
                            <CardDescription>View and manage all users currently assigned to this project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <form onSubmit={handleSearch} className="flex-1 flex gap-4">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="max-w-md"
                                    />
                                    <Button type="submit">Search</Button>
                                </form>
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
                                                                    onClick={() => handleAssignFreelancer(freelancer.id || freelancer._id)}
                                                                    disabled={actionLoading === (freelancer.id || freelancer._id)}
                                                                >
                                                                    {actionLoading === (freelancer.id || freelancer._id) ? (
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
                                                    Showing {freelancers.length} of {freelancerPagination.totalUsers} freelancers
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No users found for this project.</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">User</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold">Role</th>
                                                <th className="px-6 py-4 font-semibold text-center">Tasks</th>
                                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-foreground">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={getStatusBadge(user.status)}>{user.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 capitalize">{user.role.toLowerCase()}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {user.stats?.totalTasksCompleted || user.tasksCompleted || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveUser(user.id)}>
                                                                    <UserX className="mr-2 h-4 w-4" /> Remove User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Pagination would go here */}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Join Requests</CardTitle>
                            <CardDescription>Review and manage requests from freelancers to join this project.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isRequestsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                                    <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                                    <p>No pending requests.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {pendingRequests.map((user: any) => (
                                        <div key={user._id || user.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-lg">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleApprove(user._id || user.id)}
                                                    disabled={actionLoading === (user._id || user.id)}
                                                >
                                                    {actionLoading === (user._id || user.id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" /> Approve
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(user._id || user.id)}
                                                    disabled={actionLoading === (user._id || user.id)}
                                                >
                                                    {actionLoading === (user._id || user.id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
