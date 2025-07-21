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
    // Check if models are already loaded by looking for face-api in global scope
    const checkModelStatus = () => {
      if (typeof window !== 'undefined' && (window as any).faceapi) {
        const faceapi = (window as any).faceapi;
        
        // Check if models are loaded
        const tinyFaceDetectorLoaded = faceapi.nets.tinyFaceDetector.params !== undefined;
        const faceLandmarkLoaded = faceapi.nets.faceLandmark68Net.params !== undefined;
        
        if (tinyFaceDetectorLoaded && faceLandmarkLoaded) {
          setStatus({
            isLoading: false,
            isLoaded: true,
            error: null,
            source: 'Models loaded successfully'
          });
          return true;
        }
      }
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
          error: 'Face detection models could not be loaded. Color analysis will use fallback methods.',
          source: null
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
