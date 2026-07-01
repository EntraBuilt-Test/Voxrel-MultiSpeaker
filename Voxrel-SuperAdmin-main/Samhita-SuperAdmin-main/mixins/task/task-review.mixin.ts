import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTasks } from '@/hooks/queries/tasks-queries.hook';
import { useUpdateTask } from '@/hooks/mutations/task-mutations.hook';
import { useNotifications, useModalState } from '@/hooks';
import { Task, User, TaskReview } from '@/types';
import { LANGUAGE_OPTIONS } from '@/constants';

export interface TaskReviewFilters {
  language: string;
  projectId?: string;
  [key: string]: string | undefined;
}

export interface TaskReviewState {
  // Filter and search state
  searchQuery: string;
  filterValues: TaskReviewFilters;
  currentPage: number;

  // Modal states
  viewModal: ReturnType<typeof useModalState<Task>>;
  transcriptionModal: ReturnType<typeof useModalState<Task>>;

  // Data
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  error: string | null;

  // Notifications
  notifications: any[];
}

export const useTaskReview = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<TaskReviewFilters>({
    language: 'all',
    ...(projectId && { projectId }),
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const viewModal = useModalState<Task>();
  const transcriptionModal = useModalState<Task>();

  // Notifications
  const { notifications, showSuccess, showError, dismiss } = useNotifications();

  // Build filters for API call
  const buildFilters = useCallback(() => {
    const getLanguageFilterValue = () => {
      if (filterValues.language === 'all') return undefined;
      const languageOption = LANGUAGE_OPTIONS.find(option => option.value === filterValues.language);
      return languageOption?.label;
    };

    // Map frontend sort fields to API sort fields
    const getSortByValue = (): 'createdAt' | 'deadline' | 'price' | 'priority' => {
      const fieldMapping: Record<string, 'createdAt' | 'deadline' | 'price' | 'priority'> = {
        'dueDate': 'deadline',
      };

      const mappedField = fieldMapping[sortField];
      if (mappedField) return mappedField;

      const allowedFields: Array<'createdAt' | 'deadline' | 'price' | 'priority'> =
        ['createdAt', 'deadline', 'price', 'priority'];

      return allowedFields.includes(sortField as any) ? sortField as any : 'createdAt';
    };

    const finalSortBy = getSortByValue();

    return {
      ...(searchQuery && { search: searchQuery }),
      // Always filter for SUBMITTED status only in review page
      status: 'SUBMITTED',
      ...(filterValues.language !== 'all' && { language: getLanguageFilterValue() }),
      ...(filterValues.projectId && { projectId: filterValues.projectId }),
      ...(sortField && { sortBy: finalSortBy }),
      ...(sortOrder && { sortOrder }),
    };
  }, [searchQuery, filterValues, sortField, sortOrder]);

  // Data fetching
  const { data: tasksData, isLoading, error } = useTasks(currentPage, 50, buildFilters());

  // Mutations
  const updateTaskMutation = useUpdateTask();

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
  const handleViewTask = useCallback((task: Task) => {
    viewModal.open(task);
  }, [viewModal]);

  const handleApproveTask = useCallback(async (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      console.error('Invalid task ID for approval:', taskId);
      showError('Invalid task ID. Cannot approve task.');
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: 'COMPLETED' }
      });
      showSuccess('Task approved successfully');
    } catch (error) {
      console.error('Error approving task:', error);
      showError('Failed to approve task');
    }
  }, [updateTaskMutation, showSuccess, showError]);

  const handleRejectTask = useCallback(async (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      console.error('Invalid task ID for rejection:', taskId);
      showError('Invalid task ID. Cannot reject task.');
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: 'CANCELLED' }
      });
      showSuccess('Task rejected successfully');
    } catch (error) {
      console.error('Error rejecting task:', error);
      showError('Failed to reject task');
    }
  }, [updateTaskMutation, showSuccess, showError]);

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterValues({
      language: 'all'
    });
    setCurrentPage(1);
  }, []);

  // Computed values
  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNext: false,
    hasPrev: false
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
      case 'COMPLETED':
        return 'default';
      case 'SUBMITTED':
      case 'IN_REVIEW':
        return 'secondary';
      case 'OPEN':
      case 'PENDING_APPROVAL':
      case 'ASSIGNED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  }, []);

  const getPriorityBadgeVariant = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  }, []);

  // Utility functions for table display
  const getTaskId = useCallback((task: Task): string => {
    const taskId = task._id || task.id;
    if (!taskId) {
      console.error('Task ID is missing:', task);
      throw new Error('Task ID is required');
    }
    return taskId;
  }, []);

  const getClaimedByDisplay = useCallback((claimedById: string | User | null | undefined) => {
    if (!claimedById) return 'Unclaimed';
    if (typeof claimedById === 'string') return claimedById;
    return claimedById.name || claimedById.email || 'Unknown';
  }, []);

  const getReviewedByDisplay = useCallback((review: TaskReview | null | undefined) => {
    if (!review) return 'Not Reviewed';
    if (review.reviewer) {
      return review.reviewer.name || review.reviewer.email || 'Unknown';
    }
    return 'Not Reviewed';
  }, []);

  const capitalizeFirstLetter = useCallback((str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }, []);

  const getDisplayStatus = useCallback((apiStatus: string) => {
    switch (apiStatus) {
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      case 'IN_REVIEW':
        return 'In Review';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'SUBMITTED':
        return 'Submitted';
      default:
        return apiStatus.replace('_', ' ');
    }
  }, []);

  const getDisplayPriority = useCallback((apiPriority: string) => {
    switch (apiPriority) {
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      case 'LOW':
        return 'Low';
      case 'URGENT':
        return 'Urgent';
      default:
        return apiPriority;
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
    transcriptionModal,

    // Data
    tasks,
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
    getPriorityBadgeVariant,
    getTaskId,
    getClaimedByDisplay,
    getReviewedByDisplay,
    capitalizeFirstLetter,
    getDisplayStatus,
    getDisplayPriority,
    handleSort,
    getSortIcon,

    // Event handlers
    handleViewTask,
    handleApproveTask,
    handleRejectTask,
    handleFilterChange,
    handleResetFilters,

    // Setters
    setCurrentPage,
    setSearchQuery,
  };
};
