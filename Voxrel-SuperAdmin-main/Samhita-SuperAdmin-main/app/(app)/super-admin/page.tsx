"use client";

// SUPER ADMIN EXTENSION: Super Admin Landing Page - Projects Table View
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  UserPlus,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { RoleGuard } from "@/components/auth/role.guard";
import { FilterBar, NotificationToast } from "@/components/shared";
import { Badge } from "@/components/ui/badge.ui";
import { Button } from "@/components/ui/button.ui";
import { Card, CardContent } from "@/components/ui/card.ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.ui";
import { Label } from "@/components/ui/label.ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.ui";
import { useNotifications } from "@/hooks";
import { projectService } from "@/services/project.service";
import { useProjectStore } from "@/stores";
import { Project, ProjectType, User } from "@/types";

const projectTypeLabels: Record<ProjectType, string> = {
  AUDIO_RECORDING: "Audio Recording",
  TRANSCRIPTION: "Transcription",
  REVIEW: "Review",
  IMAGE_ANNOTATION: "Image Annotation",
  VIDEO_ANNOTATION: "Video Annotation",
};

const PROJECT_FILTERS = [
  {
    key: 'status',
    type: 'select' as const,
    label: 'Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'ARCHIVED', label: 'Archived' },
      { value: 'COMPLETED', label: 'Completed' },
    ]
  },
  {
    key: 'type',
    type: 'select' as const,
    label: 'Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'AUDIO_RECORDING', label: 'Audio Recording' },
      { value: 'TRANSCRIPTION', label: 'Transcription' },
      { value: 'REVIEW', label: 'Review' },
      { value: 'IMAGE_ANNOTATION', label: 'Image Annotation' },
      { value: 'VIDEO_ANNOTATION', label: 'Video Annotation' },
    ]
  },
];

export default function SuperAdminLandingPage() {
  const router = useRouter();
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const { notifications, showError, dismiss } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    type: 'all',
  });
  const [sortField, setSortField] = useState<'name' | 'type' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<Project | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { showSuccess } = useNotifications();
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProjects().catch((err) => {
      showError(err.message || "Failed to load projects");
    });
  }, [fetchProjects, showError]);

  const loadAdmins = useCallback(async () => {
    try {
      const response = await projectService.getAdmins();
      // Handle different response structures
      const adminsList = response.data?.admins || response.data?.users || [];
      setAdmins(adminsList);
    } catch {
      showError("Failed to load admins");
    }
  }, [showError]);

  // Load admins when assign dialog opens
  useEffect(() => {
    if (showAssignDialog) {
      loadAdmins();
    }
  }, [showAssignDialog, loadAdmins]);

  const handleOpenAssignDialog = (project: Project) => {
    setSelectedProjectForAssign(project);
    setSelectedAdminId("");
    setShowAssignDialog(true);
  };

  const handleAssignAdmin = async () => {
    if (!selectedProjectForAssign || !selectedAdminId) {
      showError("Please select an admin");
      return;
    }

    setIsAssigning(true);
    try {
      await projectService.assignProjectToAdmin(selectedProjectForAssign.id || selectedProjectForAssign._id || "", selectedAdminId);
      showSuccess("Admin assigned to project successfully");
      setShowAssignDialog(false);
      // Refresh projects
      await fetchProjects();
    } catch {
      showError("Failed to assign admin to project");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter and sort projects
  const filteredProjects = projects.filter((project) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!project.name.toLowerCase().includes(query) &&
        !project.description?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Status filter
    if (filterValues.status !== 'all' && project.status !== filterValues.status) {
      return false;
    }

    // Type filter
    if (filterValues.type !== 'all' && project.type !== filterValues.type) {
      return false;
    }

    return true;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue: string | number | boolean | null | undefined;
    let bValue: string | number | boolean | null | undefined;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: 'name' | 'type' | 'status' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'name' | 'type' | 'status' | 'createdAt') => {
    if (sortField !== field) return 'none';
    return sortOrder === 'asc' ? 'sort-up' : 'sort-down';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisiblePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages.filter((p, i, arr) => {
      if (p === '...') return true;
      return arr.indexOf(p) === i;
    });
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilterValues(prev => ({ ...prev, [key]: value || 'all' }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterValues({ status: 'all', type: 'all' });
    setSortField('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="max-h-screen flex flex-col px-4 gap-3">
        {/* Filter Section */}
        <FilterBar
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          filters={PROJECT_FILTERS}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          searchPlaceholder="Search projects..."
          resetLabel="Reset"
          showSort={false}
        />

        {/* Table Section */}
        <div className="flex-1 min-h-[calc(100vh-14rem)]">
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 h-full flex flex-col">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading projects...</div>
                </div>
              ) : paginatedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || filterValues.status !== 'all' || filterValues.type !== 'all'
                        ? 'No projects match your filters'
                        : 'No projects found'}
                    </p>
                    {!searchQuery && filterValues.status === 'all' && filterValues.type === 'all' && (
                      <Button onClick={() => router.push('/super-admin/projects/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0 overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('name')}
                              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                              Project Name
                              {getSortIcon('name') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                getSortIcon('name') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                  <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('type')}
                              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                              Project Type
                              {getSortIcon('type') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                getSortIcon('type') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                  <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('status')}
                              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                              Status
                              {getSortIcon('status') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                getSortIcon('status') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                  <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort('createdAt')}
                              className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                              Created At
                              {getSortIcon('createdAt') === 'sort-up' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> :
                                getSortIcon('createdAt') === 'sort-down' ? <ArrowDown className="h-4 w-4 text-muted-foreground" /> :
                                  <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />}
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned Admins</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {paginatedProjects.map((project) => (
                          <tr
                            key={project.id || project._id}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle font-medium max-w-[200px] truncate">
                              {project.name}
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-sm">
                                {projectTypeLabels[project.type] || project.type}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge
                                variant={
                                  project.status === "ACTIVE" ? "default" :
                                    project.status === "COMPLETED" ? "success" :
                                      "secondary"
                                }
                                className="text-xs"
                              >
                                {project.status}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-sm">
                                {formatDate(project.createdAt)}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-wrap gap-1">
                                {project.admins && project.admins.length > 0 ? (
                                  project.admins.map((admin: User, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {admin.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No admins</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
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
                                <PopoverContent className="w-56" align="end">
                                  <div className="grid gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/task/manage?projectId=${project.id || project._id}`)}
                                      className="justify-start h-8 px-2"
                                    >
                                      <Settings className="mr-2 h-4 w-4" />
                                      Manage Project
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenAssignDialog(project)}
                                      className="justify-start h-8 px-2"
                                    >
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Assign Admin
                                    </Button>
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
        {sortedProjects.length > 0 && (
          <div className="shrink-0">
            <Card>
              <CardContent className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedProjects.length)} of {sortedProjects.length} projects
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {getVisiblePageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
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

        {/* Assign Admin Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Admin to Project</DialogTitle>
              <DialogDescription>
                Select an admin to assign to {selectedProjectForAssign?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="admin-select">Select Admin</Label>
                <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                  <SelectTrigger id="admin-select">
                    <SelectValue placeholder="Choose an admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((admin) => {
                      const adminId = admin.id || admin._id;
                      const isAlreadyAssigned = selectedProjectForAssign?.admins?.some(
                        (assignedAdmin: User) => (assignedAdmin.id || assignedAdmin._id) === adminId
                      );

                      return (
                        <SelectItem
                          key={adminId}
                          value={adminId || ""}
                          disabled={isAlreadyAssigned}
                        >
                          {admin.name} ({admin.email}) {isAlreadyAssigned && "- Already Assigned"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignAdmin}
                  disabled={isAssigning || !selectedAdminId}
                >
                  {isAssigning ? "Assigning..." : "Assign Admin"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Toast */}
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
      </div>
    </RoleGuard>
  );
}
