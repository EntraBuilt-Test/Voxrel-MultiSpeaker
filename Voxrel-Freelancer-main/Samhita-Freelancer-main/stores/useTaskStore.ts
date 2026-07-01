import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { taskService } from '@/services/task.service';
import { Task, CreateTaskData, UpdateTaskData, TaskStoreState, TaskAnalytics } from '@/types';

interface TaskStore extends TaskStoreState {
  // --- GETTERS (SELECTORS) ---
  getTasksByStatus: (status: string) => Task[];
  getTasksByPriority: (priority: string) => Task[];
  getPendingTasksCount: () => number;
  getCompletedTasksCount: () => number;
  getOverdueTasksCount: () => number;
  getTaskById: (id: string) => Task | undefined;
  getFilteredTasks: () => Task[];

  // Language filtering methods
  setLanguageFilter: (languages: string[]) => void;
  clearLanguageFilter: () => void;

  // --- ACTIONS ---
  fetchAvailableTasks: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchMyTasks: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  claimTask: (id: string) => Promise<void>;
  submitTask: (id: string, submission: string) => Promise<void>;
  updateTaskProgress: (id: string, data: { progress?: number; notes?: string }) => Promise<void>;
  clearCurrentTask: () => void;
  clearError: () => void;
  setFilters: (filters: any) => void;
  setPagination: (page: number, limit?: number) => void;
}

const useTaskStore = create<TaskStore>()(
  immer((set, get) => ({
    // --- STATE ---
    tasks: [],
    currentTask: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    filters: {},
    selectedLanguages: [],
    _pendingRequests: {} as Record<string, boolean>, // Track pending requests to prevent duplicates

    // --- GETTERS (SELECTORS) ---
    getTasksByStatus: (status: string) => {
      return get().tasks.filter(task => task.status === status);
    },

    getTasksByPriority: (priority: string) => {
      return get().tasks.filter(task => task.priority === priority);
    },

    getPendingTasksCount: () => {
      return get().tasks.filter(task => task.status === 'OPEN').length;
    },

    getCompletedTasksCount: () => {
      return get().tasks.filter(task => task.status === 'COMPLETED').length;
    },

    getOverdueTasksCount: () => {
      const today = new Date();
      return get().tasks.filter(task =>
        task.deadline &&
        new Date(task.deadline) < today &&
        task.status !== 'COMPLETED'
      ).length;
    },

    getTaskById: (id: string) => {
      return get().tasks.find(task => task.id === id);
    },

    getFilteredTasks: () => {
      const { tasks, selectedLanguages } = get();
      if (selectedLanguages.length === 0) return tasks;

      return tasks.filter(task =>
        selectedLanguages.includes(task.language.toLowerCase())
      );
    },

    // Language filtering methods
    setLanguageFilter: (languages: string[]) => {
      set(state => {
        state.selectedLanguages = languages;
        state.filters.languages = languages;
      });
    },

    clearLanguageFilter: () => {
      set(state => {
        state.selectedLanguages = [];
        state.filters.languages = undefined;
      });
    },

    // --- ACTIONS ---
    fetchAvailableTasks: async (page = 1, limit = 10, filters = {}) => {
      // Create unique request key to prevent duplicate concurrent requests
      const { selectedLanguages } = get();
      const { languages, ...otherFilters } = get().filters;
      const languagesValue = selectedLanguages?.length ? selectedLanguages.join(',') : undefined;
      const singleLanguage = selectedLanguages?.length === 1 ? selectedLanguages[0] : undefined;
      const allFilters = {
        ...filters,
        ...otherFilters,
        languages: languagesValue,
        language: singleLanguage,
      };
      const requestKey = `available-${page}-${limit}-${JSON.stringify(allFilters)}`;

      // Prevent duplicate concurrent requests - check and set atomically
      let shouldProceed = false;
      set(state => {
        if (state._pendingRequests[requestKey]) {
          // Already fetching this exact request, skip duplicate call
          return;
        }
        shouldProceed = true;
        state.isLoading = true;
        state.error = null;
        state._pendingRequests[requestKey] = true;
      });

      if (!shouldProceed) {
        return; // Another request is already in progress
      }

      try {
        const response = await taskService.getAvailableTasks(page, limit, allFilters);

        if (response.success) {
          // Normalize API response to frontend format
          const normalizedTasks = response.data.tasks.map((task: any) => ({
            id: task._id || task.id, // Use _id from API as id for frontend
            _id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            // Support both audioUrl (string) and audioUrls (array) from backend
            audioUrl: task.audioUrl ?? (Array.isArray(task.audioUrls) && task.audioUrls.length > 0 ? task.audioUrls[0] : undefined),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            price: task.price,
            language: task.language,
            tags: Array.isArray(task.tags) ? task.tags.join(',') : task.tags,
          }));

          set(state => {
            state.tasks = normalizedTasks;
            state.pagination = {
              page: response.data.pagination.currentPage,
              limit,
              total: response.data.pagination.totalTasks,
              totalPages: response.data.pagination.totalPages,
            };
            state.filters = filters;
            state.isLoading = false;
            state.error = null;
            delete state._pendingRequests[requestKey];
          });
        } else {
          throw new Error(response.message || 'Failed to fetch available tasks');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch available tasks';
          state.isLoading = false;
          delete state._pendingRequests[requestKey];
        });
        console.error('Failed to fetch available tasks:', error);
      }
    },

    fetchMyTasks: async (page = 1, limit = 10, filters = {}) => {
      // Create unique request key to prevent duplicate concurrent requests
      const { selectedLanguages } = get();
      const { languages, ...otherFilters } = get().filters;
      const languagesValue = selectedLanguages?.length ? selectedLanguages.join(',') : undefined;
      const singleLanguage = selectedLanguages?.length === 1 ? selectedLanguages[0] : undefined;
      const allFilters = {
        ...filters,
        ...otherFilters,
        languages: languagesValue,
        language: singleLanguage,
      };
      const requestKey = `my-${page}-${limit}-${JSON.stringify(allFilters)}`;

      // Prevent duplicate concurrent requests - check and set atomically
      let shouldProceed = false;
      set(state => {
        if (state._pendingRequests[requestKey]) {
          // Already fetching this exact request, skip duplicate call
          return;
        }
        shouldProceed = true;
        state.isLoading = true;
        state.error = null;
        state._pendingRequests[requestKey] = true;
      });

      if (!shouldProceed) {
        return; // Another request is already in progress
      }

      try {
        const response = await taskService.getMyTasks(page, limit, allFilters);

        if (response.success) {
          // Normalize API response to frontend format
          const normalizedTasks = response.data.tasks.map((task: any) => ({
            id: task._id || task.id, // Use _id from API as id for frontend
            _id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            // Support both audioUrl (string) and audioUrls (array) from backend
            audioUrl: task.audioUrl ?? (Array.isArray(task.audioUrls) && task.audioUrls.length > 0 ? task.audioUrls[0] : undefined),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            price: task.price,
            language: task.language,
            tags: Array.isArray(task.tags) ? task.tags.join(',') : task.tags,
            projectId: task.projectId?._id || task.projectId || task.project?._id || task.project,
            review: task.review,
            // Multi-speaker task fields
            type: task.type,
            roomName: task.roomName,
            assignedFreelancers: task.assignedFreelancers,
            // Recording fields for multi-speaker tasks
            recordingUrl: task.recordingUrl,
            recordingFileName: task.recordingFileName,
            recordingDuration: task.recordingDuration,
            recordingStatus: task.recordingStatus,
          }));

          set(state => {
            state.tasks = normalizedTasks;
            state.pagination = {
              page: response.data.pagination.currentPage,
              limit,
              total: response.data.pagination.totalTasks,
              totalPages: response.data.pagination.totalPages,
            };
            state.filters = filters;
            state.isLoading = false;
            state.error = null;
            delete state._pendingRequests[requestKey];
          });
        } else {
          throw new Error(response.message || 'Failed to fetch my tasks');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch my tasks';
          state.isLoading = false;
          delete state._pendingRequests[requestKey];
        });
        console.error('Failed to fetch my tasks:', error);
      }
    },

    fetchTaskById: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.getTaskById(id);

        if (response.success) {
          set(state => {
            state.currentTask = response.data;
            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to fetch task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch task';
          state.isLoading = false;
        });
        console.error('Failed to fetch task:', error);
      }
    },

    claimTask: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.claimTask(id);

        if (response.success) {
          // Update the task in the current list
          set(state => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
              state.tasks[taskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to claim task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to claim task';
          state.isLoading = false;
        });
        console.error('Failed to claim task:', error);
        throw error; // Re-throw for component handling
      }
    },

    submitTask: async (id: string, submission: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.submitTask(id, { submission });

        if (response.success) {
          // Update the task in the current list
          set(state => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
              state.tasks[taskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to submit task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to submit task';
          state.isLoading = false;
        });
        console.error('Failed to submit task:', error);
        throw error; // Re-throw for component handling
      }
    },

    updateTaskProgress: async (id: string, data: { progress?: number; notes?: string }) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.updateTaskProgress(id, data);

        if (response.success) {
          // Update the task in the current list
          set(state => {
            const taskIndex = state.tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
              state.tasks[taskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to update task progress');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to update task progress';
          state.isLoading = false;
        });
        console.error('Failed to update task progress:', error);
        throw error; // Re-throw for component handling
      }
    },

    clearCurrentTask: () => {
      set(state => {
        state.currentTask = null;
      });
    },

    clearError: () => {
      set(state => {
        state.error = null;
      });
    },

    setFilters: (filters: any) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
      });
    },

    setPagination: (page: number, limit = 10) => {
      set(state => {
        state.pagination.page = page;
        state.pagination.limit = limit;
      });
    },
  }))
);

export default useTaskStore;
