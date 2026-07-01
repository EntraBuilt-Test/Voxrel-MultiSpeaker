'use client';

import { ClipboardList, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

import { FilterBar } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { ANALYTICS_FILTERS_CONFIG } from '@/constants/analytics.constants';
import { useTaskAnalytics } from '@/mixins/task';
import { projectService } from '@/services/project.service';

export default function ProjectAnalyticPage() {
    const [selectedProjectId, setSelectedProjectId] = React.useState<string | undefined>(undefined);
    const [projects, setProjects] = React.useState<any[]>([]);

    // Fetch projects for the selector
    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await projectService.getProjects();
                if (response.success) {
                    setProjects(response.data.projects);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };
        fetchProjects();
    }, []);

    // For project analytics, we can filter by a specific projectId
    const {
        // State
        filterValues,

        // Data
        analyticsData,
        statusDistribution,
        completionTrendData,
        revenueTrendData,
        languageDistribution,

        // Chart configs
        statusChartConfig,
        completionTrendConfig,
        languageConfig,

        // Loading and error states
        isLoading,
        isError,
        error,

        // Utility functions
        formatTrend,

        // Event handlers
        handleFilterChange,
        handleResetFilters,
    } = useTaskAnalytics(selectedProjectId);

    // UI helper functions
    const renderTrend = (value: number) => {
        const trend = formatTrend(value);
        return (
            <span className={`text-sm ${trend.color}`}>
                {trend.arrow} {trend.displayText}
            </span>
        );
    };

    // Show loading state
    if (isLoading && projects.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col px-4 gap-4 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Project Analytics</h1>
                    <p className="text-muted-foreground">Track performance and throughput across projects.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="w-full sm:w-[200px]">
                        <Select
                            value={selectedProjectId || "all"}
                            onValueChange={(value) => setSelectedProjectId(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <FilterBar
                        showSearch={false}
                        filters={ANALYTICS_FILTERS_CONFIG}
                        filterValues={filterValues}
                        onFilterChange={handleFilterChange}
                        onReset={() => {
                            setSelectedProjectId(undefined);
                            handleResetFilters();
                        }}
                        resetLabel="Reset"
                        layout="row"
                    />
                </div>
            </div>

            {isError ? (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="text-center">
                        <p className="text-destructive font-semibold">Failed to load analytics</p>
                        {error && <p className="text-sm text-muted-foreground mt-2">{error}</p>}
                    </div>
                </div>
            ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading data...</div>
                </div>
            ) : (
                <>
                    {/* REST OF THE UI */}


                    {/* Stats Cards */}
                    <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Total Tasks */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                        <p className="text-2xl font-bold">{analyticsData?.totalTasks?.count?.toLocaleString() || 0}</p>
                                        {analyticsData?.totalTasks && renderTrend(analyticsData.totalTasks.growth)}
                                    </div>
                                    <ClipboardList className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Tasks */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                                        <p className="text-2xl font-bold">{analyticsData?.activeTasks?.count || 0}</p>
                                        {analyticsData?.activeTasks && renderTrend(analyticsData.activeTasks.growth)}
                                    </div>
                                    <Activity className="h-8 w-8 text-orange-600" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Completed Tasks */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                                        <p className="text-2xl font-bold">{(analyticsData?.completedTasks?.count || 0).toLocaleString()}</p>
                                        {analyticsData?.completedTasks && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">{analyticsData.completedTasks.rate}%</span>
                                                {renderTrend(analyticsData.completedTasks.growth)}
                                            </div>
                                        )}
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overdue Tasks */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                                        <p className="text-2xl font-bold text-red-600">{analyticsData?.overdueTasks?.count || 0}</p>
                                        {analyticsData?.overdueTasks && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">{analyticsData.overdueTasks.rate}%</span>
                                                <span className="text-sm text-red-600">↗ +{analyticsData.overdueTasks.growth}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Average Completion Time */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                                        <p className="text-2xl font-bold">{analyticsData?.avgCompletionTime?.days || 0} days</p>
                                        {analyticsData?.avgCompletionTime && (
                                            <span className="text-sm text-green-600">↘ {analyticsData.avgCompletionTime.change}hrs</span>
                                        )}
                                    </div>
                                    <Clock className="h-8 w-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Status Distribution</CardTitle>
                                <CardDescription>Breakdown of tasks by status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {statusDistribution && statusDistribution.length > 0 ? (
                                    <ChartContainer config={statusChartConfig} className="h-[320px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                        </PieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground">
                                        <p>No status distribution data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Language Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Language Distribution</CardTitle>
                                <CardDescription>Tasks breakdown by language</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {languageDistribution && languageDistribution.length > 0 ? (
                                    <ChartContainer config={languageConfig} className="h-[320px] w-full">
                                        <BarChart data={languageDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="language" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="count" fill="#8884d8" />
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground">
                                        <p>No language distribution data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Completion Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Completion Trends</CardTitle>
                                <CardDescription>Task completion over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {completionTrendData && completionTrendData.length > 0 ? (
                                    <ChartContainer config={completionTrendConfig} className="h-[320px] w-full">
                                        <AreaChart data={completionTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area type="monotone" dataKey="completed" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                            <Area type="monotone" dataKey="pending" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground">
                                        <p>No completion trend data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Revenue Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>Revenue generated over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {revenueTrendData && revenueTrendData.length > 0 ? (
                                    <ChartContainer config={completionTrendConfig} className="h-[320px] w-full">
                                        <AreaChart data={revenueTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground">
                                        <p>No revenue trend data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

