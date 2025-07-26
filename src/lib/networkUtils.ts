import { getErrorMessage } from './errorUtils';

interface NetworkRequest {
  retries?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Check if an error is network-related
 */
export const isNetworkError = (error: any): boolean => {
  if (error instanceof TypeError && error.message?.includes('NetworkError')) {
    return true;
  }
  if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
    return true;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error?.message?.includes('NetworkError')) {
    return true;
  }
  if (error?.message?.includes('Failed to fetch')) {
    return true;
  }
  return false;
};

/**
 * Execute a function with retry logic for network errors
 */
export const withNetworkRetry = async <T>(
  fn: () => Promise<T>,
  options: NetworkRequest = {}
): Promise<T> => {
  const { retries = 2, timeout = 10000, onRetry } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout wrapper
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('Request timed out', 'AbortError'));
          });
        })
      ]);
      
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (isNetworkError(error) && !isLastAttempt) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
        console.log(`Network error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
        
        onRetry?.(attempt + 1, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Unexpected error in withNetworkRetry');
};

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get a user-friendly network error message
 */
export const getNetworkErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    if (!isOnline()) {
      return 'No internet connection. Please check your network and try again.';
    }
    return 'Network connection error. Please check your internet and try again.';
  }
  
  return getErrorMessage(error);
};

/**
 * Create a network-aware Supabase query wrapper
 */
export const supabaseWithRetry = <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: NetworkRequest = {}
) => {
  return withNetworkRetry(async () => {
    const result = await queryFn();
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }, options);
};
