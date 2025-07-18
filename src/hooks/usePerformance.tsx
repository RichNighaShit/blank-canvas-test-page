import React, { useCallback, useRef, useEffect } from "react";
import {
  PerformanceCache,
  CACHE_NAMESPACES,
  CacheNamespace,
} from "@/lib/performanceCache";
import { PerformanceMonitor } from "@/lib/performanceMonitor";
import { ImageOptimizer } from "@/lib/imageOptimizer";

export interface UsePerformanceOptions {
  cacheNamespace?: CacheNamespace;
  enableCaching?: boolean;
  enableMonitoring?: boolean;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    cacheNamespace = CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching = true,
    enableMonitoring = true,
  } = options;

  const cacheKeyRef = useRef<string>("");

  // Generate cache key from component props
  const generateCacheKey = useCallback((data: any): string => {
    const key = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Cached function execution
  function executeWithCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      if (!enableCaching) {
        return PerformanceMonitor.measureExecutionTime(key, fn);
      }

      const cacheKey = generateCacheKey({ key, namespace: cacheNamespace });

      try {
        const cached = PerformanceCache.get<T>(cacheKey, cacheNamespace);
        if (cached) {
          return Promise.resolve(cached);
        }
      } catch (cacheError) {
        console.warn("Cache retrieval error:", cacheError);
      }

      return PerformanceMonitor.measureExecutionTime(key, fn)
        .then((result) => {
          try {
            PerformanceCache.set(cacheKey, result, {
              ttl,
              namespace: cacheNamespace,
            });
          } catch (cacheError) {
            console.warn("Cache storage error:", cacheError);
          }
          return result;
        })
        .catch((error) => {
          console.error("Function execution error:", error);
          throw error;
        });
    } catch (error) {
      console.error("executeWithCache error:", error);
      return Promise.reject(error);
    }
  }

  // Optimized image loading
  const loadOptimizedImage = useCallback(
    async (
      file: File,
      options?: {
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
        format?: "webp" | "jpeg" | "png";
      },
    ) => {
      return PerformanceMonitor.measureExecutionTime("image_optimization", () =>
        ImageOptimizer.optimizeImage(file, options),
      );
    },
    [],
  );

  // Debounced function execution
  const debounce = useCallback(
    <T extends (...args: any[]) => any>(func: T, delay: number): T => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const debouncedFn = (...args: Parameters<T>) => {
        try {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          timeoutId = setTimeout(() => {
            timeoutId = null;
            try {
              const result = func(...args);
              // Handle async functions properly
              if (result && typeof result.catch === "function") {
                result.catch((error: any) => {
                  console.error("Error in async debounced function:", error);
                });
              }
            } catch (error) {
              console.error("Error in debounced function:", error);
            }
          }, delay);
        } catch (error) {
          console.error("Error setting up debounced function:", error);
        }
      };

      // Add cleanup method to the debounced function
      (debouncedFn as any).cancel = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      return debouncedFn as T;
    },
    [],
  );

  // Throttled function execution
  const throttle = useCallback(
    <T extends (...args: any[]) => any>(func: T, delay: number): T => {
      let lastCall = 0;

      return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return func(...args);
        }
        return undefined;
      }) as T;
    },
    [],
  );

  // Preload critical resources
  const preloadResources = useCallback(async (urls: string[]) => {
    return PerformanceMonitor.measureExecutionTime("resource_preload", () =>
      ImageOptimizer.preloadImages(urls),
    );
  }, []);

  // Clear component cache
  const clearCache = useCallback(() => {
    PerformanceCache.clearNamespace(cacheNamespace);
  }, [cacheNamespace]);

  // Get performance stats
  const getPerformanceStats = useCallback(() => {
    return {
      cache: PerformanceCache.getStats(),
      monitor: PerformanceMonitor.getReport(),
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
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
    generateCacheKey,
  };
};
