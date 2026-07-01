import BaseService from './base.service';
import { Project, ProjectType } from '@/types';

class ProjectService extends BaseService {
  // Get all projects (Platform Admin)
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

  // Get project by ID
  async getProjectById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Project;
  }> {
    return this.get(`/admin/projects/${id}`);
  }

  // Create a new project
  async createProject(projectData: {
    name: string;
    description?: string;
    type: ProjectType;
    supportedLanguages?: string[];
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Project;
  }> {
    return this.post('/admin/projects', projectData);
  }

  // Update a project
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Project;
  }> {
    return this.patch(`/admin/projects/${projectId}`, projectData);
  }

  // Assign project to admin
  async assignProjectToAdmin(projectId: string, adminId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/admins`, { adminId });
  }

  // Get all admins
  async getAdmins(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      admins: any[];
      users?: any[];
      pagination?: any;
    };
  }> {
    const response = await this.get<{
      success: boolean;
      statusCode: number;
      message: string;
      data: {
        users: any[];
        pagination?: any;
      };
    }>('/admin/users?role=ADMIN');

    // Normalize response structure
    if (response.data && response.data.users) {
      return {
        ...response,
        data: {
          admins: response.data.users,
          users: response.data.users,
          pagination: response.data.pagination,
        },
      };
    }
    return {
      ...response,
      data: {
        admins: [],
        ...response.data
      }
    };
  }

  // Spawn task to another project
  async spawnTaskToProject(sourceTaskId: string, targetProjectId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post('/admin/tasks/spawn', { sourceTaskId, targetProjectId });
  }

  // User/Admin password recovery
  async recoverPassword(email: string, isAdmin: boolean = false): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post('/admin/recover-password', { email, isAdmin });
  }

  // Get projects not assigned for review
  async getProjectsNotAssignedForReview(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      projects: Project[];
    };
  }> {
    return this.get('/admin/projects/not-assigned-for-review');
  }

  // Get users in a project
  async getProjectUsers(
    projectId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string;
      status?: string;
      role?: string;
      sortBy?: string;
      sortOrder?: string;
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
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    return this.get(`/admin/projects/${projectId}/users?${queryParams.toString()}`);
  }

  // Approve join request
  async approveJoinRequest(projectId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/requests/approve`, { userId });
  }

  // Reject join request
  async rejectJoinRequest(projectId: string, userId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/admin/projects/${projectId}/requests/reject`, { userId });
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
}

export const projectService = new ProjectService();
export default projectService;

