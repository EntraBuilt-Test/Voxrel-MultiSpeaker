/**
 * Performance Monitoring Utility
 * Tracks API call performance, cache hit rates, and provides insights
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  cached: boolean;
  success: boolean;
  error?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private cacheStats = new Map<string, CacheStats>();
  private readonly MAX_METRICS = 1000; // Keep only last 1000 metrics

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Update cache stats
    this.updateCacheStats(metric.endpoint, metric.cached);
  }

  /**
   * Update cache statistics
   */
  private updateCacheStats(endpoint: string, cached: boolean): void {
    const stats = this.cacheStats.get(endpoint) || { hits: 0, misses: 0, total: 0, hitRate: 0 };
    
    if (cached) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    stats.total = stats.hits + stats.misses;
    stats.hitRate = stats.total > 0 ? (stats.hits / stats.total) * 100 : 0;
    
    this.cacheStats.set(endpoint, stats);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    cacheHitRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
    errorRate: number;
  } {
    const totalRequests = this.metrics.length;
    
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        cacheHitRate: 0,
        slowestEndpoints: [],
        errorRate: 0,
      };
    }

    const successfulRequests = this.metrics.filter(m => m.success);
    const cachedRequests = this.metrics.filter(m => m.cached);
    const errorRequests = this.metrics.filter(m => !m.success);

    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const successRate = (successfulRequests.length / totalRequests) * 100;
    const cacheHitRate = (cachedRequests.length / totalRequests) * 100;
    const errorRate = (errorRequests.length / totalRequests) * 100;

    // Calculate slowest endpoints
    const endpointDurations = new Map<string, number[]>();
    this.metrics.forEach(metric => {
      if (!endpointDurations.has(metric.endpoint)) {
        endpointDurations.set(metric.endpoint, []);
      }
      endpointDurations.get(metric.endpoint)!.push(metric.duration);
    });

    const slowestEndpoints = Array.from(endpointDurations.entries())
      .map(([endpoint, durations]) => ({
        endpoint,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowestEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  /**
   * Get cache statistics for a specific endpoint
   */
  getCacheStats(endpoint: string): CacheStats | undefined {
    return this.cacheStats.get(endpoint);
  }

  /**
   * Get all cache statistics
   */
  getAllCacheStats(): Map<string, CacheStats> {
    return new Map(this.cacheStats);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheStats.clear();
  }

  /**
   * Get recent metrics (last N requests)
   */
  getRecentMetrics(count: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to wrap API calls with performance monitoring
 */
export function withPerformanceMonitoring<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
  method: string = 'GET'
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        endpoint,
        method,
        duration,
        cached: false, // This would need to be determined by the caching layer
        success,
        error,
      });
    }
  };
}

/**
 * Development-only performance logging
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV === 'development') {
    // Performance metrics available for debugging if needed
    // const summary = performanceMonitor.getPerformanceSummary();
  }
}
