import BaseService from './base.service';
import { Project, ApiResponse } from '@/types';

class ProjectService extends BaseService {
  // Get all projects available to the user
  // Note: Backend endpoint not yet implemented - returning empty array gracefully
  async getProjects(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      projects: Project[];
    };
  }> {
    try {
      return await this.get('/freelancer/projects');
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('Not Found') ||
        errorMessage.includes('not found')
      ) {
        return {
          success: true,
          statusCode: 200,
          message: 'No projects available',
          data: {
            projects: [],
          },
        };
      }
      throw error;
    }
  }

  // Get a specific project by ID
  async getProject(projectId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Project;
  }> {
    try {
      return await this.get(`/freelancer/projects/${projectId}`);
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        throw new Error('Project not found');
      }
      throw error;
    }
  }

  // Request to join a project
  async requestToJoinProject(projectId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    try {
      return await this.post(`/freelancer/projects/${projectId}/request-join`);
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        throw new Error('Project not found');
      }
      throw error;
    }
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
    try {
     return await this.get(`/freelancer/tasks?projectId=${projectId}&${queryParams}`);
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return {
          success: true,
          statusCode: 200,
          message: 'No tasks available',
          data: {
            tasks: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalTasks: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        };
      }
      throw error;
    }
  }
}

export const projectService = new ProjectService();
export default projectService;

