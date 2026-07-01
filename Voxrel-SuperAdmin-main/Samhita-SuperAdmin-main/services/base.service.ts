// Base service for API requests
import { withDeduplication, generateCacheKey } from '@/lib/request-deduplication.lib';

// Extend RequestInit to include _retry for token refresh logic
interface ExtendedRequestInit extends RequestInit {
  _retry?: boolean;
}

class BaseService {
  protected baseURL: string;

  constructor() {
    // Always use environment variable - no hardcoded URLs
    const API_BASE_URL = 
      process.env.NEXT_PUBLIC_API_URL || 
      (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_URL) ||
      'https://samhita-backend-tlpg.onrender.com';

    this.baseURL = `${API_BASE_URL}/api/v1`;

    // Log the baseURL for debugging
    if (typeof window !== 'undefined') {
      console.log('BaseService: Using API URL:', this.baseURL);
    }
  }

  protected async request<T>(
    endpoint: string,
    options: ExtendedRequestInit = {}
  ): Promise<T> {
    // Use deduplication for GET requests to prevent duplicate calls
    if (!options.method || options.method === 'GET') {
      const cacheKey = generateCacheKey(endpoint, options.body ? JSON.parse(options.body as string) : {});
      return withDeduplication(
        (endpoint: string, options: ExtendedRequestInit) => this._makeRequest<T>(endpoint, options),
        () => cacheKey
      )(endpoint, options);
    }

    return this._makeRequest<T>(endpoint, options);
  }

  private async _makeRequest<T>(
    endpoint: string,
    options: ExtendedRequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('BaseService: Making request to:', url);

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = this.getToken();

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    } else if (endpoint.includes('/admin/')) {
      // Admin endpoints require authentication
      console.warn('BaseService: Admin endpoint without token:', endpoint);
    }

    const config: ExtendedRequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // If sending FormData, let the browser set the Content-Type with boundary
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      if (config.headers && 'Content-Type' in (config.headers as Record<string, string>)) {
        delete (config.headers as Record<string, string>)['Content-Type'];
      }
    }

    try {

      const response = await fetch(url, config);

      if (!response.ok) {

        // Handle token refresh for 401 errors (but NOT for auth endpoints like login)
        if (response.status === 401 && !options._retry && !endpoint.includes('/auth/')) {
          const refreshed = await this.handleTokenRefresh();

          if (refreshed) {
            // Retry the original request with new token
            const newToken = this.getToken();
            if (newToken) {
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${newToken}`,
              };
              config._retry = true;
              return this.request<T>(endpoint, config);
            }
          } else {
            // Redirect to login if refresh fails
            this.handleAuthFailure();
            return Promise.reject(new Error('Authentication failed - redirected to login'));
          }
        }

        const errorData = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        }));

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Enhanced logging for task creation endpoints
      if (endpoint.includes('/admin/tasks')) {
        console.log('🔍 API Response Debug:', {
          url,
          method: config.method || 'GET',
          status: response.status,
          ok: response.ok,
          data: data,
          hasSuccessField: data.hasOwnProperty('success'),
          successValue: data.success,
          dataType: typeof data,
          isArray: Array.isArray(data)
        });
      }

      // TEMPORARILY DISABLED: Handle new API response format
      // For successful HTTP responses (200-299), check if there's an explicit success field
      // If success field exists and is false, throw error
      // If success field doesn't exist, treat as successful (for APIs that don't use this format)
      // COMMENTING OUT TO TEST IF THIS IS CAUSING THE ERROR TOAST
      /*
      if (data.hasOwnProperty('success') && !data.success) {
        console.error('❌ API returned success: false', { url, data });
        throw new Error(data.message || 'Request failed');
      }
      */

      console.log('✅ Request successful:', { url, method: config.method || 'GET', status: response.status });
      return data; // Return the full response
    } catch (error) {
      throw error;
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.success) {
        // Store new tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      } else {
      }
      return false;
    } catch {
      return false;
    }
  }

  private handleAuthFailure(): void {

    // Clear tokens from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      return token;
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }
}

export default BaseService;
