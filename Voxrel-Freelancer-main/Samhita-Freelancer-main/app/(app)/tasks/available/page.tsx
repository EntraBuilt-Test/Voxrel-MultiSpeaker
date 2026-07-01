"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { NotificationToast } from "@/components/notification-toast";
import FilterBar from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DURATION_OPTIONS, LANGUAGES } from "@/constants/tasks";
import { useNotifications } from "@/hooks/use-notifications";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useTaskStore, useProjectStore } from "@/stores";
import { Task } from "@/types";

const TASKS_PER_PAGE = 10;

export default function TasksPage() {
  const router = useRouter();
  const { selectedProject } = useProjectStore();
  const {
    tasks,
    isLoading,
    error,
    pagination,
    fetchAvailableTasks,
    claimTask,
    selectedLanguages,
    filters,
    setFilters,
    setLanguageFilter,
    clearLanguageFilter,
  } = useTaskStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [languageSelection, setLanguageSelection] = useState(selectedLanguages[0] ?? "all");
  const [durationSelection, setDurationSelection] = useState(filters.duration ?? "all");
  const [sortConfig, setSortConfig] = useState<{ field: 'status' | 'createdAt' | null; direction: 'asc' | 'desc' }>({
    field: null,
    direction: 'asc',
  });
  const { notifications, showError, showSuccess, dismiss } = useNotifications();
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const lastAppliedSearchRef = useRef(filters.search?.trim() ?? '');
  const lastErrorRef = useRef<string | null>(null);
  const fetchRef = useRef<string>('');

  // Handle errors silently - logged to console
  useEffect(() => {
    if (error) {
      console.error('Task error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      showError(error, { title: 'Task error' });
      lastErrorRef.current = error;
    }

    if (!error) {
      lastErrorRef.current = null;
    }
  }, [error, showError]);

  useEffect(() => {
    lastAppliedSearchRef.current = filters.search?.trim() ?? '';
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    if (selectedLanguages.length === 0) {
      setLanguageSelection('all');
      return;
    }
    setLanguageSelection(selectedLanguages[0]);
  }, [selectedLanguages]);

  useEffect(() => {
    if (!filters.duration) {
      setDurationSelection('all');
      return;
    }
    setDurationSelection(filters.duration);
  }, [filters.duration]);

  useEffect(() => {
    const normalized = debouncedSearch.trim();
    if (normalized === lastAppliedSearchRef.current) {
      return;
    }

    lastAppliedSearchRef.current = normalized;
    setFilters({ search: normalized || undefined });
    setCurrentPage(1);
  }, [debouncedSearch, setFilters]);

  // Memoize filters and selectedLanguages to prevent unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const languagesKey = useMemo(() => selectedLanguages.join(','), [selectedLanguages]);
  const languageOptions = useMemo(
    () => [
      { value: 'all', label: 'All Languages' },
      ...LANGUAGES.map(({ label, value }) => ({
        value,
        label,
      })),
    ],
    []
  );
  const durationOptions = useMemo(() => DURATION_OPTIONS, []);
  const filterConfigs = useMemo(
    () => [
      {
        key: 'language',
        type: 'select' as const,
        label: 'Language',
        placeholder: 'All Languages',
        options: languageOptions,
      },
      {
        key: 'duration',
        type: 'select' as const,
        label: 'Duration',
        placeholder: 'Duration',
        options: durationOptions,
      },
    ],
    [languageOptions, durationOptions]
  );
  const filterValues = useMemo(
    () => ({
      language: languageSelection,
      duration: durationSelection,
    }),
    [languageSelection, durationSelection]
  );
  const displayTasks = useMemo(() => {
    if (!sortConfig.field) {
      return tasks;
    }

    const sortedTasks = [...tasks];
    sortedTasks.sort((a, b) => {
      if (sortConfig.field === 'status') {
        const comparison = (a.status || '').localeCompare(b.status || '');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
    });

    return sortedTasks;
  }, [tasks, sortConfig]);
  const hasTasks = displayTasks.length > 0;
  const visiblePageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);

    for (let offset = -1; offset <= 1; offset += 1) {
      const page = currentPage + offset;
      if (page > 1 && page < totalPages) {
        pages.add(page);
      }
    }

    if (currentPage - 2 > 1) {
      pages.add(currentPage - 2);
    }
    if (currentPage + 2 < totalPages) {
      pages.add(currentPage + 2);
    }

    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, pagination.totalPages]);

  // Initial data fetch - prevent duplicate calls
  useEffect(() => {
    const fetchKey = `${currentPage}-${languagesKey}-${filtersKey}`;

    // Skip if already fetching this exact combination
    if (fetchRef.current === fetchKey || isLoading) {
      return;
    }

    // Only fetch if this is a new combination (prevents duplicate calls)
    fetchRef.current = fetchKey;

    // Add projectId to filters if a project is selected
    const taskFilters = {
      ...filters,
      projectId: selectedProject?.id || selectedProject?._id
    };

    fetchAvailableTasks(currentPage, TASKS_PER_PAGE, taskFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, languagesKey, filtersKey, selectedProject?.id]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of tasks table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSort = (field: 'status' | 'createdAt') => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        field,
        direction: 'asc',
      };
    });
  };

  const renderSortIcon = (field: 'status' | 'createdAt') => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/60" />;
    }

    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-muted-foreground" />;
    }

    return <ArrowDown className="h-4 w-4 text-muted-foreground" />;
  };

  const handleFilterChange = (key: string, value?: string) => {
    if (key === 'language') {
      const normalizedValue = !value || value === 'all' ? 'all' : value;
      setLanguageSelection(normalizedValue);

      if (!value || value === 'all') {
        clearLanguageFilter();
      } else {
        setLanguageFilter([value]);
      }
      setCurrentPage(1);
      return;
    }

    if (key === 'duration') {
      const normalizedValue = !value || value === 'all' ? 'all' : value;
      setDurationSelection(normalizedValue);
      setFilters({ duration: normalizedValue === 'all' ? undefined : normalizedValue });
      setCurrentPage(1);
      return;
    }

    setFilters({ [key]: value || undefined });
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    lastAppliedSearchRef.current = '';
    setFilters({ search: undefined, duration: undefined });
    clearLanguageFilter();
    setLanguageSelection('all');
    setDurationSelection('all');
    setSortConfig({ field: null, direction: 'asc' });
    setCurrentPage(1);
  };

  const handleClaimTask = (task: Task) => {
    setSelectedTask(task);
    setShowClaimDialog(true);
  };

  const formatStatus = (value: Task['status']) =>
    value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const formatDate = (value?: string) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalTasks = pagination.total || displayTasks.length;
  const paginationStart = totalTasks === 0 ? 0 : (currentPage - 1) * TASKS_PER_PAGE + 1;
  const paginationEnd = totalTasks === 0 ? 0 : Math.min(currentPage * TASKS_PER_PAGE, totalTasks);

  const confirmClaimTask = async () => {
    if (isClaiming || !selectedTask || !selectedTask.id) return;

    setIsClaiming(true);
    try {
      await claimTask(selectedTask.id!);
      showSuccess('Task claimed successfully', { title: selectedTask.title });

      // Task claimed successfully - redirect to My Tasks page
      // Workspace will only be accessible after admin approves the claim
      router.push('/tasks/draft');

      console.log("Task claimed:", selectedTask);
    } catch (error) {
      console.error('Failed to claim task:', error);
      const message = error instanceof Error ? error.message : 'Failed to claim task';
      showError(message, { title: 'Claim failed' });
      setIsClaiming(false); // Re-enable on error
    } finally {
      setShowClaimDialog(false);
      setSelectedTask(null);
      setIsClaiming(false);
    }
  };

  return (
    <div className="w-full space-y-6">


      <FilterBar
        searchQuery={searchInput}
        onSearch={handleSearchChange}
        searchPlaceholder="Search tasks..."
        filters={filterConfigs}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        resetLabel="Reset filters"
        showSort={false}
      />

      <Card>
        <CardContent className="p-0 flex flex-col">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold">Loading tasks...</div>
                <div className="text-sm text-muted-foreground">
                  Please wait while we fetch available tasks
                </div>
              </div>
            </div>
          ) : hasTasks ? (
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[320px]">
                      Task
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                      >
                        Status
                        {renderSortIcon('status')}
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Language
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                      >
                        Created
                        {renderSortIcon('createdAt')}
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {displayTasks.map((task) => (
                    <tr key={task.id} className="border-b transition-colors hover:bg-muted/40">
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-foreground">{task.title}</div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex min-w-[90px] items-center justify-center rounded-full bg-[#f5f6fb] px-3 py-1 text-xs font-semibold text-[#1f2933]">
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-sm font-semibold text-[#111827]">
                          {formatCurrency(task.price)}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {task.language}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button
                          size="sm"
                          onClick={() => handleClaimTask(task)}
                          disabled={task.status !== 'OPEN'}
                        >
                          {task.status === 'OPEN' ? 'Claim Task' : 'Not Available'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[320px] w-full items-center justify-center">
              <div className="w-full max-w-lg px-6 py-6 text-center space-y-4">
                <div className="flex justify-center">
                  <Image
                    src="/No data-cuate.svg"
                    alt="No tasks available"
                    width={260}
                    height={260}
                    className="object-contain"
                  />
                </div>
                <div className="text-foreground text-xl font-semibold">No Tasks Available</div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  There are currently no tasks matching your criteria. Try adjusting your filter settings above or check back
                  later for new opportunities.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="default" className="flex-1" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                  <Button variant="secondary" className="flex-1" size="sm" onClick={() => router.push('/profile')}>
                    Update Account Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {totalTasks > 0 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {paginationStart} to {paginationEnd} of {totalTasks} tasks
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {visiblePageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-9"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(pagination.totalPages || 1, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Task Confirmation Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Claim Task
            </DialogTitle>
            <DialogDescription>
              Review the task details before claiming
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>

              <Separator />

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="font-semibold text-green-600">₹{selectedTask.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Language</p>
                    <p className="font-semibold">{selectedTask.language}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-muted-foreground">
                    Created on {new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Status: {selectedTask.status}
                  </Badge>
                </div>
              </div>

              {/* Warning/Info */}
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Once you claim this task, it will be sent for admin approval.
                  You&apos;ll be notified when it&apos;s approved and ready for work.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmClaimTask} className="bg-green-600 hover:bg-green-700" disabled={isLoading || isClaiming}>
              {isLoading || isClaiming ? 'Claiming...' : 'Claim Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
