/**
 * Request Deduplication Utility
 * Prevents duplicate API calls for the same request within a short time window
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private readonly DEDUPLICATION_WINDOW = 1000; // 1 second

  /**
   * Get or create a request promise
   * If a request with the same key is already pending, return the existing promise
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    
    // Check if there's already a pending request for this key
    const existing = this.pendingRequests.get(key) as PendingRequest<T> | undefined;
    
    if (existing) {
      // If the request is still within the deduplication window, return the existing promise
      if (now - existing.timestamp < this.DEDUPLICATION_WINDOW) {
        return existing.promise;
      } else {
        // Clean up expired request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up when request completes
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Check if a request is pending for a given key
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
}

export const requestDeduplication = new RequestDeduplication();

/**
 * Higher-order function to wrap API calls with deduplication
 */
export function withDeduplication<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    return requestDeduplication.deduplicate(key, () => fn(...args));
  };
}

/**
 * Generate a cache key for API requests
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, unknown> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
}
