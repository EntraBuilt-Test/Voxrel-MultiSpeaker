import { Project } from '@/types';

import BaseService from './base.service';

class ProjectService extends BaseService {
  // Get all projects for admin
  async getProjects(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      projects: Project[];
    };
  }> {
    return this.get('/admin/projects');
  }

  // Get a specific project by ID
  async getProject(projectId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Project;
  }> {
    return this.get(`/admin/projects/${projectId}`);
  }

  // Get tasks for a specific project
  async getProjectTasks(
    projectId: string,
    page = 1,
    limit = 20,
    filters: {
      status?: string;
      language?: string;
      priority?: string;
    } = {}
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      tasks: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalTasks: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
      ),
    });
    return this.get(`/admin/projects/${projectId}/tasks?${queryParams}`);
  }

  // Create task in a project
  async createProjectTask(projectId: string, taskData: any): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/tasks`, taskData);
  }

  // Assign task to user
  async assignTask(taskId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/tasks/${taskId}/assign`, { userId });
  }

  // Approve task claim
  async approveTaskClaim(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/tasks/${taskId}/approve-claim`);
  }

  // Add user to project
  async addUserToProject(projectId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/users`, { userId });
  }

  // Get users in a project
  async getProjectUsers(
    projectId: string,
    page = 1,
    limit = 20,
    filters: {
      search?: string;
      status?: string;
    } = {}
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      users: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
      ),
    });
    return this.get(`/admin/projects/${projectId}/users?${queryParams}`);
  }

  // Approve user request to join project
  async approveJoinRequest(projectId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/requests/approve`, { userId });
  }

  // Reject user request to join project
  async rejectJoinRequest(projectId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/requests/reject`, { userId });
  }

  // Spawn task to another project
  async spawnTaskToProject(taskId: string, targetProjectId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/tasks/${taskId}/spawn`, { targetProjectId });
  }
}

export const projectService = new ProjectService();
export default projectService;

