import BaseService from './base.service';
import { User, LoginCredentials, RegisterData } from '@/types';

class UserService extends BaseService {
  // Authentication methods for regular users
  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await this.post<any>('/auth/login', credentials);
    
    // Extract data from API response structure
    const loginData = response.data || response;
    
    // Validate required fields
    if (!loginData.accessToken || !loginData.refreshToken || !loginData.user) {
      throw new Error('Invalid login response: missing required authentication data');
    }
    
    // Normalize user object (ensure it has id field)
    const normalizedUser = { ...loginData.user };
    if (normalizedUser._id && !normalizedUser.id) {
      normalizedUser.id = normalizedUser._id;
    }
    
    // Map backend status to frontend status for consistency
    if (normalizedUser.status === 'PENDING_VERIFICATION') {
      normalizedUser.status = 'PENDING' as any; // Map PENDING_VERIFICATION to PENDING
    }
    // Keep ACTIVE and BANNED as-is
    
    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', loginData.accessToken);
      localStorage.setItem('refreshToken', loginData.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    }
    
    return {
      user: normalizedUser,
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken
    };
  }

  // Two-step registration process
  async registerStart(userData: RegisterData): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
      email: string;
    };
  }> {
    return this.post('/auth/register/start', userData);
  }

  async registerVerify(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const response = await this.post<any>('/auth/register/verify', { email, otp });
    
    // Extract data from API response structure
    const verifyData = response.data || response;
    
    // According to API docs, this endpoint only verifies email
    // User remains in PENDING_VERIFICATION status until admin approval
    // No tokens are returned - user must login separately after admin approval
    
    // Check if response indicates success (handle different response formats)
    if (verifyData.success === true || verifyData.message || response.success === true) {
      return {
        success: true,
        message: verifyData.message || response.message || 'Email verified successfully'
      };
    }
    
    // If we get here, the verification failed
    throw new Error(verifyData.message || response.message || 'Invalid verification code');
  }

  // Legacy method - kept for backward compatibility
  async register(userData: RegisterData): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Start registration
    await this.registerStart(userData);
    
    // Note: This will fail because we need OTP
    // Use registerStart + registerVerify instead
    throw new Error('Registration requires OTP verification. Use registerStart and registerVerify methods.');
  }

  async logout(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    try {
      // Call logout endpoint with refresh token
      await this.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Log error but continue with local cleanup
    } finally {
      // Clear tokens regardless of API call result
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post('/auth/refresh', { refreshToken });
  }

  // User management methods
  async getCurrentUser(): Promise<User> {
    const response = await this.get<any>('/auth/me');
    const user = response.data || response;
    
    // Normalize user object
    if (user._id && !user.id) {
      user.id = user._id;
    }
    
    // Map backend status to frontend status for consistency
    if (user.status === 'PENDING_VERIFICATION') {
      user.status = 'PENDING' as any; // Map PENDING_VERIFICATION to PENDING
    }
    // Keep ACTIVE and BANNED as-is
    
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.patch<any>('/users/profile', data);
    return response.data || response;
  }

  // Password management
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.post('/auth/change-password', { oldPassword, newPassword });
  }

  async forgotPassword(email: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
      otp?: string;
      expiresIn?: string;
    };
  }> {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      message: string;
    };
  }> {
    return this.post('/auth/reset-password', { email, otp, newPassword });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.post('/auth/verify-email', { token });
  }
}

export const userService = new UserService();
