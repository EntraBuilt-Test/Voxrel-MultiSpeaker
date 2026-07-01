'use client';

import { Users, DollarSign, Target, User, TrendingUp } from 'lucide-react';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

import { FilterBar } from '@/components/shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.ui';
import { Badge } from '@/components/ui/badge.ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.ui';
import { ANALYTICS_FILTERS_CONFIG } from '@/constants/analytics.constants';
import { useUserAnalytics, TopPerformer } from '@/mixins/user';

export default function UserAnalyticPage() {
    const {
        // State
        filterValues,
        
        // Data
        analyticsData,
        userGrowthData,
        topPerformers,
        
        // Chart config
        userGrowthConfig,
        
        // Utility functions
        formatTrend,
        getTrendIcon,
        
        // Event handlers
        handleFilterChange,
        handleResetFilters,
    } = useUserAnalytics();

    // UI helper functions
    const renderTrend = (value: number) => {
        const trend = formatTrend(value);
        return (
            <span className={`text-sm ${trend.color}`}>
                {trend.arrow} {trend.displayText}
            </span>
        );
    };

    const renderTrendIcon = (trend: string) => {
        const trendType = getTrendIcon(trend);
        switch (trendType) {
            case 'up':
                return <TrendingUp className="h-3 w-3 text-green-600" />;
            case 'down':
                return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
            default:
                return <div className="h-3 w-3 rounded-full bg-yellow-500" />;
        }
    };

    return (
        <div className="max-h-screen flex flex-col px-4 gap-4">
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

            {/* Key Metrics Cards */}
            <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold">{analyticsData.totalUsers.count.toLocaleString()}</p>
                                {renderTrend(analyticsData.totalUsers.growth)}
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue per User */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Revenue per User</p>
                                <p className="text-2xl font-bold">₹{analyticsData.revenuePerUser.amount.toLocaleString()}</p>
                                {renderTrend(analyticsData.revenuePerUser.growth)}
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Task Completion Rate */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                                <p className="text-2xl font-bold">{analyticsData.taskCompletion.rate}%</p>
                                {renderTrend(analyticsData.taskCompletion.growth)}
                            </div>
                            <Target className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks per User */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tasks per User</p>
                                <p className="text-2xl font-bold">{analyticsData.tasksPerUser.average}</p>
                                {renderTrend(analyticsData.tasksPerUser.growth)}
                            </div>
                            <User className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                {/* User Growth Area Chart */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            User Growth Trend
                        </CardTitle>
                        <CardDescription>
                            Total users and new user registrations over the last 2 weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer config={userGrowthConfig} className="h-[280px] w-full">
                            <AreaChart
                                data={userGrowthData}
                                margin={{
                                    top: 12,
                                    left: 12,
                                    right: 12,
                                    bottom: 12,
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
                                    <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
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
                                    <linearGradient id="fillNewUsers" x1="0" y1="0" x2="0" y2="1">
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
                                    dataKey="users"
                                    type="monotone"
                                    fill="url(#fillUsers)"
                                    fillOpacity={0.6}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                                <Area
                                    dataKey="newUsers"
                                    type="monotone"
                                    fill="url(#fillNewUsers)"
                                    fillOpacity={0.6}
                                    stroke="#1d4ed8"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Top Performers Leaderboard */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                            Top Performers
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Users with highest task completion and revenue generation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <div className="space-y-2">
                            {topPerformers.map((performer: TopPerformer, index: number) => (
                                <div key={performer.rank} className="flex items-center justify-between p-2 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                            #{index + 1}
                                        </div>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {performer.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{performer.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {performer.tasksCompleted} tasks • ₹{(performer.revenue || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0">
                                            {performer.completionRate}%
                                            {renderTrendIcon(performer.trend)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}