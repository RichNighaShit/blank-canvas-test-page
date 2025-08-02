export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'navigation' | 'resource' | 'paint' | 'layout' | 'custom';
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  recommendations: string[];
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Initialize performance monitoring
   */
  static init(): void {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor paint timing
    this.observePaintTiming();
    
    // Monitor layout shifts
    this.observeLayoutShifts();
    
    // Monitor largest contentful paint
    this.observeLargestContentfulPaint();
  }

  /**
   * Record a custom performance metric
   */
  static recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    category: PerformanceMetric['category'] = 'custom'
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`Performance Metric: ${name} = ${value}${unit}`);
    }
  }

  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  /**
   * Get performance report
   */
  static getReport(): PerformanceReport {
    const navigationMetrics = this.metrics.filter(m => m.category === 'navigation');
    const paintMetrics = this.metrics.filter(m => m.category === 'paint');
    const resourceMetrics = this.metrics.filter(m => m.category === 'resource');

    const totalLoadTime = navigationMetrics.find(m => m.name === 'loadEventEnd')?.value || 0;
    const firstContentfulPaint = paintMetrics.find(m => m.name === 'first-contentful-paint')?.value || 0;
    const largestContentfulPaint = paintMetrics.find(m => m.name === 'largest-contentful-paint')?.value || 0;
    const cumulativeLayoutShift = this.metrics.find(m => m.name === 'cumulative-layout-shift')?.value || 0;

    const recommendations = this.generateRecommendations({
      totalLoadTime,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift
    });

    return {
      metrics: this.metrics,
      summary: {
        totalLoadTime,
        firstContentfulPaint,
        largestContentfulPaint,
        cumulativeLayoutShift
      },
      recommendations
    };
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics = [];
  }

  /**
   * Observe navigation timing
   */
  private static observeNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('loadEventEnd', navEntry.loadEventEnd - navEntry.loadEventStart);
          this.recordMetric('domInteractive', navEntry.domInteractive - navEntry.fetchStart);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', observer);
  }

  /**
   * Observe resource timing
   */
  private static observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource_${resourceEntry.name}`, resourceEntry.duration, 'ms', 'resource');
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  /**
   * Observe paint timing
   */
  private static observePaintTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'paint') {
          this.recordMetric(entry.name, entry.startTime, 'ms', 'paint');
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('paint', observer);
  }

  /**
   * Observe layout shifts
   */
  private static observeLayoutShifts(): void {
    if (!('PerformanceObserver' in window)) return;

    let cumulativeLayoutShift = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as any; // Type assertion for layout shift specific properties
          if (!layoutShiftEntry.hadRecentInput) {
            cumulativeLayoutShift += layoutShiftEntry.value;
          }
        }
      });
      this.recordMetric('cumulative-layout-shift', cumulativeLayoutShift, '', 'layout');
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('layout-shift', observer);
  }

  /**
   * Observe largest contentful paint
   */
  private static observeLargestContentfulPaint(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordMetric('largest-contentful-paint', lastEntry.startTime, 'ms', 'paint');
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('largest-contentful-paint', observer);
  }

  /**
   * Generate performance recommendations
   */
  private static generateRecommendations(summary: PerformanceReport['summary']): string[] {
    const recommendations: string[] = [];

    if (summary.totalLoadTime > 3000) {
      recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    }

    if (summary.firstContentfulPaint > 1500) {
      recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
    }

    if (summary.largestContentfulPaint > 2500) {
      recommendations.push('Optimize images and implement lazy loading for better LCP');
    }

    if (summary.cumulativeLayoutShift > 0.1) {
      recommendations.push('Fix layout shifts by setting explicit dimensions for images and ads');
    }

    return recommendations;
  }

  /**
   * Disconnect all observers
   */
  static disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
