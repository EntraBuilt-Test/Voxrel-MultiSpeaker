'use client';

import { ClipboardList, Activity, CheckCircle, AlertTriangle, Clock, BarChart3, FolderKanban } from 'lucide-react';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

import { FilterBar } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.ui';
import { ANALYTICS_FILTERS_CONFIG } from '@/constants/analytics.constants';
import { useTaskAnalytics } from '@/mixins/task';
import { projectService } from '@/services/project.service';
import { Project } from '@/types';

export default function SuperAdminAnalyticPage() {
    const [activeTab, setActiveTab] = React.useState('projects');
    const [selectedProjectId, setSelectedProjectId] = React.useState<string | undefined>(undefined);
    const [projects, setProjects] = React.useState<Project[]>([]);

    // Fetch projects for the selector
    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await projectService.getProjects();
                // Depending on service response structure
                const projectsList = response.data?.projects || response.data || [];
                setProjects(projectsList);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };
        fetchProjects();
    }, []);

    const {
        filterValues,
        analyticsData,
        statusDistribution,
        completionTrendData,
        languageDistribution,
        statusChartConfig,
        completionTrendConfig,
        languageConfig,
        isLoading,
        isError,
        error,
        formatTrend,
        handleFilterChange,
        handleResetFilters,
    } = useTaskAnalytics(selectedProjectId);

    const renderTrend = (value: number) => {
        const trend = formatTrend(value);
        return (
            <span className={`text-sm ${trend.color}`}>
                {trend.arrow} {trend.displayText}
            </span>
        );
    };

    // Calculate project trends data
    const projectTrendsData = React.useMemo(() => {
        // Group projects by month
        const monthlyData: Record<string, { created: number; completed: number }> = {};

        projects.forEach(project => {
            const date = new Date(project.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { created: 0, completed: 0 };
            }

            monthlyData[monthKey].created++;

            if (project.status === 'COMPLETED') {
                monthlyData[monthKey].completed++;
            }
        });

        // Convert to array and sort by date
        return Object.entries(monthlyData)
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                ...data
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-12); // Last 12 months
    }, [projects]);

    if (isLoading && projects.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">Loading system analytics...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="projects">Project Analytics</TabsTrigger>
                    <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
                </TabsList>

                {/* Project Analytics Tab */}
                <TabsContent value="projects" className="space-y-6 mt-6">
                    {/* Project Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                                        <p className="text-2xl font-bold">{projects.length}</p>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-full">
                                        <FolderKanban className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                                        <p className="text-2xl font-bold">
                                            {projects.filter(p => p.status === 'ACTIVE').length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-full">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1 inline-block" />
                                        <span className="sr-only">Active</span>
                                        <FolderKanban className="h-5 w-5 text-green-600 inline-block" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {projects.filter(p => p.status === 'COMPLETED').length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-full">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Project Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Status Distribution</CardTitle>
                                <CardDescription>Breakdown of projects by status</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] p-6">
                                <ChartContainer config={{
                                    active: { label: 'Active', color: '#22c55e' },
                                    completed: { label: 'Completed', color: '#3b82f6' },
                                    inactive: { label: 'Inactive', color: '#94a3b8' },
                                    archived: { label: 'Archived', color: '#64748b' },
                                }} className="h-full w-full !aspect-auto">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Active', value: projects.filter(p => p.status === 'ACTIVE').length, fill: '#22c55e' },
                                                { name: 'Completed', value: projects.filter(p => p.status === 'COMPLETED').length, fill: '#3b82f6' },
                                                { name: 'Inactive', value: projects.filter(p => p.status === 'INACTIVE').length, fill: '#94a3b8' },
                                                { name: 'Archived', value: projects.filter(p => p.status === 'ARCHIVED').length, fill: '#64748b' },
                                            ].filter(item => item.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[...Array(4)].map((_, index) => (
                                                <Cell key={`cell-${index}`} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Project Type Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Type Distribution</CardTitle>
                                <CardDescription>Projects by type</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] p-6">
                                <ChartContainer config={{
                                    count: { label: 'Projects', color: '#3b82f6' },
                                }} className="h-full w-full !aspect-auto">
                                    <BarChart data={[
                                        { type: 'Audio', count: projects.filter(p => p.type === 'AUDIO_RECORDING').length },
                                        { type: 'Transcription', count: projects.filter(p => p.type === 'TRANSCRIPTION').length },
                                        { type: 'Review', count: projects.filter(p => p.type === 'REVIEW').length },
                                        { type: 'Image', count: projects.filter(p => p.type === 'IMAGE_ANNOTATION').length },
                                        { type: 'Video', count: projects.filter(p => p.type === 'VIDEO_ANNOTATION').length },
                                    ].filter(item => item.count > 0)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="type" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Project Creation Trends */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Project Creation Trends</CardTitle>
                                <CardDescription>Projects created over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] p-6">
                                <ChartContainer config={{
                                    created: { label: 'Created', color: '#3b82f6' },
                                    completed: { label: 'Completed', color: '#22c55e' },
                                }} className="h-full w-full !aspect-auto">
                                    <AreaChart data={projectTrendsData}>
                                        <defs>
                                            <linearGradient id="colorProjectCreated" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProjectCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProjectCreated)" />
                                        <Area type="monotone" dataKey="completed" stroke="#22c55e" fillOpacity={1} fill="url(#colorProjectCompleted)" />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Task Analytics Tab */}
                <TabsContent value="tasks" className="space-y-6 mt-6">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-end">
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
                                        <SelectItem key={project.id || project._id} value={project.id || project._id || ""}>
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
                            onFilterChange={(key, val) => handleFilterChange(key as string, val)}
                            onReset={handleResetFilters}
                            resetLabel="Reset"
                            layout="row"
                        />
                    </div>

                    {isError ? (
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardContent className="py-10 text-center">
                                <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
                                <p className="text-destructive font-semibold">Failed to load analytics</p>
                                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Task Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                                <p className="text-2xl font-bold">{analyticsData?.totalTasks?.count?.toLocaleString() || 0}</p>
                                                {renderTrend(analyticsData?.totalTasks?.growth || 0)}
                                            </div>
                                            <ClipboardList className="h-8 w-8 text-blue-600 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                                                <p className="text-2xl font-bold">{analyticsData?.activeTasks?.count || 0}</p>
                                                {renderTrend(analyticsData?.activeTasks?.growth || 0)}
                                            </div>
                                            <Activity className="h-8 w-8 text-orange-600 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                                                <p className="text-2xl font-bold">{(analyticsData?.completedTasks?.count || 0).toLocaleString()}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{analyticsData?.completedTasks?.rate || 0}% rate</span>
                                                    {renderTrend(analyticsData?.completedTasks?.growth || 0)}
                                                </div>
                                            </div>
                                            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                                                <p className="text-2xl font-bold text-red-600">{analyticsData?.overdueTasks?.count || 0}</p>
                                                <span className="text-xs text-muted-foreground">{analyticsData?.overdueTasks?.rate || 0}% of total</span>
                                            </div>
                                            <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                                                <p className="text-2xl font-bold">{analyticsData?.avgCompletionTime?.days || 0} days</p>
                                                <span className="text-xs text-green-600">Improving trend</span>
                                            </div>
                                            <Clock className="h-8 w-8 text-purple-600 opacity-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Task Status Distribution</CardTitle>
                                        <CardDescription>Global status breakdown</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px] p-6">
                                        <ChartContainer config={statusChartConfig} className="h-full w-full [&>div]:!aspect-auto">
                                            <PieChart>
                                                <Pie
                                                    data={statusDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="tasks"
                                                >
                                                    {statusDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                            </PieChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Language Distribution</CardTitle>
                                        <CardDescription>Task volume by language</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px] p-6">
                                        <ChartContainer config={languageConfig} className="h-full w-full [&>div]:!aspect-auto">
                                            <BarChart data={languageDistribution}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="language" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Task Completion Trends</CardTitle>
                                        <CardDescription>Daily creation vs completion</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[350px] p-6">
                                        <ChartContainer config={completionTrendConfig} className="h-full w-full [&>div]:!aspect-auto">
                                            <AreaChart data={completionTrendData}>
                                                <defs>
                                                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
                                                <Area type="monotone" dataKey="completed" stroke="#1d4ed8" fillOpacity={1} fill="url(#colorCompleted)" />
                                            </AreaChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
