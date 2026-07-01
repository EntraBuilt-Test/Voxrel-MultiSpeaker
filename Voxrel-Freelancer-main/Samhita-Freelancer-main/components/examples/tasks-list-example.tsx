"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/queries/use-tasks";
import { Task } from "@/types";

/**
 * Example component showing how to use React Query hooks
 * This demonstrates:
 * - Fetching data with useTasks
 * - Loading and error states
 * - Mutations (delete, update status)
 * - Pagination
 */
export function TasksListExample() {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
    });

    // Query for fetching tasks
    const { data, isLoading, error, isFetching } = useTasks(page, 10, filters);

    // Mutations
    // const deleteTask = useDeleteTask(); // TODO: Implement deleteTask method
    // const updateStatus = useUpdateTaskStatus(); // TODO: Implement updateTaskStatus method

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">Error: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="rounded border px-3 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="rounded border px-3 py-2"
                    >
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </CardContent>
            </Card>

            {/* Tasks List */}
            <div className="space-y-4">
                {isFetching && <p className="text-sm text-muted-foreground">Updating...</p>}

                {data?.data.tasks.map((task: Task) => (
                    <Card key={task.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{task.title}</span>
                                <span className="text-sm font-normal text-muted-foreground">{task.status}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-sm text-muted-foreground">{task.description}</p>

                            <div className="flex gap-2">
                                {/* Update status button disabled - TODO: Implement updateTaskStatus method */}
                                {/* <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        updateStatus.mutate({
                                            id: task.id,
                                            status: "completed",
                                        })
                                    }
                                    disabled={updateStatus.isPending}
                                >
                                    {updateStatus.isPending ? "Updating..." : "Mark Complete"}
                                </Button> */}

                                {/* Delete button disabled - TODO: Implement deleteTask method */}
                                {/* <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteTask.mutate(task.id)}
                                    disabled={deleteTask.isPending}
                                >
                                    {deleteTask.isPending ? "Deleting..." : "Delete"}
                                </Button> */}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {data?.data.pagination && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {data.data.pagination.currentPage} of {data.data.pagination.totalPages} (
                        {data.data.pagination.totalTasks} total tasks)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= data.data.pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
