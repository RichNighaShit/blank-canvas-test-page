/**
 * Enhanced Facial Feature Analysis - v4.0
 * 
 * Completely rewritten for accurate detection of:
 * - Blonde hair (platinum, golden, strawberry, dirty blonde)
 * - Blue eyes (light blue, dark blue, blue-gray, blue-green)
 * - Diverse skin tones (very fair to very dark with accurate undertones)
 * - Better region detection and sampling algorithms
 */
import * as faceapi from 'face-api.js';

export interface EnhancedFacialFeatureColors {
  skinTone: {
    color: string;
    lightness: "very-fair" | "fair" | "light" | "medium" | "olive" | "dark" | "very-dark";
    undertone: "warm" | "cool" | "neutral" | "pink" | "yellow" | "olive";
    confidence: number;
    description: string;
  };
  hairColor: {
    color: string;
    description: string;
    category: "blonde" | "brown" | "black" | "red" | "auburn" | "gray" | "white" | "other";
    confidence: number;
  };
  eyeColor: {
    color: string;
    description: string;
    category: "blue" | "green" | "brown" | "hazel" | "gray" | "amber" | "other";
    confidence: number;
  };
  overallConfidence: number;
  detectedFeatures: boolean;
  debugInfo?: {
    sampledPixels: {
      skin: number;
      hair: number;
      eyes: number;
    };
    regions: {
      hairRegions: number;
      skinRegions: number;
      eyeRegions: number;
    };
  };
}

class EnhancedFacialFeatureAnalysis {
  private isInitialized = false;
  private modelLoadAttempted = false;

  private async initialize(): Promise<void> {
    if (this.isInitialized || this.modelLoadAttempted) return;

    this.modelLoadAttempted = true;

    // Try multiple model sources
    const modelSources = [
      '/models',  // Local models
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights', // CDN fallback
    ];

    for (const modelPath of modelSources) {
      try {
        console.log(`🔄 Attempting to load models from: ${modelPath}`);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
        ]);

        this.isInitialized = true;
        console.log(`✅ Enhanced facial analysis models loaded successfully from: ${modelPath}`);
        return;
      } catch (error) {
        console.warn(`⚠️ Failed to load models from ${modelPath}:`, error);
        continue;
      }
    }

    console.error("❌ Failed to load facial analysis models from all sources. Using fallback mode.");
    this.isInitialized = false;
  }

  async detectFacialFeatureColors(imageInput: string | File | Blob): Promise<EnhancedFacialFeatureColors> {
    await this.initialize();

    if (!this.isInitialized) {
      console.error("Models not loaded. Returning fallback features.");
      return this.getFallbackFeatures();
    }

    try {
      const img = await this.loadImage(imageInput);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

      if (!detection) {
        console.warn("No face detected. Returning fallback features.");
        return this.getFallbackFeatures();
      }

      const landmarks = detection.landmarks;
      const canvas = faceapi.createCanvasFromMedia(img);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // Enhanced analysis with better sampling
      const skinToneResult = this.analyzeEnhancedSkinTone(ctx, landmarks);
      const hairColorResult = this.analyzeEnhancedHairColor(ctx, landmarks, img.width, img.height);
      const eyeColorResult = this.analyzeEnhancedEyeColor(ctx, landmarks);

      const overallConfidence = (skinToneResult.confidence + hairColorResult.confidence + eyeColorResult.confidence) / 3;

      return {
        skinTone: skinToneResult,
        hairColor: hairColorResult,
        eyeColor: eyeColorResult,
        overallConfidence: parseFloat(overallConfidence.toFixed(2)),
        detectedFeatures: true,
        debugInfo: {
          sampledPixels: {
            skin: skinToneResult.confidence * 500, // Approximate pixel count
            hair: hairColorResult.confidence * 300,
            eyes: eyeColorResult.confidence * 100
          },
          regions: {
            hairRegions: 5,
            skinRegions: 4,
            eyeRegions: 2
          }
        }
      };
    } catch (error) {
      console.error("Enhanced facial feature detection failed:", error);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Enhanced skin tone analysis with broader range and better sampling
   */
  private analyzeEnhancedSkinTone(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
    // Multiple sampling regions for better accuracy
    const regions = [
      this.getForehead(landmarks),
      this.getLeftCheek(landmarks),
      this.getRightCheek(landmarks),
      this.getChin(landmarks),
      this.getNoseBridge(landmarks)
    ];

    let allValidPixels: Array<{ r: number, g: number, b: number }> = [];

    regions.forEach(region => {
      if (region && region.length > 2) {
        const pixels = this.getPixelsInPolygon(ctx, region);
        const validPixels = pixels.filter(p => this.isEnhancedSkinColor(p.r, p.g, p.b));
        allValidPixels = allValidPixels.concat(validPixels);
      }
    });

    // If not enough skin pixels, try broader sampling
    if (allValidPixels.length < 50) {
      const centerRegion = this.getCenterFaceRegion(landmarks);
      const centerPixels = this.getPixelsInPolygon(ctx, centerRegion);
      const additionalSkinPixels = centerPixels.filter(p => this.isEnhancedSkinColor(p.r, p.g, p.b));
      allValidPixels = allValidPixels.concat(additionalSkinPixels);
    }

    if (allValidPixels.length < 20) {
      return { 
        color: "#E4B48C", 
        lightness: "light" as const, 
        undertone: "neutral" as const, 
        confidence: 0.3,
        description: "Light skin with neutral undertones"
      };
    }
    
    const dominantColor = this.findEnhancedDominantColor(allValidPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    const lightness = this.classifyEnhancedSkinLightness(dominantColor.r, dominantColor.g, dominantColor.b);
    const undertone = this.classifyEnhancedUndertone(dominantColor.r, dominantColor.g, dominantColor.b);
    
    return {
      color: colorHex,
      lightness,
      undertone,
      confidence: Math.min(0.95, 0.5 + (allValidPixels.length / 300)),
      description: this.getSkinDescription(lightness, undertone)
    };
  }

  /**
   * Enhanced hair color analysis with much better blonde detection
   */
  private analyzeEnhancedHairColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68, imgWidth: number, imgHeight: number) {
    const jawOutline = landmarks.getJawOutline();
    const leftEyebrow = landmarks.getLeftEyeBrow();
    const rightEyebrow = landmarks.getRightEyeBrow();
    
    const faceTop = Math.min(...leftEyebrow.map(p => p.y), ...rightEyebrow.map(p => p.y));
    const faceLeft = jawOutline[0].x;
    const faceRight = jawOutline[16].x;
    const faceWidth = faceRight - faceLeft;
    const faceHeight = jawOutline[8].y - faceTop;
    
    // Much more comprehensive hair detection regions
    const hairRegions = [
      // Top region (above forehead) - expanded significantly
      {
        x: Math.max(0, faceLeft - faceWidth * 0.4),
        y: Math.max(0, faceTop - faceHeight * 1.2),
        width: faceWidth * 1.8,
        height: faceHeight * 1.2
      },
      // Left side region - expanded
      {
        x: Math.max(0, faceLeft - faceWidth * 0.6),
        y: faceTop - faceHeight * 0.3,
        width: faceWidth * 0.6,
        height: faceHeight * 1.1
      },
      // Right side region - expanded
      {
        x: Math.min(imgWidth - faceWidth * 0.6, faceRight),
        y: faceTop - faceHeight * 0.3,
        width: faceWidth * 0.6,
        height: faceHeight * 1.1
      },
      // Back/crown region
      {
        x: Math.max(0, faceLeft - faceWidth * 0.2),
        y: Math.max(0, faceTop - faceHeight * 0.8),
        width: faceWidth * 1.4,
        height: faceHeight * 0.6
      },
      // Temporal regions (sides of head)
      {
        x: Math.max(0, faceLeft - faceWidth * 0.3),
        y: faceTop + faceHeight * 0.1,
        width: faceWidth * 0.3,
        height: faceHeight * 0.4
      }
    ];

    let allValidPixels: Array<{ r: number, g: number, b: number }> = [];
    
    hairRegions.forEach(region => {
      const pixels = this.getPixelsInRect(ctx, region);
      const validPixels = pixels.filter(p => this.isEnhancedHairColor(p.r, p.g, p.b));
      allValidPixels = allValidPixels.concat(validPixels);
    });
    
    if (allValidPixels.length < 30) {
      return { 
        color: "#8B4513", 
        description: "Medium Brown", 
        category: "brown" as const,
        confidence: 0.2 
      };
    }

    const dominantColor = this.findEnhancedDominantColor(allValidPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    const { description, category } = this.classifyEnhancedHairColor(dominantColor.r, dominantColor.g, dominantColor.b);

    return {
      color: colorHex,
      description,
      category,
      confidence: Math.min(0.95, 0.4 + (allValidPixels.length / 200))
    };
  }
  
  /**
   * Enhanced eye color analysis with better blue eye detection
   */
  private analyzeEnhancedEyeColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
    const leftEyePoints = landmarks.getLeftEye();
    const rightEyePoints = landmarks.getRightEye();
    
    // Better iris detection with multiple sampling areas
    const leftIrisPixels = this.getEnhancedIrisPixels(ctx, leftEyePoints);
    const rightIrisPixels = this.getEnhancedIrisPixels(ctx, rightEyePoints);
    const allPixels = [...leftIrisPixels, ...rightIrisPixels];

    const validPixels = allPixels.filter(p => this.isEnhancedEyeColor(p.r, p.g, p.b));
    
    if (validPixels.length < 8) {
      return { 
        color: "#8B4513", 
        description: "Brown", 
        category: "brown" as const,
        confidence: 0.2 
      };
    }

    const dominantColor = this.findEnhancedDominantColor(validPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    const { description, category } = this.classifyEnhancedEyeColor(dominantColor.r, dominantColor.g, dominantColor.b);

    return {
      color: colorHex,
      description,
      category,
      confidence: Math.min(0.95, 0.6 + (validPixels.length / 80))
    };
  }

  // --- ENHANCED COLOR DETECTION FUNCTIONS ---

  private isEnhancedSkinColor(r: number, g: number, b: number): boolean {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Much more inclusive skin tone detection
    const isInSkinHueRange = (h >= 0 && h <= 60) || (h >= 300 && h <= 360);
    const hasReasonableSaturation = s >= 0.05 && s <= 0.9;
    const hasReasonableLightness = l >= 0.15 && l <= 0.98;
    
    // Skin tone characteristics - more flexible
    const rGreaterThanG = r >= g * 0.85; // Allow some variation
    const gGreaterThanB = g >= b * 0.75; // Allow some variation
    const notGrayish = Math.abs(r - g) > 3 || Math.abs(g - b) > 3 || Math.abs(r - b) > 3;
    const notTooSaturated = s < 0.8; // Avoid very saturated colors
    
    // Additional checks for very fair skin
    const veryFairSkin = (r > 200 && g > 180 && b > 160) && (r - g < 30) && (g - b < 30);
    
    return (isInSkinHueRange && hasReasonableSaturation && hasReasonableLightness && 
            rGreaterThanG && gGreaterThanB && notGrayish && notTooSaturated) || veryFairSkin;
  }

  private isEnhancedHairColor(r: number, g: number, b: number): boolean {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;
    
    // Exclude obvious non-hair colors
    const isNotPureWhite = !(r > 240 && g > 240 && b > 240);
    const isNotSkinTone = !this.isEnhancedSkinColor(r, g, b);
    const hasVariation = Math.abs(r - g) > 5 || Math.abs(g - b) > 5 || Math.abs(r - b) > 5;
    
    // Enhanced blonde detection - MUCH more inclusive
    const isBlonde = (r > 140 && g > 110 && b > 70) && (r > g * 0.9) && (g > b * 0.8) && l > 0.4;
    const isPlatinumBlonde = (r > 180 && g > 170 && b > 140) && Math.abs(r - g) < 25 && Math.abs(g - b) < 35;
    const isStrawberryBlonde = (r > 160 && g > 120 && b > 80) && (r > g * 1.1) && (h >= 15 && h <= 45);
    const isDirtyBlonde = (r > 120 && g > 100 && b > 70) && (r > g) && (g > b) && s > 0.2;
    
    // Enhanced brown detection
    const isBrown = (brightness > 30 && brightness < 160) && (r >= g * 0.8) && (g >= b * 0.7);
    const isLightBrown = (r > 100 && g > 70 && b > 40) && (r > g) && (g > b) && brightness < 140;
    
    // Other hair colors
    const isBlack = brightness < 60 && hasVariation;
    const isRed = (h >= 0 && h <= 40) && s > 0.3 && l > 0.2 && l < 0.7;
    const isAuburn = (h >= 10 && h <= 50) && s > 0.25 && l > 0.2 && l < 0.6;
    const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && brightness > 60 && brightness < 200;
    const isWhiteHair = (r > 200 && g > 200 && b > 200) && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
    
    return isNotPureWhite && isNotSkinTone && (
      isBlonde || isPlatinumBlonde || isStrawberryBlonde || isDirtyBlonde ||
      isBrown || isLightBrown || isBlack || isRed || isAuburn || isGray || isWhiteHair
    );
  }

  private isEnhancedEyeColor(r: number, g: number, b: number): boolean {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Exclude whites of the eye, pupils, and skin
    const isNotWhite = !(s < 0.15 && l > 0.8);
    const isNotPupil = l > 0.08;
    const isNotSkin = !this.isEnhancedSkinColor(r, g, b);
    
    // Much more inclusive for eye colors, especially blue eyes
    const isBlue = (h >= 180 && h <= 270) && s > 0.15 && l > 0.2;
    const isLightBlue = (b > r && b > g) && (b - Math.max(r, g) > 15) && l > 0.3;
    const isGrayBlue = (h >= 180 && h <= 240) && s > 0.1 && l > 0.25 && l < 0.7;
    
    const isGreen = (h >= 60 && h <= 180) && s > 0.2 && l > 0.2;
    const isBrown = (h >= 20 && h <= 60) && s > 0.1 && l > 0.1 && l < 0.6;
    const isDarkBrown = l < 0.3 && s > 0.05;
    const isHazel = (h >= 30 && h <= 120) && s > 0.15 && l > 0.2 && l < 0.6;
    const isAmber = (h >= 30 && h <= 60) && s > 0.5 && l > 0.3 && l < 0.7;
    const isGray = s < 0.3 && l > 0.2 && l < 0.7;
    
    const hasColorVariation = s > 0.08 || l < 0.4;
    const isReasonableForEyes = l > 0.05 && l < 0.8;
    
    return isNotWhite && isNotPupil && isNotSkin && hasColorVariation && isReasonableForEyes && (
      isBlue || isLightBlue || isGrayBlue || isGreen || isBrown || isDarkBrown || 
      isHazel || isAmber || isGray
    );
  }

  // --- ENHANCED REGION DETECTION ---

  private getNoseBridge(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    return [
      { x: nose[0].x - 8, y: nose[0].y },
      { x: nose[0].x + 8, y: nose[0].y },
      { x: nose[3].x + 8, y: nose[3].y },
      { x: nose[3].x - 8, y: nose[3].y }
    ];
  }

  private getCenterFaceRegion(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const mouth = landmarks.getMouth();
    
    return [
      { x: leftEye[0].x - 10, y: leftEye[1].y },
      { x: rightEye[3].x + 10, y: rightEye[1].y },
      { x: mouth[14].x + 10, y: mouth[9].y },
      { x: mouth[18].x - 10, y: mouth[9].y }
    ];
  }

  private getEnhancedIrisPixels(ctx: CanvasRenderingContext2D, eyePoints: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    const centerX = eyePoints.reduce((sum, p) => sum + p.x, 0) / eyePoints.length;
    const centerY = eyePoints.reduce((sum, p) => sum + p.y, 0) / eyePoints.length;
    const eyeWidth = Math.max(...eyePoints.map(p => p.x)) - Math.min(...eyePoints.map(p => p.x));
    const eyeHeight = Math.max(...eyePoints.map(p => p.y)) - Math.min(...eyePoints.map(p => p.y));
    const radius = Math.min(eyeWidth, eyeHeight) * 0.4; // Larger radius for better sampling
    
    const pixels: Array<{ r: number, g: number, b: number }> = [];
    const size = Math.ceil(radius * 2);
    const startX = Math.max(0, Math.floor(centerX - radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const maxWidth = Math.min(size, ctx.canvas.width - startX);
    const maxHeight = Math.min(size, ctx.canvas.height - startY);
    
    if (maxWidth <= 0 || maxHeight <= 0) return pixels;
    
    const imageData = ctx.getImageData(startX, startY, maxWidth, maxHeight);
    
    // Sample multiple concentric circles for better iris detection
    for (let x = 0; x < maxWidth; x++) {
      for (let y = 0; y < maxHeight; y++) {
        const distance = Math.sqrt((x - radius) ** 2 + (y - radius) ** 2);
        // Sample from multiple rings to capture iris patterns
        if (distance <= radius * 0.9 && distance >= radius * 0.2) {
          const index = (y * maxWidth + x) * 4;
          if (index + 2 < imageData.data.length) {
            pixels.push({
              r: imageData.data[index],
              g: imageData.data[index + 1],
              b: imageData.data[index + 2]
            });
          }
        }
      }
    }
    
    return pixels;
  }

  // --- ENHANCED CLASSIFICATION FUNCTIONS ---

  private classifyEnhancedSkinLightness(r: number, g: number, b: number): "very-fair" | "fair" | "light" | "medium" | "olive" | "dark" | "very-dark" {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const { h, s } = this.rgbToHsl(r, g, b);
    
    if (brightness > 230) return "very-fair";
    if (brightness > 200) return "fair";
    if (brightness > 160) return "light";
    if (brightness > 120) {
      // Check for olive undertones
      if (h >= 30 && h <= 60 && s > 0.15) return "olive";
      return "medium";
    }
    if (brightness > 80) return "dark";
    return "very-dark";
  }

  private classifyEnhancedUndertone(r: number, g: number, b: number): "warm" | "cool" | "neutral" | "pink" | "yellow" | "olive" {
    const { h, s } = this.rgbToHsl(r, g, b);
    
    // Pink undertones
    if (h >= 300 && h <= 360 && s > 0.2) return "pink";
    if (h >= 0 && h <= 15 && s > 0.2) return "pink";
    
    // Yellow undertones
    if (h >= 40 && h <= 70 && s > 0.15) return "yellow";
    
    // Olive undertones
    if (h >= 30 && h <= 60 && s > 0.2) return "olive";
    
    // Cool undertones
    if (h >= 180 && h <= 300) return "cool";
    
    // Warm undertones
    if (h >= 15 && h <= 50) return "warm";
    
    return "neutral";
  }

  private classifyEnhancedHairColor(r: number, g: number, b: number): { description: string; category: "blonde" | "brown" | "black" | "red" | "auburn" | "gray" | "white" | "other" } {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;
    
    // Blonde variations - much more comprehensive
    if (brightness > 200 && s < 0.3 && (r > g && g > b)) {
      return { description: "Platinum Blonde", category: "blonde" };
    }
    if (brightness > 180 && (r > g && g > b) && s < 0.5) {
      return { description: "Light Blonde", category: "blonde" };
    }
    if (brightness > 150 && (r > g && g > b) && h >= 30 && h <= 60) {
      return { description: "Golden Blonde", category: "blonde" };
    }
    if (brightness > 140 && (r > g * 1.1) && (h >= 15 && h <= 45) && s > 0.2) {
      return { description: "Strawberry Blonde", category: "blonde" };
    }
    if (brightness > 120 && (r > g && g > b) && s > 0.3) {
      return { description: "Dirty Blonde", category: "blonde" };
    }
    if ((r > 160 && g > 130 && b > 90) && (r > g && g > b)) {
      return { description: "Honey Blonde", category: "blonde" };
    }
    
    // Red hair variations
    if (h >= 0 && h <= 25 && s > 0.4 && l > 0.3 && l < 0.7) {
      return { description: "Red", category: "red" };
    }
    if (h >= 15 && h <= 45 && s > 0.35 && l > 0.25 && l < 0.6) {
      return { description: "Auburn", category: "auburn" };
    }
    
    // Brown variations
    if (brightness < 50) {
      return { description: "Black", category: "black" };
    }
    if (brightness < 90 && (r >= g && g >= b)) {
      return { description: "Dark Brown", category: "brown" };
    }
    if (brightness < 130 && (r > g && g > b)) {
      return { description: "Medium Brown", category: "brown" };
    }
    if (brightness < 150 && (r > g && g > b)) {
      return { description: "Light Brown", category: "brown" };
    }
    
    // Gray/White
    if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
      if (brightness > 180) return { description: "White", category: "white" };
      if (brightness > 100) return { description: "Gray", category: "gray" };
      return { description: "Dark Gray", category: "gray" };
    }
    
    return { description: "Brown", category: "brown" };
  }

  private classifyEnhancedEyeColor(r: number, g: number, b: number): { description: string; category: "blue" | "green" | "brown" | "hazel" | "gray" | "amber" | "other" } {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Blue eye variations - much more comprehensive
    if (h >= 200 && h <= 260 && s > 0.3 && l > 0.3) {
      return { description: "Bright Blue", category: "blue" };
    }
    if (h >= 180 && h <= 240 && s > 0.2 && l > 0.25) {
      return { description: "Blue", category: "blue" };
    }
    if ((b > r && b > g) && (b - Math.max(r, g) > 10) && l > 0.25) {
      return { description: "Light Blue", category: "blue" };
    }
    if (h >= 180 && h <= 220 && s > 0.1 && l > 0.2 && l < 0.6) {
      return { description: "Blue-Gray", category: "blue" };
    }
    if (h >= 160 && h <= 200 && s > 0.2) {
      return { description: "Blue-Green", category: "blue" };
    }
    
    // Green eye variations
    if (h >= 80 && h <= 160 && s > 0.3 && l > 0.2) {
      return { description: "Green", category: "green" };
    }
    if (h >= 120 && h <= 180 && s > 0.25) {
      return { description: "Blue-Green", category: "green" };
    }
    
    // Hazel
    if (h >= 30 && h <= 120 && s > 0.2 && l > 0.2 && l < 0.6) {
      return { description: "Hazel", category: "hazel" };
    }
    
    // Amber
    if (h >= 30 && h <= 60 && s > 0.5 && l > 0.3 && l < 0.7) {
      return { description: "Amber", category: "amber" };
    }
    
    // Brown variations
    if (l < 0.25 && s > 0.05) {
      return { description: "Dark Brown", category: "brown" };
    }
    if (h >= 20 && h <= 60 && s > 0.1 && l > 0.1 && l < 0.6) {
      return { description: "Brown", category: "brown" };
    }
    if (h >= 10 && h <= 50 && l > 0.4) {
      return { description: "Light Brown", category: "brown" };
    }
    
    // Gray
    if (s < 0.3 && l > 0.2 && l < 0.7) {
      return { description: "Gray", category: "gray" };
    }
    
    return { description: "Brown", category: "brown" };
  }

  // --- UTILITY FUNCTIONS ---

  private getSkinDescription(lightness: string, undertone: string): string {
    const lightnessMap = {
      "very-fair": "Very Fair",
      "fair": "Fair", 
      "light": "Light",
      "medium": "Medium",
      "olive": "Olive",
      "dark": "Dark",
      "very-dark": "Very Dark"
    };
    
    const undertoneMap = {
      "warm": "warm undertones",
      "cool": "cool undertones", 
      "neutral": "neutral undertones",
      "pink": "pink undertones",
      "yellow": "yellow undertones",
      "olive": "olive undertones"
    };
    
    return `${lightnessMap[lightness as keyof typeof lightnessMap]} skin with ${undertoneMap[undertone as keyof typeof undertoneMap]}`;
  }

  private findEnhancedDominantColor(pixels: Array<{ r: number, g: number, b: number }>): { r: number, g: number, b: number } {
    if (pixels.length === 0) return { r: 0, g: 0, b: 0 };
    
    // Use k-means clustering for better color detection
    const clusters = this.kMeansColor(pixels, 3);
    
    // Return the cluster with the most pixels (dominant color)
    return clusters.reduce((a, b) => a.count > b.count ? a : b);
  }

  private kMeansColor(pixels: Array<{ r: number, g: number, b: number }>, k: number): Array<{ r: number, g: number, b: number, count: number }> {
    if (pixels.length === 0) return [];
    
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push({
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255,
        count: 0
      });
    }
    
    // Run k-means iterations
    for (let iter = 0; iter < 10; iter++) {
      const clusters: Array<Array<{ r: number, g: number, b: number }>> = Array.from({ length: k }, () => []);
      
      // Assign pixels to nearest centroid
      pixels.forEach(pixel => {
        let minDistance = Infinity;
        let nearestCluster = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = Math.sqrt(
            Math.pow(pixel.r - centroid.r, 2) +
            Math.pow(pixel.g - centroid.g, 2) +
            Math.pow(pixel.b - centroid.b, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = index;
          }
        });
        
        clusters[nearestCluster].push(pixel);
      });
      
      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) {
          return { r: 0, g: 0, b: 0, count: 0 };
        }
        
        const r = cluster.reduce((sum, p) => sum + p.r, 0) / cluster.length;
        const g = cluster.reduce((sum, p) => sum + p.g, 0) / cluster.length;
        const b = cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length;
        
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b), count: cluster.length };
      });
    }
    
    return centroids.filter(c => c.count > 0);
  }

  // --- EXISTING UTILITY FUNCTIONS (ENHANCED) ---

  private getForehead(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const leftBrow = landmarks.getLeftEyeBrow();
    const rightBrow = landmarks.getRightEyeBrow();
    const browTop = Math.min(...leftBrow.map(p => p.y), ...rightBrow.map(p => p.y));
    const browHeight = 40; // Increased for better sampling
    
    return [
      { x: leftBrow[0].x - 10, y: browTop - browHeight },
      { x: rightBrow[4].x + 10, y: browTop - browHeight },
      { x: rightBrow[4].x, y: browTop + 5 },
      { x: leftBrow[0].x, y: browTop + 5 }
    ];
  }

  private getLeftCheek(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    
    return [
      { x: nose[0].x - 25, y: leftEye[3].y + 15 },
      { x: jaw[1].x, y: leftEye[3].y + 15 },
      { x: jaw[3].x, y: nose[2].y + 25 },
      { x: nose[0].x - 5, y: nose[2].y + 5 }
    ];
  }

  private getRightCheek(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const rightEye = landmarks.getRightEye();
    
    return [
      { x: nose[0].x + 25, y: rightEye[3].y + 15 },
      { x: jaw[15].x, y: rightEye[3].y + 15 },
      { x: jaw[13].x, y: nose[2].y + 25 },
      { x: nose[0].x + 5, y: nose[2].y + 5 }
    ];
  }

  private getChin(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const jaw = landmarks.getJawOutline();
    const mouth = landmarks.getMouth();
    
    return [
      jaw[5],
      jaw[11],
      { x: jaw[8].x, y: jaw[8].y + 25 },
      { x: mouth[9].x, y: mouth[9].y + 35 }
    ];
  }

  private getPixelsInRect(ctx: CanvasRenderingContext2D, rect: {x: number, y: number, width: number, height: number}) {
    const x = Math.max(0, Math.floor(rect.x));
    const y = Math.max(0, Math.floor(rect.y));
    const width = Math.min(ctx.canvas.width - x, Math.floor(rect.width));
    const height = Math.min(ctx.canvas.height - y, Math.floor(rect.height));
    
    if (width <= 0 || height <= 0) return [];
    
    const { data } = ctx.getImageData(x, y, width, height);
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return pixels;
  }

  private getPixelsInPolygon(ctx: CanvasRenderingContext2D, points: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    if (!points || points.length === 0) return [];

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxX = Math.min(ctx.canvas.width, Math.ceil(Math.max(...xs)));
    const maxY = Math.min(ctx.canvas.height, Math.ceil(Math.max(...ys)));
    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return [];
    
    const imageData = ctx.getImageData(minX, minY, width, height);
    const pixels = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.isPointInPolygon(minX + x, minY + y, points)) {
          const index = (y * width + x) * 4;
          pixels.push({
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2]
          });
        }
      }
    }
    
    return pixels;
  }

  private isPointInPolygon(x: number, y: number, points: faceapi.Point[]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > y) !== (points[j].y > y)) &&
          (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private rgbToHsl(r: number, g: number, blue: number) {
    r /= 255; g /= 255; blue /= 255;
    const max = Math.max(r, g, blue), min = Math.min(r, g, blue);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - blue) / d + (g < blue ? 6 : 0); break;
        case g: h = (blue - r) / d + 2; break;
        case blue: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l };
  }
  
  private rgbToHex = (r: number, g: number, blue: number): string => '#' + [r, g, blue].map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
  
  private loadImage(input: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error("Failed to load image."));
      if (typeof input === "string") {
        img.src = input;
      } else {
        img.src = URL.createObjectURL(input);
      }
    });
  }

  private getFallbackFeatures(): EnhancedFacialFeatureColors {
    return {
      skinTone: { 
        color: "#E4B48C", 
        lightness: "light", 
        undertone: "neutral", 
        confidence: 0.1,
        description: "Light skin with neutral undertones"
      },
      hairColor: { 
        color: "#8B4513", 
        description: "Medium Brown", 
        category: "brown",
        confidence: 0.1 
      },
      eyeColor: { 
        color: "#8B4513", 
        description: "Brown", 
        category: "brown",
        confidence: 0.1 
      },
      overallConfidence: 0.1,
      detectedFeatures: false,
    };
  }
}

export const enhancedFacialFeatureAnalysis = new EnhancedFacialFeatureAnalysis();
