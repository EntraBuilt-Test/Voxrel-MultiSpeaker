'use client';

import { ClipboardList, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';


import { FilterBar } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.ui';
import { ANALYTICS_FILTERS_CONFIG } from '@/constants/analytics.constants';
import { useTaskAnalytics } from '@/mixins/task';


export default function TaskAnalyticPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') || undefined;

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

        // Utility functions
        formatTrend,

        // Event handlers
        handleFilterChange,
        handleResetFilters,
    } = useTaskAnalytics(projectId);

    // UI helper functions
    const renderTrend = (value: number) => {
        const trend = formatTrend(value);
        return (
            <span className={`text-sm ${trend.color}`}>
                {trend.arrow} {trend.displayText}
            </span>
        );
    };

    return (
        <div className="min-h-screen flex flex-col px-4 gap-4 pb-8">
            {/* Filter Section */}
            <FilterBar
                showSearch={false}
                filters={ANALYTICS_FILTERS_CONFIG}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                resetLabel="Reset analytics filters"
                layout="row"
            />

            {/* Stats Cards */}
            <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Tasks */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                <p className="text-2xl font-bold">{analyticsData.totalTasks.count.toLocaleString()}</p>
                                {renderTrend(analyticsData.totalTasks.growth)}
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
                                <p className="text-2xl font-bold">{analyticsData.activeTasks.count}</p>
                                {renderTrend(analyticsData.activeTasks.growth)}
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
                                <p className="text-2xl font-bold">{analyticsData.completedTasks.count.toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{analyticsData.completedTasks.rate}%</span>
                                    {renderTrend(analyticsData.completedTasks.growth)}
                                </div>
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
                                <p className="text-2xl font-bold text-red-600">{analyticsData.overdueTasks.count}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{analyticsData.overdueTasks.rate}%</span>
                                    <span className="text-sm text-red-600">↗ +{analyticsData.overdueTasks.growth}%</span>
                                </div>
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
                                <p className="text-2xl font-bold">{analyticsData.avgCompletionTime.days} days</p>
                                <span className="text-sm text-green-600">↘ {analyticsData.avgCompletionTime.change}hrs</span>
                            </div>
                            <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Task Status Distribution */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Task Status Distribution
                        </CardTitle>
                        <CardDescription>
                            Current breakdown of all tasks by status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer config={statusChartConfig} className="h-[320px] w-full">
                            <BarChart
                                data={statusDistribution}
                                margin={{
                                    top: 16,
                                    left: 16,
                                    right: 16,
                                    bottom: 16,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="status"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.replace('_', ' ')}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar dataKey="tasks" strokeWidth={2} radius={8}>
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Task Creation vs Completion Trend */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Task Creation vs Completion
                        </CardTitle>
                        <CardDescription>
                            Daily task creation and completion over the last 2 weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer config={completionTrendConfig} className="h-[320px] w-full">
                            <AreaChart
                                data={completionTrendData}
                                margin={{
                                    top: 16,
                                    left: 16,
                                    right: 16,
                                    bottom: 16,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <defs>
                                    <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#1d4ed8"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#1d4ed8"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <Area
                                    dataKey="created"
                                    type="monotone"
                                    fill="url(#fillCreated)"
                                    fillOpacity={0.6}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                                <Area
                                    dataKey="completed"
                                    type="monotone"
                                    fill="url(#fillCompleted)"
                                    fillOpacity={0.6}
                                    stroke="#1d4ed8"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Language Distribution */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Tasks by Language
                        </CardTitle>
                        <CardDescription>
                            Distribution of tasks across different languages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer
                            config={languageConfig}
                            className="h-[320px] w-full flex items-center justify-center"
                        >
                            <PieChart width={280} height={280} style={{ background: 'transparent' }}>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={languageDistribution}
                                    dataKey="count"
                                    nameKey="language"
                                    innerRadius={50}
                                    outerRadius={120}
                                    strokeWidth={3}
                                    label={({ language, percent }) => `${language} ${(percent * 100).toFixed(1)}%`}
                                    labelLine={true}
                                >
                                    {languageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Revenue Trend */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Revenue Trend
                        </CardTitle>
                        <CardDescription>
                            Daily revenue generated over the last 2 weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer
                            config={{ revenue: { label: "Revenue", color: "#1d4ed8" } }}
                            className="h-[320px] w-full"
                        >
                            <AreaChart
                                data={revenueTrendData}
                                margin={{
                                    top: 16,
                                    left: 16,
                                    right: 16,
                                    bottom: 16,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        hideLabel
                                        formatter={(value) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Revenue']}
                                    />}
                                />
                                <defs>
                                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#1d4ed8"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#1d4ed8"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <Area
                                    dataKey="revenue"
                                    type="monotone"
                                    fill="url(#fillRevenue)"
                                    fillOpacity={0.6}
                                    stroke="#1d4ed8"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}