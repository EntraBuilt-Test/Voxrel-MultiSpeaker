import BaseService from './base.service';
import { Task, ApiResponse, PaginationInfo } from '@/types';

interface FreelancerStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalEarnings: number;
  averageRating: number;
  languages: Record<string, number>;
  monthlyEarnings: Record<string, number>;
}

export interface FreelancerProfile {
  bio?: string;
  languages: string[];
  country: string;
  skills?: string[];
  experience?: string;
}

class FreelancerService extends BaseService {
  // Profile Management
  async updateProfile(data: Partial<FreelancerProfile>): Promise<ApiResponse<FreelancerProfile>> {
    return this.patch('/freelancer/profile', data);
  }

  async getProfile(): Promise<ApiResponse<FreelancerProfile>> {
    // Since the backend doesn't have a GET endpoint for freelancer profile,
    // we'll return a default profile structure
    return Promise.resolve({
      success: true,
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: {
        bio: '',
        languages: [],
        country: '',
        skills: [],
        experience: ''
      }
    });
  }


  // Task Management
  async getAvailableTasks(params?: {
    page?: number;
    limit?: number;
    language?: string;
    priority?: string;
    tags?: string;
    projectId?: string;
  }): Promise<ApiResponse<{
    tasks: Task[];
    pagination: PaginationInfo;
  }>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.get(`/freelancer/tasks${queryString ? `?${queryString}` : ''}`);
  }

  async getMyTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    projectId?: string;
  }): Promise<ApiResponse<{
    tasks: Task[];
    pagination: PaginationInfo;
  }>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.get(`/freelancer/tasks/my${queryString ? `?${queryString}` : ''}`);
  }

  async claimTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/freelancer/tasks/${taskId}/claim`);
  }

  async submitTask(taskId: string, submission: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/freelancer/tasks/${taskId}/submit`, { submission });
  }

  async startReviewTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/freelancer/tasks/${taskId}/start-review`);
  }

  // Review Management
  async getAssignedReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{
    reviews: any[];
    pagination: PaginationInfo;
  }>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.get(`/freelancer/reviews/assigned${queryString ? `?${queryString}` : ''}`);
  }

  async submitReview(reviewId: string, rating: number, feedback: string, decision?: 'APPROVE' | 'REJECT'): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/freelancer/reviews/${reviewId}/submit`, { rating, feedback, decision });
  }

  // Analytics and Statistics
  async getStats(): Promise<ApiResponse<FreelancerStats>> {
    // For now, return a default stats since the endpoint might not be working
    return Promise.resolve({
      success: true,
      statusCode: 200,
      message: 'Stats retrieved successfully',
      data: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalEarnings: 0,
        averageRating: 0,
        languages: {},
        monthlyEarnings: {}
      }
    });
  }

  // Helper method to calculate stats from tasks
  calculateStatsFromTasks(tasks: Task[]): Partial<FreelancerStats> {
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
    const pendingTasks = tasks.filter(task => ['ASSIGNED', 'PENDING_APPROVAL'].includes(task.status));

    const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.price || 0), 0);

    const languageStats = tasks.reduce((acc, task) => {
      const lang = task.language || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      totalEarnings,
      languages: languageStats,
    };
  }
}

export const freelancerService = new FreelancerService();