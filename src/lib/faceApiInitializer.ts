/**
 * Face-API Model Initializer
 * 
 * Centralized initialization for face-api.js models with comprehensive error handling
 * and multiple fallback sources
 */

import * as faceapi from 'face-api.js';

export interface InitializationResult {
  success: boolean;
  source: string | null;
  error: string | null;
  modelsLoaded: string[];
  fallbackMode: boolean;
}

class FaceApiInitializer {
  private static instance: FaceApiInitializer;
  private initialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  private constructor() {}

  static getInstance(): FaceApiInitializer {
    if (!FaceApiInitializer.instance) {
      FaceApiInitializer.instance = new FaceApiInitializer();
    }
    return FaceApiInitializer.instance;
  }

  /**
   * Initialize face-api models with multiple fallback sources
   */
  async initialize(): Promise<InitializationResult> {
    // Return cached promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return success if already initialized
    if (this.initialized && this.areModelsLoaded()) {
      return {
        success: true,
        source: 'cached',
        error: null,
        modelsLoaded: ['tinyFaceDetector', 'faceLandmark68Net'],
        fallbackMode: false
      };
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<InitializationResult> {
    const modelSources = [
      {
        url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model',
        name: 'vladmandic CDN'
      },
      {
        url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model',
        name: 'vladmandic GitHub'
      },
      {
        url: '/models',
        name: 'Local models'
      }
    ];

    const requiredModels = [
      { name: 'tinyFaceDetector', loader: faceapi.nets.tinyFaceDetector },
      { name: 'faceLandmark68Net', loader: faceapi.nets.faceLandmark68Net }
    ];

    for (const source of modelSources) {
      try {
        console.log(`🔄 Attempting to load face-api models from: ${source.name} (${source.url})`);
        
        // Load models with timeout
        const loadPromises = requiredModels.map(model => 
          this.loadModelWithTimeout(model.loader, source.url, 10000)
        );
        
        await Promise.all(loadPromises);
        
        // Verify all models are loaded
        const loadedModels = [];
        for (const model of requiredModels) {
          if (this.isModelLoaded(model.loader)) {
            loadedModels.push(model.name);
          }
        }
        
        if (loadedModels.length === requiredModels.length) {
          this.initialized = true;
          console.log(`✅ All face-api models loaded successfully from: ${source.name}`);
          
          return {
            success: true,
            source: source.name,
            error: null,
            modelsLoaded: loadedModels,
            fallbackMode: false
          };
        } else {
          throw new Error(`Only ${loadedModels.length}/${requiredModels.length} models loaded`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to load from ${source.name}:`, error);
        continue;
      }
    }

    // All sources failed - return fallback mode
    console.warn('⚠️ Failed to load face-api models from all sources. Facial feature detection will be disabled.');
    
    return {
      success: false,
      source: null,
      error: 'Failed to load models from all sources',
      modelsLoaded: [],
      fallbackMode: true
    };
  }

  /**
   * Load a single model with timeout
   */
  private loadModelWithTimeout(
    modelLoader: any, 
    sourceUrl: string, 
    timeoutMs: number
  ): Promise<void> {
    return Promise.race([
      modelLoader.loadFromUri(sourceUrl),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Check if a specific model is loaded
   */
  private isModelLoaded(modelLoader: any): boolean {
    try {
      return modelLoader.params !== undefined && modelLoader.params !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check if all required models are loaded
   */
  areModelsLoaded(): boolean {
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
   * Get current initialization status
   */
  getStatus(): {
    initialized: boolean;
    modelsLoaded: boolean;
    tinyFaceDetector: boolean;
    faceLandmark68Net: boolean;
  } {
    return {
      initialized: this.initialized,
      modelsLoaded: this.areModelsLoaded(),
      tinyFaceDetector: this.isModelLoaded(faceapi.nets.tinyFaceDetector),
      faceLandmark68Net: this.isModelLoaded(faceapi.nets.faceLandmark68Net)
    };
  }

  /**
   * Force re-initialization (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
  }
}

export const faceApiInitializer = FaceApiInitializer.getInstance();
