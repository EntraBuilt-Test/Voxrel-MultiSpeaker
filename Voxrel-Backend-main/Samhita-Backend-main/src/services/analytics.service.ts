import Task from '@/models/task.model.js';
import User from '@/models/user.model.js';
import Project from '@/models/project.model.js';
import { TaskStatus } from '@/types/task.interface.js';
import ApiError from '@/utils/api-error.utility.js';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

// --- Task Analytics ---

export const getTaskSummary = async (dateFrom: string, dateTo: string, projectId?: string) => {
  // Handle empty strings by using default dates
  let startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  let endDate = dateTo ? new Date(dateTo) : new Date(); // now

  // If dateTo is a date-only string (YYYY-MM-DD), set it to end of day
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  }

  // If dateFrom is a date-only string, ensure it's at start of day
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0); // Set to start of day
  }

  // Get previous period for growth calculation
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevEndDate = new Date(startDate);

  const query: any = { createdAt: { $gte: startDate, $lte: endDate } };
  const prevQuery: any = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };

  if (projectId && Types.ObjectId.isValid(projectId)) {
    const projectObjectId = new Types.ObjectId(projectId);
    query.projectId = projectObjectId;
    prevQuery.projectId = projectObjectId;
  }

  const [
    totalTasks,
    activeTasks,
    completedTasks,
    overdueTasks,
    prevTotalTasks,
    prevActiveTasks,
    prevCompletedTasks,
    prevOverdueTasks,
    avgCompletionTime,
  ] = await Promise.all([
    Task.countDocuments(query),
    Task.countDocuments({
      ...query,
      status: {
        $in: [
          TaskStatus.OPEN,
          TaskStatus.PENDING_APPROVAL,
          TaskStatus.ASSIGNED,
          TaskStatus.SUBMITTED,
          TaskStatus.IN_REVIEW,
        ],
      },
    }),
    Task.countDocuments({
      ...query,
      status: TaskStatus.COMPLETED,
    }),
    Task.countDocuments({
      ...query,
      deadline: { $lt: new Date() },
      status: { $ne: TaskStatus.COMPLETED },
    }),
    Task.countDocuments(prevQuery),
    Task.countDocuments({
      ...prevQuery,
      status: {
        $in: [
          TaskStatus.OPEN,
          TaskStatus.PENDING_APPROVAL,
          TaskStatus.ASSIGNED,
          TaskStatus.SUBMITTED,
          TaskStatus.IN_REVIEW,
        ],
      },
    }),
    Task.countDocuments({
      ...prevQuery,
      status: TaskStatus.COMPLETED,
    }),
    Task.countDocuments({
      ...prevQuery,
      deadline: { $lt: new Date() },
      status: { $ne: TaskStatus.COMPLETED },
    }),
    calculateAvgCompletionTime(startDate, endDate, projectId),
  ]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  return {
    totalTasks: {
      count: totalTasks,
      growth: calculateGrowth(totalTasks, prevTotalTasks),
    },
    activeTasks: {
      count: activeTasks,
      growth: calculateGrowth(activeTasks, prevActiveTasks),
    },
    completedTasks: {
      count: completedTasks,
      rate: totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0,
      growth: calculateGrowth(completedTasks, prevCompletedTasks),
    },
    overdueTasks: {
      count: overdueTasks,
      rate: totalTasks > 0 ? Number(((overdueTasks / totalTasks) * 100).toFixed(1)) : 0,
      growth: calculateGrowth(overdueTasks, prevOverdueTasks),
    },
    avgCompletionTime: {
      days: avgCompletionTime,
      change: -0.8, // Placeholder - would need historical data
    },
  };
};

export const getTaskStatusDistribution = async (
  dateFrom: string,
  dateTo: string,
  projectId?: string
) => {
  // Handle empty strings by using default dates
  let startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  let endDate = dateTo ? new Date(dateTo) : new Date(); // now

  // If dateTo is a date-only string (YYYY-MM-DD), set it to end of day
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  }

  // If dateFrom is a date-only string, ensure it's at start of day
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0); // Set to start of day
  }

  const query: any = { createdAt: { $gte: startDate, $lte: endDate } };
  if (projectId && Types.ObjectId.isValid(projectId)) {
    query.projectId = new Types.ObjectId(projectId);
  }

  const [pending, inProgress, completed, cancelled] = await Promise.all([
    Task.countDocuments({
      ...query,
      status: { $in: [TaskStatus.OPEN, TaskStatus.PENDING_APPROVAL] },
    }),
    Task.countDocuments({
      ...query,
      status: { $in: [TaskStatus.ASSIGNED, TaskStatus.SUBMITTED, TaskStatus.IN_REVIEW] },
    }),
    Task.countDocuments({
      ...query,
      status: TaskStatus.COMPLETED,
    }),
    Task.countDocuments({
      ...query,
      status: 'CANCELLED', // Assuming cancelled status exists
    }),
  ]);

  return [
    { status: 'pending', tasks: pending },
    { status: 'in_progress', tasks: inProgress },
    { status: 'completed', tasks: completed },
    { status: 'cancelled', tasks: cancelled },
  ];
};

export const getTaskTrends = async (
  type: string,
  dateFrom: string,
  dateTo: string,
  projectId?: string
) => {
  // Handle empty strings by using default dates
  let startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  let endDate = dateTo ? new Date(dateTo) : new Date(); // now

  // If dateTo is a date-only string (YYYY-MM-DD), set it to end of day
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  }

  // If dateFrom is a date-only string, ensure it's at start of day
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0); // Set to start of day
  }

  const match: any = { createdAt: { $gte: startDate, $lte: endDate } };
  if (projectId && Types.ObjectId.isValid(projectId)) {
    match.projectId = new Types.ObjectId(projectId);
  }

  if (type === 'completion') {
    const trends = await Task.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          created: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', TaskStatus.COMPLETED] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    return trends.map(trend => ({
      date: `${getMonthName(trend._id.month)} ${trend._id.day}`,
      created: trend.created,
      completed: trend.completed,
    }));
  }

  if (type === 'revenue') {
    const trends = await Task.aggregate([
      {
        $match: {
          ...match,
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$price' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    return trends.map(trend => ({
      date: `${getMonthName(trend._id.month)} ${trend._id.day}`,
      revenue: trend.revenue,
    }));
  }

  throw new ApiError(400, 'Invalid trend type. Must be "completion" or "revenue"');
};

export const getLanguageDistribution = async (
  dateFrom: string,
  dateTo: string,
  projectId?: string
) => {
  // Handle empty strings by using default dates
  let startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  let endDate = dateTo ? new Date(dateTo) : new Date(); // now

  // If dateTo is a date-only string (YYYY-MM-DD), set it to end of day
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  }

  // If dateFrom is a date-only string, ensure it's at start of day
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0); // Set to start of day
  }

  const match: any = { createdAt: { $gte: startDate, $lte: endDate } };
  if (projectId && Types.ObjectId.isValid(projectId)) {
    match.projectId = new Types.ObjectId(projectId);
  }

  const distribution = await Task.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return distribution.map(item => ({
    language: capitalizeFirst(item._id),
    count: item.count,
  }));
};

// --- User Analytics ---

// eslint-disable-next-line max-lines-per-function
export const getUserSummary = async (dateFrom: string, dateTo: string, projectId?: string) => {
  // Handle empty strings by using default dates
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = dateTo ? new Date(dateTo) : new Date(); // now

  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevEndDate = new Date(startDate);

  // Filter setup
  const userFilter: any = {};
  const taskFilter: any = {};

  if (projectId && Types.ObjectId.isValid(projectId)) {
    taskFilter.projectId = new Types.ObjectId(projectId);
    const project = await Project.findById(projectId).select('users');
    if (project?.users) {
      userFilter._id = { $in: project.users };
    } else {
      // If project not found or no users, ensure 0 results
      userFilter._id = { $in: [] };
    }
  }

  const [
    totalUsers,
    prevTotalUsers,
    _newUsersInPeriod,
    _prevNewUsers,
    totalRevenue,
    prevTotalRevenue,
    completedTasksInPeriod,
    totalTasksInPeriod,
    prevCompletedTasks,
    prevTotalTasks,
    tasksPerUser,
    prevTasksPerUser,
  ] = await Promise.all([
    // Total users (all time up to end date)
    User.countDocuments({
      ...userFilter,
      createdAt: { $lte: endDate },
    }),
    // Total users up to previous period end
    User.countDocuments({
      ...userFilter,
      createdAt: { $lte: prevEndDate },
    }),
    // New users in current period
    User.countDocuments({
      ...userFilter,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    // New users in previous period
    User.countDocuments({
      ...userFilter,
      createdAt: { $gte: prevStartDate, $lte: prevEndDate },
    }),
    // Total revenue in current period
    Task.aggregate([
      {
        $match: {
          ...taskFilter,
          updatedAt: { $gte: startDate, $lte: endDate },
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
    // Total revenue in previous period
    Task.aggregate([
      {
        $match: {
          ...taskFilter,
          updatedAt: { $gte: prevStartDate, $lte: prevEndDate },
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
    // Completed tasks in current period
    Task.countDocuments({
      ...taskFilter,
      updatedAt: { $gte: startDate, $lte: endDate },
      status: TaskStatus.COMPLETED,
    }),
    // Total tasks in current period
    Task.countDocuments({
      ...taskFilter,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    // Completed tasks in previous period
    Task.countDocuments({
      ...taskFilter,
      updatedAt: { $gte: prevStartDate, $lte: prevEndDate },
      status: TaskStatus.COMPLETED,
    }),
    // Total tasks in previous period
    Task.countDocuments({
      ...taskFilter,
      createdAt: { $gte: prevStartDate, $lte: prevEndDate },
    }),
    // Tasks per user in current period
    calculateTasksPerUser(startDate, endDate, projectId),
    // Tasks per user in previous period
    calculateTasksPerUser(prevStartDate, prevEndDate, projectId),
  ]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  const currentCompletionRate =
    totalTasksInPeriod > 0
      ? Number(((completedTasksInPeriod / totalTasksInPeriod) * 100).toFixed(1))
      : 0;
  const prevCompletionRate =
    prevTotalTasks > 0 ? Number(((prevCompletedTasks / prevTotalTasks) * 100).toFixed(1)) : 0;

  return {
    totalUsers: {
      count: totalUsers,
      growth: calculateGrowth(totalUsers, prevTotalUsers),
    },
    revenuePerUser: {
      amount: totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0,
      growth: calculateGrowth(
        totalRevenue / (totalUsers || 1),
        prevTotalRevenue / (prevTotalUsers || 1)
      ),
    },
    taskCompletion: {
      rate: currentCompletionRate,
      growth: calculateGrowth(currentCompletionRate, prevCompletionRate),
    },
    tasksPerUser: {
      average: tasksPerUser,
      change: calculateGrowth(tasksPerUser, prevTasksPerUser),
    },
  };
};

export const getUserGrowthTrend = async (dateFrom: string, dateTo: string, projectId?: string) => {
  // Handle empty strings by using default dates
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = dateTo ? new Date(dateTo) : new Date(); // now

  const match: any = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (projectId && Types.ObjectId.isValid(projectId)) {
    const project = await Project.findById(projectId).select('users');
    if (project?.users) {
      match._id = { $in: project.users };
    } else {
      match._id = { $in: [] };
    }
  }

  const trends = await User.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        newUsers: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
  ]);

  let cumulativeTotal = 0;

  if (projectId && Types.ObjectId.isValid(projectId)) {
    const project = await Project.findById(projectId).select('users');
    const projectUsers = project?.users || [];
    cumulativeTotal = await User.countDocuments({
      createdAt: { $lt: startDate },
      _id: { $in: projectUsers },
    });
  } else {
    cumulativeTotal = await User.countDocuments({
      createdAt: { $lt: startDate },
    });
  }

  return trends.map(trend => {
    cumulativeTotal += trend.newUsers;
    return {
      date: `${getMonthName(trend._id.month)} ${trend._id.day}`,
      totalUsers: cumulativeTotal,
      newUsers: trend.newUsers,
    };
  });
};

export const getUserStats = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const [totalTasksCompleted, currentTasksClaimed, totalRevenueEarned, tasksInProgress] =
    await Promise.all([
      // Total tasks completed by user (all time)
      Task.countDocuments({
        claimedById: userId,
        status: TaskStatus.COMPLETED,
      }),
      // Current tasks under claim (not completed)
      Task.countDocuments({
        claimedById: userId,
        status: {
          $in: [
            TaskStatus.PENDING_APPROVAL,
            TaskStatus.ASSIGNED,
            TaskStatus.SUBMITTED,
            TaskStatus.IN_REVIEW,
          ],
        },
      }),
      // Total revenue earned by user (all time)
      Task.aggregate([
        {
          $match: {
            claimedById: userId,
            status: TaskStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$price' },
          },
        },
      ]).then(result => result[0]?.total || 0),
      // Tasks currently in progress (assigned, submitted, in review)
      Task.countDocuments({
        claimedById: userId,
        status: {
          $in: [TaskStatus.ASSIGNED, TaskStatus.SUBMITTED, TaskStatus.IN_REVIEW],
        },
      }),
    ]);

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    totalTasksCompleted,
    currentTasksClaimed,
    totalRevenueEarned,
    tasksInProgress,
    averageTaskValue:
      totalTasksCompleted > 0 ? Math.round(totalRevenueEarned / totalTasksCompleted) : 0,
  };
};

export const getTopPerformers = async (
  dateFrom: string,
  dateTo: string,
  limit: number = 5,
  projectId?: string
) => {
  // Handle empty strings by using default dates
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = dateTo ? new Date(dateTo) : new Date(); // now

  const match: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: TaskStatus.COMPLETED,
    claimedById: { $exists: true },
  };

  if (projectId && Types.ObjectId.isValid(projectId)) {
    match.projectId = new Types.ObjectId(projectId);
  }

  const performers = await Task.aggregate([
    {
      $match: match,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'claimedById',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $group: {
        _id: '$claimedById',
        name: { $first: '$user.name' },
        tasksCompleted: { $sum: 1 },
        revenueGenerated: { $sum: '$price' },
        totalTasks: { $sum: 1 },
      },
    },
    {
      $addFields: {
        completionRate: {
          $multiply: [{ $divide: ['$tasksCompleted', '$totalTasks'] }, 100],
        },
      },
    },
    {
      $sort: { tasksCompleted: -1, revenueGenerated: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  return performers.map((performer, index) => ({
    rank: index + 1,
    initials: getInitials(performer.name),
    name: performer.name,
    tasksCompleted: performer.tasksCompleted,
    revenueGenerated: performer.revenueGenerated,
    completionRate: Number(performer.completionRate.toFixed(1)),
    trend: 'up', // Placeholder
  }));
};

// --- Helper Functions ---

const calculateAvgCompletionTime = async (
  startDate: Date,
  endDate: Date,
  projectId?: string
): Promise<number> => {
  const match: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: TaskStatus.COMPLETED,
  };
  if (projectId && Types.ObjectId.isValid(projectId)) {
    match.projectId = new Types.ObjectId(projectId);
  }

  const result = await Task.aggregate([
    {
      $match: match,
    },
    {
      $addFields: {
        completionTime: {
          $divide: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$completionTime' },
      },
    },
  ]);

  return result[0]?.avgTime ? Number(result[0].avgTime.toFixed(1)) : 0;
};

const calculateTasksPerUser = async (
  startDate: Date,
  endDate: Date,
  projectId?: string
): Promise<number> => {
  const match: any = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  if (projectId && Types.ObjectId.isValid(projectId)) {
    match.projectId = new Types.ObjectId(projectId);
  }

  const result = await Task.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: '$claimedById',
        taskCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        avgTasks: { $avg: '$taskCount' },
      },
    },
  ]);

  return result[0]?.avgTasks ? Number(result[0].avgTasks.toFixed(1)) : 0;
};

const getMonthName = (month: number): string => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month - 1];
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- Combined Analytics ---

export const getUserAnalyticsDashboard = async (
  dateFrom: string,
  dateTo: string,
  topPerformersLimit: number = 5,
  projectId?: string
) => {
  const [summary, growthTrend, topPerformers] = await Promise.all([
    getUserSummary(dateFrom, dateTo, projectId),
    getUserGrowthTrend(dateFrom, dateTo, projectId),
    getTopPerformers(dateFrom, dateTo, topPerformersLimit, projectId),
  ]);

  return {
    summary,
    growthTrend,
    topPerformers,
  };
};

// --- Freelancer Performance Analytics ---

// Helper function to fetch freelancer performance data
const fetchFreelancerPerformanceData = async (userId: string) => {
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1);

  return Promise.all([
    // Total tasks completed by user (all time)
    Task.countDocuments({
      claimedById: userId,
      status: TaskStatus.COMPLETED,
    }),
    // Current tasks under claim (not completed)
    Task.countDocuments({
      claimedById: userId,
      status: {
        $in: [
          TaskStatus.PENDING_APPROVAL,
          TaskStatus.ASSIGNED,
          TaskStatus.SUBMITTED,
          TaskStatus.IN_REVIEW,
        ],
      },
    }),
    // Total revenue earned by user (all time)
    Task.aggregate([
      {
        $match: {
          claimedById: userId,
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
    // Tasks currently in progress (assigned, submitted, in review)
    Task.countDocuments({
      claimedById: userId,
      status: {
        $in: [TaskStatus.ASSIGNED, TaskStatus.SUBMITTED, TaskStatus.IN_REVIEW],
      },
    }),
    // Tasks claimed this month
    Task.countDocuments({
      claimedById: userId,
      createdAt: {
        $gte: currentMonthStart,
        $lt: currentMonthEnd,
      },
    }),
    // Tasks completed this month
    Task.countDocuments({
      claimedById: userId,
      status: TaskStatus.COMPLETED,
      updatedAt: {
        $gte: currentMonthStart,
        $lt: currentMonthEnd,
      },
    }),
    // Revenue earned this month
    Task.aggregate([
      {
        $match: {
          claimedById: userId,
          status: TaskStatus.COMPLETED,
          updatedAt: {
            $gte: currentMonthStart,
            $lt: currentMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]).then(result => result[0]?.total || 0),
    // Average completion time in days
    Task.aggregate([
      {
        $match: {
          claimedById: userId,
          status: TaskStatus.COMPLETED,
        },
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$completionTime' },
        },
      },
    ]).then(result => Math.round((result[0]?.averageTime || 0) * 10) / 10),
    // Recent completed tasks (last 5)
    Task.find({
      claimedById: userId,
      status: TaskStatus.COMPLETED,
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title price language updatedAt')
      .lean(),
    // Performance trend (last 6 months)
    Task.aggregate([
      {
        $match: {
          claimedById: userId,
          status: TaskStatus.COMPLETED,
          updatedAt: {
            $gte: sixMonthsAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          tasksCompleted: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]),
  ]);
};

// Helper function to calculate performance metrics
const calculateFreelancerMetrics = async (
  userId: string,
  totalTasksCompleted: number,
  currentTasksClaimed: number,
  tasksCompletedThisMonth: number
) => {
  const completionRate =
    currentTasksClaimed + totalTasksCompleted > 0
      ? Math.round((totalTasksCompleted / (currentTasksClaimed + totalTasksCompleted)) * 100)
      : 0;

  const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const previousMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const previousMonthTasks = await Task.countDocuments({
    claimedById: userId,
    status: TaskStatus.COMPLETED,
    updatedAt: {
      $gte: previousMonth,
      $lt: previousMonthEnd,
    },
  });

  const monthlyGrowth =
    previousMonthTasks > 0
      ? Math.round(((tasksCompletedThisMonth - previousMonthTasks) / previousMonthTasks) * 100)
      : tasksCompletedThisMonth > 0
        ? 100
        : 0;

  return { completionRate, monthlyGrowth };
};

// Helper function to build response object
const buildFreelancerPerformanceResponse = (
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    lastLoginAt?: Date;
  },
  performanceData: [
    number, // totalTasksCompleted
    number, // currentTasksClaimed
    number, // totalRevenueEarned
    number, // tasksInProgress
    number, // tasksClaimedThisMonth
    number, // tasksCompletedThisMonth
    number, // revenueThisMonth
    number, // averageCompletionTime
    Array<{ title: string; price: number; language: string; updatedAt: Date }>, // recentTasks
    Array<{ _id: { year: number; month: number }; tasksCompleted: number; revenue: number }>, // performanceTrend
  ],
  metrics: { completionRate: number; monthlyGrowth: number }
) => {
  const [
    totalTasksCompleted,
    currentTasksClaimed,
    totalRevenueEarned,
    tasksInProgress,
    tasksClaimedThisMonth,
    tasksCompletedThisMonth,
    revenueThisMonth,
    averageCompletionTime,
    recentTasks,
    performanceTrend,
  ] = performanceData;

  const { completionRate, monthlyGrowth } = metrics;

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    performance: {
      totalTasksCompleted,
      currentTasksClaimed,
      totalRevenueEarned,
      tasksInProgress,
      averageTaskValue:
        totalTasksCompleted > 0 ? Math.round(totalRevenueEarned / totalTasksCompleted) : 0,
      completionRate,
      averageCompletionTime,
    },
    monthlyStats: {
      tasksClaimed: tasksClaimedThisMonth,
      tasksCompleted: tasksCompletedThisMonth,
      revenue: revenueThisMonth,
      growth: monthlyGrowth,
    },
    recentActivity: {
      recentTasks,
      performanceTrend,
    },
    summary: {
      totalEarnings: totalRevenueEarned,
      successRate: completionRate,
      averageTaskTime: averageCompletionTime,
      monthlyGrowth,
    },
  };
};

export const getFreelancerPerformance = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Only allow freelancers to access their own performance data
  if (user.role !== 'FREELANCER') {
    throw new ApiError(403, 'Access denied. This endpoint is for freelancers only.');
  }

  const performanceData = await fetchFreelancerPerformanceData(userId);
  const metrics = await calculateFreelancerMetrics(
    userId,
    performanceData[0], // totalTasksCompleted
    performanceData[1], // currentTasksClaimed
    performanceData[5] // tasksCompletedThisMonth
  );

  return buildFreelancerPerformanceResponse(user, performanceData, metrics);
};
