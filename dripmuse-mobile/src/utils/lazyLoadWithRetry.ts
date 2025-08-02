/**
 * Utility to create lazy-loaded components with automatic retry on chunk loading failures
 */
export const lazyWithRetry = (importFn: () => Promise<any>, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber: number) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          console.log(`Lazy load attempt ${attemptNumber} failed:`, error);
          
          // Check if it's a chunk loading error
          const isChunkError = error.message?.includes('Loading chunk') || 
                              error.message?.includes('dynamically imported module') ||
                              error.message?.includes('Failed to fetch dynamically imported module') ||
                              error.message?.includes('NetworkError');
          
          if (isChunkError && attemptNumber < retries) {
            console.log(`Retrying lazy load (${attemptNumber + 1}/${retries})`);
            // Exponential backoff: 500ms, 1000ms, 1500ms
            setTimeout(() => attempt(attemptNumber + 1), 500 * attemptNumber);
          } else if (isChunkError && attemptNumber >= retries) {
            // If all retries failed, reload the page to get fresh chunks
            console.log('All retry attempts failed, reloading page...');
            window.location.reload();
          } else {
            // Not a chunk error, reject immediately
            reject(error);
          }
        });
    };
    
    attempt(1);
  });
};
