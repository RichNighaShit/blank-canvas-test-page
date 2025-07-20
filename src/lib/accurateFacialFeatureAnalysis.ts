/**
 * Accurate Facial Feature Color Analysis Service - v2.0
 * 
 * This version uses face-api.js for landmark detection to accurately locate
 * facial features, resolving previous issues with incorrect color analysis.
 * It detects the ACTUAL colors of hair, eyes, and skin tone.
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
    description: string; // e.g., "Black", "Dark Brown", "Light Brown", etc.
    confidence: number;
  };
  eyeColor: {
    color: string;
    description: string; // e.g., "Dark Brown", "Brown", "Blue", etc.
    confidence: number;
  };
  overallConfidence: number;
  detectedFeatures: boolean;
}

class AccurateFacialFeatureAnalysis {
  private isInitialized = false;

  /**
   * Initializes face-api.js models if they haven't been loaded yet.
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || faceapi.nets.tinyFaceDetector.params === undefined) {
        try {
            // Models should be placed in the public/models directory
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
  }

  /**
   * Main function to analyze an image and detect facial feature colors.
   */
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
      
      // Analyze each feature using its specific landmarks
      const skinToneResult = this.analyzeSkinTone(ctx, landmarks);
      const hairColorResult = this.analyzeHairColor(ctx, landmarks);
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
   * Analyzes skin tone by sampling from the cheeks, which are reliable regions.
   */
  private analyzeSkinTone(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
    const leftCheekPoints = [landmarks.getLeftEyeBrow()[4], landmarks.getNose()[0], landmarks.getJawOutline()[3]];
    const rightCheekPoints = [landmarks.getRightEyeBrow()[0], landmarks.getNose()[3], landmarks.getJawOutline()[13]];

    const leftCheekPixels = this.getPixelsInPolygon(ctx, leftCheekPoints).filter(p => this.isSkinColor(p.r, p.g, p.b));
    const rightCheekPixels = this.getPixelsInPolygon(ctx, rightCheekPoints).filter(p => this.isSkinColor(p.r, p.g, p.b));
    const allPixels = [...leftCheekPixels, ...rightCheekPixels];

    if (allPixels.length < 20) {
        return { color: "#D4A574", lightness: "medium" as const, undertone: "neutral" as const, confidence: 0.3 }; // Slightly increased confidence for fallback
    }
    
    const dominantColor = this.findDominantColor(allPixels);
    const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    
    return {
        color: colorHex,
        lightness: this.classifySkinLightness(dominantColor.r, dominantColor.g, dominantColor.b),
        undertone: this.classifyUndertone(dominantColor.r, dominantColor.g, dominantColor.b),
        confidence: 0.95
    };
  }

  /**
   * Analyzes hair color by sampling from the forehead/hairline region.
   */
  private analyzeHairColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
      const jaw = landmarks.getJawOutline();
      const faceTopY = Math.min(...landmarks.getLeftEyeBrow().map(p => p.y), ...landmarks.getRightEyeBrow().map(p => p.y));
      const faceHeight = Math.max(...jaw.map(p => p.y)) - faceTopY;

      const hairRegion = {
          x: jaw[0].x,
          y: Math.max(0, faceTopY - faceHeight * 0.4), // Extend region upwards
          width: jaw[16].x - jaw[0].x,
          height: faceHeight * 0.4, // Increase height to capture more hair
      };

      const pixels = this.getPixelsInRect(ctx, hairRegion);
      const validPixels = pixels.filter(p => this.isHairColor(p.r, p.g, p.b));
      
      if (validPixels.length < 50) {
        return { color: "#3C2415", description: "Dark Brown", confidence: 0.3 }; // Slightly increased confidence for fallback
      }

      const dominantColor = this.findDominantColor(validPixels);
      const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);

      return {
          color: colorHex,
          description: this.classifyHairColor(dominantColor.r, dominantColor.g, dominantColor.b),
          confidence: 0.9
      };
  }
  
  /**
   * Analyzes eye color by sampling from within the eye landmarks.
   */
  private analyzeEyeColor(ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) {
      const leftEyePixels = this.getPixelsInPolygon(ctx, landmarks.getLeftEye());
      const rightEyePixels = this.getPixelsInPolygon(ctx, landmarks.getRightEye());
      const allPixels = [...leftEyePixels, ...rightEyePixels];

      const validPixels = allPixels.filter(p => this.isEyeColor(p.r, p.g, p.b));
      
      if (validPixels.length < 10) {
        return { color: "#654321", description: "Dark Brown", confidence: 0.3 }; // Slightly increased confidence for fallback
      }

      const dominantColor = this.findDominantColor(validPixels);
      const colorHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);

      return {
          color: colorHex,
          description: this.classifyEyeColor(dominantColor.r, dominantColor.g, dominantColor.b),
          confidence: 0.95
      };
  }

  // --- Pixel Filtering and Classification ---

  private isSkinColor(r: number, g: number, b: number): boolean {
    // A more robust skin color detection based on common skin tone ranges
    // and less strict conditions for variations.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Check for general skin tone hue (reddish-yellowish)
    const isHueInRange = (r > 90 && g > 50 && b > 20);

    // Check for reasonable saturation and lightness
    const isSufficientlySaturated = diff > 10; // Ensure it's not too desaturated (grayish)
    const isNotTooBrightOrDark = (max < 240 && min > 15); // Avoid pure white or pure black

    // Check for r > g > b or similar relationships, but allow for variations
    const isReddishDominant = r > g && g > b; // Typical Caucasian/Asian skin
    const isYellowishDominant = r > g && b < g; // Some Asian/Mediterranean skin

    return isHueInRange && isSufficientlySaturated && isNotTooBrightOrDark && (isReddishDominant || isYellowishDominant);
  }

  private isHairColor(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    const isGrayish = Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
    const isBrownish = (r > 60 && g > 30 && b > 10 && r < 180 && g < 150 && b < 120); // Range for brown
    const isBlonde = (r > 180 && g > 160 && b > 100); // Range for blonde
    const isBlack = (brightness < 60); // Range for black
    const isRed = (r > 100 && g < 80 && b < 80); // Range for red

    // Filter out obvious skin tones and very bright/desaturated colors that are not hair
    return !this.isSkinColor(r, g, b) && brightness < 240 && !isGrayish && (isBrownish || isBlonde || isBlack || isRed);
  }

  private isEyeColor(r: number, g: number, b: number): boolean {
    const { h, s, l } = this.rgbToHsl(r, g, b);

    // Filter out whites of the eye (low saturation, high lightness) and pupil (very low lightness)
    // Also, filter out skin tones that might be picked up around the eyes.
    const isNotWhiteOfEye = !(s < 0.15 && l > 0.8); // Avoid very desaturated and bright
    const isNotPupil = !(l < 0.1); // Avoid very dark (pupil)
    const isNotSkin = !this.isSkinColor(r, g, b); // Exclude skin tones

    // Consider a broader range for saturation and lightness for various eye colors
    const isSufficientlySaturated = s > 0.05; // Allow for less saturated eye colors like some grays
    const isReasonableLightness = l > 0.1 && l < 0.9; // Broader range for lightness

    return isNotWhiteOfEye && isNotPupil && isNotSkin && isSufficientlySaturated && isReasonableLightness;
  }
  
  private classifySkinLightness = (r: number, g: number, b: number): "very-light" | "light" | "medium" | "dark" | "very-dark" => {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 200) return "very-light";
    if (brightness > 160) return "light";
    if (brightness > 120) return "medium";
    if (brightness > 80) return "dark";
    return "very-dark";
  }

  private classifyUndertone = (r: number, g: number, b: number): "warm" | "cool" | "neutral" => {
    if (r > g && r > b && g > b) return "warm";  // Red & Yellow > Blue
    if (b > r && b > g) return "cool"; // Blue is dominant
    return "neutral";
  }

  private classifyHairColor(r: number, g: number, b: number): string {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    if (l < 0.20) return "Black";
    if (l < 0.40 && s < 0.4) return "Dark Brown";
    if (l > 0.70 && s < 0.5) return "Blonde";
    if ((h < 30 || h > 330) && s > 0.3 && l > 0.4) return "Auburn/Red";
    return "Brown";
  }

  private classifyEyeColor(r: number, g: number, b: number): string {
    const { h, s, l } = this.rgbToHsl(r, g, b);
    if (s < 0.15) return "Brown"; // Low saturation eyes are typically brown or gray
    if (h > 180 && h < 260 && s > 0.2) return "Blue";
    if (h > 70 && h < 180 && s > 0.2) return "Green";
    if (h > 30 && h < 70 && s > 0.2) return "Hazel";
    return "Dark Brown";
  }

  // --- Utility Functions ---
  
  private getPixelsInRect(ctx: CanvasRenderingContext2D, rect: {x: number, y: number, width: number, height: number}) {
    const { data } = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return pixels;
  }

  private getPixelsInPolygon(ctx: CanvasRenderingContext2D, points: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    if (!points || points.length === 0) return [];

    // Create a path for the polygon to use as a clipping region
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
    }
    path.closePath();

    // Get the bounding box of the polygon to minimize the area we have to read
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    const width = maxX - minX, height = maxY - minY;

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
      // The alpha channel (data[i+3]) will be > 0 only for pixels inside the clipped path
      if (imageData.data[i + 3] > 0) {
        pixels.push({ r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
      }
    }
    return pixels;
  }

  private findDominantColor(pixels: Array<{ r: number, g: number, b: number }>): { r: number, g: number, b: number } {
    // Simplified k-means/clustering by quantization
    const colorMap: { [key: string]: number } = {};
    const step = 32; // Bucket size
    
    pixels.forEach(p => {
      const key = [
        Math.floor(p.r / step),
        Math.floor(p.g / step),
        Math.floor(p.b / step)
      ].join(',');
      colorMap[key] = (colorMap[key] || 0) + 1;
    });

    const dominantKey = Object.keys(colorMap).sort((a, b) => colorMap[b] - colorMap[a])[0];
    const [r, g, b] = dominantKey.split(',').map(Number);
    
    return {
      r: r * step + step / 2,
      g: g * step + step / 2,
      b: b * step + step / 2,
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
      eyeColor: { color: "#654321", description: "Dark Brown", confidence: 0.1 },
      overallConfidence: 0.1,
      detectedFeatures: false,
    };
  }
}

export const accurateFacialFeatureAnalysis = new AccurateFacialFeatureAnalysis();