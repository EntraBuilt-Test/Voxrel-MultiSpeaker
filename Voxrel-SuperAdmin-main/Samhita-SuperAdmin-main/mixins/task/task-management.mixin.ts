import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTasks } from '@/hooks/queries/tasks-queries.hook';
import { useUpdateTask, useDeleteTask, useApproveTaskClaim, useRejectTaskClaim } from '@/hooks/mutations/task-mutations.hook';
import { useNotifications, useModalState } from '@/hooks';
import { Task, User } from '@/types';
import { LANGUAGE_OPTIONS } from '@/constants';

export interface TaskFilters {
  status: string;
  language: string;
  projectId?: string;
  [key: string]: string | undefined;
}

export interface TaskManageState {
  // Filter and search state
  searchQuery: string;
  filterValues: TaskFilters;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;

  // Modal states
  viewModal: ReturnType<typeof useModalState<Task>>;
  editModal: ReturnType<typeof useModalState<Task>>;

  // Edit form state
  editFormData: {
    title: string;
    description: string;
    status: string;
    priority: string;
    price: string;
    language: string;
    dueDate: string;
  };
}

export const useTaskManagement = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<TaskFilters>({
    status: 'all',
    language: 'all',
    ...(projectId && { projectId }),
  });
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const viewModal = useModalState<Task>();
  const editModal = useModalState<Task>();

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    price: '',
    language: '',
    dueDate: '',
  });

  // Notifications
  const { notifications, showSuccess, showError, dismiss } = useNotifications();

  // Build filters for API call
  const buildFilters = useCallback(() => {
    const getLanguageFilterValue = () => {
      if (filterValues.language === 'all') return undefined;
      const languageOption = LANGUAGE_OPTIONS.find(option => option.value === filterValues.language);
      return languageOption?.label || filterValues.language;
    };

    // Map frontend sort fields to API sort fields
    const getSortByValue = (): 'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority' => {
      const fieldMapping: Record<string, 'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority'> = {
        'dueDate': 'deadline',
        'createdDate': 'createdAt',
        'updatedDate': 'updatedAt',
      };

      const mappedField = fieldMapping[sortField];
      if (mappedField) return mappedField;

      const allowedFields: Array<'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority'> =
        ['createdAt', 'updatedAt', 'deadline', 'price', 'priority'];

      return allowedFields.includes(sortField as any) ? sortField as any : 'createdAt';
    };

    const finalSortBy = getSortByValue();

    return {
      ...(searchQuery && { search: searchQuery }),
      ...(filterValues.status !== 'all' && { status: filterValues.status }),
      ...(filterValues.language !== 'all' && { language: getLanguageFilterValue() }),
      ...(filterValues.projectId && { projectId: filterValues.projectId }),
      ...(sortField && { sortBy: finalSortBy }),
      ...(sortOrder && { sortOrder }),
    };
  }, [searchQuery, filterValues, sortField, sortOrder]);

  // Data fetching
  const { data: tasksData, isLoading, error } = useTasks(currentPage, 20, buildFilters());

  // Mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const approveTaskClaimMutation = useApproveTaskClaim();
  const rejectTaskClaimMutation = useRejectTaskClaim();

  // Helper functions
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

    if (typeof claimedById === 'object' && claimedById.name) {
      return claimedById.name;
    }

    if (typeof claimedById === 'string') {
      return claimedById;
    }

    return 'Unclaimed';
  }, []);

  const capitalizeFirstLetter = useCallback((str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }, []);

  const getDisplayStatus = useCallback((apiStatus: string) => {
    const statusMap = {
      'OPEN': 'Open',
      'PENDING_APPROVAL': 'Pending Approval',
      'ASSIGNED': 'Assigned',
      'SUBMITTED': 'Submitted',
      'IN_REVIEW': 'In Review',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[apiStatus as keyof typeof statusMap] || apiStatus;
  }, []);

  const getDisplayPriority = useCallback((apiPriority: string) => {
    const priorityMap = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High'
    };
    return priorityMap[apiPriority as keyof typeof priorityMap] || apiPriority;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Event handlers
  const handleEditTask = useCallback((task: Task) => {
    const languageOption = LANGUAGE_OPTIONS.find(option =>
      option.label.toLowerCase() === task.language.toLowerCase()
    );

    setEditFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      price: task.price.toString(),
      language: languageOption?.value || task.language.toLowerCase(),
      dueDate: task.dueDate || '',
    });
    editModal.open(task);
  }, [editModal]);

  const handleViewTask = useCallback((task: Task) => {
    viewModal.open(task);
  }, [viewModal]);

  const handleUpdateTask = useCallback(async () => {
    if (!editModal.selectedItem) return;

    const selectedLanguageOption = LANGUAGE_OPTIONS.find(option =>
      option.value === editFormData.language
    );

    try {
      const taskId = getTaskId(editModal.selectedItem);
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          title: editFormData.title,
          description: editFormData.description,
          status: editFormData.status as 'OPEN' | 'PENDING_APPROVAL' | 'ASSIGNED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED',
          priority: editFormData.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          price: parseInt(editFormData.price),
          language: selectedLanguageOption?.label || editFormData.language,
          dueDate: editFormData.dueDate || undefined,
        }
      });

      editModal.close();
      showSuccess('Task updated successfully');
    } catch (error) {
      showError('Failed to update task');
    }
  }, [editModal, editFormData, getTaskId, updateTaskMutation, showSuccess, showError]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      showSuccess('Task deleted successfully');
    } catch (error) {
      showError('Failed to delete task');
    }
  }, [deleteTaskMutation, showSuccess, showError]);

  const handleApproveTask = useCallback(async (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      console.error('Invalid task ID for approval:', taskId);
      showError('Invalid task ID. Cannot approve task.');
      return;
    }

    try {
      await approveTaskClaimMutation.mutateAsync(taskId);
      showSuccess('Task claim approved successfully');
    } catch (error) {
      console.error('Error approving task claim:', error);
      showError('Failed to approve task claim');
    }
  }, [approveTaskClaimMutation, showSuccess, showError]);

  const handleRejectTask = useCallback(async (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      console.error('Invalid task ID for rejection:', taskId);
      showError('Invalid task ID. Cannot reject task.');
      return;
    }

    try {
      await rejectTaskClaimMutation.mutateAsync(taskId);
      showSuccess('Task claim rejected successfully');
    } catch (error) {
      console.error('Error rejecting task claim:', error);
      showError('Failed to reject task claim');
    }
  }, [rejectTaskClaimMutation, showSuccess, showError]);

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterValues({
      status: 'all',
      language: 'all',
    });
    setSortField('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) {
      return 'sort';
    }
    return sortOrder === 'asc' ? 'sort-up' : 'sort-down';
  }, [sortField, sortOrder]);

  // Computed values
  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNext: false,
    hasPrev: false
  };

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

  return {
    // State
    searchQuery,
    filterValues,
    sortField,
    sortOrder,
    currentPage,
    editFormData,
    setEditFormData,

    // Modals
    viewModal,
    editModal,

    // Data
    tasks,
    pagination,
    isLoading,
    error,

    // Notifications
    notifications,
    dismiss,

    // Helper functions
    getTaskId,
    getClaimedByDisplay,
    capitalizeFirstLetter,
    getDisplayStatus,
    getDisplayPriority,
    formatDate,
    getSortIcon,
    getVisiblePageNumbers,

    // Event handlers
    handleEditTask,
    handleViewTask,
    handleUpdateTask,
    handleDeleteTask,
    handleApproveTask,
    handleRejectTask,
    handleFilterChange,
    handleSearchChange,
    handleResetFilters,
    handleSort,

    // Setters
    setCurrentPage,
    setFilterValues,
  };
};
