import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { userService } from '@/services/user.service';
import { User, LoginCredentials, RegisterData, UserStoreState } from '@/types';

interface UserStore extends UserStoreState {
  // Token management (NEW)
  accessToken: string | null;
  refreshToken: string | null;
  
  // --- GETTERS (SELECTORS) ---
  isLoggedIn: () => boolean;
  getUserInitials: () => string;

  // --- AUTH ACTIONS ---
  initializeAuth: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  refreshUserStatus: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const useUserStore = create<UserStore>()(
  persist(
    immer((set, get) => ({
      // --- AUTH STATE ---
      user: null,
      token: null, // Deprecated, keeping for backward compatibility
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // --- GETTERS (SELECTORS) ---
      isLoggedIn: () => {
        const { user, accessToken } = get();
        return !!user && !!accessToken;
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

      // --- INITIALIZE AUTH ---
      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const storedAccessToken = localStorage.getItem('accessToken');
          const storedRefreshToken = localStorage.getItem('refreshToken');
          const storedUser = localStorage.getItem('user');

          if (storedAccessToken && storedRefreshToken && storedUser) {
            try {
              const user = JSON.parse(storedUser);
              set(state => {
                state.user = user;
                state.accessToken = storedAccessToken;
                state.refreshToken = storedRefreshToken;
                state.token = storedAccessToken; // Backward compatibility
              });
            } catch (error) {
              console.error('Failed to parse stored user:', error);
              // Clear invalid data
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
            }
          }
        }
      },

      // --- ACTIONS ---
      login: async (credentials: LoginCredentials) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // userService.login now returns { user, accessToken, refreshToken }
          // Tokens are already stored in localStorage by the service
          const { user, accessToken, refreshToken } = await userService.login(credentials);

          set(state => {
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.token = accessToken; // Backward compatibility
            state.isLoading = false;
            state.error = null;
          });

          // Set cookies for middleware
          if (typeof window !== 'undefined') {
            document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; secure; samesite=strict`;
            document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=86400; secure; samesite=strict`;
          }
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Login failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // userService.register now returns { user, accessToken, refreshToken }
          // Tokens are already stored in localStorage by the service
          const { user, accessToken, refreshToken } = await userService.register(userData);

          set(state => {
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.token = accessToken; // Backward compatibility
            state.isLoading = false;
            state.error = null;
          });

          // Set cookies for middleware
          if (typeof window !== 'undefined') {
            document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; secure; samesite=strict`;
            document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=86400; secure; samesite=strict`;
          }
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
          // userService.logout() handles clearing tokens from localStorage
          await userService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        } finally {
          set(state => {
            state.user = null;
            state.token = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isLoading = false;
            state.error = null;
          });

          // Clear cookies for middleware
          if (typeof window !== 'undefined') {
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }
      },

      refreshAccessToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const { accessToken, refreshToken } = await userService.refreshToken(currentRefreshToken);
          
          // Tokens are already stored in localStorage by the service
          set(state => {
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.token = accessToken; // Backward compatibility
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
          // userService.getCurrentUser() now returns User directly
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

      refreshUserStatus: async () => {
        try {
          // Get fresh user data from backend
          const user = await userService.getCurrentUser();
          
          set(state => {
            state.user = user;
            state.error = null;
          });

          // Update localStorage with fresh data
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
            document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=86400; secure; samesite=strict`;
          }
        } catch (error) {
          console.error('Failed to refresh user status:', error);
          // Don't throw error for refresh - just log it
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // userService.updateProfile() now returns User directly
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
          await userService.forgotPassword(email);
          
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
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
          await userService.resetPassword(email, otp, newPassword);
          
          set(state => {
            state.isLoading = false;
            state.error = null;
          });
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
        // Deprecated method, keeping for backward compatibility
        set(state => {
          state.token = token;
          state.accessToken = token; // Treat as accessToken
        });
        
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('auth_token', token); // Backward compatibility
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('auth_token'); // Backward compatibility
          }
        }
      },

    })),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token, // Deprecated
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useUserStore;
