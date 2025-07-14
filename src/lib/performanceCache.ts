export const CACHE_NAMESPACES = {
  RECOMMENDATIONS: 'recommendations',
  WARDROBE_ITEMS: 'wardrobe_items',
  USER_PROFILE: 'user_profile',
  WEATHER_DATA: 'weather_data',
  SHOPPING_PRODUCTS: 'shopping_products',
  ANALYTICS: 'analytics',
  DASHBOARD: 'dashboard',
  OUTFIT_PLANNER: 'outfit_planner'
} as const;

export type CacheNamespace = typeof CACHE_NAMESPACES[keyof typeof CACHE_NAMESPACES];

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  namespace: CacheNamespace;
}

interface CacheOptions {
  ttl?: number;
  namespace?: CacheNamespace;
  maxSize?: number;
}

export class PerformanceCache {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_MAX_SIZE = 100;
  private static readonly CACHE_PREFIX = 'dripmuse_cache_';
  private static readonly MEMORY_CACHE = new Map<string, CacheEntry<any>>();

  /**
   * Set a value in the cache
   */
  static set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl = this.DEFAULT_TTL, namespace = CACHE_NAMESPACES.RECOMMENDATIONS } = options;
    const cacheKey = `${namespace}:${key}`;
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      namespace
    };

    // Store in memory cache
    this.MEMORY_CACHE.set(cacheKey, entry);

    // Store in localStorage for persistence
    try {
      localStorage.setItem(this.CACHE_PREFIX + cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to store cache in localStorage:', error);
    }

    // Enforce max size
    if (this.MEMORY_CACHE.size > this.DEFAULT_MAX_SIZE) {
      this.evictOldest();
    }
  }

  /**
   * Get a value from the cache
   */
  static get<T>(key: string, namespace: CacheNamespace = CACHE_NAMESPACES.RECOMMENDATIONS): T | null {
    const cacheKey = `${namespace}:${key}`;
    
    // Check memory cache first
    const memoryEntry = this.MEMORY_CACHE.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(this.CACHE_PREFIX + cacheKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          // Restore to memory cache
          this.MEMORY_CACHE.set(cacheKey, entry);
          return entry.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(this.CACHE_PREFIX + cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve cache from localStorage:', error);
    }

    return null;
  }

  /**
   * Check if a key exists and is not expired
   */
  static has(key: string, namespace: CacheNamespace = CACHE_NAMESPACES.RECOMMENDATIONS): boolean {
    return this.get(key, namespace) !== null;
  }

  /**
   * Remove a specific key from cache
   */
  static delete(key: string, namespace: CacheNamespace = CACHE_NAMESPACES.RECOMMENDATIONS): void {
    const cacheKey = `${namespace}:${key}`;
    this.MEMORY_CACHE.delete(cacheKey);
    try {
      localStorage.removeItem(this.CACHE_PREFIX + cacheKey);
    } catch (error) {
      console.warn('Failed to remove cache from localStorage:', error);
    }
  }

  /**
   * Clear all cache entries for a specific namespace
   */
  static clearNamespace(namespace: CacheNamespace): void {
    // Clear from memory cache
    for (const [key] of this.MEMORY_CACHE) {
      if (key.startsWith(`${namespace}:`)) {
        this.MEMORY_CACHE.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX + namespace + ':')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear namespace from localStorage:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.MEMORY_CACHE.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): { 
    memorySize: number; 
    localStorageSize: number; 
    namespaces: string[]; 
  } {
    const namespaces = new Set<string>();
    let localStorageSize = 0;
    
    // Count memory cache namespaces
    for (const [key, entry] of this.MEMORY_CACHE) {
      namespaces.add(entry.namespace);
    }

    // Count localStorage size and namespaces
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            localStorageSize += stored.length;
            // Extract namespace from key
            const cacheKey = key.replace(this.CACHE_PREFIX, '');
            const namespace = cacheKey.split(':')[0];
            namespaces.add(namespace);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage stats:', error);
    }

    return {
      memorySize: this.MEMORY_CACHE.size,
      localStorageSize,
      namespaces: Array.from(namespaces)
    };
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, entry] of this.MEMORY_CACHE) {
      if (this.isExpired(entry)) {
        this.MEMORY_CACHE.delete(key);
      }
    }

    // Clean localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry = JSON.parse(stored);
            if (this.isExpired(entry)) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }
  }

  private static isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private static evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.MEMORY_CACHE) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.MEMORY_CACHE.delete(oldestKey);
    }
  }
}
