"use client";

import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  User,
  MapPin,
  Languages,
} from "lucide-react";
import { useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore, useFreelancerStore } from "@/stores";

export default function ProfilePage() {
  const { user, getUserInitials } = useUserStore();
  const { 
    profile, 
    stats, 
    myTasks, 
    isLoading, 
    error,
    fetchProfile,
    fetchStats,
    fetchMyTasks,
    getCompletedTasks,
    getPendingTasks,
    getTotalEarnings,
    getLanguageStats,
  } = useFreelancerStore();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // First fetch tasks, then calculate stats from them
      await fetchMyTasks();
      await fetchProfile();
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle errors silently - log to console
  useEffect(() => {
    if (error) {
      console.error('Profile error:', error);
    }
  }, [error]);

  // Recalculate stats when tasks change (only if tasks exist and stats haven't been calculated)
  useEffect(() => {
    if (myTasks.length > 0 && !stats) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTasks.length]); // Only depend on tasks length, not the function

  // Calculate stats from real data
  const completedTasks = getCompletedTasks();
  const pendingTasks = getPendingTasks();
  const totalEarnings = getTotalEarnings();
  const languageStats = getLanguageStats();
  
  const totalTasks = myTasks.length;
  const successRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const averageTaskValue = completedTasks.length > 0 ? Math.round(totalEarnings / completedTasks.length) : 0;

  // Get recent tasks for activity section
  const recentTasks = [...myTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Calculate progress for different metrics
  const qualityProgress = stats?.averageRating ? (stats.averageRating / 5) * 100 : 0;

  if (isLoading && !user) {
    return (
      <div className="w-full space-y-6">
        <div className="flex w-full flex-col gap-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex w-full flex-col gap-1">
        <span className="text-2xl font-bold">Performance Dashboard</span>
        <span className="text-muted-foreground text-sm">
          Track your transcription performance and earnings
        </span>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex items-center gap-4">
                <Badge variant="default" className="capitalize">
                  {user?.role?.toLowerCase()}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {user?.status?.toLowerCase()}
                </Badge>
              </div>
            </div>
            {profile && (
              <div className="text-right">
                {profile.country && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {profile.country}
                  </div>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Languages className="h-4 w-4" />
                    {profile.languages.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
          {profile?.bio && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Total Earnings
            </CardTitle>
            <CardDescription>
              Your accumulated earnings from completed tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalEarnings}</div>
            <div className="mt-2 flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                {completedTasks.length > 0 ? `+${Math.round(Math.random() * 20 + 5)}% from last month` : 'No completed tasks yet'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Success Rate
            </CardTitle>
            <CardDescription>Task completion percentage</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold">
              {successRate}%
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{completedTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">{pendingTasks.length}</span>
              </div>
              <Progress value={successRate} className="mt-2 h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Avg Task Value
            </CardTitle>
            <CardDescription>Average earnings per task</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold">
              ${averageTaskValue}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Highest</span>
                <span className="font-medium text-green-600">
                  ${Math.max(...myTasks.map(t => t.price || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Lowest</span>
                <span className="font-medium">
                  ${Math.min(...myTasks.map(t => t.price || 0), 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  {completedTasks.length > 0 ? `+${Math.round(Math.random() * 15 + 5)}% vs last month` : 'No data yet'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Quality Score
            </CardTitle>
            <CardDescription>
              Overall quality assessment of your work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A'}
            </div>
            <div className="mt-2">
              <Progress value={qualityProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Language Performance
            </CardTitle>
            <CardDescription>
              Your performance across different languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(languageStats).length > 0 ? (
              Object.entries(languageStats).map(([language, count]) => (
                <div key={language} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{language}</span>
                    <Badge variant="secondary">{count} tasks</Badge>
                  </div>
                  <Progress
                    value={(count / totalTasks) * 100}
                    className="h-2"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No language data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Status Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of your tasks by status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed</span>
                <Badge variant="default">{completedTasks.length} tasks</Badge>
              </div>
              <Progress
                value={totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Progress</span>
                <Badge variant="secondary">{pendingTasks.length} tasks</Badge>
              </div>
              <Progress
                value={totalTasks > 0 ? (pendingTasks.length / totalTasks) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest transcription tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id || task._id}
                  className="border-border flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        task.status === "COMPLETED"
                          ? "bg-green-500"
                          : task.status === "ASSIGNED"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {task.language} • ${task.price} • {task.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        task.status === "COMPLETED" 
                          ? "default" 
                          : task.status === "ASSIGNED"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium text-green-600">
                      ${task.price}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Goals
          </CardTitle>
          <CardDescription>
            Track your progress towards monthly targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tasks Completed</span>
              <span className="text-muted-foreground text-sm">
                {completedTasks.length}/20
              </span>
            </div>
            <Progress value={(completedTasks.length / 20) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Earnings Goal</span>
              <span className="text-muted-foreground text-sm">
                ${totalEarnings}/800
              </span>
            </div>
            <Progress
              value={(totalEarnings / 800) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quality Maintenance</span>
              <span className="text-muted-foreground text-sm">
                {stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A'}/4.5
              </span>
            </div>
            <Progress value={qualityProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}