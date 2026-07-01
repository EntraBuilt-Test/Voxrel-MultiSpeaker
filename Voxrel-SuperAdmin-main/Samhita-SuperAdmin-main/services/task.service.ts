import { Task, CreateTaskData, UpdateTaskData, ApiResponse, TaskAnalytics, TaskStatusDistribution, TaskCompletionTrend, TaskRevenueTrend, TaskLanguageDistribution } from '@/types';

import BaseService from './base.service';

class TaskService extends BaseService {
  // Task CRUD operations
  async getAllTasks(
    page = 1,
    limit = 20,
    filters: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
      language?: string;
      projectId?: string;
      createdAfter?: string;
      createdBefore?: string;
      dueDateAfter?: string;
      dueDateBefore?: string;
      sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      tasks: Task[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalTasks: number;
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

    const url = `/admin/tasks?${params.toString()}`;

    const response = await this.get(url) as {
      success: boolean;
      statusCode: number;
      message: string;
      data: {
        tasks: Task[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalTasks: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      };
    };
    return response;
  }

  async getTaskById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.get(`/admin/tasks/${id}`);
  }

  async createTask(taskData: CreateTaskData): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    // Use FormData for multipart upload (as per API documentation)
    const formData = new FormData();
    formData.append('title', taskData.title);
    // Set default values for fields removed from form UI
    formData.append('description', taskData.description || '');
    formData.append('priority', taskData.priority || 'MEDIUM');
    formData.append('deadline', taskData.dueDate ? taskData.dueDate.toISOString() : new Date().toISOString());
    formData.append('price', taskData.price.toString());
    formData.append('language', taskData.language);

    // Tags are optional - only add if provided
    if (taskData.tags) {
      const tagsString = Array.isArray(taskData.tags)
        ? taskData.tags.join(',')
        : taskData.tags;

      if (tagsString.trim().length > 0) {
        formData.append('tags', tagsString.trim());
      }
    }

    // Add projectId if provided
    if (taskData.projectId) {
      formData.append('projectId', taskData.projectId);
    }

    // Audio files are required (multiple)
    if (taskData.audioFiles && taskData.audioFiles.length > 0) {
      for (const file of taskData.audioFiles) {
        formData.append('audio', file);
      }
    }

    return this.request('/admin/tasks', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  async bulkCreateTasks(taskData: CreateTaskData): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task[];
  }> {
    // Use FormData for multipart upload to bulk endpoint
    const formData = new FormData();
    formData.append('title', taskData.title);
    // Set default values for fields removed from form UI
    formData.append('description', taskData.description || '');
    formData.append('priority', taskData.priority || 'MEDIUM');
    formData.append('deadline', taskData.dueDate ? taskData.dueDate.toISOString() : new Date().toISOString());
    formData.append('price', taskData.price.toString());
    formData.append('language', taskData.language);

    // Tags are optional - only add if provided
    if (taskData.tags) {
      const tagsString = Array.isArray(taskData.tags)
        ? taskData.tags.join(',')
        : taskData.tags;

      if (tagsString.trim().length > 0) {
        formData.append('tags', tagsString.trim());
      }
    }

    // Add projectId if provided
    if (taskData.projectId) {
      formData.append('projectId', taskData.projectId);
    }

    // Audio files are required (multiple) - bulk endpoint creates one task per file
    if (taskData.audioFiles && taskData.audioFiles.length > 0) {
      for (let i = 0; i < taskData.audioFiles.length; i++) {
        const file = taskData.audioFiles[i];
        formData.append('audio', file);
      }
    }

    return this.request('/admin/tasks/bulk', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.patch(`/admin/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }> {
    return this.delete(`/admin/tasks/${id}`);
  }

  // Task claim approval/rejection
  async approveTaskClaim(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.patch(`/admin/tasks/${id}/claim`, { action: 'APPROVE' });
  }

  async rejectTaskClaim(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.patch(`/admin/tasks/${id}/claim`, { action: 'REJECT' });
  }

  // Task Analytics Methods
  async getTaskAnalyticsSummary(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskAnalytics;
  }> {
    let url = `/admin/analytics/tasks/summary?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.get(url);
  }

  async getTaskStatusDistribution(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskStatusDistribution[];
  }> {
    let url = `/admin/analytics/tasks/status-distribution?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.get(url);
  }

  async getTaskCompletionTrends(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskCompletionTrend[];
  }> {
    let url = `/admin/analytics/tasks/trends?type=completion&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.get(url);
  }

  async getTaskRevenueTrends(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskRevenueTrend[];
  }> {
    let url = `/admin/analytics/tasks/trends?type=revenue&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.get(url);
  }

  async getTaskLanguageDistribution(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskLanguageDistribution[];
  }> {
    let url = `/admin/analytics/tasks/language-distribution?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.get(url);
  }

}

export const taskService = new TaskService();
