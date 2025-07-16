/**
 * Structured Logging System
 * Provides centralized logging functionality for both client-side and server-side errors
 * with proper log levels, formatting, and external service integration capabilities
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  // Allow additional properties for flexibility
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: "development" | "production";
  userAgent?: string;
  url?: string;
}

class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  private constructor() {
    // Initialize session tracking
    this.setupUnhandledErrorTracking();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Sets up global error tracking for unhandled errors
   */
  private setupUnhandledErrorTracking() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.error("Unhandled Promise Rejection", {
        error: {
          name: "UnhandledPromiseRejection",
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        },
        context: {
          component: "Global",
          action: "unhandledrejection",
        },
      });
    });

    // Catch JavaScript errors
    window.addEventListener("error", (event) => {
      this.error("Unhandled JavaScript Error", {
        error: {
          name: event.error?.name || "JavaScriptError",
          message: event.message,
          stack: event.error?.stack,
        },
        context: {
          component: "Global",
          action: "javascript_error",
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      });
    });
  }

  /**
   * Creates a log entry with common fields
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    options: {
      error?: Error | any;
      context?: LogContext;
    } = {},
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.DEV ? "development" : "production",
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (options.context) {
      entry.context = options.context;
    }

    if (options.error) {
      entry.error = {
        name: options.error.name || "Error",
        message: options.error.message || String(options.error),
        stack: options.error.stack,
      };
    }

    return entry;
  }

  /**
   * Processes and stores log entries
   */
  private processLog(entry: LogEntry) {
    // Add to buffer
    this.logBuffer.push(entry);

    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output based on environment
    if (import.meta.env.DEV) {
      this.outputToConsole(entry);
    }

    // Send to external service in production
    if (import.meta.env.PROD) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Outputs log to console with proper formatting
   */
  private outputToConsole(entry: LogEntry) {
    const { level, message, timestamp, context, error } = entry;

    const logMethod = console[level] || console.log;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (error) {
      logMethod(`${prefix} ${message}`, {
        error,
        context,
        url: entry.url,
      });
    } else {
      logMethod(`${prefix} ${message}`, context || {});
    }
  }

  /**
   * Sends log to external logging service
   * In production, this would integrate with services like Sentry, LogRocket, etc.
   */
  private async sendToExternalService(entry: LogEntry) {
    try {
      // Example: Send to logging API
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });

      // For now, we'll use console in production too
      console.log("Log Entry:", entry);
    } catch (error) {
      console.error("Failed to send log to external service:", error);
    }
  }

  /**
   * Debug level logging
   */
  public debug(message: string, context?: LogContext) {
    this.processLog(this.createLogEntry(LogLevel.DEBUG, message, { context }));
  }

  /**
   * Info level logging
   */
  public info(message: string, context?: LogContext) {
    this.processLog(this.createLogEntry(LogLevel.INFO, message, { context }));
  }

  /**
   * Warning level logging
   */
  public warn(message: string, context?: LogContext) {
    this.processLog(this.createLogEntry(LogLevel.WARN, message, { context }));
  }

  /**
   * Error level logging
   */
  public error(
    message: string,
    options: { error?: Error | any; context?: LogContext } = {},
  ) {
    this.processLog(this.createLogEntry(LogLevel.ERROR, message, options));
  }

  /**
   * Fatal level logging
   */
  public fatal(
    message: string,
    options: { error?: Error | any; context?: LogContext } = {},
  ) {
    this.processLog(this.createLogEntry(LogLevel.FATAL, message, options));
  }

  /**
   * Logs API/Server response errors
   */
  public apiError(
    endpoint: string,
    response: Response | any,
    context?: LogContext,
  ) {
    const message = `API Error: ${endpoint}`;
    const errorContext: LogContext = {
      ...context,
      action: "api_request",
      metadata: {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ...(context?.metadata || {}),
      },
    };

    this.error(message, { context: errorContext });
  }

  /**
   * Logs user actions for analytics
   */
  public userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, {
      ...context,
      action: "user_interaction",
    });
  }

  /**
   * Gets recent logs (useful for debugging)
   */
  public getRecentLogs(count: number = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clears the log buffer
   */
  public clearLogs() {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports for direct usage
export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);
export const logError = (
  message: string,
  options?: { error?: Error | any; context?: LogContext },
) => logger.error(message, options);
export const logFatal = (
  message: string,
  options?: { error?: Error | any; context?: LogContext },
) => logger.fatal(message, options);
export const logApiError = (
  endpoint: string,
  response: Response | any,
  context?: LogContext,
) => logger.apiError(endpoint, response, context);
export const logUserAction = (action: string, context?: LogContext) =>
  logger.userAction(action, context);

export default logger;
