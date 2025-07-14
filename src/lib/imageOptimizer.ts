export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: boolean;
}

export interface OptimizedImage {
  src: string;
  placeholder?: string;
  width: number;
  height: number;
  size: number;
}

export class ImageOptimizer {
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly DEFAULT_MAX_WIDTH = 800;
  private static readonly DEFAULT_MAX_HEIGHT = 600;
  private static readonly CACHE_PREFIX = 'dripmuse_img_';
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Compress and optimize an image file
   */
  static async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      quality = this.DEFAULT_QUALITY,
      maxWidth = this.DEFAULT_MAX_WIDTH,
      maxHeight = this.DEFAULT_MAX_HEIGHT,
      format = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to desired format
          const mimeType = `image/${format}`;
          const dataUrl = canvas.toDataURL(mimeType, quality);

          // Create optimized image object
          const optimizedImage: OptimizedImage = {
            src: dataUrl,
            width,
            height,
            size: this.estimateFileSize(dataUrl)
          };

          // Generate placeholder if requested
          if (options.placeholder) {
            optimizedImage.placeholder = this.generatePlaceholder(width, height);
          }

          resolve(optimizedImage);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate a low-quality placeholder for lazy loading
   */
  static generatePlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = Math.min(width, 20);
    canvas.height = Math.min(height, 20);

    // Create a simple gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.1);
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Estimate file size from data URL
   */
  private static estimateFileSize(dataUrl: string): number {
    // Remove data URL prefix to get base64 data
    const base64 = dataUrl.split(',')[1];
    // Each base64 character represents 6 bits, so 4 characters = 3 bytes
    return Math.round((base64.length * 3) / 4);
  }

  /**
   * Cache an image URL with metadata
   */
  static cacheImage(url: string, metadata: any): void {
    try {
      const cacheKey = this.CACHE_PREFIX + this.hashString(url);
      const cacheData = {
        url,
        metadata,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }

  /**
   * Get cached image data
   */
  static getCachedImage(url: string): any | null {
    try {
      const cacheKey = this.CACHE_PREFIX + this.hashString(url);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            if (now - cached.timestamp > this.CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove invalid cache entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  /**
   * Simple hash function for URLs
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Preload critical images
   */
  static preloadImages(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
        img.src = url;
      });
    });

    return Promise.all(promises);
  }

  /**
   * Create responsive image srcset
   */
  static createSrcSet(
    baseUrl: string,
    widths: number[] = [320, 640, 800, 1200]
  ): string {
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }
} 