import BaseService from './base.service';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: {
    message: string;
  };
}

export class AuthService extends BaseService {
  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const result = await this.request<ChangePasswordResponse>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      console.error('AuthService: Password change failed:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
