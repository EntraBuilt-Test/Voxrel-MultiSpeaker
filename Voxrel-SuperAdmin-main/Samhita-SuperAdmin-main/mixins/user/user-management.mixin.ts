import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUsers } from '@/hooks/queries/users-queries.hook';
import { useUpdateUserStatus, useDeleteUser } from '@/hooks/mutations/user-mutations.hook';
import { useNotifications, useModalState } from '@/hooks';
import { User } from '@/types';

export interface UserFilters {
  status: string;
  projectId?: string;
  [key: string]: string | undefined;
}

export interface UserManageState {
  // Filter and search state
  searchQuery: string;
  filterValues: UserFilters;
  currentPage: number;

  // Modal states
  viewModal: ReturnType<typeof useModalState<User>>;

  // Data
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
  isLoading: boolean;
  error: string | null;

  // Notifications
  notifications: any[];
}

export const useUserManagement = () => {
  // Get projectId from URL if present
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<UserFilters>({
    status: 'all',
    role: 'all',
    ...(projectId && { projectId }),
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const viewModal = useModalState<User>();

  // Notifications
  const { notifications, showSuccess, showError, dismiss } = useNotifications();

  // Build filters for API call
  const buildFilters = useCallback(() => {
    const filters: Record<string, string | undefined> = {};

    if (searchQuery) {
      filters.search = searchQuery;
    }
    if (filterValues.status !== 'all') {
      filters.status = filterValues.status;
    }
    if (filterValues.role !== 'all' && filterValues.role !== 'SUPER_ADMIN') {
      filters.role = filterValues.role;
    }
    if (filterValues.projectId) {
      filters.projectId = filterValues.projectId;
    }

    // Add sorting parameters
    const allowedFields = ['createdAt', 'name', 'email', 'lastLoginAt'];
    const finalField = allowedFields.includes(sortField) ? sortField : 'createdAt';

    if (sortField) {
      filters.sortBy = finalField;
    }
    if (sortOrder) {
      filters.sortOrder = sortOrder;
    }

    return filters;
  }, [searchQuery, filterValues, sortField, sortOrder]);

  // Data fetching
  const { data: usersData, isLoading, error } = useUsers(currentPage, 20, buildFilters());

  // Mutations
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filterValues]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      showError(`Error: ${error}`);
    }
  }, [error, showError]);

  // Event handlers
  const handleViewUser = useCallback((user: User) => {
    viewModal.open(user);
  }, [viewModal]);

  const handleUnbanUser = useCallback(async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userId,
        status: 'ACTIVE'
      });
      showSuccess('User unbanned successfully');
    } catch (error) {
      showError('Failed to unban user');
    }
  }, [updateUserStatusMutation, showSuccess, showError]);

  const handleRejectUser = useCallback(async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userId,
        status: 'BANNED'
      });
      showSuccess('User rejected successfully');
    } catch (error) {
      showError('Failed to reject user');
    }
  }, [updateUserStatusMutation, showSuccess, showError]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      showSuccess('User deleted successfully');
    } catch (error) {
      showError('Failed to delete user');
    }
  }, [deleteUserMutation, showSuccess, showError]);

  const handleApproveUser = useCallback(async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userId,
        status: 'ACTIVE'
      });
      showSuccess('User approved successfully');
    } catch (error) {
      showError('Failed to approve user');
    }
  }, [updateUserStatusMutation, showSuccess, showError]);

  const handleBanUser = useCallback(async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userId,
        status: 'BANNED'
      });
      showSuccess('User banned successfully');
    } catch (error) {
      showError('Failed to ban user');
    }
  }, [updateUserStatusMutation, showSuccess, showError]);

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterValues({
      status: 'all',
      role: 'all',
    });
    setCurrentPage(1);
  }, []);

  // Computed values
  // Filter out SUPER_ADMIN users from the list
  const users = (usersData?.users || []).filter(user => user.role !== 'SUPER_ADMIN');
  const pagination = usersData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Utility functions
  const getVisiblePageNumbers = useCallback(() => {
    const totalPages = pagination.totalPages;
    const current = currentPage;
    const delta = 2;

    let start = Math.max(1, current - delta);
    let end = Math.min(totalPages, current + delta);

    if (end - start < delta * 2) {
      if (start === 1) {
        end = Math.min(totalPages, start + delta * 2);
      } else if (end === totalPages) {
        start = Math.max(1, end - delta * 2);
      }
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [pagination.totalPages, currentPage]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_VERIFICATION':
        return 'warning';
      case 'BANNED':
        return 'destructive';
      default:
        return 'outline';
    }
  }, []);

  const getDisplayStatus = useCallback((status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'PENDING';
      case 'ACTIVE':
        return 'ACTIVE';
      case 'BANNED':
        return 'BANNED';
      default:
        return status;
    }
  }, []);

  // Sorting functions
  const handleSort = useCallback((field: string) => {
    setSortField(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return 'sort';
    return sortOrder === 'asc' ? 'sort-up' : 'sort-down';
  }, [sortField, sortOrder]);

  return {
    // State
    searchQuery,
    filterValues,
    currentPage,
    sortField,
    sortOrder,

    // Modals
    viewModal,

    // Data
    users,
    pagination,
    isLoading,
    error,

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
  };
};
