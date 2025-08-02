import { supabase } from '@/integrations/supabase/client';

export interface ErrorReport {
  id?: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  componentStack?: string;
  errorBoundary?: boolean;
}

class ErrorMonitoringService {
  private queue: ErrorReport[] = [];
  private isOnline = navigator.onLine;
  private maxQueueSize = 50;

  constructor() {
    this.setupNetworkListeners();
    this.setupGlobalErrorHandlers();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: 'high',
        context: {
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error'
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: 'medium',
        context: {
          type: 'unhandled_rejection',
          reason: event.reason
        }
      });
    });
  }

  async reportError(error: Omit<ErrorReport, 'id'>) {
    try {
      // Add user ID if available
      const { data: { user } } = await supabase.auth.getUser();
      const errorWithUser = {
        ...error,
        userId: user?.id
      };

      if (this.isOnline) {
        await this.sendError(errorWithUser);
      } else {
        this.queueError(errorWithUser);
      }

      // Log to console in development with proper error message extraction
      if (import.meta.env.DEV) {
        console.error('Error reported to monitoring service:', {
          message: errorWithUser.message,
          stack: errorWithUser.stack,
          url: errorWithUser.url,
          severity: errorWithUser.severity,
          timestamp: errorWithUser.timestamp
        });
      }
    } catch (err) {
      console.error('Failed to report error:', err);
      this.queueError(error);
    }
  }

  private async sendError(error: ErrorReport) {
    try {
      // Try to store in Supabase - gracefully handle if table doesn't exist
      const { error: dbError } = await supabase
        .from('error_logs' as any) // Use 'as any' to bypass TypeScript checks temporarily
        .insert({
          message: error.message,
          stack: error.stack,
          url: error.url,
          user_agent: error.userAgent,
          timestamp: error.timestamp,
          user_id: error.userId,
          severity: error.severity,
          context: error.context,
          component_stack: error.componentStack,
          from_error_boundary: error.errorBoundary || false
        });

      if (dbError) {
        // If it's a table not found error, just log to console
        if (dbError.message?.includes('relation "error_logs" does not exist')) {
          if (import.meta.env.DEV) {
            console.warn('Error monitoring table not set up yet. Error logged locally:', {
              message: error.message,
              severity: error.severity,
              url: error.url,
              timestamp: error.timestamp
            });
          }
        } else {
          console.error('Failed to store error in database:', dbError.message || dbError);
          this.queueError(error);
        }
      }
    } catch (err) {
      // Gracefully handle network or other errors
      if (import.meta.env.DEV) {
        console.warn('Error monitoring service unavailable:', err instanceof Error ? err.message : String(err));
        console.warn('Error details:', {
          message: error.message,
          severity: error.severity,
          url: error.url,
          timestamp: error.timestamp
        });
      }
      // Don't queue errors if we can't connect to avoid memory issues
    }
  }

  private queueError(error: ErrorReport) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift(); // Remove oldest error
    }
    this.queue.push(error);
    
    // Store in localStorage as backup
    try {
      localStorage.setItem('errorQueue', JSON.stringify(this.queue));
    } catch (err) {
      console.warn('Failed to store error queue in localStorage:', err);
    }
  }

  private async flushQueue() {
    const queuedErrors = [...this.queue];
    this.queue = [];

    for (const error of queuedErrors) {
      await this.sendError(error);
    }

    // Clear localStorage backup
    try {
      localStorage.removeItem('errorQueue');
    } catch (err) {
      console.warn('Failed to clear error queue from localStorage:', err);
    }
  }

  // Method for manual error reporting
  async captureException(error: Error, context?: Record<string, any>, severity: ErrorReport['severity'] = 'medium') {
    await this.reportError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity,
      context: {
        ...context,
        type: 'manual_capture'
      }
    });
  }

  // Method for capturing custom messages
  async captureMessage(message: string, severity: ErrorReport['severity'] = 'low', context?: Record<string, any>) {
    await this.reportError({
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity,
      context: {
        ...context,
        type: 'custom_message'
      }
    });
  }

  // Initialize from localStorage on app start
  initialize() {
    try {
      const stored = localStorage.getItem('errorQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
        if (this.isOnline) {
          this.flushQueue();
        }
      }
    } catch (err) {
      console.warn('Failed to load error queue from localStorage:', err);
    }
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Initialize on import
errorMonitoring.initialize();

// Export convenience methods
export const captureException = (error: Error, context?: Record<string, any>, severity?: ErrorReport['severity']) => 
  errorMonitoring.captureException(error, context, severity);

export const captureMessage = (message: string, severity?: ErrorReport['severity'], context?: Record<string, any>) => 
  errorMonitoring.captureMessage(message, severity, context);
