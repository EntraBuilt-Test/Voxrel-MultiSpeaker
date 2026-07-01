import BaseService from './base.service';
import { User, LoginCredentials, RegisterData, ApiResponse } from '@/types';

class UserService extends BaseService {
  // Authentication methods for admin
  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await this.post<any>('/auth/login', credentials);

    // Extract data from API response structure
    const loginData = response.data || response;


    // Validate required fields
    if (!loginData.accessToken || !loginData.refreshToken || !loginData.user) {
      throw new Error('Invalid login response: missing required authentication data');
    }

    // Normalize user object (ensure it has id field)
    const normalizedUser = { ...loginData.user };
    if (normalizedUser._id && !normalizedUser.id) {
      normalizedUser.id = normalizedUser._id;
    }

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', loginData.accessToken);
      localStorage.setItem('refreshToken', loginData.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      // Verify tokens were stored correctly
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

    } else {
    }

    return {
      user: normalizedUser,
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken
    };
  }

  async logout(): Promise<void> {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refreshToken')
      : null;

    try {
      // Call logout endpoint with refresh token
      await this.post('/auth/logout', { refreshToken });
    } catch (error) {
    } finally {
      // Clear tokens regardless of API call result
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }

  async logoutAllDevices(): Promise<void> {
    try {
      await this.post('/auth/logout-all');
    } finally {
      // Clear local tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post('/auth/refresh', { refreshToken });
  }

  // User management methods
  async getCurrentUser(): Promise<User> {
    return this.get('/auth/me');
  }

  // Admin user management methods
  async getAllUsers(
    page = 1,
    limit = 10,
    filters: {
      status?: string;
      role?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    success: boolean;
    statusCode: number;
    data: {
      users: User[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    const response = await this.get(`/admin/users?${params.toString()}`) as any;

    // Normalize user data: convert _id to id
    if (response.success && response.data?.users) {
      response.data.users = response.data.users.map((user: any) => ({
        ...user,
        id: user._id || user.id
      }));
    }

    return response;
  }

  async getUserById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: User;
  }> {
    return this.get(`/admin/users/${id}`);
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER';
    status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED';
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: User;
  }> {
    return this.post('/admin/users', userData);
  }

  async updateUserStatus(id: string, status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'BANNED'): Promise<void> {
    return this.patch(`/admin/users/${id}/status`, { status });
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(`/admin/users/${id}`);
  }

  // Profile management (for current admin user)
  async updateProfile(data: Partial<User>): Promise<User> {
    // This endpoint doesn't exist yet, but keeping for future implementation
    // return this.patch('/users/profile', data);
    throw new Error('Update profile endpoint not implemented yet');
  }

  // Password management
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // This endpoint doesn't exist yet, but keeping for future implementation
    // return this.post('/auth/change-password', { oldPassword, newPassword });
    throw new Error('Change password endpoint not implemented yet');
  }

  async forgotPassword(email: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
      otp?: string;
      expiresIn?: string;
    };
  }> {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
    };
  }> {
    return this.post('/auth/reset-password', { email, otp, newPassword });
  }

  async verifyEmail(token: string): Promise<void> {
    // This endpoint doesn't exist yet, but keeping for future implementation
    // return this.post('/auth/verify-email', { token });
    throw new Error('Verify email endpoint not implemented yet');
  }

  // User Analytics Methods

  // Combined Dashboard Endpoint (Recommended for better performance)
  async getUserAnalyticsDashboard(dateFrom: string, dateTo: string, limit: number = 5, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: import('@/types').UserAnalyticsDashboard;
  }> {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
      limit: limit.toString(),
      ...(projectId && { projectId })
    });
    return this.get(`/admin/analytics/users/dashboard?${queryParams.toString()}`);
  }

  // Individual Analytics Endpoints (use dashboard endpoint instead for better performance)
  async getUserAnalyticsSummary(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: import('@/types').UserAnalytics;
  }> {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
      ...(projectId && { projectId })
    });
    return this.get(`/admin/analytics/users/summary?${queryParams.toString()}`);
  }

  async getUserGrowthTrend(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: import('@/types').UserGrowthTrend[];
  }> {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
      ...(projectId && { projectId })
    });
    return this.get(`/admin/analytics/users/growth-trend?${queryParams.toString()}`);
  }

  async getTopPerformers(dateFrom: string, dateTo: string, limit: number = 5, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: import('@/types').TopPerformer[];
  }> {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
      limit: limit.toString(),
      ...(projectId && { projectId })
    });
    return this.get(`/admin/analytics/users/top-performers?${queryParams.toString()}`);
  }

  // User Statistics Methods
  async getUserStats(userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      userId: string;
      name: string;
      email: string;
      totalTasksCompleted: number;
      currentTasksClaimed: number;
      totalRevenueEarned: number;
      tasksInProgress: number;
      averageTaskValue: number;
      totalTasksClaimed: number;
      totalRevenueGenerated: number;
    };
  }> {
    return this.get(`/admin/analytics/users/${userId}/stats`);
  }

  async getMyStats(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      userId: string;
      name: string;
      email: string;
      totalTasksCompleted: number;
      currentTasksClaimed: number;
      totalRevenueEarned: number;
      tasksInProgress: number;
      averageTaskValue: number;
      totalTasksClaimed: number;
      totalRevenueGenerated: number;
    };
  }> {
    return this.get('/freelancer/stats');
  }
}

export const userService = new UserService();
