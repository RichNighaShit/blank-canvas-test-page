/**
 * Utility function to extract error messages safely from various error types
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  if (error?.details) return error.details;
  if (error?.code && error?.message) return `${error.code}: ${error.message}`;
  
  // Handle AbortError specifically
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request was cancelled or timed out';
  }
  
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('NetworkError')) {
    return 'Network connection error';
  }
  
  // Try to stringify if it's an object
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
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
