import BaseService from './base.service';
import { Task, CreateTaskData, UpdateTaskData, TaskAnalytics } from '@/types';

class TaskService extends BaseService {
  // Get available tasks for freelancers to claim
  async getAvailableTasks(
    page = 1,
    limit = 20,
    filters: {
      language?: string;
      languages?: string; // Add support for multiple languages
      priority?: string;
      tags?: string;
      projectId?: string; // Filter by project
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

    return this.get(`/freelancer/tasks?${params.toString()}`);
  }

  async getTaskById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    // Normalize the ID to ensure consistent matching
    const normalizedId = id?.trim();
    if (!normalizedId) {
      throw new Error('Task ID is required');
    }

    try {
      // Try the direct endpoint first (preferred method)
      console.log('[TaskService] Fetching task by ID:', normalizedId);
      const response = await this.get<{
        success: boolean;
        statusCode: number;
        message: string;
        data: Task;
      }>(`/freelancer/tasks/${normalizedId}`);
      
      // CRITICAL: Strictly verify the returned task ID matches the requested ID
      if (response.success && response.data) {
        const returnedId = response.data._id || response.data.id;
        const normalizedReturnedId = returnedId?.toString().trim();
        
        // Strict validation - IDs must match exactly
        if (returnedId && normalizedReturnedId !== normalizedId) {
          console.error('[TaskService] CRITICAL: Task ID mismatch!', {
            requestedId: normalizedId,
            returnedId: normalizedReturnedId,
            taskTitle: response.data.title,
            taskType: response.data.type,
            taskRecordingUrl: response.data.recordingUrl
          });
          // Throw error instead of returning mismatched task
          throw new Error(`Task ID mismatch: Requested task ${normalizedId} but received task ${normalizedReturnedId}. This may be a different task's recording.`);
        }
        
        console.log('[TaskService] Task fetched successfully and validated:', {
          requestedId: normalizedId,
          returnedId: normalizedReturnedId,
          title: response.data.title,
          type: response.data.type,
          recordingUrl: response.data.recordingUrl,
          idMatch: normalizedReturnedId === normalizedId
        });
      }
      
      return response;
    } catch (error: any) {
      // Fallback: Try to get task from "My Tasks" list
      // This endpoint exists and works for tasks the user has claimed
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('not found')) {
        console.warn('[TaskService] Direct endpoint failed, trying fallback for task ID:', normalizedId);
        try {
          const myTasksResponse = await this.getMyTasks(1, 100);
          if (myTasksResponse.success && myTasksResponse.data.tasks) {
            // More strict matching - check both _id and id fields with exact match
            const task = myTasksResponse.data.tasks.find(
              (t: Task) => {
                const taskId = t._id || t.id;
                const normalizedTaskId = taskId?.toString().trim();
                // Exact match required
                return normalizedTaskId === normalizedId;
              }
            );
            if (task) {
              // Double-check the ID matches
              const foundTaskId = (task._id || task.id)?.toString().trim();
              if (foundTaskId !== normalizedId) {
                console.error('[TaskService] CRITICAL: Fallback task ID mismatch!', {
                  requestedId: normalizedId,
                  foundId: foundTaskId
                });
                throw new Error(`Task ID mismatch in fallback: Requested ${normalizedId} but found ${foundTaskId}`);
              }
              
              console.log('[TaskService] Task found via fallback and validated:', {
                requestedId: normalizedId,
                foundId: foundTaskId,
                title: task.title,
                type: task.type,
                recordingUrl: task.recordingUrl,
                idMatch: foundTaskId === normalizedId
              });
              return {
                success: true,
                statusCode: 200,
                message: 'Task found in my tasks',
                data: task,
              };
            } else {
              console.warn('[TaskService] Task not found in my tasks list. Available task IDs:', 
                myTasksResponse.data.tasks.map((t: Task) => t._id || t.id));
            }
          }
        } catch (fallbackError) {
          // If fallback also fails, throw original error
          console.error('[TaskService] Fallback task loading failed:', fallbackError);
        }
      }
      // Re-throw original error if no fallback worked
      throw error;
    }
  }

  // Get user's claimed/assigned tasks
  async getMyTasks(
    page = 1,
    limit = 20,
    filters: {
      status?: string;
      language?: string;
      languages?: string; // Add support for multiple languages
      projectId?: string; // Filter by project
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

    return this.get(`/freelancer/tasks/my?${params.toString()}`);
  }

  // Task claim operations
  async claimTask(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.post(`/freelancer/tasks/${id}/claim`, {});
  }

  async unclaimTask(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.delete(`/freelancer/tasks/${id}/claim`);
  }

  // Submit task for review
  async submitTask(id: string, submissionData: {
    submission: string;
    speakerName?: string;
    speakerAge?: number;
    speakerLocation?: string;
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.post(`/freelancer/tasks/${id}/submit`, submissionData);
  }

  // Submit speaker metadata (for multi-speaker tasks)
  async submitSpeakerMetadata(id: string, metadata: {
    topic?: string;
    speakerName?: string;
    speakerId?: string;
    speakerAge?: number;
    gender?: string;
    qualification?: string;
    occupation?: string;
    motherTongueCode?: string;
    nativePlace?: string;
    currentLocation?: string;
    district?: string;
    state?: string;
    dialectZone?: string;
    dialect?: string;
    recordingDeviceType?: 'PC' | 'Mobile' | '';
    recordingEnvironment?: 'Indoor' | 'Outdoor' | '';
    speakerLocation?: string; // Backward compatibility
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.post(`/freelancer/tasks/${id}/metadata`, metadata);
  }

  // Submit review
  async submitReview(reviewId: string, data: {
    rating: number;
    feedback: string;
    decision: 'APPROVE' | 'REJECT';
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/freelancer/reviews/${reviewId}/submit`, data);
  }

  // Update task progress/status (for claimed tasks)
  async updateTaskProgress(id: string, data: {
    progress?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: Task;
  }> {
    return this.patch(`/freelancer/tasks/${id}/progress`, data);
  }

  // Save transcript/work progress
  async saveTranscript(taskId: string, transcriptData: {
    segments: Array<{
      timestamp: {
        start: number;
        end: number;
      };
      content: string;
      remark?: string;
      quality: number;
    }>;
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/freelancer/tasks/${taskId}/transcript`, transcriptData);
  }

  async getTranscript(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      segments: Array<{
        timestamp: {
          start: number;
          end: number;
        };
        content: string;
        remark?: string;
        quality: number;
      }>;
    };
  }> {
    return this.get(`/freelancer/tasks/${taskId}/transcript`);
  }

  // Save draft progress (for auto-save functionality)
  async saveDraft(taskId: string, draftData: {
    progress: number;
    segments: Array<{
      timestamp: {
        start: number;
        end: number;
      };
      content: string;
      remark?: string;
      quality: number;
    }>;
    lastSavedAt: string;
  }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/freelancer/tasks/${taskId}/draft`, draftData);
  }

  async getDraft(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      progress: number;
      segments: Array<{
        timestamp: {
          start: number;
          end: number;
        };
        content: string;
        remark?: string;
        quality: number;
      }>;
      lastSavedAt: string;
    };
  }> {
    return this.get(`/freelancer/tasks/${taskId}/draft`);
  }

  // Task analytics for user
  async getMyTaskAnalytics(dateRange?: { from: string; to: string }): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: TaskAnalytics;
  }> {
    const params = dateRange
      ? `?from=${dateRange.from}&to=${dateRange.to}`
      : '';
    return this.get(`/freelancer/stats${params}`);
  }

  // Task comments
  async addComment(taskId: string, comment: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/freelancer/tasks/${taskId}/comments`, { comment });
  }

  async getComments(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any[];
  }> {
    return this.get(`/freelancer/tasks/${taskId}/comments`);
  }

  // Upload attachments (if needed)
  // Upload audio recording
  async uploadAudio(taskId: string, file: Blob): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    const formData = new FormData();
    // Filename is needed for Blob
    formData.append('audio', file, 'recording.webm');

    return this.request(`/freelancer/tasks/${taskId}/upload-audio`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData and boundary
    });
  }

  // Upload attachments (alias for uploadAudio for now)
  async uploadAttachment(taskId: string, file: File): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    const formData = new FormData();
    formData.append('audio', file);

    return this.request(`/freelancer/tasks/${taskId}/upload-audio`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  // Get multi-speaker tasks for a project
  async getMultiSpeakerTasks(projectId: string): Promise<{
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
    return this.getMyTasks(1, 100, { projectId }).then((response) => {
      // Filter for multi-speaker tasks
      if (response.success && response.data.tasks) {
        const multiTasks = response.data.tasks.filter(
          (task: Task) => task.type === 'multi'
        );
        return {
          ...response,
          data: {
            ...response.data,
            tasks: multiTasks,
            pagination: {
              ...response.data.pagination,
              totalTasks: multiTasks.length,
            },
          },
        };
      }
      return response;
    });
  }

  // Get LiveKit room token for a multi-speaker task
  async getRoomToken(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      token: string;
      url: string;
      identity: string;
      roomName: string;
    };
  }> {
    return this.get(`/freelancer/tasks/${taskId}/room-token`);
  }

  async startRecording(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      egressId: string;
    };
  }> {
    return this.post(`/freelancer/tasks/${taskId}/recording/start`, {});
  }

  async stopRecording(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
    };
  }> {
    return this.post(`/freelancer/tasks/${taskId}/recording/stop`, {});
  }

  async checkRecording(taskId: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      found: boolean;
      recordingUrl?: string;
      message: string;
      updated?: boolean;
    };
  }> {
    return this.post(`/freelancer/tasks/${taskId}/recording/check`, {});
  }

  // Save speaker metadata (Issue 5 - Metadata Module)
  async saveSpeakerMetadata(taskId: string, speakersMetadata: any[]): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: any;
  }> {
    return this.post(`/freelancer/tasks/${taskId}/speaker-metadata`, { speakersMetadata });
  }
}

export const taskService = new TaskService();
