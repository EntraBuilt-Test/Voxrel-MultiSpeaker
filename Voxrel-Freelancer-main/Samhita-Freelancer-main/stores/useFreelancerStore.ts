import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { freelancerService } from '@/services/freelancer.service';
import { Task, FreelancerStats, FreelancerProfile, BaseState, PaginationInfo } from '@/types';

interface FreelancerStore extends BaseState {
  // State
  profile: FreelancerProfile | null;
  stats: FreelancerStats | null;
  myTasks: Task[];
  availableTasks: Task[];
  assignedReviews: any[];
  pagination: PaginationInfo;
  _pendingRequests: Record<string, boolean>; // Track pending requests to prevent duplicates
  
  // Getters
  getCompletedTasks: () => Task[];
  getPendingTasks: () => Task[];
  getTotalEarnings: () => number;
  getLanguageStats: () => Record<string, number>;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<FreelancerProfile>) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMyTasks: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchAvailableTasks: (page?: number, limit?: number, filters?: any) => Promise<void>;
  claimTask: (taskId: string) => Promise<void>;
  submitTask: (taskId: string, submission: string) => Promise<void>;
  fetchAssignedReviews: (page?: number, limit?: number, filters?: any) => Promise<void>;
  submitReview: (reviewId: string, rating: number, feedback: string) => Promise<void>;
  clearError: () => void;
}

const useFreelancerStore = create<FreelancerStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      profile: null,
      stats: null,
      myTasks: [],
      availableTasks: [],
      assignedReviews: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      _pendingRequests: {} as Record<string, boolean>, // Track pending requests to prevent duplicates

      // Getters
      getCompletedTasks: () => {
        return get().myTasks.filter(task => task.status === 'COMPLETED');
      },

      getPendingTasks: () => {
        return get().myTasks.filter(task => ['ASSIGNED', 'PENDING_APPROVAL'].includes(task.status));
      },

      getTotalEarnings: () => {
        const completedTasks = get().getCompletedTasks();
        return completedTasks.reduce((sum, task) => sum + (task.price || 0), 0);
      },

      getLanguageStats: () => {
        const tasks = get().myTasks;
        return tasks.reduce((acc, task) => {
          const lang = task.language || 'Unknown';
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      },

      // Actions
      fetchProfile: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await freelancerService.getProfile();
          
          set(state => {
            state.profile = response.data;
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch profile';
            state.isLoading = false;
          });
        }
      },

      updateProfile: async (data: Partial<FreelancerProfile>) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await freelancerService.updateProfile(data);
          
          set(state => {
            state.profile = response.data;
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to update profile';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchStats: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Always calculate stats from tasks since the stats endpoint might not be working
          const tasks = get().myTasks;
          const calculatedStats = freelancerService.calculateStatsFromTasks(tasks);
          
          set(state => {
            state.stats = {
              totalTasks: calculatedStats.totalTasks || 0,
              completedTasks: calculatedStats.completedTasks || 0,
              pendingTasks: calculatedStats.pendingTasks || 0,
              totalEarnings: calculatedStats.totalEarnings || 0,
              averageRating: 0, // Will be calculated when we have review data
              languages: calculatedStats.languages || {},
              monthlyEarnings: {},
            };
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to calculate stats';
            state.isLoading = false;
          });
        }
      },

      fetchMyTasks: async (page = 1, limit = 10, filters = {}) => {
        // Create unique request key to prevent duplicate concurrent requests
        const requestKey = `freelancer-my-${page}-${limit}-${JSON.stringify(filters)}`;
        
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
          const response = await freelancerService.getMyTasks({ page, limit, ...filters });
          
          set(state => {
            state.myTasks = response.data.tasks.map(task => ({
              ...task,
              id: task._id || task.id, // Normalize ID
            }));
            state.pagination = response.data.pagination;
            state.isLoading = false;
            delete state._pendingRequests[requestKey];
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch tasks';
            state.isLoading = false;
            delete state._pendingRequests[requestKey];
          });
        }
      },

      fetchAvailableTasks: async (page = 1, limit = 10, filters = {}) => {
        // Create unique request key to prevent duplicate concurrent requests
        const requestKey = `freelancer-available-${page}-${limit}-${JSON.stringify(filters)}`;
        
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
          const response = await freelancerService.getAvailableTasks({ page, limit, ...filters });
          
          set(state => {
            state.availableTasks = response.data.tasks.map(task => ({
              ...task,
              id: task._id || task.id, // Normalize ID
            }));
            state.pagination = response.data.pagination;
            state.isLoading = false;
            delete state._pendingRequests[requestKey];
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch available tasks';
            state.isLoading = false;
            delete state._pendingRequests[requestKey];
          });
        }
      },

      claimTask: async (taskId: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await freelancerService.claimTask(taskId);
          
          // Refresh available tasks and my tasks
          await get().fetchAvailableTasks();
          await get().fetchMyTasks();
          
          set(state => {
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to claim task';
            state.isLoading = false;
          });
          throw error;
        }
      },

      submitTask: async (taskId: string, submission: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await freelancerService.submitTask(taskId, submission);
          
          // Refresh my tasks
          await get().fetchMyTasks();
          
          set(state => {
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to submit task';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchAssignedReviews: async (page = 1, limit = 10, filters = {}) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await freelancerService.getAssignedReviews({ page, limit, ...filters });
          
          set(state => {
            state.assignedReviews = response.data.reviews;
            state.pagination = response.data.pagination;
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch reviews';
            state.isLoading = false;
          });
        }
      },

      submitReview: async (reviewId: string, rating: number, feedback: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await freelancerService.submitReview(reviewId, rating, feedback);
          
          // Refresh assigned reviews
          await get().fetchAssignedReviews();
          
          set(state => {
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to submit review';
            state.isLoading = false;
          });
          throw error;
        }
      },

      clearError: () => {
        set(state => {
          state.error = null;
        });
      },
    })),
    {
      name: 'freelancer-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        stats: state.stats,
      }),
    }
  )
);

export default useFreelancerStore;
