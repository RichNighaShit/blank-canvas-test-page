/**
 * Utility function to extract error messages safely from various error types
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;

  // Handle AbortError specifically (check this early)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request was cancelled or timed out';
  }

  // Handle network errors
  if (error instanceof TypeError && error.message?.includes('NetworkError')) {
    return 'Network connection error - please check your internet connection';
  }

  if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
    return 'Failed to connect to server - please check your internet connection';
  }

  // Handle authentication specific errors
  if (error?.message?.includes('Auth') && error?.message?.includes('NetworkError')) {
    return 'Authentication failed due to network connection issues';
  }

  // Check for standard error properties
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  if (error?.details) return error.details;
  if (error?.code && error?.message) return `${error.code}: ${error.message}`;

  // Handle Supabase specific errors
  if (error?.error && typeof error.error === 'string') return error.error;
  if (error?.msg && typeof error.msg === 'string') return error.msg;

  // Handle Error objects that might not have accessible message property
  if (error instanceof Error) {
    return error.toString();
  }

  // Special handling for objects with name property (like DOMException)
  if (error?.name && error?.message) {
    return `${error.name}: ${error.message}`;
  }

  // Try to stringify if it's an object, but be more careful
  if (error && typeof error === 'object') {
    try {
      // Check if it has useful properties to extract
      const keys = Object.keys(error);
      if (keys.length === 0) {
        return 'Empty error object';
      }

      // Look for common error message properties
      for (const key of ['message', 'error', 'description', 'details', 'msg']) {
        if (error[key] && typeof error[key] === 'string') {
          return error[key];
        }
      }

      return JSON.stringify(error);
    } catch {
      return error.toString();
    }
  }

  return 'Unknown error occurred';
};

/**
 * Log error with proper message extraction
 */
export const logError = (error: any, context?: string): void => {
  const message = getErrorMessage(error);
  if (context) {
    console.error(`${context}:`, message);
  } else {
    console.error('Error:', message);
  }
};
