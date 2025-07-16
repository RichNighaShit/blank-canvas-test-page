
/**
 * Centralized logging utility for consistent error handling and debugging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor() {
    this.level = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private log(level: LogLevel, message: string, data?: any, source?: string) {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      source,
    };

    // Add to memory log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const logMethod = this.getConsoleMethod(level);
    const prefix = `[${LogLevel[level]}] ${source ? `[${source}]` : ''}`;
    
    if (data) {
      logMethod(`${prefix} ${message}`, data);
    } else {
      logMethod(`${prefix} ${message}`);
    }

    // TODO: Send to external logging service in production
    // if (!import.meta.env.DEV && level >= LogLevel.ERROR) {
    //   this.sendToLoggingService(entry);
    // }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(message: string, data?: any, source?: string) {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  info(message: string, data?: any, source?: string) {
    this.log(LogLevel.INFO, message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.log(LogLevel.WARN, message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.log(LogLevel.ERROR, message, data, source);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Helper for logging errors with stack traces
  logError(error: Error, context?: string, data?: any) {
    this.error(
      `${context ? `[${context}] ` : ''}${error.message}`,
      {
        stack: error.stack,
        name: error.name,
        data,
      },
      context
    );
  }
}

export const logger = new Logger();
