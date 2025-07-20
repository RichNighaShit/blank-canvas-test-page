/**
 * Performance Optimized Facial Color Analysis Service
 * 
 * Optimized for scale (1M+ users) with:
 * - Web Workers for heavy computations
 * - Caching for repeated analyses 
 * - Progressive loading for better UX
 * - Memory management for large images
 * - Batch processing capabilities
 */

import { FacialColorProfile, facialColorAnalysisService } from "./facialColorAnalysis";

interface AnalysisCache {
  [key: string]: {
    result: FacialColorProfile;
    timestamp: number;
    imageHash: string;
  };
}

interface OptimizationOptions {
  useWebWorker?: boolean;
  enableCaching?: boolean;
  maxImageSize?: number;
  progressCallback?: (progress: number) => void;
  timeoutMs?: number;
}

class PerformanceOptimizedFacialAnalysis {
  private cache: AnalysisCache = {};
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;
  private worker: Worker | null = null;
  private readonly DEFAULT_MAX_IMAGE_SIZE = 800 * 600; // 800x600 max for performance

  /**
   * Initialize the service with performance optimizations
   */
  async initialize(): Promise<void> {
    // Clean expired cache entries
    this.cleanCache();
    
    // Pre-warm the face detection models
    await this.preWarmModels();
    
    // Initialize web worker if supported
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('./workers/facialAnalysisWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (error) {
        console.warn('Web Worker not available, falling back to main thread');
      }
    }
  }

  /**
   * Optimized facial color analysis with performance enhancements
   */
  async analyzeFacialColorsOptimized(
    imageInput: string | File | Blob,
    options: OptimizationOptions = {}
  ): Promise<FacialColorProfile> {
    const {
      useWebWorker = true,
      enableCaching = true,
      maxImageSize = this.DEFAULT_MAX_IMAGE_SIZE,
      progressCallback,
      timeoutMs = 30000
    } = options;

    try {
      progressCallback?.(10);

      // Generate cache key
      const imageHash = await this.generateImageHash(imageInput);
      const cacheKey = `${imageHash}_${maxImageSize}`;

      // Check cache first
      if (enableCaching && this.cache[cacheKey]) {
        const cached = this.cache[cacheKey];
        if (Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
          console.log('✅ Using cached facial analysis result');
          progressCallback?.(100);
          return cached.result;
        }
      }

      progressCallback?.(20);

      // Optimize image for processing
      const optimizedImage = await this.optimizeImageForAnalysis(imageInput, maxImageSize);
      progressCallback?.(40);

      // Perform analysis (with web worker if available)
      let result: FacialColorProfile;
      
      if (useWebWorker && this.worker) {
        result = await this.analyzeWithWorker(optimizedImage, timeoutMs, progressCallback);
      } else {
        result = await this.analyzeOnMainThread(optimizedImage, progressCallback);
      }

      progressCallback?.(90);

      // Cache the result
      if (enableCaching) {
        this.cacheResult(cacheKey, result, imageHash);
      }

      progressCallback?.(100);
      return result;

    } catch (error) {
      console.error('Optimized facial analysis failed:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple images with optimized resource usage
   */
  async batchAnalyzeFacialColors(
    images: Array<string | File | Blob>,
    options: OptimizationOptions = {}
  ): Promise<Array<FacialColorProfile | null>> {
    const results: Array<FacialColorProfile | null> = [];
    const batchSize = 3; // Process 3 images at a time to avoid memory issues

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (image, index) => {
        try {
          const overallProgress = ((i + index) / images.length) * 100;
          options.progressCallback?.(overallProgress);
          
          return await this.analyzeFacialColorsOptimized(image, {
            ...options,
            progressCallback: undefined // Disable individual progress for batch
          });
        } catch (error) {
          console.warn(`Failed to analyze image ${i + index}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay to prevent browser freezing
      await this.delay(100);
    }

    options.progressCallback?.(100);
    return results;
  }

  /**
   * Generate color recommendations without full facial analysis (faster)
   */
  async getQuickColorRecommendations(
    imageInput: string | File | Blob,
    options: { count?: number } = {}
  ): Promise<string[]> {
    const { count = 8 } = options;

    try {
      // Use a faster, simplified analysis
      const optimizedImage = await this.optimizeImageForAnalysis(imageInput, 400 * 300);
      
      // Extract dominant colors quickly without full facial feature detection
      const quickColors = await this.extractDominantColorsQuick(optimizedImage);
      
      // Apply basic color theory to generate flattering colors
      const recommendations = this.generateQuickColorRecommendations(quickColors, count);
      
      return recommendations;
    } catch (error) {
      console.warn('Quick color recommendations failed, using fallback:', error);
      return this.getFallbackRecommendations(count);
    }
  }

  /**
   * Pre-warm models for faster initial analysis
   */
  private async preWarmModels(): Promise<void> {
    try {
      // Initialize the facial analysis service
      await facialColorAnalysisService.initializeFaceAPI();
      console.log('✅ Facial analysis models pre-warmed');
    } catch (error) {
      console.warn('Model pre-warming failed:', error);
    }
  }

  /**
   * Optimize image for analysis (resize, compress)
   */
  private async optimizeImageForAnalysis(
    imageInput: string | File | Blob,
    maxSize: number
  ): Promise<File> {
    const img = await this.loadImage(imageInput);
    
    // Calculate optimal dimensions
    const { width, height } = this.calculateOptimalDimensions(
      img.width, 
      img.height, 
      maxSize
    );

    // Resize image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to optimized blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'optimized.jpg', { 
            type: 'image/jpeg' 
          });
          resolve(file);
        }
      }, 'image/jpeg', 0.85); // 85% quality for good balance
    });
  }

  /**
   * Calculate optimal dimensions while preserving aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxPixels: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    const currentPixels = originalWidth * originalHeight;
    
    if (currentPixels <= maxPixels) {
      return { width: originalWidth, height: originalHeight };
    }
    
    const scaleFactor = Math.sqrt(maxPixels / currentPixels);
    
    return {
      width: Math.round(originalWidth * scaleFactor),
      height: Math.round(originalHeight * scaleFactor)
    };
  }

  /**
   * Analyze using web worker for non-blocking performance
   */
  private async analyzeWithWorker(
    image: File, 
    timeoutMs: number, 
    progressCallback?: (progress: number) => void
  ): Promise<FacialColorProfile> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Web worker not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, timeoutMs);

      this.worker.onmessage = (event) => {
        const { type, data, progress, error } = event.data;
        
        if (type === 'progress') {
          progressCallback?.(40 + progress * 0.4); // Map worker progress to 40-80%
        } else if (type === 'complete') {
          clearTimeout(timeout);
          resolve(data);
        } else if (type === 'error') {
          clearTimeout(timeout);
          reject(new Error(error));
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Send image to worker
      this.worker.postMessage({
        type: 'analyze',
        image: image
      });
    });
  }

  /**
   * Analyze on main thread with progress tracking
   */
  private async analyzeOnMainThread(
    image: File, 
    progressCallback?: (progress: number) => void
  ): Promise<FacialColorProfile> {
    progressCallback?.(50);
    
    const result = await facialColorAnalysisService.analyzeFacialColors(image);
    
    progressCallback?.(80);
    return result;
  }

  /**
   * Extract dominant colors quickly without full analysis
   */
  private async extractDominantColorsQuick(image: File): Promise<string[]> {
    const img = await this.loadImage(image);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Use small canvas for speed
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const colors = this.extractColorsFromImageData(imageData, 5);
    
    return colors;
  }

  /**
   * Extract colors from image data using simplified algorithm
   */
  private extractColorsFromImageData(imageData: ImageData, count: number): string[] {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample every 4th pixel for speed
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin color detection
      if (this.isLikelySkinColor(r, g, b)) {
        const hex = this.rgbToHex(r, g, b);
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }
    
    // Sort by frequency and return top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([color]) => color);
    
    return sortedColors;
  }

  /**
   * Generate quick color recommendations based on extracted colors
   */
  private generateQuickColorRecommendations(baseColors: string[], count: number): string[] {
    const recommendations = new Set<string>();
    
    // Add base colors
    baseColors.forEach(color => recommendations.add(color));
    
    // Generate complementary and analogous colors
    for (const color of baseColors) {
      if (recommendations.size >= count) break;
      
      const complement = this.getComplementaryColor(color);
      recommendations.add(complement);
      
      const analogous = this.getAnalogousColor(color);
      recommendations.add(analogous);
    }
    
    // Fill remaining with curated colors if needed
    const curatedColors = [
      "#E6E6FA", "#B0E0E6", "#98FB98", "#FFB6C1", "#DDA0DD", 
      "#F5DEB3", "#D2B48C", "#CD853F", "#8B7355", "#A0522D"
    ];
    
    for (const color of curatedColors) {
      if (recommendations.size >= count) break;
      recommendations.add(color);
    }
    
    return Array.from(recommendations).slice(0, count);
  }

  /**
   * Generate image hash for caching
   */
  private async generateImageHash(imageInput: string | File | Blob): Promise<string> {
    let imageData: ArrayBuffer;
    
    if (typeof imageInput === 'string') {
      const response = await fetch(imageInput);
      imageData = await response.arrayBuffer();
    } else {
      imageData = await imageInput.arrayBuffer();
    }
    
    // Simple hash based on file size and first few bytes
    const view = new Uint8Array(imageData);
    const size = imageData.byteLength;
    const sample = view.slice(0, Math.min(1024, size));
    
    let hash = size.toString(16);
    for (let i = 0; i < sample.length; i += 8) {
      hash += sample[i].toString(16);
    }
    
    return hash;
  }

  /**
   * Cache analysis result
   */
  private cacheResult(key: string, result: FacialColorProfile, imageHash: string): void {
    // Remove oldest entries if cache is full
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      const oldestKey = Object.keys(this.cache).reduce((oldest, current) => 
        this.cache[current].timestamp < this.cache[oldest].timestamp ? current : oldest
      );
      delete this.cache[oldestKey];
    }
    
    this.cache[key] = {
      result,
      timestamp: Date.now(),
      imageHash
    };
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.CACHE_EXPIRY) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Load image from various input types
   */
  private async loadImage(input: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      if (typeof input === "string") {
        img.src = input;
      } else {
        const url = URL.createObjectURL(input);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
      }
    });
  }

  /**
   * Utility functions
   */
  private isLikelySkinColor(r: number, g: number, b: number): boolean {
    return (r > 95 && g > 40 && b > 20) &&
           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
           (Math.abs(r - g) > 15) && (r > g) && (r > b);
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  private getComplementaryColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return this.rgbToHex(255 - r, 255 - g, 255 - b);
  }

  private getAnalogousColor(hex: string): string {
    // Simple analogous color generation
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Shift hue slightly
    const newR = Math.min(255, Math.max(0, r + 30));
    const newG = Math.min(255, Math.max(0, g - 15));
    const newB = Math.min(255, Math.max(0, b + 15));
    
    return this.rgbToHex(newR, newG, newB);
  }

  private getFallbackRecommendations(count: number): string[] {
    const fallback = [
      "#8B7355", "#D4A574", "#F5E6D3", "#A0522D", "#CD853F", 
      "#DEB887", "#E6E6FA", "#B0E0E6", "#98FB98", "#FFB6C1", 
      "#DDA0DD", "#F5DEB3"
    ];
    return fallback.slice(0, count);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number; oldestEntry: number } {
    const size = Object.keys(this.cache).length;
    const now = Date.now();
    const oldestEntry = size > 0 ? Math.min(...Object.values(this.cache).map(c => now - c.timestamp)) : 0;
    
    return {
      size,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      oldestEntry
    };
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.clearCache();
  }
}

// Export singleton instance
export const performanceOptimizedFacialAnalysis = new PerformanceOptimizedFacialAnalysis();

// Auto-initialize on load
if (typeof window !== "undefined") {
  performanceOptimizedFacialAnalysis.initialize().catch(error => {
    console.warn("Performance optimized facial analysis initialization failed:", error);
  });
}
