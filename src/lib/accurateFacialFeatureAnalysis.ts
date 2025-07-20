/**
 * Improved Facial Feature Color Analysis Service - v3.0
 * 
 * Enhanced version with better color detection algorithms and more accurate
 * filtering to properly detect blonde hair, blue eyes, and light skin tones.
 */
import * as faceapi from 'face-api.js';

export interface FacialFeatureColors {
  skinTone: {
    color: string;
    lightness: "very-light" | "light" | "medium" | "dark" | "very-dark";
    undertone: "warm" | "cool" | "neutral";
    confidence: number;
  };
  hairColor: {
    color: string;
    description: string;
    confidence: number;
  };
  eyeColor: {
    color: string;
    description: string;
    confidence: number;
  };
  overallConfidence: number;
  detectedFeatures: boolean;
}

class ImprovedFacialFeatureAnalysis {
  private isInitialized = false;

  private async initialize(): Promise<void> {
    if (this.isInitialized || faceapi.nets.tinyFaceDetector.params !== undefined) {
      return;
    }
    
    try {
      const modelPath = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
      ]);
      this.isInitialized = true;
      console.log("✅ Facial analysis models loaded successfully.");
    } catch (error) {
      console.error("❌ Failed to load facial analysis models:", error);
      this.isInitialized = false;
    }
  }

  async detectFacialFeatureColors(imageInput: string | File | Blob): Promise<FacialFeatureColors> {
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
      
      const skinToneResult = this.analyzeSkinTone(ctx, landmarks);
      const hairColorResult = this.analyzeHairColor(ctx, landmarks, img.width, img.height);
      const eyeColorResult = this.analyzeEyeColor(ctx, landmarks);

      const overallConfidence = (skinToneResult.confidence + hairColorResult.confidence + eyeColorResult.confidence) / 3;

      return {
        skinTone: skinToneResult,
        hairColor: hairColorResult,
        eyeColor: eyeColorResult,
        overallConfidence: parseFloat(overallConfidence.toFixed(2)),
        detectedFeatures: true,
      };
    } catch (error) {
      console.error("An error occurred during facial feature detection:", error);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Improved skin tone analysis with better sampling regions
   */
  private analyzeSkinTone(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
    // Sample from forehead, cheeks, and chin for better accuracy
    const forehead = this.getForehead(landmarks);
    const leftCheek = this.getLeftCheek(landmarks);
    const rightCheek = this.getRightCheek(landmarks);
    const chin = this.getChin(landmarks);

    const allRegions = [forehead, leftCheek, rightCheek, chin];
    let allValidPixels: Array<{ r: number, g: number, b: number }> = [];

    allRegions.forEach(region => {
      if (region.length > 2) {
        const pixels = this.getPixelsInPolygon(ctx, region);
        const validPixels = pixels.filter(p => this.isSkinColor(p.r, p.g, p.b));
        allValidPixels = allValidPixels.concat(validPixels);
      }
    });

    if (allValidPixels.length < 30) {
      return { 
        color: "#D4A574", 
        lightness: "medium" as const, 
        undertone: "neutral" as const, 
        confidence: 0.3 
      };
    }
    
    const dominantColor = this.findDominantColor(allValidPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    
    return {
      color: colorHex,
      lightness: this.classifySkinLightness(dominantColor.r, dominantColor.g, dominantColor.b),
      undertone: this.classifyUndertone(dominantColor.r, dominantColor.g, dominantColor.b),
      confidence: Math.min(0.95, 0.5 + (allValidPixels.length / 200))
    };
  }

  /**
   * Improved hair color analysis with better region detection
   */
  private analyzeHairColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68, imgWidth: number, imgHeight: number) {
    const jawOutline = landmarks.getJawOutline();
    const leftEyebrow = landmarks.getLeftEyeBrow();
    const rightEyebrow = landmarks.getRightEyeBrow();
    
    // Get the top of the face
    const faceTop = Math.min(...leftEyebrow.map(p => p.y), ...rightEyebrow.map(p => p.y));
    const faceLeft = jawOutline[0].x;
    const faceRight = jawOutline[16].x;
    const faceWidth = faceRight - faceLeft;
    
    // Expand hair detection region significantly
    const hairRegions = [
      // Top region (above eyebrows)
      {
        x: Math.max(0, faceLeft - faceWidth * 0.3),
        y: Math.max(0, faceTop - faceWidth * 0.8),
        width: faceWidth * 1.6,
        height: faceWidth * 0.8
      },
      // Left side region
      {
        x: Math.max(0, faceLeft - faceWidth * 0.5),
        y: faceTop,
        width: faceWidth * 0.5,
        height: faceWidth * 0.8
      },
      // Right side region
      {
        x: Math.min(imgWidth - faceWidth * 0.5, faceRight),
        y: faceTop,
        width: faceWidth * 0.5,
        height: faceWidth * 0.8
      }
    ];

    let allValidPixels: Array<{ r: number, g: number, b: number }> = [];
    
    hairRegions.forEach(region => {
      const pixels = this.getPixelsInRect(ctx, region);
      const validPixels = pixels.filter(p => this.isHairColor(p.r, p.g, p.b));
      allValidPixels = allValidPixels.concat(validPixels);
    });
    
    if (allValidPixels.length < 20) {
      return { 
        color: "#3C2415", 
        description: "Dark Brown", 
        confidence: 0.2 
      };
    }

    const dominantColor = this.findDominantColor(allValidPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);

    return {
      color: colorHex,
      description: this.classifyHairColor(dominantColor.r, dominantColor.g, dominantColor.b),
      confidence: Math.min(0.95, 0.4 + (allValidPixels.length / 150))
    };
  }
  
  /**
   * Improved eye color analysis with better iris detection
   */
  private analyzeEyeColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
    const leftEyePoints = landmarks.getLeftEye();
    const rightEyePoints = landmarks.getRightEye();
    
    // Create smaller regions focusing on the iris area
    const leftIrisPixels = this.getIrisPixels(ctx, leftEyePoints);
    const rightIrisPixels = this.getIrisPixels(ctx, rightEyePoints);
    const allPixels = [...leftIrisPixels, ...rightIrisPixels];

    const validPixels = allPixels.filter(p => this.isEyeColor(p.r, p.g, p.b));
    
    if (validPixels.length < 5) {
      return { 
        color: "#654321", 
        description: "Brown", 
        confidence: 0.2 
      };
    }

    const dominantColor = this.findDominantColor(validPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);

    return {
      color: colorHex,
      description: this.classifyEyeColor(dominantColor.r, dominantColor.g, dominantColor.b),
      confidence: Math.min(0.95, 0.6 + (validPixels.length / 50))
    };
  }

  // --- Improved Color Detection Functions ---

  private isSkinColor(r: number, g: number, b: number): boolean {
    // More inclusive skin tone detection
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Skin tones typically fall in these hue ranges
    const isInSkinHueRange = (h >= 0 && h <= 50) || (h >= 340 && h <= 360);
    
    // Allow for a wider range of saturation and lightness
    const hasReasonableSaturation = s >= 0.1 && s <= 0.8;
    const hasReasonableLightness = l >= 0.2 && l <= 0.95;
    
    // Additional checks for common skin tone characteristics
    const isWarmish = r >= g && g >= b * 0.8; // Allow some variation
    const isNotGrayish = Math.abs(r - g) > 5 || Math.abs(g - b) > 5;
    
    return isInSkinHueRange && hasReasonableSaturation && hasReasonableLightness && isWarmish && isNotGrayish;
  }

  private isHairColor(r: number, g: number, b: number): boolean {
    // Much more inclusive hair color detection
    const brightness = (r + g + b) / 3;
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Exclude obvious non-hair colors
    const isNotPureWhite = brightness < 240;
    const isNotSkinTone = !this.isSkinColor(r, g, b);
    
    // Include a much wider range of potential hair colors
    const isBlonde = (r > 150 && g > 120 && b > 80) && (r > g && g > b);
    const isBrown = (r > 40 && g > 20 && b > 10) && (r >= g && g >= b);
    const isBlack = brightness < 80;
    const isRed = (h >= 0 && h <= 30) && s > 0.3 && l > 0.3;
    const isAuburn = (h >= 15 && h <= 45) && s > 0.2;
    const isGray = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && brightness > 80 && brightness < 180;
    
    return isNotPureWhite && isNotSkinTone && (isBlonde || isBrown || isBlack || isRed || isAuburn || isGray);
  }

  private isEyeColor(r: number, g: number, b: number): boolean {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    // Exclude whites of the eye and very dark pupils
    const isNotWhite = !(s < 0.1 && l > 0.85);
    const isNotPupil = l > 0.1;
    const isNotSkin = !this.isSkinColor(r, g, b);
    
    // Much more inclusive for eye colors
    const hasColorVariation = s > 0.05 || l < 0.3; // Allow for dark brown eyes
    const isReasonableForEyes = l > 0.05 && l < 0.8;
    
    return isNotWhite && isNotPupil && isNotSkin && hasColorVariation && isReasonableForEyes;
  }

  // --- Helper Functions for Better Region Detection ---

  private getForehead(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const leftBrow = landmarks.getLeftEyeBrow();
    const rightBrow = landmarks.getRightEyeBrow();
    const browTop = Math.min(...leftBrow.map(p => p.y), ...rightBrow.map(p => p.y));
    const browHeight = 30;
    
    return [
      { x: leftBrow[0].x, y: browTop - browHeight },
      { x: rightBrow[4].x, y: browTop - browHeight },
      { x: rightBrow[4].x, y: browTop },
      { x: leftBrow[0].x, y: browTop }
    ];
  }

  private getLeftCheek(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    
    return [
      { x: nose[0].x - 20, y: leftEye[3].y + 10 },
      { x: jaw[2].x, y: leftEye[3].y + 10 },
      { x: jaw[4].x, y: nose[2].y + 20 },
      { x: nose[0].x, y: nose[2].y }
    ];
  }

  private getRightCheek(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const rightEye = landmarks.getRightEye();
    
    return [
      { x: nose[0].x + 20, y: rightEye[3].y + 10 },
      { x: jaw[14].x, y: rightEye[3].y + 10 },
      { x: jaw[12].x, y: nose[2].y + 20 },
      { x: nose[0].x, y: nose[2].y }
    ];
  }

  private getChin(landmarks: faceapi.FaceLandmarks68): faceapi.Point[] {
    const jaw = landmarks.getJawOutline();
    const mouth = landmarks.getMouth();
    
    return [
      jaw[6],
      jaw[10],
      { x: jaw[8].x, y: jaw[8].y + 20 },
      { x: mouth[9].x, y: mouth[9].y + 30 }
    ];
  }

  private getIrisPixels(ctx: CanvasRenderingContext2D, eyePoints: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    // Calculate eye center and create a smaller circular region for iris
    const centerX = eyePoints.reduce((sum, p) => sum + p.x, 0) / eyePoints.length;
    const centerY = eyePoints.reduce((sum, p) => sum + p.y, 0) / eyePoints.length;
    const eyeWidth = Math.max(...eyePoints.map(p => p.x)) - Math.min(...eyePoints.map(p => p.x));
    const radius = eyeWidth * 0.3; // Smaller radius to focus on iris
    
    const pixels: Array<{ r: number, g: number, b: number }> = [];
    const imageData = ctx.getImageData(
      Math.max(0, centerX - radius), 
      Math.max(0, centerY - radius), 
      radius * 2, 
      radius * 2
    );
    
    for (let x = 0; x < radius * 2; x++) {
      for (let y = 0; y < radius * 2; y++) {
        const distance = Math.sqrt((x - radius) ** 2 + (y - radius) ** 2);
        if (distance <= radius * 0.8) { // Focus on center area
          const index = (y * radius * 2 + x) * 4;
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

  // --- Improved Classification Functions ---

  private classifyHairColor(r: number, g: number, b: number): string {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;
    
    if (brightness < 50) return "Black";
    if (brightness > 180 && s < 0.3) return "Platinum Blonde";
    if (brightness > 160 && (r > g && g > b)) return "Blonde";
    if (brightness > 140 && s > 0.4 && (h >= 25 && h <= 45)) return "Dirty Blonde";
    if (h >= 0 && h <= 25 && s > 0.4 && l > 0.3) return "Auburn/Red";
    if (h >= 25 && h <= 45 && s > 0.3) return "Light Brown";
    if (brightness < 100) return "Dark Brown";
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) return "Gray";
    
    return "Brown";
  }

  private classifyEyeColor(r: number, g: number, b: number): string {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    if (s < 0.15 && l < 0.3) return "Dark Brown";
    if (s < 0.2) return "Brown";
    if (h >= 200 && h <= 240 && s > 0.3) return "Blue";
    if (h >= 180 && h <= 200 && s > 0.2) return "Blue-Gray";
    if (h >= 80 && h <= 140 && s > 0.3) return "Green";
    if (h >= 45 && h <= 80 && s > 0.2) return "Hazel";
    if (h >= 240 && h <= 280 && s > 0.2) return "Violet";
    if (s < 0.1) return "Gray";
    
    return "Brown";
  }

  // --- Existing utility functions (unchanged) ---
  
  private classifySkinLightness = (r: number, g: number, b: number): "very-light" | "light" | "medium" | "dark" | "very-dark" => {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 220) return "very-light";
    if (brightness > 180) return "light";
    if (brightness > 140) return "medium";
    if (brightness > 100) return "dark";
    return "very-dark";
  }

  private classifyUndertone = (r: number, g: number, b: number): "warm" | "cool" | "neutral" => {
    const { h } = this.rgbToHsl(r, g, b);
    if (h >= 15 && h <= 45) return "warm";
    if (h >= 180 && h <= 270) return "cool";
    return "neutral";
  }

  private getPixelsInRect(ctx: CanvasRenderingContext2D, rect: {x: number, y: number, width: number, height: number}) {
    const { data } = ctx.getImageData(
      Math.max(0, Math.floor(rect.x)), 
      Math.max(0, Math.floor(rect.y)), 
      Math.min(ctx.canvas.width - Math.max(0, Math.floor(rect.x)), Math.floor(rect.width)), 
      Math.min(ctx.canvas.height - Math.max(0, Math.floor(rect.y)), Math.floor(rect.height))
    );
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return pixels;
  }

  private getPixelsInPolygon(ctx: CanvasRenderingContext2D, points: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    if (!points || points.length === 0) return [];

    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
    path.closePath();

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxX = Math.min(ctx.canvas.width, Math.ceil(Math.max(...xs)));
    const maxY = Math.min(ctx.canvas.height, Math.ceil(Math.max(...ys)));
    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return [];
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = ctx.canvas.width;
    tempCanvas.height = ctx.canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.clip(path);
    tempCtx.drawImage(ctx.canvas, 0, 0);

    const imageData = tempCtx.getImageData(minX, minY, width, height);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 0) {
        pixels.push({ r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
      }
    }
    return pixels;
  }

  private findDominantColor(pixels: Array<{ r: number, g: number, b: number }>): { r: number, g: number, b: number } {
    const colorMap: { [key: string]: { count: number, r: number, g: number, b: number } } = {};
    const step = 16; // Smaller step for more precision
    
    pixels.forEach(p => {
      const key = [
        Math.floor(p.r / step),
        Math.floor(p.g / step),
        Math.floor(p.b / step)
      ].join(',');
      
      if (!colorMap[key]) {
        colorMap[key] = { count: 0, r: 0, g: 0, b: 0 };
      }
      colorMap[key].count++;
      colorMap[key].r += p.r;
      colorMap[key].g += p.g;
      colorMap[key].b += p.b;
    });

    const dominantKey = Object.keys(colorMap).sort((a, b) => colorMap[b].count - colorMap[a].count)[0];
    const dominant = colorMap[dominantKey];
    
    return {
      r: Math.round(dominant.r / dominant.count),
      g: Math.round(dominant.g / dominant.count),
      b: Math.round(dominant.b / dominant.count),
    };
  }

  private rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l };
  }
  
  private rgbToHex = (r: number, g: number, b: number): string => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  
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

  private getFallbackFeatures(): FacialFeatureColors {
    return {
      skinTone: { color: "#D4A574", lightness: "medium", undertone: "neutral", confidence: 0.1 },
      hairColor: { color: "#3C2415", description: "Dark Brown", confidence: 0.1 },
      eyeColor: { color: "#654321", description: "Brown", confidence: 0.1 },
      overallConfidence: 0.1,
      detectedFeatures: false,
    };
  }
}

export const improvedFacialFeatureAnalysis = new ImprovedFacialFeatureAnalysis();