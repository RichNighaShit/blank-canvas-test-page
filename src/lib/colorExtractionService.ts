/**
 * Advanced Color Extraction Service - Enhanced Version
 *
 * This service provides sophisticated color extraction from images using:
 * - CIELAB color space for perceptual accuracy
 * - Advanced skin tone detection and analysis
 * - Sophisticated color clustering with k-means
 * - Perceptual color distance calculations
 * - Color harmony validation
 * - Accessibility considerations
 */

import * as faceapi from "face-api.js";
import { extractColors } from "extract-colors";
import SmartCrop from "smartcrop";
import { enhancedFacialFeatureAnalysis, type EnhancedFacialFeatureColors } from "./enhancedFacialFeatureAnalysis";

export interface ExtractedPalette {
  colors: string[]; // Hex color codes
  confidence: number; // 0-1 confidence score
  source: "face" | "full-image" | "fallback";
  metadata?: {
    faceDetected: boolean;
    colorCount: number;
    dominantColor: string;
    skinTones: string[];
    colorHarmony: string;
    accessibilityScore: number;
    colorTemperature: "warm" | "cool" | "neutral";
    colorSeason: "spring" | "summer" | "autumn" | "winter" | "neutral";
    enhancedFeatures?: EnhancedFacialFeatureColors;
  };
}

export interface ColorExtractionOptions {
  colorCount?: number; // Number of colors to extract (default: 8)
  quality?: number; // Extraction quality 1-10 (default: 8)
  fallbackToFullImage?: boolean; // If no face detected, use full image (default: true)
  minColorDistance?: number; // Minimum perceptual distance between colors (default: 15)
  includeSkinTones?: boolean; // Include skin tone analysis (default: true)
  validateAccessibility?: boolean; // Check color accessibility (default: true)
}

interface ColorPoint {
  r: number;
  g: number;
  b: number;
  l: number;
  a: number;
  bLab: number;
  count: number;
  hex: string;
}

interface SkinToneRange {
  name: string;
  hexRange: string[];
  labRange: { l: [number, number]; a: [number, number]; b: [number, number] };
}

class ColorExtractionService {
  private faceApiInitialized = false;
  private readonly modelBasePath = "/models";
  private readonly skinToneRanges: SkinToneRange[] = [
    {
      name: "Very Fair",
      hexRange: ["#FFDBB4", "#F1C27D"],
      labRange: { l: [85, 95], a: [5, 15], b: [20, 30] }
    },
    {
      name: "Fair",
      hexRange: ["#F1C27D", "#E0AC69"],
      labRange: { l: [75, 85], a: [10, 20], b: [25, 35] }
    },
    {
      name: "Light",
      hexRange: ["#E0AC69", "#C68642"],
      labRange: { l: [65, 75], a: [15, 25], b: [30, 40] }
    },
    {
      name: "Medium",
      hexRange: ["#C68642", "#A0522D"],
      labRange: { l: [55, 65], a: [20, 30], b: [35, 45] }
    },
    {
      name: "Olive",
      hexRange: ["#A0522D", "#8B4513"],
      labRange: { l: [45, 55], a: [25, 35], b: [40, 50] }
    },
    {
      name: "Dark",
      hexRange: ["#8B4513", "#654321"],
      labRange: { l: [35, 45], a: [30, 40], b: [45, 55] }
    },
    {
      name: "Very Dark",
      hexRange: ["#654321", "#2F1B14"],
      labRange: { l: [25, 35], a: [35, 45], b: [50, 60] }
    }
  ];

  /**
   * Initialize face-api.js models
   */
  async initializeFaceAPI(): Promise<void> {
    if (this.faceApiInitialized) return;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelBasePath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBasePath),
      ]);

      this.faceApiInitialized = true;
      console.log("Face-API models loaded successfully");
    } catch (error) {
      console.warn("Failed to load Face-API models:", error);
    }
  }

  /**
   * Extract color palette from image with advanced algorithms
   */
  async extractPalette(
    imageInput: string | File | Blob,
    options: ColorExtractionOptions = {},
  ): Promise<ExtractedPalette> {
    const {
      colorCount = 8,
      quality = 8,
      fallbackToFullImage = true,
      minColorDistance = 15,
      includeSkinTones = true,
      validateAccessibility = true,
    } = options;

    try {
      const img = await this.loadImage(imageInput);
      let croppedImage = img;
      let faceDetected = false;

      // Enhanced face detection and feature analysis
      let enhancedFeatures: EnhancedFacialFeatureColors | undefined;
      if (this.faceApiInitialized) {
        try {
          // Use enhanced facial feature analysis
          enhancedFeatures = await enhancedFacialFeatureAnalysis.detectFacialFeatureColors(imageInput);
          if (enhancedFeatures.detectedFeatures) {
            faceDetected = true;
            // Use the enhanced analysis to guide cropping
            const faceBox = await this.detectFace(img);
            if (faceBox) {
              croppedImage = await this.cropToFace(img, faceBox);
            }
          }
        } catch (error) {
          console.warn("Enhanced face detection failed, using standard detection:", error);
          // Fallback to standard face detection
          const faceBox = await this.detectFace(img);
          if (faceBox) {
            croppedImage = await this.cropToFace(img, faceBox);
            faceDetected = true;
          }
        }
      }

      if (!faceDetected && !fallbackToFullImage) {
        try {
          croppedImage = await this.smartCrop(img);
        } catch (error) {
          console.warn("Smart crop failed, using full image:", error);
        }
      }

      // Advanced color extraction with CIELAB analysis
      const extractedColors = await this.extractColorsAdvanced(croppedImage, {
        colorCount,
        quality,
        minColorDistance,
        includeSkinTones,
      });

      // Enhanced confidence calculation
      const confidence = this.calculateAdvancedConfidence(
        extractedColors,
        faceDetected,
        img.width,
        img.height,
      );

      // Color harmony analysis
      const colorHarmony = this.analyzeColorHarmony(extractedColors);
      
      // Accessibility validation
      const accessibilityScore = validateAccessibility 
        ? this.calculateAccessibilityScore(extractedColors)
        : 0.8;

      // Color temperature analysis
      const colorTemperature = this.analyzeColorTemperature(extractedColors);
      
      // Seasonal color analysis
      const colorSeason = this.analyzeSeasonalColors(extractedColors);

      // Enhanced skin tone detection
      const skinTones = includeSkinTones
        ? this.detectEnhancedSkinTones(extractedColors, enhancedFeatures)
        : [];

      const result: ExtractedPalette = {
        colors: extractedColors,
        confidence,
        source: faceDetected ? "face" : fallbackToFullImage ? "full-image" : "fallback",
        metadata: {
          faceDetected,
          colorCount: extractedColors.length,
          dominantColor: extractedColors[0] || "#000000",
          skinTones,
          colorHarmony,
          accessibilityScore,
          colorTemperature,
          colorSeason,
          enhancedFeatures,
        },
      };

      return result;
    } catch (error) {
      console.error("Advanced color extraction failed:", error);
      return this.getFallbackPalette();
    }
  }

  /**
   * Load image from various input types
   */
  private async loadImage(
    input: string | File | Blob,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS for external images

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      if (typeof input === "string") {
        img.src = input;
      } else {
        const url = URL.createObjectURL(input);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
      }
    });
  }

  /**
   * Detect face in image using face-api.js
   */
  private async detectFace(img: HTMLImageElement): Promise<faceapi.Box | null> {
    if (!this.faceApiInitialized) return null;

    try {
      // Use tiny face detector for performance
      const detection = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5,
        }),
      );

      return detection?.box || null;
    } catch (error) {
      console.warn("Face detection error:", error);
      return null;
    }
  }

  /**
   * Crop image to face region
   */
  private async cropToFace(
    img: HTMLImageElement,
    faceBox: faceapi.Box,
  ): Promise<HTMLImageElement> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Add padding around face (20% of face size)
    const padding = Math.min(faceBox.width, faceBox.height) * 0.2;
    const cropX = Math.max(0, faceBox.x - padding);
    const cropY = Math.max(0, faceBox.y - padding);
    const cropWidth = Math.min(img.width - cropX, faceBox.width + padding * 2);
    const cropHeight = Math.min(
      img.height - cropY,
      faceBox.height + padding * 2,
    );

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return this.canvasToImage(canvas);
  }

  /**
   * Smart crop using smartcrop.js as fallback
   */
  private async smartCrop(img: HTMLImageElement): Promise<HTMLImageElement> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Use smartcrop to find the best crop area
      const result = await SmartCrop.crop(canvas, {
        width: Math.min(img.width, 400),
        height: Math.min(img.height, 400),
      });

      const crop = result.topCrop;
      const croppedCanvas = document.createElement("canvas");
      const croppedCtx = croppedCanvas.getContext("2d")!;

      croppedCanvas.width = crop.width;
      croppedCanvas.height = crop.height;

      croppedCtx.drawImage(
        canvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );

      return this.canvasToImage(croppedCanvas);
    } catch (error) {
      console.warn("Smart crop failed:", error);
      return img; // Return original image
    }
  }

  /**
   * Convert canvas to image element
   */
  private async canvasToImage(
    canvas: HTMLCanvasElement,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL();
    });
  }

  /**
   * Advanced color extraction using CIELAB color space and k-means clustering
   */
  private async extractColorsAdvanced(
    img: HTMLImageElement,
    options: {
      colorCount: number;
      quality: number;
      minColorDistance: number;
      includeSkinTones: boolean;
    },
  ): Promise<string[]> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = this.samplePixels(imageData, options.quality);
      
      // Convert to CIELAB color space
      const labPixels = pixels.map(pixel => ({
        ...pixel,
        ...this.rgbToLab(pixel.r, pixel.g, pixel.b)
      }));

      // K-means clustering for better color grouping
      const clusters = this.kMeansClustering(labPixels, options.colorCount);
      
      // Filter and sort colors by perceptual importance
      const filteredColors = this.filterColorsByDistance(
        clusters,
        options.minColorDistance
      );

      // Enhance with skin tone detection if requested
      let finalColors = filteredColors;
      if (options.includeSkinTones) {
        const skinTones = this.extractSkinTones(labPixels);
        finalColors = this.mergeColorsWithSkinTones(filteredColors, skinTones);
      }

      // Validate and ensure minimum color count
      if (finalColors.length < 3) {
        finalColors = this.generateComplementaryColors(finalColors);
      }

      return finalColors.map(color => color.hex);
    } catch (error) {
      console.error("Advanced color extraction error:", error);
      return this.getFallbackColors();
    }
  }

  /**
   * Sample pixels intelligently based on quality setting
   */
  private samplePixels(imageData: ImageData, quality: number): ColorPoint[] {
    const data = imageData.data;
    const pixels: ColorPoint[] = [];
    const step = Math.max(1, Math.floor(100 / quality)); // Higher quality = more pixels

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skip transparent or very dark/light pixels
      if (this.isValidColor(r, g, b)) {
        const lab = this.rgbToLab(r, g, b);
        pixels.push({
          r, g, b: b,
          l: lab.l, a: lab.a, b: lab.b,
          count: 1,
          hex: this.rgbToHex(r, g, b)
        });
      }
    }

    return pixels;
  }

  /**
   * K-means clustering for color grouping
   */
  private kMeansClustering(pixels: ColorPoint[], k: number): ColorPoint[] {
    if (pixels.length === 0) return [];

    // Initialize centroids
    let centroids = this.initializeCentroids(pixels, k);
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      // Assign pixels to nearest centroid
      const clusters: ColorPoint[][] = Array.from({ length: k }, () => []);
      
      pixels.forEach(pixel => {
        const distances = centroids.map(centroid => 
          this.calculateLabDistance(pixel, centroid)
        );
        const nearestCentroid = distances.indexOf(Math.min(...distances));
        clusters[nearestCentroid].push(pixel);
      });

      // Update centroids
      const newCentroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0];
        
        const avgL = cluster.reduce((sum, p) => sum + p.l, 0) / cluster.length;
        const avgA = cluster.reduce((sum, p) => sum + p.a, 0) / cluster.length;
        const avgBLab = cluster.reduce((sum, p) => sum + p.bLab, 0) / cluster.length;

        const rgb = this.labToRgb(avgL, avgA, avgBLab);
        return {
          r: rgb.r, g: rgb.g, b: rgb.b,
          l: avgL, a: avgA, bLab: avgBLab,
          count: cluster.length,
          hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
        };
      });

      // Check convergence
      const hasConverged = newCentroids.every((centroid, i) => 
        this.calculateLabDistance(centroid, centroids[i]) < 1
      );

      if (hasConverged) break;
      
      centroids = newCentroids;
      iterations++;
    }

    return centroids.sort((a, b) => b.count - a.count);
  }

  /**
   * Filter colors by minimum perceptual distance
   */
  private filterColorsByDistance(colors: ColorPoint[], minDistance: number): ColorPoint[] {
    const filtered: ColorPoint[] = [];
    
    for (const color of colors) {
      const isDistantEnough = filtered.every(existing => 
        this.calculateLabDistance(color, existing) >= minDistance
      );
      
      if (isDistantEnough) {
        filtered.push(color);
      }
    }

    return filtered;
  }

  /**
   * Extract skin tones from color data
   */
  private extractSkinTones(pixels: ColorPoint[]): ColorPoint[] {
    const skinTones: ColorPoint[] = [];
    
    for (const pixel of pixels) {
      for (const range of this.skinToneRanges) {
        if (this.isInSkinToneRange(pixel, range)) {
          skinTones.push(pixel);
          break;
        }
      }
    }

    // Group similar skin tones
    return this.groupSimilarColors(skinTones, 10);
  }

  /**
   * Merge extracted colors with skin tones
   */
  private mergeColorsWithSkinTones(colors: ColorPoint[], skinTones: ColorPoint[]): ColorPoint[] {
    const merged = [...colors];
    
    // Add up to 2 skin tones if they're significantly different
    for (const skinTone of skinTones.slice(0, 2)) {
      const isDistantEnough = merged.every(color => 
        this.calculateLabDistance(skinTone, color) >= 15
      );
      
      if (isDistantEnough) {
        merged.push(skinTone);
      }
    }

    return merged;
  }

  /**
   * Generate complementary colors if needed
   */
  private generateComplementaryColors(colors: ColorPoint[]): ColorPoint[] {
    const complementary: ColorPoint[] = [...colors];
    
    for (const color of colors) {
      const lab = { l: color.l, a: color.a, b: color.b };
      const complementaryLab = { l: lab.l, a: -lab.a, b: -lab.b };
      const rgb = this.labToRgb(complementaryLab.l, complementaryLab.a, complementaryLab.b);
      
      complementary.push({
        r: rgb.r, g: rgb.g, b: rgb.b,
        l: complementaryLab.l, a: complementaryLab.a, bLab: complementaryLab.b,
        count: 1,
        hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
      });
    }

    return complementary;
  }

  /**
   * Calculate perceptual distance in CIELAB color space
   */
  private calculateLabDistance(color1: ColorPoint, color2: ColorPoint): number {
    const deltaL = color1.l - color2.l;
    const deltaA = color1.a - color2.a;
    const deltaB = color1.bLab - color2.bLab;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  /**
   * Convert RGB to CIELAB color space
   */
  private rgbToLab(r: number, g: number, blue: number): { l: number; a: number; b: number } {
    // Convert RGB to XYZ
    const xyz = this.rgbToXyz(r, g, blue);

    // Convert XYZ to CIELAB
    const xn = 0.95047, yn = 1.00000, zn = 1.08883; // D65 illuminant

    const xr = this.xyzToLab(xyz.x / xn);
    const yr = this.xyzToLab(xyz.y / yn);
    const zr = this.xyzToLab(xyz.z / zn);

    const l = 116 * yr - 16;
    const a = 500 * (xr - yr);
    const b = 200 * (yr - zr);

    return { l, a, b };
  }

  /**
   * Convert CIELAB to RGB
   */
  private labToRgb(l: number, a: number, bLab: number): { r: number; g: number; b: number } {
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;

    const yr = (l + 16) / 116;
    const xr = a / 500 + yr;
    const zr = yr - bLab / 200;

    const x = xn * this.labToXyz(xr);
    const y = yn * this.labToXyz(yr);
    const z = zn * this.labToXyz(zr);

    return this.xyzToRgb(x, y, z);
  }

  /**
   * Convert RGB to XYZ
   */
  private rgbToXyz(r: number, g: number, blue: number): { x: number; y: number; z: number } {
    r = r / 255;
    g = g / 255;
    blue = blue / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    blue = blue > 0.04045 ? Math.pow((blue + 0.055) / 1.055, 2.4) : blue / 12.92;

    const x = r * 0.4124 + g * 0.3576 + blue * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + blue * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + blue * 0.9505;

    return { x, y, z };
  }

  /**
   * Convert XYZ to RGB
   */
  private xyzToRgb(x: number, y: number, z: number): { r: number; g: number; b: number } {
    const rCalc = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const gCalc = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const bCalc = x * 0.0557 + y * -0.2040 + z * 1.0570;

    const rNorm = Math.max(0, Math.min(1, rCalc));
    const gNorm = Math.max(0, Math.min(1, gCalc));
    const bNorm = Math.max(0, Math.min(1, bCalc));

    const rFinal = rNorm > 0.0031308 ? 1.055 * Math.pow(rNorm, 1/2.4) - 0.055 : 12.92 * rNorm;
    const gFinal = gNorm > 0.0031308 ? 1.055 * Math.pow(gNorm, 1/2.4) - 0.055 : 12.92 * gNorm;
    const bFinal = bNorm > 0.0031308 ? 1.055 * Math.pow(bNorm, 1/2.4) - 0.055 : 12.92 * bNorm;

    return {
      r: Math.round(rFinal * 255),
      g: Math.round(gFinal * 255),
      b: Math.round(bFinal * 255)
    };
  }

  /**
   * Helper functions for CIELAB conversion
   */
  private xyzToLab(t: number): number {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);
  }

  private labToXyz(t: number): number {
    return t > 0.206893 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;
  }

  /**
   * Initialize centroids for k-means clustering
   */
  private initializeCentroids(pixels: ColorPoint[], k: number): ColorPoint[] {
    const centroids: ColorPoint[] = [];
    
    // Use k-means++ initialization
    if (pixels.length === 0) return centroids;
    
    // First centroid
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    
    // Subsequent centroids
    for (let i = 1; i < k; i++) {
      const distances = pixels.map(pixel => {
        const minDistance = Math.min(...centroids.map(centroid => 
          this.calculateLabDistance(pixel, centroid)
        ));
        return { pixel, distance: minDistance };
      });
      
      const totalDistance = distances.reduce((sum, d) => sum + d.distance, 0);
      let random = Math.random() * totalDistance;
      
      for (const { pixel, distance } of distances) {
        random -= distance;
        if (random <= 0) {
          centroids.push(pixel);
          break;
        }
      }
    }
    
    return centroids;
  }

  /**
   * Group similar colors together
   */
  private groupSimilarColors(colors: ColorPoint[], maxDistance: number): ColorPoint[] {
    const groups: ColorPoint[][] = [];
    
    for (const color of colors) {
      let addedToGroup = false;
      
      for (const group of groups) {
        const avgDistance = group.reduce((sum, groupColor) => 
          sum + this.calculateLabDistance(color, groupColor), 0
        ) / group.length;
        
        if (avgDistance <= maxDistance) {
          group.push(color);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([color]);
      }
    }
    
    return groups.map(group => {
      const avgL = group.reduce((sum, c) => sum + c.l, 0) / group.length;
      const avgA = group.reduce((sum, c) => sum + c.a, 0) / group.length;
      const avgBLab = group.reduce((sum, c) => sum + c.bLab, 0) / group.length;

      const rgb = this.labToRgb(avgL, avgA, avgBLab);
      return {
        r: rgb.r, g: rgb.g, b: rgb.b,
        l: avgL, a: avgA, bLab: avgBLab,
        count: group.length,
        hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
      };
    });
  }

  /**
   * Check if color is in skin tone range
   */
  private isInSkinToneRange(pixel: ColorPoint, range: SkinToneRange): boolean {
    return pixel.l >= range.labRange.l[0] && pixel.l <= range.labRange.l[1] &&
           pixel.a >= range.labRange.a[0] && pixel.a <= range.labRange.a[1] &&
           pixel.b >= range.labRange.b[0] && pixel.b <= range.labRange.b[1];
  }

  /**
   * Validate color quality
   */
  private isValidColor(r: number, g: number, b: number): boolean {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 15 && brightness < 240; // Avoid very dark/light colors
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, blue: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Analyze color harmony
   */
  private analyzeColorHarmony(colors: string[]): string {
    if (colors.length < 2) return "single-color";
    
    const labColors = colors.map(hex => {
      const rgb = this.hexToRgb(hex);
      return this.rgbToLab(rgb.r, rgb.g, rgb.b);
    });
    
    // Check for monochromatic
    const avgL = labColors.reduce((sum, c) => sum + c.l, 0) / labColors.length;
    const lVariance = labColors.reduce((sum, c) => sum + Math.pow(c.l - avgL, 2), 0) / labColors.length;
    
    if (lVariance < 10) return "monochromatic";
    
    // Check for complementary
    const hasComplementary = labColors.some((c1, i) => 
      labColors.some((c2, j) => i !== j && 
        Math.abs(c1.a + c2.a) < 5 && Math.abs(c1.b + c2.b) < 5
      )
    );
    
    if (hasComplementary) return "complementary";
    
    // Check for analogous
    const hueAngles = labColors.map(c => Math.atan2(c.b, c.a));
    const hueVariance = Math.max(...hueAngles) - Math.min(...hueAngles);
    
    if (hueVariance < Math.PI / 3) return "analogous";
    
    return "mixed";
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(colors: string[]): number {
    let score = 0.8; // Base score
    
    // Check for sufficient contrast
    const contrastScores = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const contrast = this.calculateContrast(colors[i], colors[j]);
        contrastScores.push(contrast);
      }
    }
    
    const avgContrast = contrastScores.reduce((sum, c) => sum + c, 0) / contrastScores.length;
    if (avgContrast > 4.5) score += 0.1;
    if (avgContrast > 7.0) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const luminance1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const luminance2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance
   */
  private calculateLuminance(r: number, g: number, b: number): number {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rL = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gL = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bL = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  }

  /**
   * Analyze color temperature
   */
  private analyzeColorTemperature(colors: string[]): "warm" | "cool" | "neutral" {
    const labColors = colors.map(hex => {
      const rgb = this.hexToRgb(hex);
      return this.rgbToLab(rgb.r, rgb.g, rgb.b);
    });
    
    const avgA = labColors.reduce((sum, c) => sum + c.a, 0) / labColors.length;
    const avgB = labColors.reduce((sum, c) => sum + c.b, 0) / labColors.length;
    
    if (avgA > 5 && avgB > 5) return "warm";
    if (avgA < -5 && avgB < -5) return "cool";
    return "neutral";
  }

  /**
   * Analyze seasonal colors
   */
  private analyzeSeasonalColors(colors: string[]): "spring" | "summer" | "autumn" | "winter" | "neutral" {
    const labColors = colors.map(hex => {
      const rgb = this.hexToRgb(hex);
      return this.rgbToLab(rgb.r, rgb.g, rgb.b);
    });
    
    const avgL = labColors.reduce((sum, c) => sum + c.l, 0) / labColors.length;
    const avgA = labColors.reduce((sum, c) => sum + c.a, 0) / labColors.length;
    const avgB = labColors.reduce((sum, c) => sum + c.b, 0) / labColors.length;
    
    // Spring: high lightness, warm undertones
    if (avgL > 70 && avgA > 0 && avgB > 0) return "spring";
    
    // Summer: medium lightness, cool undertones
    if (avgL > 50 && avgL <= 70 && avgA < 0) return "summer";
    
    // Autumn: medium-low lightness, warm undertones
    if (avgL <= 50 && avgA > 0 && avgB > 0) return "autumn";
    
    // Winter: high contrast, cool undertones
    if (avgL < 30 || avgL > 80) return "winter";
    
    return "neutral";
  }

  /**
   * Enhanced skin tone detection using facial feature analysis
   */
  private detectEnhancedSkinTones(colors: string[], enhancedFeatures?: EnhancedFacialFeatureColors): string[] {
    const skinTones: string[] = [];

    // If we have enhanced facial analysis, use that as primary source
    if (enhancedFeatures?.detectedFeatures) {
      skinTones.push(enhancedFeatures.skinTone.color);

      // Also add similar tones from the general palette
      const targetRgb = this.hexToRgb(enhancedFeatures.skinTone.color);
      const targetLab = this.rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

      for (const color of colors) {
        const rgb = this.hexToRgb(color);
        const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);
        const distance = this.calculateLabDistance(
          { l: targetLab.l, a: targetLab.a, b: targetLab.b },
          { l: lab.l, a: lab.a, b: lab.b }
        );

        // Include colors that are similar to the detected skin tone
        if (distance < 25 && !skinTones.includes(color)) {
          skinTones.push(color);
        }
      }
    } else {
      // Fallback to traditional detection
      for (const color of colors) {
        const rgb = this.hexToRgb(color);
        const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);

        for (const range of this.skinToneRanges) {
          if (this.isInSkinToneRange({ r: rgb.r, g: rgb.g, b: rgb.b, l: lab.l, a: lab.a, bLab: lab.b, count: 1, hex: color }, range)) {
            skinTones.push(color);
            break;
          }
        }
      }
    }

    return skinTones;
  }

  /**
   * Detect skin tones in color palette (legacy method)
   */
  private detectSkinTones(colors: string[]): string[] {
    return this.detectEnhancedSkinTones(colors);
  }

  /**
   * Calculate advanced confidence score
   */
  private calculateAdvancedConfidence(
    colors: string[],
    faceDetected: boolean,
    imageWidth: number,
    imageHeight: number,
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Face detection bonus
    if (faceDetected) confidence += 0.2;
    
    // Color count bonus
    if (colors.length >= 6) confidence += 0.15;
    else if (colors.length >= 4) confidence += 0.1;
    
    // Image quality bonus
    const imageArea = imageWidth * imageHeight;
    if (imageArea > 500000) confidence += 0.1; // High resolution
    else if (imageArea > 100000) confidence += 0.05; // Medium resolution
    
    // Color diversity bonus
    const labColors = colors.map(hex => {
      const rgb = this.hexToRgb(hex);
      return this.rgbToLab(rgb.r, rgb.g, rgb.b);
    });
    
    const lVariance = this.calculateVariance(labColors.map(c => c.l));
    const aVariance = this.calculateVariance(labColors.map(c => c.a));
    const bVariance = this.calculateVariance(labColors.map(c => c.b));
    
    if (lVariance > 20 && aVariance > 10 && bVariance > 10) confidence += 0.1;
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Get fallback colors
   */
  private getFallbackColors(): string[] {
    return ["#8B7355", "#D4A574", "#F5E6D3", "#A0522D", "#CD853F", "#DEB887"];
  }

  /**
   * Get fallback palette
   */
  private getFallbackPalette(): ExtractedPalette {
    return {
      colors: this.getFallbackColors(),
      confidence: 0.3,
      source: "fallback",
      metadata: {
        faceDetected: false,
        colorCount: 6,
        dominantColor: "#8B7355",
        skinTones: ["#E4B48C", "#D4A574"],
        colorHarmony: "neutral",
        accessibilityScore: 0.7,
        colorTemperature: "warm",
        colorSeason: "autumn",
      },
    };
  }

  /**
   * Validate extracted colors for quality
   */
  validateColors(colors: string[]): boolean {
    if (!colors || colors.length === 0) return false;

    // Check if all colors are valid hex codes
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return colors.every((color) => hexRegex.test(color));
  }

  /**
   * Get color statistics for debugging
   */
  getColorStats(colors: string[]): {
    avgBrightness: number;
    avgSaturation: number;
    colorDiversity: number;
  } {
    if (colors.length === 0) {
      return { avgBrightness: 0, avgSaturation: 0, colorDiversity: 0 };
    }

    const stats = colors.map((hex) => {
      const rgb = this.hexToRgb(hex);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      return { ...rgb, ...hsl };
    });

    const avgBrightness =
      stats.reduce((sum, color) => sum + color.l, 0) / stats.length;
    const avgSaturation =
      stats.reduce((sum, color) => sum + color.s, 0) / stats.length;

    // Calculate color diversity (variance in hue)
    const hues = stats.map((color) => color.h);
    const avgHue = hues.reduce((sum, hue) => sum + hue, 0) / hues.length;
    const hueVariance =
      hues.reduce((sum, hue) => sum + Math.pow(hue - avgHue, 2), 0) /
      hues.length;
    const colorDiversity = Math.sqrt(hueVariance) / 360; // Normalize to 0-1

    return {
      avgBrightness: Math.round(avgBrightness),
      avgSaturation: Math.round(avgSaturation * 100),
      colorDiversity: Math.round(colorDiversity * 100) / 100,
    };
  }

  /**
   * Utility: Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Utility: Convert RGB to HSL
   */
  private rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100) / 100,
      l: Math.round(l * 100) / 100,
    };
  }
}

// Export singleton instance
export const colorExtractionService = new ColorExtractionService();

// Initialize face detection models on module load
if (typeof window !== "undefined") {
  colorExtractionService.initializeFaceAPI().catch((error) => {
    console.warn("Face detection initialization failed:", error);
  });
}
