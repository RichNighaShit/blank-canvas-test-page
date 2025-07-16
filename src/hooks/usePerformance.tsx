
import React from 'react';
import { PerformanceCache, CACHE_NAMESPACES, CacheNamespace } from '@/lib/performanceCache';
import { PerformanceMonitor } from '@/lib/performanceMonitor';
import { ImageOptimizer } from '@/lib/imageOptimizer';

export interface UsePerformanceOptions {
  cacheNamespace?: CacheNamespace;
  enableCaching?: boolean;
  enableMonitoring?: boolean;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    cacheNamespace = CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching = true,
    enableMonitoring = true
  } = options;

  const cacheKeyRef = React.useRef<string>('');

  // Generate cache key from component props
  const generateCacheKey = React.useCallback((data: any): string => {
    const key = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Cached function execution
  function executeWithCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (!enableCaching) {
      return PerformanceMonitor.measureExecutionTime(key, fn);
    }

    const cacheKey = generateCacheKey({ key, namespace: cacheNamespace });
    const cached = PerformanceCache.get<T>(cacheKey, cacheNamespace);

    if (cached) {
      return Promise.resolve(cached);
    }

    return PerformanceMonitor.measureExecutionTime(key, fn).then(result => {
      PerformanceCache.set(cacheKey, result, { ttl, namespace: cacheNamespace });
      return result;
    });
  }

  // Optimized image loading
  const loadOptimizedImage = React.useCallback(async (
    file: File,
    options?: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ) => {
    return PerformanceMonitor.measureExecutionTime('image_optimization', () =>
      ImageOptimizer.optimizeImage(file, options)
    );
  }, []);

  // Debounced function execution
  const debounce = React.useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }, []);

  // Throttled function execution
  const throttle = React.useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let lastCall = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    }) as T;
  }, []);

  // Preload critical resources
  const preloadResources = React.useCallback(async (urls: string[]) => {
    return PerformanceMonitor.measureExecutionTime('resource_preload', () =>
      ImageOptimizer.preloadImages(urls)
    );
  }, []);

  // Clear component cache
  const clearCache = React.useCallback(() => {
    PerformanceCache.clearNamespace(cacheNamespace);
  }, [cacheNamespace]);

  // Get performance stats
  const getPerformanceStats = React.useCallback(() => {
    return {
      cache: PerformanceCache.getStats(),
      monitor: PerformanceMonitor.getReport()
    };
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Optional: clear component-specific cache on unmount
      // clearCache();
    };
  }, [clearCache]);

  return {
    executeWithCache,
    loadOptimizedImage,
    debounce,
    throttle,
    preloadResources,
    clearCache,
    getPerformanceStats,
    generateCacheKey
  };
}; 
