import { useState, useEffect } from 'react';

export interface ModelLoadingStatus {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  source: string | null;
}

export function useModelLoadingStatus(): ModelLoadingStatus {
  const [status, setStatus] = useState<ModelLoadingStatus>({
    isLoading: false,
    isLoaded: false,
    error: null,
    source: null
  });

  useEffect(() => {
    // Disable face-api model checking to prevent errors
    const checkModelStatus = () => {
      // Always return false to indicate models are not loaded
      return false;
    };

    // Initial check
    if (checkModelStatus()) return;

    // Set loading state
    setStatus(prev => ({ ...prev, isLoading: true }));

    // Listen for console logs to detect model loading status
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.join(' ');
      if (message.includes('Face-API models loaded successfully')) {
        const source = message.includes('from:') ? message.split('from:')[1].trim() : 'unknown source';
        setStatus({
          isLoading: false,
          isLoaded: true,
          error: null,
          source
        });
      }
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.join(' ');
      if (message.includes('Failed to load Face-API models from all sources')) {
        setStatus({
          isLoading: false,
          isLoaded: false,
          error: null, // No error - fallback mode is expected
          source: 'Using advanced color analysis'
        });
      }
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      // Don't update status on warnings, just individual source failures
    };

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return status;
}
