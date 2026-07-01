import ApiResponse from '@/utils/api-response.utility.js';
import { catchAsync } from '@/utils/catch-async.utility.js';
import { Request, Response } from 'express';
import * as analyticsService from '@/services/analytics.service.js';

// Task Analytics Controllers

export const getTaskSummaryController = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, projectId } = req.query;

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const result = await analyticsService.getTaskSummary(
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString(),
    projectId as string
  );
  new ApiResponse(200, result).send(res);
});

export const getTaskStatusDistributionController = catchAsync(
  async (req: Request, res: Response) => {
    const { dateFrom, dateTo, projectId } = req.query;

    // Provide default dates if not provided
    const defaultFrom = new Date();
    defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
    const defaultTo = new Date();

    const result = await analyticsService.getTaskStatusDistribution(
      (dateFrom as string) || defaultFrom.toISOString(),
      (dateTo as string) || defaultTo.toISOString(),
      projectId as string
    );
    new ApiResponse(200, result).send(res);
  }
);

export const getTaskTrendsController = catchAsync(async (req: Request, res: Response) => {
  const { type, dateFrom, dateTo, projectId } = req.query;

  if (!type) {
    throw new Error('type is required');
  }

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const result = await analyticsService.getTaskTrends(
    type as string,
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString(),
    projectId as string
  );
  new ApiResponse(200, result).send(res);
});

export const getLanguageDistributionController = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, projectId } = req.query;

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const result = await analyticsService.getLanguageDistribution(
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString(),
    projectId as string
  );
  new ApiResponse(200, result).send(res);
});

// User Analytics Controllers

export const getUserSummaryController = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const result = await analyticsService.getUserSummary(
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString()
  );
  new ApiResponse(200, result).send(res);
});

export const getUserGrowthTrendController = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const result = await analyticsService.getUserGrowthTrend(
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString()
  );
  new ApiResponse(200, result).send(res);
});

export const getTopPerformersController = catchAsync(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, limit } = req.query;

  // Provide default dates if not provided
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
  const defaultTo = new Date();

  const limitNum = limit ? parseInt(limit as string) : 5;
  const result = await analyticsService.getTopPerformers(
    (dateFrom as string) || defaultFrom.toISOString(),
    (dateTo as string) || defaultTo.toISOString(),
    limitNum
  );
  new ApiResponse(200, result).send(res);
});

export const getUserAnalyticsDashboardController = catchAsync(
  async (req: Request, res: Response) => {
    const { dateFrom, dateTo, limit } = req.query;

    // Provide default dates if not provided
    const defaultFrom = new Date();
    defaultFrom.setMonth(defaultFrom.getMonth() - 1); // 1 month ago
    const defaultTo = new Date();

    const limitNum = limit ? parseInt(limit as string) : 5;
    const result = await analyticsService.getUserAnalyticsDashboard(
      (dateFrom as string) || defaultFrom.toISOString(),
      (dateTo as string) || defaultTo.toISOString(),
      limitNum
    );
    new ApiResponse(200, result, 'User analytics dashboard retrieved successfully').send(res);
  }
);

export const getUserStatsController = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id;

  // Use userId from params if provided (admin route), otherwise use current user
  const targetUserId = userId || currentUserId;

  if (!targetUserId) {
    throw new Error('userId is required');
  }

  const result = await analyticsService.getUserStats(targetUserId);
  new ApiResponse(200, result, 'User statistics retrieved successfully').send(res);
});

// Freelancer Performance Analytics Controller

export const getFreelancerPerformanceController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await analyticsService.getFreelancerPerformance(userId);
    new ApiResponse(200, result, 'Freelancer performance data retrieved successfully').send(res);
  }
);
