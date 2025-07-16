/**
 * PWA Performance Optimizations
 * Provides utilities for improving PWA performance, preloading, and resource management
 */

export interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

export interface PreloadStrategy {
  critical: string[];
  important: string[];
  lazy: string[];
}

class PWAPerformanceOptimizer {
  private preloadStrategy: PreloadStrategy = {
    critical: ["/wardrobe", "/recommendations", "/dashboard"],
    important: ["/profile", "/analytics"],
    lazy: ["/settings", "/help"],
  };

  private performanceMetrics: PerformanceMetrics = {};
  private preloadedRoutes = new Set<string>();
  private preloadInProgress = new Set<string>();

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupIntersectionObserver();
    this.setupResourceHints();
  }

  /**
   * Initialize Web Vitals and performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Measure First Contentful Paint
    this.measureFCP();

    // Measure Largest Contentful Paint
    this.measureLCP();

    // Measure First Input Delay
    this.measureFID();

    // Measure Cumulative Layout Shift
    this.measureCLS();

    // Measure Time to Interactive (approximation)
    this.measureTTI();
  }

  private measureFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === "first-contentful-paint") {
            this.performanceMetrics.firstContentfulPaint = entry.startTime;
            this.reportMetric("FCP", entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ["paint"] });
    } catch (error) {
      console.warn("[PWA] FCP measurement not supported");
    }
  }

  private measureLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.performanceMetrics.largestContentfulPaint = lastEntry.startTime;
        this.reportMetric("LCP", lastEntry.startTime);
      });
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      console.warn("[PWA] LCP measurement not supported");
    }
  }

  private measureFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          // Cast to PerformanceEventTiming for processingStart access
          const eventEntry = entry as PerformanceEventTiming;
          if (eventEntry.processingStart) {
            this.performanceMetrics.firstInputDelay =
              eventEntry.processingStart - entry.startTime;
            this.reportMetric("FID", eventEntry.processingStart - entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      console.warn("[PWA] FID measurement not supported");
    }
  }

  private measureCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.performanceMetrics.cumulativeLayoutShift = clsValue;
        this.reportMetric("CLS", clsValue);
      });
      observer.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("[PWA] CLS measurement not supported");
    }
  }

  private measureTTI(): void {
    // Simplified TTI approximation
    const measureTTI = () => {
      const timing = performance.timing;
      const tti = timing.domInteractive - timing.navigationStart;
      this.performanceMetrics.timeToInteractive = tti;
      this.reportMetric("TTI", tti);
    };

    if (document.readyState === "complete") {
      measureTTI();
    } else {
      window.addEventListener("load", measureTTI);
    }
  }

  /**
   * Setup intersection observer for intelligent preloading
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === "undefined") {
      console.warn("[PWA] IntersectionObserver not supported");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");

            if (href && !this.preloadedRoutes.has(href)) {
              this.preloadRoute(href, "lazy");
            }
          }
        });
      },
      { rootMargin: "100px" },
    );

    // Observe navigation links
    const observeLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach((link) => observer.observe(link));
    };

    // Initial observation
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", observeLinks);
    } else {
      observeLinks();
    }

    // Re-observe on route changes
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(observeLinks, 100);
    };
  }

  /**
   * Setup resource hints in document head
   */
  private setupResourceHints(): void {
    const head = document.head;

    // DNS prefetch for external domains
    this.addResourceHint("dns-prefetch", "//api.supabase.co");
    this.addResourceHint("dns-prefetch", "//fonts.googleapis.com");
    this.addResourceHint("dns-prefetch", "//api.openweathermap.org");

    // Preconnect to critical origins
    this.addResourceHint("preconnect", "https://api.supabase.co");
    this.addResourceHint("preconnect", "https://fonts.gstatic.com", true);

    // Preload critical assets
    this.preloadCriticalAssets();
  }

  private addResourceHint(
    rel: string,
    href: string,
    crossorigin = false,
  ): void {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (crossorigin) {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  }

  /**
   * Preload critical assets
   */
  private preloadCriticalAssets(): void {
    // Preload critical fonts
    this.preloadResource("/fonts/inter.woff2", "font", "font/woff2", true);

    // Preload critical images
    this.preloadResource("/placeholder.svg", "image");

    // Preload critical CSS
    const criticalCSS = document.querySelector('link[rel="stylesheet"]');
    if (criticalCSS) {
      this.preloadResource(criticalCSS.getAttribute("href")!, "style");
    }
  }

  private preloadResource(
    href: string,
    as: string,
    type?: string,
    crossorigin = false,
  ): void {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = "anonymous";

    document.head.appendChild(link);
  }

  /**
   * Intelligent route preloading
   */
  async preloadRoute(
    route: string,
    priority: "critical" | "important" | "lazy" = "lazy",
  ): Promise<void> {
    if (this.preloadedRoutes.has(route) || this.preloadInProgress.has(route)) {
      return;
    }

    this.preloadInProgress.add(route);

    try {
      // Determine delay based on priority
      const delay = this.getPreloadDelay(priority);

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Fetch the route
      const response = await fetch(route, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      if (response.ok) {
        this.preloadedRoutes.add(route);
        console.log(`[PWA] Preloaded route: ${route}`);

        // Extract and preload linked resources
        this.preloadLinkedResources(await response.text());
      }
    } catch (error) {
      console.warn(`[PWA] Failed to preload route ${route}:`, error);
    } finally {
      this.preloadInProgress.delete(route);
    }
  }

  private getPreloadDelay(priority: "critical" | "important" | "lazy"): number {
    switch (priority) {
      case "critical":
        return 0;
      case "important":
        return 100;
      case "lazy":
        return 1000;
      default:
        return 1000;
    }
  }

  private preloadLinkedResources(html: string): void {
    // Extract CSS and image URLs from HTML
    const cssRegex = /<link[^>]+href=["']([^"']*\.css[^"']*)["'][^>]*>/gi;
    const imgRegex = /<img[^>]+src=["']([^"']*)["'][^>]*>/gi;
    const scriptRegex = /<script[^>]+src=["']([^"']*)["'][^>]*>/gi;

    let match;

    // Preload CSS
    while ((match = cssRegex.exec(html)) !== null) {
      this.preloadResource(match[1], "style");
    }

    // Preload images (with lower priority)
    setTimeout(() => {
      while ((match = imgRegex.exec(html)) !== null) {
        this.preloadResource(match[1], "image");
      }
    }, 500);

    // Preload scripts (with lowest priority)
    setTimeout(() => {
      while ((match = scriptRegex.exec(html)) !== null) {
        this.preloadResource(match[1], "script");
      }
    }, 1000);
  }

  /**
   * Preload critical routes immediately
   */
  async preloadCriticalRoutes(): Promise<void> {
    const promises = this.preloadStrategy.critical.map((route) =>
      this.preloadRoute(route, "critical"),
    );

    await Promise.allSettled(promises);

    // Preload important routes with delay
    setTimeout(() => {
      this.preloadStrategy.important.forEach((route) =>
        this.preloadRoute(route, "important"),
      );
    }, 2000);
  }

  /**
   * Optimize images with lazy loading and responsive loading
   */
  optimizeImages(): void {
    const images = document.querySelectorAll("img[data-src]");

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              imageObserver.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px",
        },
      );

      images.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach((img) => this.loadImage(img as HTMLImageElement));
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute("data-src");
    if (!src) return;

    // Create a new image to test loading
    const imageLoader = new Image();

    imageLoader.onload = () => {
      img.src = src;
      img.classList.remove("lazy");
      img.classList.add("loaded");
    };

    imageLoader.onerror = () => {
      img.classList.add("error");
      // Set fallback image
      img.src = "/placeholder.svg";
    };

    imageLoader.src = src;
  }

  /**
   * Memory management and cleanup
   */
  cleanupResources(): void {
    // Clear preloaded routes cache if it gets too large
    if (this.preloadedRoutes.size > 50) {
      const routesToKeep = new Set(
        [...this.preloadedRoutes].slice(-25), // Keep last 25
      );
      this.preloadedRoutes = routesToKeep;
    }

    // Force garbage collection if available
    if ("gc" in window && typeof (window as any).gc === "function") {
      (window as any).gc();
    }
  }

  /**
   * Report performance metric
   */
  private reportMetric(name: string, value: number): void {
    console.log(`[PWA Performance] ${name}: ${value.toFixed(2)}ms`);

    // Send to analytics if available
    if ("gtag" in window) {
      (window as any).gtag("event", "web_vital", {
        name,
        value: Math.round(value),
        custom_map: { metric_name: name },
      });
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Register periodic cleanup
   */
  startPeriodicCleanup(): void {
    // Cleanup every 5 minutes
    setInterval(
      () => {
        this.cleanupResources();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Initialize service worker communication
   */
  initializeServiceWorkerComm(): void {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case "CACHE_UPDATE":
              console.log("[PWA] Cache updated:", event.data.url);
              break;
            case "OFFLINE_READY":
              console.log("[PWA] App ready for offline use");
              break;
            case "UPDATE_AVAILABLE":
              this.handleUpdateAvailable();
              break;
          }
        }
      });
    }
  }

  private handleUpdateAvailable(): void {
    // Notify user of available update
    window.dispatchEvent(new CustomEvent("pwa-update-available"));
  }

  /**
   * Prefetch user-specific data
   */
  async prefetchUserData(userId: string): Promise<void> {
    if (!userId) return;

    try {
      // Prefetch wardrobe items
      fetch(`/api/wardrobe-items?user_id=${userId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            console.log("[PWA] Prefetched wardrobe items");
          }
        })
        .catch(() => {
          // Silently fail prefetch
        });

      // Prefetch recent recommendations
      setTimeout(() => {
        fetch(`/api/recommendations?user_id=${userId}&limit=10`, {
          method: "GET",
          headers: { Accept: "application/json" },
        })
          .then((response) => {
            if (response.ok) {
              console.log("[PWA] Prefetched recommendations");
            }
          })
          .catch(() => {
            // Silently fail prefetch
          });
      }, 1000);
    } catch (error) {
      console.warn("[PWA] Failed to prefetch user data:", error);
    }
  }
}

// Create and export singleton instance
export const pwaOptimizer = new PWAPerformanceOptimizer();

// Initialize optimizations
export const initializePWAOptimizations = () => {
  // Only initialize in browser environment
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Start performance monitoring
    pwaOptimizer.startPeriodicCleanup();

    // Initialize service worker communication
    pwaOptimizer.initializeServiceWorkerComm();

    // Preload critical routes after initial load
    if (document.readyState === "complete") {
      pwaOptimizer.preloadCriticalRoutes();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => {
          pwaOptimizer.preloadCriticalRoutes();
        }, 1000);
      });
    }

    // Optimize images
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        pwaOptimizer.optimizeImages();
      });
    } else {
      pwaOptimizer.optimizeImages();
    }
  } catch (error) {
    console.warn("[PWA] Failed to initialize optimizations:", error);
  }
};

export default PWAPerformanceOptimizer;
