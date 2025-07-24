export interface ErrorDetails {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export const logError = (error: any, context?: Record<string, any>): ErrorDetails => {
  const errorDetails: ErrorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date(),
    context
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group('🚨 Error Details');
    console.error('Message:', errorDetails.message);
    console.error('Stack:', errorDetails.stack);
    console.error('URL:', errorDetails.url);
    console.error('Context:', errorDetails.context);
    console.groupEnd();
  }

  // Here you could send to an error tracking service like Sentry
  // For now, we'll just save to localStorage for debugging
  try {
    const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
    errorLog.push(errorDetails);
    
    // Keep only last 50 errors
    if (errorLog.length > 50) {
      errorLog.splice(0, errorLog.length - 50);
    }
    
    localStorage.setItem('error_log', JSON.stringify(errorLog));
  } catch (storageError) {
    console.warn('Failed to save error to localStorage:', storageError);
  }

  return errorDetails;
};

export const getErrorLog = (): ErrorDetails[] => {
  try {
    return JSON.parse(localStorage.getItem('error_log') || '[]');
  } catch {
    return [];
  }
};

export const clearErrorLog = (): void => {
  localStorage.removeItem('error_log');
};
