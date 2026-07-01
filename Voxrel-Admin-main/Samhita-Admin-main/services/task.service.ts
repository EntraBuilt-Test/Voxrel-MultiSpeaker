import { Task, CreateTaskData, UpdateTaskData, TaskAnalytics, TaskStatusDistribution, TaskCompletionTrend, TaskRevenueTrend, TaskLanguageDistribution } from '@/types';

import BaseService from './base.service';

class TaskService extends BaseService {
  // Helper function to check if a file is a text document
  private isTextDocument(file: File): boolean {
    const textMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const textExtensions = ['.pdf', '.doc', '.docx', '.txt'];

    // Check MIME type
    if (textMimeTypes.includes(file.type)) {
      return true;
    }

    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    return textExtensions.some(ext => fileName.endsWith(ext));
  }

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

    // ProjectId is REQUIRED - must be provided to associate task with project
    if (taskData.projectId) {
      formData.append('projectId', taskData.projectId);
    } else {
      console.warn('⚠️ Warning: Task creation without projectId - task will not be associated with any project');
    }

    // Tags are optional - only add if provided
    if (taskData.tags) {
      const tagsString = Array.isArray(taskData.tags)
        ? taskData.tags.join(',')
        : taskData.tags;

      if (tagsString.trim().length > 0) {
        formData.append('tags', tagsString.trim());
      }
    }

    // Audio files OR audioUrl OR document files is required
    // For review tasks, use audioUrl from source task
    // For regular tasks, upload audio files or document files
    if (taskData.audioUrl) {
      // Use existing audio URL (for review tasks)
      formData.append('audioUrl', taskData.audioUrl);
    } else if (taskData.audioFiles && taskData.audioFiles.length > 0) {
      // Check if files are text documents or audio files
      const isTextFile = this.isTextDocument(taskData.audioFiles[0]);
      // Backend accepts: audio, audios, files, or audioFiles
      // Use 'files' for text documents (backend expects this for text files), 'audio' for audio files
      const fieldName = isTextFile ? 'files' : 'audio';

      console.log('📄 File upload info:', {
        fileName: taskData.audioFiles[0].name,
        fileType: taskData.audioFiles[0].type,
        isTextFile,
        fieldName,
        totalFiles: taskData.audioFiles.length
      });

      // Upload files with appropriate field name
      for (const file of taskData.audioFiles) {
        formData.append(fieldName, file);
      }
    }

    // Task type: 'single' or 'multi' - always include it
    if (taskData.type) {
      formData.append('type', taskData.type);
      console.log('✅ Appending type to FormData:', taskData.type);
    } else {
      // Default to 'single' if not provided
      formData.append('type', 'single');
      console.warn('⚠️ No type provided, defaulting to "single"');
    }

    // Assigned freelancers for multi-speaker tasks
    if (taskData.assignedFreelancers && taskData.assignedFreelancers.length > 0) {
      // Append as JSON string or individual IDs
      taskData.assignedFreelancers.forEach((freelancerId) => {
        formData.append('assignedFreelancers', freelancerId);
      });
    } else {
      // Allow task creation without files (e.g. self-recording tasks)
      // We can optionally pass a flag if the backend requires it, but standard task creation should work if backend allows optional files
      console.log('ℹ️ Creating task without initial files (Self Recording Task)');
      // If the backend strictly checks for files, we might need to send a dummy value or a specific flag
      // For now, we assume the backend has been updated or will support missing file fields if validated correctly
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

    // ProjectId is REQUIRED - must be provided to associate tasks with project
    if (taskData.projectId) {
      formData.append('projectId', taskData.projectId);
    } else {
      console.warn('⚠️ Warning: Bulk task creation without projectId - tasks will not be associated with any project');
    }

    // Tags are optional - only add if provided
    if (taskData.tags) {
      const tagsString = Array.isArray(taskData.tags)
        ? taskData.tags.join(',')
        : taskData.tags;

      if (tagsString.trim().length > 0) {
        formData.append('tags', tagsString.trim());
      }
    }

    // Files are required (multiple) - bulk endpoint creates one task per file
    // Note: bulk create doesn't support audioUrl, only file uploads
    if (taskData.audioFiles && taskData.audioFiles.length > 0) {
      // Check if files are text documents or audio files
      const isTextFile = this.isTextDocument(taskData.audioFiles[0]);
      // Backend accepts: audio, audios, files, or audioFiles
      // Use 'files' for text documents (backend expects this for text files), 'audio' for audio files
      const fieldName = isTextFile ? 'files' : 'audio';

      console.log('📄 Bulk file upload info:', {
        fileName: taskData.audioFiles[0].name,
        fileType: taskData.audioFiles[0].type,
        isTextFile,
        fieldName,
        totalFiles: taskData.audioFiles.length
      });

      // Upload files with appropriate field name
      for (let i = 0; i < taskData.audioFiles.length; i++) {
        const file = taskData.audioFiles[i];
        formData.append(fieldName, file);
      }
    } else if (taskData.audioUrl) {
      // If audioUrl is provided for bulk (unlikely but handle it)
      formData.append('audioUrl', taskData.audioUrl);
    } else {
      console.warn('⚠️ Warning: No files provided for bulk creation - backend may reject this request');
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
    const params = new URLSearchParams({ dateFrom, dateTo });
    if (projectId) params.append('projectId', projectId);
    return this.get(`/admin/analytics/tasks/summary?${params.toString()}`);
  }

  async getTaskStatusDistribution(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskStatusDistribution[];
  }> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    if (projectId) params.append('projectId', projectId);
    return this.get(`/admin/analytics/tasks/status-distribution?${params.toString()}`);
  }

  async getTaskCompletionTrends(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskCompletionTrend[];
  }> {
    const params = new URLSearchParams({ dateFrom, dateTo, type: 'completion' });
    if (projectId) params.append('projectId', projectId);
    return this.get(`/admin/analytics/tasks/trends?${params.toString()}`);
  }

  async getTaskRevenueTrends(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskRevenueTrend[];
  }> {
    const params = new URLSearchParams({ dateFrom, dateTo, type: 'revenue' });
    if (projectId) params.append('projectId', projectId);
    return this.get(`/admin/analytics/tasks/trends?${params.toString()}`);
  }

  async getTaskLanguageDistribution(dateFrom: string, dateTo: string, projectId?: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskLanguageDistribution[];
  }> {
    const params = new URLSearchParams({ dateFrom, dateTo });
    if (projectId) params.append('projectId', projectId);
    return this.get(`/admin/analytics/tasks/language-distribution?${params.toString()}`);
  }

}

export const taskService = new TaskService();
