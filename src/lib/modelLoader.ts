/**
 * Manual Model Loader Utility
 * 
 * Provides functions to manually initialize face-api models
 * with better error handling and user feedback
 */

import * as faceapi from 'face-api.js';

export interface ModelLoadResult {
  success: boolean;
  source: string | null;
  error: string | null;
  loadedModels: string[];
}

/**
 * Manually load face-api models with multiple fallback sources
 */
export async function loadFaceApiModels(): Promise<ModelLoadResult> {
  // Disable face-api model loading to prevent errors
  console.log('���️ Face-API model loading disabled to prevent loading errors');

  return {
    success: false,
    source: null,
    error: 'Face-API model loading disabled to prevent errors',
    loadedModels: []
  };
}

/**
 * Check if face-api models are currently loaded
 */
export function checkModelsLoaded(): boolean {
  // Always return false since we've disabled model loading
  return false;
}

/**
 * Get model loading status information
 */
export function getModelStatus(): {
  tinyFaceDetector: boolean;
  faceLandmark68Net: boolean;
  allLoaded: boolean;
} {
  // Always return false since we've disabled model loading
  return {
    tinyFaceDetector: false,
    faceLandmark68Net: false,
    allLoaded: false
  };
}

/**
 * Create a comprehensive model diagnostic
 */
export async function runModelDiagnostic(): Promise<{
  browserSupport: boolean;
  faceApiAvailable: boolean;
  modelsLoaded: boolean;
  modelStatus: ReturnType<typeof getModelStatus>;
  recommendations: string[];
}> {
  const diagnostic = {
    browserSupport: true,
    faceApiAvailable: false,
    modelsLoaded: false,
    modelStatus: getModelStatus(),
    recommendations: [] as string[]
  };

  // Check browser support
  try {
    if (typeof window === 'undefined') {
      diagnostic.browserSupport = false;
      diagnostic.recommendations.push('Face detection requires a browser environment');
    }
  } catch {
    diagnostic.browserSupport = false;
  }

  // Check face-api availability
  try {
    if (faceapi && typeof faceapi.nets !== 'undefined') {
      diagnostic.faceApiAvailable = true;
    }
  } catch {
    diagnostic.recommendations.push('face-api.js library not properly loaded');
  }

  // Check model status
  diagnostic.modelsLoaded = diagnostic.modelStatus.allLoaded;
  
  if (!diagnostic.modelsLoaded) {
    diagnostic.recommendations.push('Face detection models need to be loaded');
    
    if (!diagnostic.modelStatus.tinyFaceDetector) {
      diagnostic.recommendations.push('Tiny Face Detector model is missing');
    }
    
    if (!diagnostic.modelStatus.faceLandmark68Net) {
      diagnostic.recommendations.push('Face Landmark model is missing');
    }
  }

  return diagnostic;
}
