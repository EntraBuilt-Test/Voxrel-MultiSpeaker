import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { userService } from '@/services/user.service';
import { User, LoginCredentials, RegisterData, UserStoreState, PaginationInfo } from '@/types';

interface UserFilters {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  joinDateFrom?: string;
  joinDateTo?: string;
}

interface UserStore extends UserStoreState {
  // Admin Management State
  users: User[];
  pagination: PaginationInfo;

  // --- GETTERS (SELECTORS) ---
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  getUserInitials: () => string;

  // --- AUTH ACTIONS ---
  initializeAuth: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; otp?: string; expiresIn?: string; }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ message: string; }>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  // --- ADMIN USER MANAGEMENT ACTIONS ---
  fetchUsers: (page: number, limit: number, filters: UserFilters) => Promise<void>;
  createUser: (userData: { name: string; email: string; password: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER'; status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED' }) => Promise<User>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const useUserStore = create<UserStore>()(
  persist(
    immer((set, get) => ({
      // --- AUTH STATE ---
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // --- ADMIN MANAGEMENT STATE ---
      users: [],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 50
      },

      // --- GETTERS (SELECTORS) ---
      isLoggedIn: () => {
        const { user, token } = get();
        
        // Check store state first
        if (user && token && (user.id || (user as any)._id)) {
          return true;
        }
        
        // Also check localStorage for backup
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('accessToken');
          const storedUser = localStorage.getItem('user');
          
          if (storedToken && storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
            try {
              const parsedUser = JSON.parse(storedUser);
              return !!(parsedUser && (parsedUser.id || parsedUser._id));
            } catch (error) {
              return false;
            }
          }
        }
        
        return false;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN';
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.role === 'SUPER_ADMIN';
      },

      getUserInitials: () => {
        const { user } = get();
        if (!user) return '';
        return user.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },

      // --- ACTIONS ---
      
      // Initialize authentication state from localStorage
      initializeAuth: () => {
        if (typeof window === 'undefined') return;
        
        
        try {
          const storedToken = localStorage.getItem('accessToken');
          const storedUser = localStorage.getItem('user');
          
          
          // Check for valid token and user data
          if (storedToken && storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
            try {
              const user = JSON.parse(storedUser);
              // Check for both id and _id (API might use either)
              if (user && (user.id || user._id)) {
                
                // Normalize user object to always have id field
                if (user._id && !user.id) {
                  user.id = user._id;
                }
                
                set(state => {
                  state.user = user;
                  state.token = storedToken;
                  state.isLoading = false;
                  state.error = null;
                });
                return;
              } else {
              }
            } catch (parseError) {
            }
          }
          
          // Clear invalid or missing data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
        } catch (error) {
          // Clear corrupted data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      },

      login: async (credentials: LoginCredentials) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await userService.login(credentials);
          // Service already stores tokens in localStorage
          set(state => {
            state.user = response.user;
            state.token = response.accessToken;
            state.isLoading = false;
            state.error = null;
          });
          
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Login failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      register: async (_userData: RegisterData) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Registration endpoint doesn't exist yet for admin
          throw new Error('Registration not available for admin panel');
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Registration failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      logout: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await userService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
        } finally {
          // Service handles token clearing
          set(state => {
            state.user = null;
            state.token = null;
            state.isLoading = false;
            state.error = null;
          });
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = typeof window !== 'undefined' 
            ? localStorage.getItem('refreshToken') 
            : null;
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await userService.refreshToken(refreshToken);
          
          // Update tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
          }

          set(state => {
            state.token = response.accessToken;
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      getCurrentUser: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const user = await userService.getCurrentUser();
          
          set(state => {
            state.user = user;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to get user data';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const user = await userService.updateProfile(data);
          
          set(state => {
            state.user = user;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to update profile';
            state.isLoading = false;
          });
          throw error;
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await userService.changePassword(oldPassword, newPassword);
          
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to change password';
            state.isLoading = false;
          });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const result = await userService.forgotPassword(email);
          
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
          
          return result;
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to send reset email';
            state.isLoading = false;
          });
          throw error;
        }
      },

      resetPassword: async (email: string, otp: string, newPassword: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const result = await userService.resetPassword(email, otp, newPassword);
          
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
          
          return result;
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to reset password';
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

      setUser: (user: User | null) => {
        set(state => {
          state.user = user;
        });
      },

      setToken: (token: string | null) => {
        set(state => {
          state.token = token;
        });
        
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('accessToken', token);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      },

      // --- ADMIN USER MANAGEMENT ACTIONS ---
      fetchUsers: async (page: number = 1, limit: number = 50, filters: UserFilters = {}) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await userService.getAllUsers(page, limit, filters);
          
          set(state => {
            state.users = response.data.users;
            state.pagination = {
              page: response.data.pagination.currentPage,
              totalPages: response.data.pagination.totalPages,
              total: response.data.pagination.totalUsers,
              limit
            };
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch users';
            state.isLoading = false;
          });
          throw error;
        }
      },

      createUser: async (userData: { name: string; email: string; password: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'FREELANCER'; status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED' }) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await userService.createUser(userData);
          
          set(state => {
            // Add the new user to the list
            state.users = [response.data, ...state.users];
            state.pagination.total = state.pagination.total + 1;
            state.isLoading = false;
            state.error = null;
          });
          
          return response.data;
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to create user';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateUser: async (userId: string, data: Partial<User>) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // For now, only support status updates until other endpoints are available
          if (data.status && ['PENDING_VERIFICATION', 'ACTIVE', 'BANNED'].includes(data.status)) {
            await userService.updateUserStatus(userId, data.status as 'PENDING_VERIFICATION' | 'ACTIVE' | 'BANNED');
            
            // Update local state
            set(state => {
              const userIndex = state.users.findIndex(user => user.id === userId);
              if (userIndex !== -1) {
                state.users[userIndex] = {
                  ...state.users[userIndex],
                  status: data.status as 'ACTIVE' | 'PENDING_VERIFICATION' | 'BANNED',
                  updatedAt: new Date().toISOString()
                };
              }
              state.isLoading = false;
              state.error = null;
            });
          } else {
            throw new Error('Only status updates are currently supported');
          }
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to update user';
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteUser: async (userId: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await userService.deleteUser(userId);

          set(state => {
            state.users = state.users.filter(user => user.id !== userId);
            state.pagination.total = Math.max(0, state.pagination.total - 1);
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to delete user';
            state.isLoading = false;
          });
          throw error;
        }
      },
    })),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useUserStore;
