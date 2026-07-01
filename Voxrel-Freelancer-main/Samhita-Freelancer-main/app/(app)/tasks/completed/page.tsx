"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import FilterBar from "@/components/shared/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { DURATION_OPTIONS, LANGUAGES } from "@/constants/tasks";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useTaskStore, useProjectStore } from "@/stores";

const TASKS_PER_PAGE = 10;

export default function CompletedTasksPage() {
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
  const { selectedProject } = useProjectStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [languageSelection, setLanguageSelection] = useState(selectedLanguages[0] ?? "all");
  const [durationSelection, setDurationSelection] = useState(filters.duration ?? "all");
  const [sortConfig, setSortConfig] = useState<{ field: "completedAt" | "price" | null; direction: "asc" | "desc" }>({
    field: null,
    direction: "asc",
  });
  const fetchRef = useRef<string>("");
  const lastAppliedSearchRef = useRef(filters.search?.trim() ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    if (error) {
      console.error("Completed Tasks error:", error);
    }
  }, [error]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const languagesKey = useMemo(() => selectedLanguages.join(","), [selectedLanguages]);

  useEffect(() => {
    const fetchKey = `${currentPage}-${languagesKey}-${filtersKey}-COMPLETED`;
    if (fetchRef.current === fetchKey || isLoading) {
      return;
    }

    fetchRef.current = fetchKey;

    // Add projectId to filters if a project is selected
    const taskFilters = {
      ...filters,
      status: "COMPLETED",
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

  const completedTasks = useMemo(
    () => {
      // DEBUG: Log tasks to see if review is present
      // const tasksWithReviews = tasks.filter(t => t.status === "COMPLETED" && t.review);
      // if (tasksWithReviews.length > 0) console.log('Tasks with reviews:', tasksWithReviews);

      return tasks.filter((task) => task.status === "COMPLETED");
    },
    [tasks]
  );

  const displayTasks = useMemo(() => {
    if (!sortConfig.field) {
      return completedTasks;
    }
    const sorted = [...completedTasks];
    sorted.sort((a, b) => {
      if (sortConfig.field === "price") {
        const comparison = (a.price ?? 0) - (b.price ?? 0);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }
      const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    });
    return sorted;
  }, [completedTasks, sortConfig]);

  const hasTasks = displayTasks.length > 0;

  const formatStatus = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatCurrency = (value: number, earnings?: string) => {
    if (earnings) return earnings;
    return `₹${(value ?? 0).toLocaleString("en-IN")}`;
  };

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

  const handleSort = (field: "completedAt" | "price") => {
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

  const renderSortIcon = (field: "completedAt" | "price") => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/60" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-muted-foreground" />;
    }
    return <ArrowDown className="h-4 w-4 text-muted-foreground" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  console.log('CompletedTasksPage: Rendering. isLoading:', isLoading);
  console.log('CompletedTasksPage: Tasks count:', tasks.length);
  if (tasks.length > 0) {
    console.log('CompletedTasksPage: First task:', tasks[0]);
    console.log('CompletedTasksPage: First task review:', tasks[0].review);
  }

  return (
    <div className="w-full space-y-6">
      <FilterBar
        searchQuery={searchInput}
        onSearch={handleSearchChange}
        searchPlaceholder="Search completed tasks..."
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
                <div className="text-lg font-semibold">Loading completed tasks...</div>
                <div className="text-sm text-muted-foreground">Please wait while we fetch your completed work</div>
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
                        onClick={() => handleSort("price")}
                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                      >
                        Earnings
                        {renderSortIcon("price")}
                      </Button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Language</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("completedAt")}
                        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                      >
                        Completed
                        {renderSortIcon("completedAt")}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {displayTasks.map((task) => (
                    <>
                      <tr key={task.id} className="border-b transition-colors hover:bg-muted/40">
                        <td className="p-4 align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-foreground">{task.title}</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="text-sm font-semibold text-[#111827]">
                            {formatCurrency(task.price, task.earnings)}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {task.language}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          {task.completedAt ? (
                            <span className="text-sm text-muted-foreground">{formatDate(task.completedAt)}</span>
                          ) : (
                            <span className="inline-flex min-w-[90px] items-center justify-center rounded-full bg-[#f5f6fb] px-3 py-1 text-xs font-semibold text-[#1f2933]">
                              {formatStatus(task.status ?? "COMPLETED")}
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Admin Feedback Row */}
                      {task.review?.feedback && (
                        <tr key={`${task.id}-feedback`} className="border-b bg-blue-50/50">
                          <td colSpan={4} className="p-4">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Admin Feedback</p>
                                <p className="text-sm text-blue-900 whitespace-pre-wrap">{task.review.feedback}</p>
                                {task.review.rating && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <span className="text-xs text-blue-700">Rating:</span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={`h-4 w-4 ${star <= (task.review?.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    ))}
                                    <span className="text-xs text-blue-700 ml-1">{task.review.rating}/5</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[320px] w-full items-center justify-center">
              <div className="w-full max-w-lg px-6 py-6 text-center space-y-4">
                <div className="flex justify-center">
                  <Image src="/No data-cuate.svg" alt="No completed tasks" width={260} height={260} className="object-contain" />
                </div>
                <div className="text-foreground text-xl font-semibold">No Completed Tasks</div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  You haven&apos;t completed any tasks yet. Start working on available tasks to build your portfolio.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="default" className="flex-1" size="sm">
                    Browse Available Tasks
                  </Button>
                  <Button variant="secondary" className="flex-1" size="sm">
                    View In-Progress Tasks
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

      {/* DEBUG SECTION - REMOVE AFTER FIXING */}
      <Card className="bg-slate-50 border-dashed border-2 border-slate-300">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold mb-2">Debug Info (First Task)</h3>
          <pre className="text-xs overflow-auto max-h-60 p-2 bg-white rounded border">
            {displayTasks.length > 0
              ? JSON.stringify({
                id: displayTasks[0].id,
                _id: displayTasks[0]._id,
                title: displayTasks[0].title,
                hasReviewWrapper: 'review' in displayTasks[0],
                review: displayTasks[0].review
              }, null, 2)
              : 'No tasks loaded'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}