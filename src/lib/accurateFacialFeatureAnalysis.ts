/**
 * Accurate Facial Feature Color Analysis Service
 * 
 * Detects and returns the ACTUAL colors of hair, eyes, and skin tone
 * using face landmark detection for significantly improved accuracy.
 * NOT "flattering" colors - shows what the person actually looks like.
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
   * Initializes face-api.js models if not already loaded.
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Models should be placed in the public/models directory of your project
      const modelPath = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
      ]);
      this.isInitialized = true;
      console.log("✅ Facial analysis models loaded.");
    } catch (error) {
      console.error("❌ Failed to load facial analysis models:", error);
      // This will cause detection to fail, which is handled in the main function.
    }
  }

  /**
   * Analyze image to detect actual hair, eye, and skin colors.
   */
  async detectFacialFeatureColors(imageInput: string | File | Blob): Promise<FacialFeatureColors> {
    await this.initialize();

    if (!this.isInitialized) {
      console.error("Facial analysis models not loaded, returning fallback.");
      return this.getFallbackFeatures();
    }

    try {
      const img = await this.loadImage(imageInput);
      const canvas = faceapi.createCanvasFromMedia(img);
      const displaySize = { width: img.width, height: img.height };
      faceapi.matchDimensions(canvas, displaySize);

      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

      if (!detection) {
        console.warn("No face detected in the image.");
        return this.getFallbackFeatures();
      }

      const landmarks = detection.landmarks;
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0, img.width, img.height);

      const skinTone = this.detectRegionColor(ctx!, landmarks.getJawOutline(), { confidence: 0.3, type: 'skin' });
      const hairColor = this.detectHairColor(ctx!, landmarks.getJawOutline(), landmarks.getLeftEyeBrow(), landmarks.getRightEyeBrow());
      const eyeColor = this.detectRegionColor(ctx!, [...landmarks.getLeftEye(), ...landmarks.getRightEye()], { confidence: 0.3, type: 'eye' });

      const overallConfidence = (skinTone.confidence + hairColor.confidence + eyeColor.confidence) / 3;

      return {
        skinTone: {
          color: skinTone.color,
          confidence: skinTone.confidence,
          lightness: this.classifySkinLightness(skinTone.r, skinTone.g, skinTone.b),
          undertone: this.classifyUndertone(skinTone.r, skinTone.g, skinTone.b),
        },
        hairColor: {
          color: hairColor.color,
          confidence: hairColor.confidence,
          description: this.classifyHairColor(hairColor.r, hairColor.g, hairColor.b),
        },
        eyeColor: {
          color: eyeColor.color,
          confidence: eyeColor.confidence,
          description: this.classifyEyeColor(eyeColor.r, eyeColor.g, eyeColor.b),
        },
        overallConfidence,
        detectedFeatures: true
      };
    } catch (error) {
      console.error("Facial feature detection failed:", error);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Gets the dominant color from a specific region of the canvas defined by landmarks.
   */
  private detectRegionColor(ctx: CanvasRenderingContext2D, points: faceapi.Point[], options: { confidence: number, type: 'skin' | 'eye' }) {
    const pixels = this.getPixelsInPolygon(ctx, points);
    let validPixels = pixels;

    if (options.type === 'skin') {
      validPixels = pixels.filter(p => this.isSkinColor(p.r, p.g, p.b));
    } else if (options.type === 'eye') {
      validPixels = pixels.filter(p => this.isEyeColor(p.r, p.g, p.b));
    }

    if (validPixels.length < 10) { // Not enough data
      return { r: 128, g: 128, b: 128, color: '#808080', confidence: 0.2 };
    }

    const dominantColor = this.findDominantColor(validPixels);
    return {
      ...dominantColor,
      color: this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
      confidence: Math.min(0.95, (validPixels.length / pixels.length) * 0.8 + 0.15)
    };
  }

  /**
   * Detects hair color from the region above the eyebrows.
   */
  private detectHairColor(ctx: CanvasRenderingContext2D, jaw: faceapi.Point[], leftBrow: faceapi.Point[], rightBrow: faceapi.Point[]) {
      const faceBox = new faceapi.Rect(
          Math.min(...jaw.map(p => p.x)),
          Math.min(...leftBrow.map(p => p.y), ...rightBrow.map(p => p.y)),
          Math.max(...jaw.map(p => p.x)) - Math.min(...jaw.map(p => p.x)),
          Math.max(...jaw.map(p => p.y)) - Math.min(...leftBrow.map(p => p.y), ...rightBrow.map(p => p.y))
      );

      const hairY = Math.max(0, faceBox.y - (faceBox.height * 0.4));
      const hairHeight = faceBox.y - hairY;
      const hairPoints = [
        new faceapi.Point(faceBox.x, hairY),
        new faceapi.Point(faceBox.x + faceBox.width, hairY),
        new faceapi.Point(faceBox.x + faceBox.width, faceBox.y),
        new faceapi.Point(faceBox.x, faceBox.y),
      ];

      const pixels = this.getPixelsInPolygon(ctx, hairPoints);
      const validPixels = pixels.filter(p => this.isHairColor(p.r, p.g, p.b));

      if (validPixels.length < 20) {
        return { r: 60, g: 36, b: 21, color: '#3C2415', confidence: 0.2 };
      }
      
      const dominantColor = this.findDominantColor(validPixels);
      return {
          ...dominantColor,
          color: this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
          confidence: Math.min(0.9, (validPixels.length / pixels.length) * 0.7 + 0.2)
      };
  }

  /**
   * Extracts pixels from a polygon defined by landmark points.
   */
  private getPixelsInPolygon(ctx: CanvasRenderingContext2D, points: faceapi.Point[]): Array<{ r: number, g: number, b: number }> {
    if (points.length === 0) return [];
    
    const boundingBox = faceapi.getMediaDimensions(new faceapi.Box(
      Math.min(...points.map(p => p.x)), 
      Math.min(...points.map(p => p.y)),
      Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)),
      Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))
    ));
    
    const pixels: Array<{ r: number, g: number, b: number }> = [];
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const { data, width } = imageData;

    for (let y = Math.floor(boundingBox.y); y < boundingBox.y + boundingBox.height; y++) {
      for (let x = Math.floor(boundingBox.x); x < boundingBox.x + boundingBox.width; x++) {
        if (this.isPointInPolygon({ x, y }, points)) {
          const index = (y * width + x) * 4;
          pixels.push({ r: data[index], g: data[index + 1], b: data[index + 2] });
        }
      }
    }
    return pixels;
  }

  /**
   * Finds the most dominant color from a list of pixels using clustering.
   */
  private findDominantColor(pixels: Array<{ r: number, g: number, b: number }>): { r: number, g: number, b: number } {
    const colorBuckets = 5;
    const bucketSize = Math.floor(256 / colorBuckets);
    const colorMap: { [key: string]: { r: number[], g: number[], b: number[], count: number } } = {};

    pixels.forEach(pixel => {
      const r_bucket = Math.floor(pixel.r / bucketSize);
      const g_bucket = Math.floor(pixel.g / bucketSize);
      const b_bucket = Math.floor(pixel.b / bucketSize);
      const key = `${r_bucket},${g_bucket},${b_bucket}`;

      if (!colorMap[key]) {
        colorMap[key] = { r: [], g: [], b: [], count: 0 };
      }
      colorMap[key].r.push(pixel.r);
      colorMap[key].g.push(pixel.g);
      colorMap[key].b.push(pixel.b);
      colorMap[key].count++;
    });

    const dominantClusterKey = Object.keys(colorMap).sort((a, b) => colorMap[b].count - colorMap[a].count)[0];
    const dominantCluster = colorMap[dominantClusterKey];
    
    const avgR = Math.round(dominantCluster.r.reduce((sum, val) => sum + val, 0) / dominantCluster.count);
    const avgG = Math.round(dominantCluster.g.reduce((sum, val) => sum + val, 0) / dominantCluster.count);
    const avgB = Math.round(dominantCluster.b.reduce((sum, val) => sum + val, 0) / dominantCluster.count);

    return { r: avgR, g: avgG, b: avgB };
  }

  // Ray-casting algorithm to check if a point is inside a polygon
  private isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]): boolean {
      let isInside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x, yi = polygon[i].y;
          const xj = polygon[j].x, yj = polygon[j].y;

          const intersect = ((yi > point.y) !== (yj > point.y))
              && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
          if (intersect) isInside = !isInside;
      }
      return isInside;
  }

  private isSkinColor(r: number, g: number, b: number): boolean {
    return (r > 95 && g > 40 && b > 20) &&
           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
           (Math.abs(r - g) > 15) && (r > g) && (r > b);
  }

  private isHairColor(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    // Hair is generally not brightly colored and has lower saturation than skin.
    return brightness < 220 && saturation < 100;
  }

  private isEyeColor(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    // Filter out very dark (pupil) and very bright (sclera/reflections) pixels
    return brightness > 25 && brightness < 200;
  }
  
  private classifySkinLightness(r: number, g: number, b: number): "very-light" | "light" | "medium" | "dark" | "very-dark" {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000; // Perceived brightness
    if (brightness > 190) return "very-light";
    if (brightness > 150) return "light";
    if (brightness > 110) return "medium";
    if (brightness > 70) return "dark";
    return "very-dark";
  }

  private classifyUndertone(r: number, g: number, b: number): "warm" | "cool" | "neutral" {
    if (r > b && g > b) return "warm";   // More red/yellow than blue
    if (b > r && b > g) return "cool";  // More blue than red/green
    return "neutral";
  }

  private classifyHairColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    
    if (brightness < 40) return "Black";
    if (brightness < 70) return "Dark Brown";
    if (r > g + 10 && r > b + 10 && brightness < 150) return "Auburn/Red";
    if (brightness < 120) return "Brown";
    if (brightness < 180) return "Dark Blonde";
    if (g > 80 && b < 80) return "Blonde";
    return "Light Blonde / Grey";
  }

  private classifyEyeColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    
    if (b > r && b > g && b > 80) return "Blue";
    if (g > r && g > b && g > 70) return "Green";
    if (r > 100 && g > 80 && b < 80) return "Hazel";
    if (brightness < 65) return "Dark Brown";
    return "Brown";
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }
  
  private loadImage(input: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error("Failed to load image: " + err));
      if (typeof input === "string") {
        img.src = input;
      } else {
        img.src = URL.createObjectURL(input);
      }
    });
  }

  private getFallbackFeatures(): FacialFeatureColors {
    return {
      skinTone: { color: "#D4A574", lightness: "medium", undertone: "neutral", confidence: 0.3 },
      hairColor: { color: "#3C2415", description: "Dark Brown", confidence: 0.3 },
      eyeColor: { color: "#654321", description: "Dark Brown", confidence: 0.3 },
      overallConfidence: 0.3,
      detectedFeatures: false
    };
  }
}

// Export a singleton instance to manage the models efficiently
export const accurateFacialFeatureAnalysis = new AccurateFacialFeatureAnalysis();