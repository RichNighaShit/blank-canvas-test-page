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
  const modelSources = [
    '/models',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model',
  ];

  const requiredModels = [
    { name: 'tinyFaceDetector', loader: faceapi.nets.tinyFaceDetector },
    { name: 'faceLandmark68Net', loader: faceapi.nets.faceLandmark68Net },
  ];

  for (const source of modelSources) {
    try {
      console.log(`🔄 Attempting to load models from: ${source}`);
      
      const loadPromises = requiredModels.map(model => 
        model.loader.loadFromUri(source)
      );
      
      await Promise.all(loadPromises);
      
      // Verify models are actually loaded
      const loadedModels = [];
      for (const model of requiredModels) {
        if (model.loader.params !== undefined) {
          loadedModels.push(model.name);
        }
      }
      
      if (loadedModels.length === requiredModels.length) {
        console.log(`✅ All models loaded successfully from: ${source}`);
        return {
          success: true,
          source,
          error: null,
          loadedModels
        };
      } else {
        throw new Error(`Only ${loadedModels.length}/${requiredModels.length} models loaded`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to load from ${source}:`, error);
      continue;
    }
  }

  return {
    success: false,
    source: null,
    error: 'Failed to load models from all sources',
    loadedModels: []
  };
}

/**
 * Check if face-api models are currently loaded
 */
export function checkModelsLoaded(): boolean {
  try {
    return (
      faceapi.nets.tinyFaceDetector.params !== undefined &&
      faceapi.nets.faceLandmark68Net.params !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * Get model loading status information
 */
export function getModelStatus(): {
  tinyFaceDetector: boolean;
  faceLandmark68Net: boolean;
  allLoaded: boolean;
} {
  try {
    const tinyFaceDetector = faceapi.nets.tinyFaceDetector.params !== undefined;
    const faceLandmark68Net = faceapi.nets.faceLandmark68Net.params !== undefined;
    
    return {
      tinyFaceDetector,
      faceLandmark68Net,
      allLoaded: tinyFaceDetector && faceLandmark68Net
    };
  } catch {
    return {
      tinyFaceDetector: false,
      faceLandmark68Net: false,
      allLoaded: false
    };
  }
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
