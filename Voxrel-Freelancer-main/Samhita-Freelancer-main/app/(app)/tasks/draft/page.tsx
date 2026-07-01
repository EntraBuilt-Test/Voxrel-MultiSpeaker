"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import FilterBar from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DURATION_OPTIONS, LANGUAGES } from "@/constants/tasks";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { toast } from "sonner";
import projectService from "@/services/project.service";
import { useTaskStore, useProjectStore } from "@/stores";
import { Task } from "@/types";

const TASKS_PER_PAGE = 10;

export default function MyTasksPage() {
  const router = useRouter();
  const { selectedProject } = useProjectStore();
  const {
    tasks,
    isLoading,
    error,
    pagination,
    fetchMyTasks,
    selectedLanguages,
    filters,
    setFilters,
    setLanguageFilter,
    clearLanguageFilter,
  } = useTaskStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [languageSelection, setLanguageSelection] = useState(selectedLanguages[0] ?? "all");
  const [durationSelection, setDurationSelection] = useState(filters.duration ?? "all");
  const [sortConfig, setSortConfig] = useState<{ field: "status" | "updatedAt" | null; direction: "asc" | "desc" }>({
    field: null,
    direction: "asc",
  });
  const fetchRef = useRef<string>("");
  const lastAppliedSearchRef = useRef(filters.search?.trim() ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    if (error) {
      console.error("My Tasks error:", error);
    }
  }, [error]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const languagesKey = useMemo(() => selectedLanguages.join(","), [selectedLanguages]);

  useEffect(() => {
    const fetchKey = `${currentPage}-${languagesKey}-${filtersKey}`;
    if (fetchRef.current === fetchKey || isLoading) {
      return;
    }

    fetchRef.current = fetchKey;

    // Add projectId to filters if a project is selected
    const taskFilters = {
      ...filters,
      projectId: selectedProject?.id || selectedProject?._id
    };

    fetchMyTasks(currentPage, TASKS_PER_PAGE, taskFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, languagesKey, filtersKey, selectedProject?.id]);

  useEffect(() => {
    const normalized = debouncedSearch.trim();
    if (normalized === lastAppliedSearchRef.current) {
      return;
    }
    lastAppliedSearchRef.current = normalized;
    setFilters({ search: normalized || undefined });
    setCurrentPage(1);
  }, [debouncedSearch, setFilters]);

  // Refresh tasks when page becomes visible (user returns from another tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh tasks when user returns to the page
        const taskFilters = {
          ...filters,
          projectId: selectedProject?.id || selectedProject?._id
        };
        fetchMyTasks(currentPage, TASKS_PER_PAGE, taskFilters);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, filters, selectedProject, fetchMyTasks]);

  // Poll for recording URL updates for multi-speaker tasks without recordings
  useEffect(() => {
    // Only poll if there are multi-speaker tasks without recordingUrl
    const multiSpeakerTasksWithoutRecording = tasks.filter(
      task => task.type === 'multi' && !task.recordingUrl && task.status === 'ASSIGNED'
    );

    if (multiSpeakerTasksWithoutRecording.length === 0) {
      return;
    }

    // TEMPORARY FIX: Check R2 for missing recording URLs
    const checkRecordings = async () => {
      const { taskService } = await import('@/services/task.service');
      for (const task of multiSpeakerTasksWithoutRecording) {
        const taskId = task.id || task._id;
        if (!taskId) continue;
        
        try {
          console.log('[MyTasks] Checking R2 for recording URL for task:', taskId);
          const checkResponse = await taskService.checkRecording(taskId);
          if (checkResponse.success && checkResponse.data?.found && checkResponse.data?.recordingUrl) {
            console.log('[MyTasks] ✅ Found recording URL, refreshing task list');
            // Refresh tasks to get updated recordingUrl
            const taskFilters = {
              ...filters,
              projectId: selectedProject?.id || selectedProject?._id
            };
            fetchMyTasks(currentPage, TASKS_PER_PAGE, taskFilters);
            break; // Only refresh once per cycle
          }
        } catch (error) {
          console.error('[MyTasks] Error checking recording:', error);
        }
      }
    };

    // Check immediately, then poll every 10 seconds
    checkRecordings();
    const interval = setInterval(() => {
      const taskFilters = {
        ...filters,
        projectId: selectedProject?.id || selectedProject?._id
      };
      fetchMyTasks(currentPage, TASKS_PER_PAGE, taskFilters);
      // Also check R2 in case file exists but wasn't in the refresh
      checkRecordings();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, currentPage, filters, selectedProject, fetchMyTasks]);

  useEffect(() => {
    lastAppliedSearchRef.current = filters.search?.trim() ?? "";
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    if (selectedLanguages.length === 0) {
      setLanguageSelection("all");
      return;
    }
    setLanguageSelection(selectedLanguages[0]);
  }, [selectedLanguages]);

  useEffect(() => {
    if (!filters.duration) {
      setDurationSelection("all");
      return;
    }
    setDurationSelection(filters.duration);
  }, [filters.duration]);

  const languageOptions = useMemo(
    () => [
      { value: "all", label: "All Languages" },
      ...LANGUAGES.map(({ label, value }) => ({ value, label })),
    ],
    []
  );
  const durationOptions = useMemo(() => DURATION_OPTIONS, []);

  const filterConfigs = useMemo(
    () => [
      {
        key: "language",
        type: "select" as const,
        label: "Language",
        placeholder: "All Languages",
        options: languageOptions,
      },
      {
        key: "duration",
        type: "select" as const,
        label: "Duration",
        placeholder: "Duration",
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
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      if (sortConfig.field === "status") {
        const comparison = (a.status || "").localeCompare(b.status || "");
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    });
    return sorted;
  }, [tasks, sortConfig]);

  const hasTasks = displayTasks.length > 0;

  const formatStatus = (value: Task["status"]) =>
    value
      .toLowerCase()
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const visiblePageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const pages = new Set<number>([1, totalPages]);
    for (let offset = -1; offset <= 1; offset += 1) {
      const page = currentPage + offset;
      if (page > 1 && page < totalPages) {
        pages.add(page);
      }
    }
    if (currentPage - 2 > 1) pages.add(currentPage - 2);
    if (currentPage + 2 < totalPages) pages.add(currentPage + 2);
    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, pagination.totalPages]);

  const totalTasks = pagination.total || displayTasks.length;
  const paginationStart = totalTasks === 0 ? 0 : (currentPage - 1) * TASKS_PER_PAGE + 1;
  const paginationEnd = totalTasks === 0 ? 0 : Math.min(currentPage * TASKS_PER_PAGE, totalTasks);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key: string, value?: string) => {
    if (key === "language") {
      const normalizedValue = !value || value === "all" ? "all" : value;
      setLanguageSelection(normalizedValue);
      if (!value || value === "all") {
        clearLanguageFilter();
      } else {
        setLanguageFilter([value]);
      }
      setCurrentPage(1);
      return;
    }

    if (key === "duration") {
      const normalizedValue = !value || value === "all" ? "all" : value;
      setDurationSelection(normalizedValue);
      setFilters({ duration: normalizedValue === "all" ? undefined : normalizedValue });
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
    setSearchInput("");
    lastAppliedSearchRef.current = "";
    setFilters({ search: undefined, duration: undefined });
    clearLanguageFilter();
    setLanguageSelection("all");
    setDurationSelection("all");
    setSortConfig({ field: null, direction: "asc" });
    setCurrentPage(1);
  };

  const handleSort = (field: "status" | "updatedAt") => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { field, direction: "asc" };
    });
  };

  const renderSortIcon = (field: "status" | "updatedAt") => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/60" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-muted-foreground" />;
    }
    return <ArrowDown className="h-4 w-4 text-muted-foreground" />;
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      // Find the task to get its projectId
      let task = tasks.find(t => t.id === taskId || t._id === taskId);

      // If task not found in store or missing projectId, fetch it from My Tasks or Project Tasks
      if (!task || !task.projectId) {
        console.log('Task not in store or missing projectId, fetching from API...');
        try {
          const { taskService } = await import('@/services/task.service');
          // First try My Tasks
          const myTasksResponse = await taskService.getMyTasks(1, 100);
          if (myTasksResponse.success && myTasksResponse.data.tasks) {
            task = myTasksResponse.data.tasks.find(
              (t: any) => t._id === taskId || t.id === taskId
            );
            if (task && task.projectId) {
              console.log('Task fetched from My Tasks:', { taskId, projectId: task.projectId, task });
            }
          }

          // If not found in My Tasks and we have a selectedProject, try project tasks
          if ((!task || !task.projectId) && selectedProject) {
            const projectId = selectedProject.id || selectedProject._id;
            if (!projectId) {
              console.error('Project ID is missing');
              return;
            }
            console.log('Task not in My Tasks, trying project tasks for project:', projectId);
            const projectTasksResponse = await projectService.getProjectTasks(projectId, 1, 100);
            if (projectTasksResponse.success && projectTasksResponse.data.tasks) {
              task = projectTasksResponse.data.tasks.find(
                (t: any) => t._id === taskId || t.id === taskId
              );
              if (task) {
                // Ensure projectId is set
                task.projectId = projectId;
                console.log('Task fetched from Project Tasks:', { taskId, projectId, task });
              }
            }
          }

          if (!task || !task.projectId) {
            console.error('Task not found in My Tasks or Project Tasks');
            router.push(`/workspace/${taskId}`);
            return;
          }
        } catch (error) {
          console.error('Error fetching task:', error);
          router.push(`/workspace/${taskId}`);
          return;
        }
      }

      if (!task) {
        console.error('Task not found for taskId:', taskId);
        return;
      }

      console.log('Task found:', { taskId, projectId: task.projectId, task, taskType: task.type });

      // If task doesn't have type field, fetch it directly from API to get the full task data
      if (!task.type) {
        console.log('⚠️ Task missing type field, fetching task directly from API...');
        try {
          const { taskService } = await import('@/services/task.service');
          const taskResponse = await taskService.getTaskById(taskId);
          if (taskResponse.success && taskResponse.data) {
            console.log('✅ Task fetched with full data:', taskResponse.data);
            task = { ...task, ...taskResponse.data };
            console.log('✅ Task type after fetch:', task.type);
          } else {
            console.warn('⚠️ Task fetch response not successful:', taskResponse);
          }
        } catch (err) {
          console.error('❌ Error fetching task type:', err);
        }
      } else {
        console.log('✅ Task has type field:', task.type);
      }

      // Extract projectId - handle both string and populated object cases
      let taskProjectIdStr: string | undefined;
      if (typeof task.projectId === 'string') {
        taskProjectIdStr = task.projectId;
      } else if (task.projectId && typeof task.projectId === 'object') {
        // Handle populated projectId object
        taskProjectIdStr = (task.projectId as any)?._id?.toString() || (task.projectId as any)?.id?.toString();
      } else if (task.projectId) {
        taskProjectIdStr = String(task.projectId as any);
      }

      if (!taskProjectIdStr) {
        console.warn('Task has no projectId after fetch, falling back to transcription workspace');
        // Fallback to transcription workspace if no projectId
        router.push(`/workspace/${taskId}`);
        return;
      }

      console.log('Extracted projectId:', taskProjectIdStr, 'from task.projectId:', task.projectId);

      // Check if selectedProject matches, otherwise fetch the project
      let project = selectedProject;
      if (!project || (project.id !== taskProjectIdStr && project._id !== taskProjectIdStr)) {
        console.log('Fetching project with ID:', taskProjectIdStr);
        try {
          const response = await projectService.getProject(taskProjectIdStr);
          if (response.success) {
            project = response.data;
            console.log('Project fetched:', { id: project.id, _id: project._id, type: project.type });
          } else {
            console.error('Failed to fetch project, falling back to transcription workspace');
            // Fallback to transcription workspace if project fetch fails
            router.push(`/workspace/${taskId}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching project:', err);
          router.push(`/workspace/${taskId}`);
          return;
        }
      } else {
        console.log('Using selected project:', { id: project.id, _id: project._id, type: project.type });
      }

      // Route based on project type
      const projectId = project.id || project._id;
      // Use the task's actual ID (either _id or id) for consistency
      const actualTaskId = task._id || task.id || taskId;
      
      // Always fetch the latest task data to ensure we have the type field
      // This ensures we get the most up-to-date task including type field
      let finalTask = task;
      if (project.type === 'AUDIO_RECORDING') {
        try {
          const { taskService } = await import('@/services/task.service');
          const taskResponse = await taskService.getTaskById(actualTaskId);
          if (taskResponse.success && taskResponse.data) {
            finalTask = taskResponse.data;
            console.log('✅ Latest task data fetched:', { 
              taskId: actualTaskId, 
              type: finalTask.type,
              roomName: finalTask.roomName 
            });
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch latest task data, using cached task:', err);
        }
      }
      
      // Debug: Log task type
      console.log('Routing to workspace:', { 
        projectId, 
        projectType: project.type, 
        taskId: actualTaskId, 
        originalTaskId: taskId,
        taskType: finalTask.type,
        task: finalTask
      });

      switch (project.type) {
        case 'AUDIO_RECORDING':
          // Route based on task type: multi-speaker or single-speaker
          // Check task.type, default to 'single' if not set
          const taskType = finalTask.type || 'single';
          console.log('🎯 Task type determined:', taskType, 'from finalTask.type:', finalTask.type);
          
          if (taskType === 'multi') {
            // For multi-speaker tasks, redirect to standalone LiveKit app with pre-filled session ID
            if (!finalTask.roomName) {
              toast.error('Task room name not set. Please contact an admin.');
              return;
            }
            console.log('✅ Redirecting to standalone multi-speaker app with roomName:', finalTask.roomName);
            // Redirect to standalone app with session ID (roomName) as query parameter
            // The standalone app URL should be set in environment variables
            const standaloneUrl = process.env.NEXT_PUBLIC_MULTISPEAKER_APP_URL || 'https://stotra-multispeaker.onrender.com';
            window.location.href = `${standaloneUrl}?sessionId=${encodeURIComponent(finalTask.roomName)}`;
            return;
          } else {
            // Route to single recording page for single-speaker tasks
            console.log('✅ Routing to SINGLE-SPEAKER workspace (default or type=' + taskType + ')');
            router.push(`/projects/${projectId}/recording/single?taskId=${actualTaskId}`);
          }
          break;
        case 'TRANSCRIPTION':
          // Route to transcription workspace
          router.push(`/workspace/${actualTaskId}`);
          break;
        case 'REVIEW':
          // If task is ASSIGNED, trigger start review to update status to IN_REVIEW
          if (task.status === "ASSIGNED") {
            try {
              console.log('Starting review task (updating status)...', actualTaskId);
              const { freelancerService } = await import("@/services/freelancer.service");
              await freelancerService.startReviewTask(actualTaskId);
            } catch (err) {
              console.error('Failed to start review task:', err);
            }
          }

          // Route to review workspace - ensure taskId is included in the path
          const reviewRoute = `/projects/${projectId}/review/${actualTaskId}`;
          console.log('Routing to review workspace:', {
            reviewRoute,
            projectId,
            taskId: actualTaskId,
            originalTaskId: taskId,
            projectType: project.type,
            projectIdType: typeof projectId,
            taskIdType: typeof actualTaskId
          });
          // Navigate to review workspace
          router.push(reviewRoute);
          break;
        default:
          console.warn('Unknown project type, defaulting to transcription workspace:', project.type);
          // Default to transcription workspace for unknown types
          router.push(`/workspace/${actualTaskId}`);
      }
    } catch (error) {
      console.error('Failed to route to workspace:', error);
      // Fallback to transcription workspace on error
      router.push(`/workspace/${taskId}`);
    }
  };

  return (
    <TooltipProvider>
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
                  <div className="text-lg font-semibold">Loading your tasks...</div>
                  <div className="text-sm text-muted-foreground">Please wait while we fetch your assigned tasks</div>
                </div>
              </div>
            ) : hasTasks ? (
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[320px]">Task</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                        >
                          Status
                          {renderSortIcon("status")}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Language</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("updatedAt")}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                        >
                          Updated
                          {renderSortIcon("updatedAt")}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {displayTasks.map((task) => (
                      <React.Fragment key={task.id}>
                        <tr className="border-b transition-colors hover:bg-muted/40">
                          <td className="p-4 align-top">
                            <div className="space-y-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="font-medium text-sm text-foreground cursor-help">{task.title}</div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-sm">
                                  <p className="text-balance">{task.title}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground line-clamp-2 cursor-help">{task.description}</p>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-sm">
                                  <p className="text-balance">{task.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <span className="inline-flex min-w-[90px] items-center justify-center rounded-full bg-[#f5f6fb] px-3 py-1 text-xs font-semibold text-[#1f2933]">
                              {formatStatus(task.status)}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <span className="text-sm font-semibold text-[#111827]">{formatCurrency(task.price)}</span>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {task.language}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-sm text-muted-foreground">{formatDate(task.updatedAt)}</td>
                          <td className="p-4 align-middle text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                // Debug logging
                                if (task.type === 'multi') {
                                  const taskId = task.id || task._id;
                                  console.log('[MyTasks] Multi-speaker task clicked:', {
                                    id: taskId,
                                    title: task.title,
                                    type: task.type,
                                    recordingUrl: task.recordingUrl,
                                    status: task.status,
                                    hasRecordingUrl: !!task.recordingUrl,
                                    roomName: task.roomName
                                  });
                                  
                                  // For multi-speaker tasks with recording, show view page
                                  if (task.recordingUrl) {
                                    console.log('[MyTasks] Navigating to view-recording page with task ID:', taskId);
                                    router.push(`/tasks/${taskId}/view-recording`);
                                    return;
                                  }
                                }
                                
                                // For other tasks or multi-speaker tasks without recording
                                handleResumeTask(task.id!);
                              }}
                              disabled={
                                task.status !== "ASSIGNED" && 
                                task.status !== "IN_REVIEW" &&
                                !(task.type === 'multi' && task.recordingUrl)
                              }
                              className="gap-2"
                            >
                              {(() => {
                                // Debug: Log button state for multi-speaker tasks
                                if (task.type === 'multi') {
                                  const shouldShowViewWork = !!task.recordingUrl;
                                  if (!shouldShowViewWork && task.status === 'ASSIGNED') {
                                    console.log('[MyTasks] Multi-speaker task without recordingUrl:', {
                                      id: task.id || task._id,
                                      recordingUrl: task.recordingUrl,
                                      allTaskKeys: Object.keys(task)
                                    });
                                  }
                                }
                                return task.type === 'multi' && task.recordingUrl ? (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    View Work
                                  </>
                                ) : task.status === "ASSIGNED" ? (
                                  <>
                                    <Play className="h-4 w-4" />
                                    Start Work
                                  </>
                                ) : task.status === "IN_REVIEW" ? (
                                  <>
                                    <Play className="h-4 w-4" />
                                    Start Review
                                  </>
                                ) : (
                                  "Not Available"
                                );
                              })()}
                            </Button>
                          </td>
                        </tr>
                        {/* Admin Feedback Row for Cancelled Tasks */}
                        {task.status === "CANCELLED" && task.review?.feedback && (
                          <tr key={`${task.id}-feedback`} className="border-b bg-red-50/50">
                            <td colSpan={6} className="p-4">
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Task Rejected - Admin Feedback</p>
                                  <p className="text-sm text-red-900 whitespace-pre-wrap">{task.review.feedback}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[320px] w-full items-center justify-center">
                <div className="w-full max-w-lg px-6 py-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <Image src="/No data-cuate.svg" alt="No assigned tasks" width={260} height={260} className="object-contain" />
                  </div>
                  <div className="text-foreground text-xl font-semibold">No Tasks Assigned</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You don&apos;t have any tasks assigned to you yet. Claim tasks from the available tasks page to get started.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="default" className="flex-1" size="sm" onClick={() => router.push("/tasks/available")}>
                      Browse Available Tasks
                    </Button>
                    <Button variant="secondary" className="flex-1" size="sm" onClick={() => router.push("/tasks/completed")}>
                      View Completed Tasks
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
                        variant={page === currentPage ? "default" : "outline"}
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
      </div>
    </TooltipProvider>
  );
}