// Base service for API requests

// Extend RequestInit to include _retry for token refresh logic
interface ExtendedRequestInit extends RequestInit {
  _retry?: boolean;
}

// Base API configuration
// NEXT_PUBLIC_* variables are embedded at build time in Next.js
// Always use environment variable - no hardcoded URLs
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_URL) ||
  'https://samhita-backend-tlpg.onrender.com';

// Global request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

class BaseService {
  protected baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1`;
  }

  // Normalize URL to ensure consistent keys (sort query params)
  private normalizeUrl(url: string): string {
    try {
      const [base, query] = url.split('?');
      if (!query) return url;

      const params = new URLSearchParams(query);
      // Sort params for consistent keys
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b));
      const normalizedQuery = new URLSearchParams(sortedParams).toString();

      return normalizedQuery ? `${base}?${normalizedQuery}` : base;
    } catch {
      return url;
    }
  }

  protected async request<T>(
    endpoint: string,
    options: ExtendedRequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Create a unique key for this request (only for GET requests to avoid caching mutations)
    const isGetRequest = !options.method || options.method === 'GET';
    const normalizedUrl = isGetRequest ? this.normalizeUrl(url) : url;
    const requestKey = isGetRequest ? `${options.method || 'GET'}:${normalizedUrl}` : null;

    // Check if there's already a pending request for this exact endpoint
    // This must be checked synchronously to prevent race conditions
    if (requestKey) {
      const existingRequest = pendingRequests.get(requestKey);
      if (existingRequest) {
        // Return the existing promise instead of making a new request
        return existingRequest as Promise<T>;
      }
    }

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = this.getToken();

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: ExtendedRequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Create the request promise and add to cache IMMEDIATELY (before async operations)
    // This prevents race conditions where multiple requests check the cache before any are added
    let requestPromise: Promise<T>;

    if (requestKey) {
      // Double-check-lock pattern: check, create placeholder, check again, set
      // This ensures true atomicity even with concurrent requests
      let existingRequest = pendingRequests.get(requestKey);
      if (existingRequest) {
        return existingRequest as Promise<T>;
      }

      // Create a placeholder promise immediately
      let resolvePromise: (value: T) => void;
      let rejectPromise: (error: any) => void;

      const placeholderPromise = new Promise<T>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });

      // Double-check: another request might have added it between the first check and now
      existingRequest = pendingRequests.get(requestKey);
      if (existingRequest) {
        return existingRequest as Promise<T>;
      }

      // Add placeholder to cache IMMEDIATELY (synchronously) - this is the critical atomic operation
      pendingRequests.set(requestKey, placeholderPromise);

      // Now create the actual request promise
      requestPromise = (async () => {
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
                  // Remove from cache before retrying
                  if (requestKey) {
                    pendingRequests.delete(requestKey);
                  }
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

          // Handle new API response format
          if (!data.success) {
            throw new Error(data.message || 'Request failed');
          }

          return data; // Return the full response with success, statusCode, message, data
        } catch (error) {
          throw error;
        } finally {
          // Remove from cache when request completes (success or failure)
          if (requestKey) {
            pendingRequests.delete(requestKey);
          }
        }
      })();

      // Resolve/reject the placeholder promise with the actual result
      requestPromise
        .then(result => resolvePromise!(result))
        .catch(error => rejectPromise!(error));

      return placeholderPromise;
    } else {
      // For non-GET requests, just execute normally
      requestPromise = (async () => {
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

          // Handle new API response format
          if (!data.success) {
            throw new Error(data.message || 'Request failed');
          }

          return data; // Return the full response with success, statusCode, message, data
        } catch (error) {
          throw error;
        }
      })();

      return requestPromise;
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
