import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { taskService } from '@/services/task.service';
import { Task, CreateTaskData, UpdateTaskData, TaskStoreState } from '@/types';

// Hardcoded filter options (as per API documentation)
const HARDCODED_FILTER_OPTIONS: FilterOptions = {
  languages: [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'korean', label: 'Korean' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'russian', label: 'Russian' },
    { value: 'italian', label: 'Italian' },
  ],
  priorities: [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ],
  statuses: [
    { value: 'OPEN', label: 'Open' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ],
};

interface FilterOptions {
  languages: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
}

interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  search?: string;
  language?: string;
  createdAfter?: string;
  createdBefore?: string;
  dueDateAfter?: string;
  dueDateBefore?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'price' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

interface TaskStore extends TaskStoreState {
  filterOptions: FilterOptions;

  // --- GETTERS (SELECTORS) ---
  getTasksByStatus: (status: string) => Task[];
  getTasksByPriority: (priority: string) => Task[];
  getPendingTasksCount: () => number;
  getCompletedTasksCount: () => number;
  getOverdueTasksCount: () => number;
  getTaskById: (id: string) => Task | undefined;

  // --- ACTIONS ---
  fetchTasks: (page?: number, limit?: number, filters?: TaskFilters) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (taskData: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  approveTaskClaim: (id: string) => Promise<void>;
  rejectTaskClaim: (id: string) => Promise<void>;
  clearCurrentTask: () => void;
  clearError: () => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
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
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    filters: {},
    filterOptions: HARDCODED_FILTER_OPTIONS,

    // --- GETTERS (SELECTORS) ---
    getTasksByStatus: (status: string) => {
      return get().tasks.filter(task => task.status === status);
    },

    getTasksByPriority: (priority: string) => {
      return get().tasks.filter(task => task.priority === priority);
    },

    getPendingTasksCount: () => {
      return get().tasks.filter(task => task.status === 'PENDING_APPROVAL').length;
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

    // --- ACTIONS ---
    fetchTasks: async (page = 1, limit = 20, filters: TaskFilters = {}) => {

      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.getAllTasks(page, limit, filters);

        if (response.success && response.data) {
          // Debug: Log the actual response structure

          // Handle different possible response structures
          let tasks: Task[] = [];
          let pagination = {
            currentPage: 1,
            totalPages: 1,
            totalTasks: 0,
            hasNext: false,
            hasPrev: false
          };

          if (Array.isArray(response.data.tasks)) {
            // New API format with tasks array
            tasks = response.data.tasks;
            pagination = response.data.pagination || pagination;
          }
          else {
            throw new Error('Invalid response structure: tasks not found');
          }


          set(state => {
            state.tasks = tasks;
            state.pagination = {
              page: pagination.currentPage,
              limit: limit,
              total: pagination.totalTasks,
              totalPages: pagination.totalPages,
            };
            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to fetch tasks');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch tasks';
          state.isLoading = false;
        });
      }
    },


    fetchTaskById: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.getTaskById(id);

        if (response.success && response.data) {
          set(state => {
            state.currentTask = response.data;
            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Task not found');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch task';
          state.isLoading = false;
        });
      }
    },

    createTask: async (taskData: CreateTaskData) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.createTask(taskData);

        if (response.success && response.data) {
          set(state => {
            state.tasks.unshift(response.data);
            state.pagination.total += 1;
            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to create task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to create task';
          state.isLoading = false;
        });
        throw error;
      }
    },

    updateTask: async (id: string, data: UpdateTaskData) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.updateTask(id, data);

        if (response.success && response.data) {
          set(state => {
            const stateTaskIndex = state.tasks.findIndex(task => task.id === id);
            if (stateTaskIndex !== -1) {
              state.tasks[stateTaskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to update task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to update task';
          state.isLoading = false;
        });
        throw error;
      }
    },

    deleteTask: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.deleteTask(id);

        if (response.success) {
          set(state => {
            state.tasks = state.tasks.filter(task => task.id !== id);
            state.pagination.total -= 1;

            if (state.currentTask?.id === id) {
              state.currentTask = null;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to delete task');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to delete task';
          state.isLoading = false;
        });
        throw error;
      }
    },

    approveTaskClaim: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.approveTaskClaim(id);

        if (response.success && response.data) {
          set(state => {
            const stateTaskIndex = state.tasks.findIndex(task => task.id === id);
            if (stateTaskIndex !== -1) {
              state.tasks[stateTaskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to approve task claim');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to approve task claim';
          state.isLoading = false;
        });
        throw error;
      }
    },

    rejectTaskClaim: async (id: string) => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await taskService.rejectTaskClaim(id);

        if (response.success && response.data) {
          set(state => {
            const stateTaskIndex = state.tasks.findIndex(task => task.id === id);
            if (stateTaskIndex !== -1) {
              state.tasks[stateTaskIndex] = response.data;
            }

            if (state.currentTask?.id === id) {
              state.currentTask = response.data;
            }

            state.isLoading = false;
            state.error = null;
          });
        } else {
          throw new Error(response.message || 'Failed to reject task claim');
        }
      } catch (error) {
        set(state => {
          state.error = error instanceof Error ? error.message : 'Failed to reject task claim';
          state.isLoading = false;
        });
        throw error;
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

    setFilters: (filters: Partial<TaskFilters>) => {
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
