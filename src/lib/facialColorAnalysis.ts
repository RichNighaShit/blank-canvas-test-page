/**
 * Facial Color Analysis Service
 * 
 * This service analyzes facial features (skin tone, hair color, eye color) 
 * and generates personalized color recommendations based on color theory.
 * Designed for high accuracy with a 1M+ user database.
 */

import * as faceapi from "face-api.js";

export interface FacialColorProfile {
  skinTone: SkinToneAnalysis;
  hairColor: HairColorAnalysis;
  eyeColor: EyeColorAnalysis;
  colorSeason: ColorSeason;
  flatteringColors: string[];
  confidence: number;
  metadata: {
    analysisTimestamp: string;
    imageQuality: number;
    faceDetectionAccuracy: number;
  };
}

export interface SkinToneAnalysis {
  dominantTone: string;
  undertone: "warm" | "cool" | "neutral";
  lightness: "very-light" | "light" | "medium" | "dark" | "very-dark";
  hexColors: string[];
  confidence: number;
}

export interface HairColorAnalysis {
  dominantColor: string;
  secondaryColors: string[];
  depth: "very-light" | "light" | "medium" | "dark" | "very-dark";
  tone: "ash" | "golden" | "red" | "neutral";
  hexColors: string[];
  confidence: number;
}

export interface EyeColorAnalysis {
  dominantColor: string;
  secondaryColors: string[];
  pattern: "solid" | "central-heterochromia" | "sectoral" | "mixed";
  hexColors: string[];
  confidence: number;
}

export interface ColorSeason {
  season: "spring" | "summer" | "autumn" | "winter";
  subSeason: string;
  confidence: number;
  characteristics: string[];
}

class FacialColorAnalysisService {
  private faceApiInitialized = false;
  private readonly modelBasePath = "/models";

  // Enhanced skin tone classification with CIELAB ranges
  private readonly skinToneClassification = {
    "very-light": {
      range: { l: [85, 100], a: [0, 15], b: [10, 25] },
      undertones: {
        warm: { a: [5, 15], b: [15, 25] },
        cool: { a: [0, 8], b: [5, 15] },
        neutral: { a: [3, 10], b: [10, 20] }
      }
    },
    "light": {
      range: { l: [70, 85], a: [5, 20], b: [15, 30] },
      undertones: {
        warm: { a: [10, 20], b: [20, 30] },
        cool: { a: [0, 12], b: [10, 20] },
        neutral: { a: [5, 15], b: [15, 25] }
      }
    },
    "medium": {
      range: { l: [55, 70], a: [10, 25], b: [20, 35] },
      undertones: {
        warm: { a: [15, 25], b: [25, 35] },
        cool: { a: [5, 15], b: [15, 25] },
        neutral: { a: [10, 20], b: [20, 30] }
      }
    },
    "dark": {
      range: { l: [40, 55], a: [15, 30], b: [25, 40] },
      undertones: {
        warm: { a: [20, 30], b: [30, 40] },
        cool: { a: [10, 20], b: [20, 30] },
        neutral: { a: [15, 25], b: [25, 35] }
      }
    },
    "very-dark": {
      range: { l: [20, 40], a: [20, 35], b: [30, 45] },
      undertones: {
        warm: { a: [25, 35], b: [35, 45] },
        cool: { a: [15, 25], b: [25, 35] },
        neutral: { a: [20, 30], b: [30, 40] }
      }
    }
  };

  // Color season determination based on facial features
  private readonly colorSeasons = {
    spring: {
      characteristics: ["warm undertone", "light-medium depth", "clear", "bright"],
      skinTones: ["very-light", "light", "medium"],
      undertones: ["warm"],
      colors: [
        "#FFE4B5", "#FFDAB9", "#F0E68C", "#98FB98", "#87CEEB", 
        "#FFB6C1", "#DDA0DD", "#F5DEB3", "#FFF8DC", "#E0FFFF"
      ]
    },
    summer: {
      characteristics: ["cool undertone", "light-medium depth", "soft", "muted"],
      skinTones: ["very-light", "light", "medium"],
      undertones: ["cool"],
      colors: [
        "#E6E6FA", "#D8BFD8", "#B0E0E6", "#F0F8FF", "#FFF0F5",
        "#E0E6E6", "#C1CDC1", "#B2DFDB", "#F5F5DC", "#FAEBD7"
      ]
    },
    autumn: {
      characteristics: ["warm undertone", "medium-deep depth", "rich", "earthy"],
      skinTones: ["light", "medium", "dark"],
      undertones: ["warm"],
      colors: [
        "#D2691E", "#CD853F", "#A0522D", "#8B4513", "#B8860B",
        "#DAA520", "#FF8C00", "#DC143C", "#8B0000", "#556B2F"
      ]
    },
    winter: {
      characteristics: ["cool undertone", "any depth", "clear", "intense"],
      skinTones: ["very-light", "light", "medium", "dark", "very-dark"],
      undertones: ["cool"],
      colors: [
        "#000080", "#4B0082", "#800080", "#8B008B", "#FF1493",
        "#DC143C", "#B22222", "#000000", "#2F4F4F", "#191970"
      ]
    }
  };

  /**
   * Initialize face-api.js models for enhanced detection
   */
  async initializeFaceAPI(): Promise<void> {
    if (this.faceApiInitialized) return;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelBasePath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBasePath),
        faceapi.nets.faceExpressionNet.loadFromUri(this.modelBasePath),
      ]);

      this.faceApiInitialized = true;
      console.log("Enhanced Face-API models loaded successfully");
    } catch (error) {
      console.warn("Failed to load Face-API models:", error);
    }
  }

  /**
   * Analyze facial colors and generate personalized recommendations
   */
  async analyzeFacialColors(imageInput: string | File | Blob): Promise<FacialColorProfile> {
    const startTime = Date.now();
    
    try {
      const img = await this.loadImage(imageInput);
      
      // Enhanced face detection with landmarks
      const faceDetection = await this.detectFaceWithLandmarks(img);
      if (!faceDetection) {
        throw new Error("No face detected in image");
      }

      // Extract facial regions
      const facialRegions = await this.extractFacialRegions(img, faceDetection);
      
      // Analyze each facial feature
      const skinTone = await this.analyzeSkinTone(facialRegions.skin);
      const hairColor = await this.analyzeHairColor(facialRegions.hair);
      const eyeColor = await this.analyzeEyeColor(facialRegions.eyes);

      // Determine color season
      const colorSeason = this.determineColorSeason(skinTone, hairColor, eyeColor);

      // Generate flattering color recommendations
      const flatteringColors = this.generateFlatteringColors(skinTone, hairColor, eyeColor, colorSeason);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(skinTone, hairColor, eyeColor, faceDetection);

      const analysisTime = Date.now() - startTime;
      console.log(`✅ Facial color analysis completed in ${analysisTime}ms`);

      return {
        skinTone,
        hairColor,
        eyeColor,
        colorSeason,
        flatteringColors,
        confidence,
        metadata: {
          analysisTimestamp: new Date().toISOString(),
          imageQuality: this.assessImageQuality(img),
          faceDetectionAccuracy: faceDetection.detection.score
        }
      };

    } catch (error) {
      console.error("Facial color analysis failed:", error);
      throw error;
    }
  }

  /**
   * Load image from various input types
   */
  private async loadImage(input: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

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
   * Enhanced face detection with landmarks
   */
  private async detectFaceWithLandmarks(img: HTMLImageElement) {
    if (!this.faceApiInitialized) {
      await this.initializeFaceAPI();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks();

      return detection;
    } catch (error) {
      console.warn("Face detection error:", error);
      return null;
    }
  }

  /**
   * Extract specific facial regions for color analysis
   */
  private async extractFacialRegions(img: HTMLImageElement, faceDetection: any) {
    const landmarks = faceDetection.landmarks;
    const box = faceDetection.detection.box;

    // Get skin region (cheek area)
    const skinRegion = this.extractSkinRegion(img, landmarks, box);
    
    // Get hair region (forehead area expanded upward)
    const hairRegion = this.extractHairRegion(img, landmarks, box);
    
    // Get eye regions
    const eyeRegions = this.extractEyeRegions(img, landmarks);

    return {
      skin: skinRegion,
      hair: hairRegion,
      eyes: eyeRegions
    };
  }

  /**
   * Extract skin region from cheek area
   */
  private extractSkinRegion(img: HTMLImageElement, landmarks: any, box: any): ImageData {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    // Focus on cheek area for clean skin tone
    const cheekWidth = box.width * 0.3;
    const cheekHeight = box.height * 0.2;
    const leftCheekX = box.x + box.width * 0.15;
    const rightCheekX = box.x + box.width * 0.55;
    const cheekY = box.y + box.height * 0.4;

    canvas.width = cheekWidth * 2;
    canvas.height = cheekHeight;
    
    ctx.drawImage(img, 0, 0);
    
    // Extract left and right cheek areas
    const leftCheek = ctx.getImageData(leftCheekX, cheekY, cheekWidth, cheekHeight);
    const rightCheek = ctx.getImageData(rightCheekX, cheekY, cheekWidth, cheekHeight);
    
    // Combine both cheek areas
    const combinedData = new Uint8ClampedArray(leftCheek.data.length + rightCheek.data.length);
    combinedData.set(leftCheek.data, 0);
    combinedData.set(rightCheek.data, leftCheek.data.length);
    
    return new ImageData(combinedData, cheekWidth * 2, cheekHeight);
  }

  /**
   * Extract hair region from forehead area
   */
  private extractHairRegion(img: HTMLImageElement, landmarks: any, box: any): ImageData {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    // Hair region above forehead
    const hairX = box.x;
    const hairY = Math.max(0, box.y - box.height * 0.3);
    const hairWidth = box.width;
    const hairHeight = box.height * 0.4;

    canvas.width = hairWidth;
    canvas.height = hairHeight;
    
    ctx.drawImage(img, 0, 0);
    
    return ctx.getImageData(hairX, hairY, hairWidth, hairHeight);
  }

  /**
   * Extract eye regions for color analysis
   */
  private extractEyeRegions(img: HTMLImageElement, landmarks: any): ImageData[] {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    ctx.drawImage(img, 0, 0);
    
    const eyeRegions = [];
    
    // Left eye region
    const leftEye = landmarks.getLeftEye();
    const leftEyeBounds = this.getEyeBounds(leftEye);
    eyeRegions.push(ctx.getImageData(leftEyeBounds.x, leftEyeBounds.y, leftEyeBounds.width, leftEyeBounds.height));
    
    // Right eye region
    const rightEye = landmarks.getRightEye();
    const rightEyeBounds = this.getEyeBounds(rightEye);
    eyeRegions.push(ctx.getImageData(rightEyeBounds.x, rightEyeBounds.y, rightEyeBounds.width, rightEyeBounds.height));
    
    return eyeRegions;
  }

  /**
   * Get bounding box for eye region
   */
  private getEyeBounds(eyePoints: any[]) {
    const x = Math.min(...eyePoints.map((p: any) => p.x));
    const y = Math.min(...eyePoints.map((p: any) => p.y));
    const maxX = Math.max(...eyePoints.map((p: any) => p.x));
    const maxY = Math.max(...eyePoints.map((p: any) => p.y));
    
    return {
      x: x - 5,
      y: y - 5,
      width: maxX - x + 10,
      height: maxY - y + 10
    };
  }

  /**
   * Analyze skin tone with enhanced accuracy
   */
  private async analyzeSkinTone(skinRegionData: ImageData): Promise<SkinToneAnalysis> {
    const pixels = this.extractValidSkinPixels(skinRegionData);
    const labColors = pixels.map(pixel => this.rgbToLab(pixel.r, pixel.g, pixel.b));
    
    // Cluster skin tones
    const dominantTones = this.clusterColors(labColors, 3);
    const primaryTone = dominantTones[0];
    
    // Classify skin lightness
    const lightness = this.classifySkinLightness(primaryTone.l);
    
    // Determine undertone
    const undertone = this.determineUndertone(primaryTone);
    
    // Convert to hex
    const hexColors = dominantTones.map(tone => {
      const rgb = this.labToRgb(tone.l, tone.a, tone.b);
      return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    return {
      dominantTone: hexColors[0],
      undertone,
      lightness,
      hexColors,
      confidence: this.calculateSkinToneConfidence(labColors, dominantTones)
    };
  }

  /**
   * Analyze hair color with depth and tone detection
   */
  private async analyzeHairColor(hairRegionData: ImageData): Promise<HairColorAnalysis> {
    const pixels = this.extractValidHairPixels(hairRegionData);
    const labColors = pixels.map(pixel => this.rgbToLab(pixel.r, pixel.g, pixel.b));
    
    // Cluster hair colors
    const dominantColors = this.clusterColors(labColors, 3);
    
    // Classify depth (lightness level)
    const depth = this.classifyHairDepth(dominantColors[0].l);
    
    // Determine tone (ash, golden, red, neutral)
    const tone = this.determineHairTone(dominantColors[0]);
    
    // Convert to hex
    const hexColors = dominantColors.map(color => {
      const rgb = this.labToRgb(color.l, color.a, color.b);
      return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    return {
      dominantColor: hexColors[0],
      secondaryColors: hexColors.slice(1),
      depth,
      tone,
      hexColors,
      confidence: this.calculateHairColorConfidence(labColors, dominantColors)
    };
  }

  /**
   * Analyze eye color with pattern detection
   */
  private async analyzeEyeColor(eyeRegionsData: ImageData[]): Promise<EyeColorAnalysis> {
    const allPixels: any[] = [];
    
    eyeRegionsData.forEach(eyeData => {
      const pixels = this.extractValidEyePixels(eyeData);
      allPixels.push(...pixels);
    });
    
    const labColors = allPixels.map(pixel => this.rgbToLab(pixel.r, pixel.g, pixel.b));
    
    // Cluster eye colors
    const dominantColors = this.clusterColors(labColors, 3);
    
    // Detect pattern (solid, heterochromia, etc.)
    const pattern = this.detectEyePattern(dominantColors);
    
    // Convert to hex
    const hexColors = dominantColors.map(color => {
      const rgb = this.labToRgb(color.l, color.a, color.b);
      return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    return {
      dominantColor: hexColors[0],
      secondaryColors: hexColors.slice(1),
      pattern,
      hexColors,
      confidence: this.calculateEyeColorConfidence(labColors, dominantColors)
    };
  }

  /**
   * Determine color season based on facial features
   */
  private determineColorSeason(
    skinTone: SkinToneAnalysis, 
    hairColor: HairColorAnalysis, 
    eyeColor: EyeColorAnalysis
  ): ColorSeason {
    let seasonScores = {
      spring: 0,
      summer: 0,
      autumn: 0,
      winter: 0
    };

    // Score based on undertone
    if (skinTone.undertone === "warm") {
      seasonScores.spring += 2;
      seasonScores.autumn += 2;
    } else if (skinTone.undertone === "cool") {
      seasonScores.summer += 2;
      seasonScores.winter += 2;
    } else {
      seasonScores.summer += 1;
      seasonScores.winter += 1;
    }

    // Score based on depth
    if (skinTone.lightness === "very-light" || skinTone.lightness === "light") {
      seasonScores.spring += 1;
      seasonScores.summer += 1;
    } else {
      seasonScores.autumn += 1;
      seasonScores.winter += 1;
    }

    // Score based on hair depth
    if (hairColor.depth === "very-light" || hairColor.depth === "light") {
      seasonScores.spring += 1;
      seasonScores.summer += 1;
    } else {
      seasonScores.autumn += 1;
      seasonScores.winter += 1;
    }

    // Determine winning season
    const maxScore = Math.max(...Object.values(seasonScores));
    const season = Object.keys(seasonScores).find(
      s => seasonScores[s as keyof typeof seasonScores] === maxScore
    ) as "spring" | "summer" | "autumn" | "winter";

    return {
      season,
      subSeason: this.determineSubSeason(season, skinTone, hairColor, eyeColor),
      confidence: maxScore / 6, // Normalize to 0-1
      characteristics: this.colorSeasons[season].characteristics
    };
  }

  /**
   * Generate flattering colors based on analysis
   */
  private generateFlatteringColors(
    skinTone: SkinToneAnalysis,
    hairColor: HairColorAnalysis,
    eyeColor: EyeColorAnalysis,
    colorSeason: ColorSeason
  ): string[] {
    const baseColors = this.colorSeasons[colorSeason.season].colors;
    
    // Enhance colors based on individual features
    const enhancedColors = this.enhanceColorsForIndividual(
      baseColors,
      skinTone,
      hairColor,
      eyeColor
    );

    // Sort by flattering score
    const scoredColors = enhancedColors.map(color => ({
      color,
      score: this.calculateFlatteringScore(color, skinTone, hairColor, eyeColor)
    }));

    scoredColors.sort((a, b) => b.score - a.score);
    
    return scoredColors.slice(0, 12).map(c => c.color);
  }

  /**
   * Helper methods for color analysis
   */
  private extractValidSkinPixels(imageData: ImageData): Array<{r: number, g: number, b: number}> {
    const pixels = [];
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Filter out non-skin pixels (too dark, too light, or non-skin colors)
      if (this.isSkinPixel(r, g, b)) {
        pixels.push({ r, g, b });
      }
    }
    
    return pixels;
  }

  private extractValidHairPixels(imageData: ImageData): Array<{r: number, g: number, b: number}> {
    const pixels = [];
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Filter valid hair pixels
      if (this.isHairPixel(r, g, b)) {
        pixels.push({ r, g, b });
      }
    }
    
    return pixels;
  }

  private extractValidEyePixels(imageData: ImageData): Array<{r: number, g: number, b: number}> {
    const pixels = [];
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Filter valid eye pixels (exclude whites, eyelashes, etc.)
      if (this.isEyePixel(r, g, b)) {
        pixels.push({ r, g, b });
      }
    }
    
    return pixels;
  }

  private isSkinPixel(r: number, g: number, b: number): boolean {
    // Enhanced skin detection algorithm
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Basic skin color range
    if (brightness < 30 || brightness > 240) return false;
    
    // Skin color ratios
    const rg = r - g;
    const rb = r - b;
    const gb = g - b;
    
    // Typical skin color characteristics
    return (r > 95 && g > 40 && b > 20) &&
           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
           (Math.abs(rg) > 15) && (r > g) && (r > b);
  }

  private isHairPixel(r: number, g: number, b: number): boolean {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Hair pixels are typically not extremely bright
    if (brightness > 200) return false;
    
    // Basic hair color validation
    return true;
  }

  private isEyePixel(r: number, g: number, b: number): boolean {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Exclude very bright (whites) and very dark (lashes) pixels
    return brightness > 20 && brightness < 200;
  }

  private clusterColors(labColors: Array<{l: number, a: number, b: number}>, k: number): Array<{l: number, a: number, b: number, count: number}> {
    if (labColors.length === 0) return [];
    
    // Simple k-means clustering
    let centroids = this.initializeCentroids(labColors, k);
    
    for (let iteration = 0; iteration < 20; iteration++) {
      const clusters: Array<Array<{l: number, a: number, b: number}>> = Array.from({ length: k }, () => []);
      
      // Assign points to nearest centroid
      labColors.forEach(color => {
        let minDistance = Infinity;
        let nearestCentroid = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = this.calculateLabDistance(color, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = index;
          }
        });
        
        clusters[nearestCentroid].push(color);
      });
      
      // Update centroids
      const newCentroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0];
        
        const avgL = cluster.reduce((sum, c) => sum + c.l, 0) / cluster.length;
        const avgA = cluster.reduce((sum, c) => sum + c.a, 0) / cluster.length;
        const avgB = cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length;
        
        return { l: avgL, a: avgA, b: avgB, count: cluster.length };
      });
      
      centroids = newCentroids;
    }
    
    return centroids.sort((a, b) => b.count - a.count);
  }

  private initializeCentroids(colors: Array<{l: number, a: number, b: number}>, k: number) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push({
        ...colors[Math.floor(Math.random() * colors.length)],
        count: 0
      });
    }
    return centroids;
  }

  private calculateLabDistance(color1: {l: number, a: number, b: number}, color2: {l: number, a: number, b: number}): number {
    const deltaL = color1.l - color2.l;
    const deltaA = color1.a - color2.a;
    const deltaB = color1.b - color2.b;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  private classifySkinLightness(lightness: number): "very-light" | "light" | "medium" | "dark" | "very-dark" {
    if (lightness >= 85) return "very-light";
    if (lightness >= 70) return "light";
    if (lightness >= 55) return "medium";
    if (lightness >= 40) return "dark";
    return "very-dark";
  }

  private determineUndertone(labColor: {l: number, a: number, b: number}): "warm" | "cool" | "neutral" {
    if (labColor.a > 5 && labColor.b > 15) return "warm";
    if (labColor.a < 5 && labColor.b < 15) return "cool";
    return "neutral";
  }

  private classifyHairDepth(lightness: number): "very-light" | "light" | "medium" | "dark" | "very-dark" {
    if (lightness >= 70) return "very-light";
    if (lightness >= 50) return "light";
    if (lightness >= 30) return "medium";
    if (lightness >= 15) return "dark";
    return "very-dark";
  }

  private determineHairTone(labColor: {l: number, a: number, b: number}): "ash" | "golden" | "red" | "neutral" {
    if (labColor.a > 10 && labColor.b > 20) return "golden";
    if (labColor.a > 15) return "red";
    if (labColor.a < 0) return "ash";
    return "neutral";
  }

  private detectEyePattern(colors: Array<{l: number, a: number, b: number, count: number}>): "solid" | "central-heterochromia" | "sectoral" | "mixed" {
    if (colors.length <= 1) return "solid";
    if (colors.length === 2 && colors[1].count > colors[0].count * 0.3) return "central-heterochromia";
    if (colors.length >= 3) return "mixed";
    return "solid";
  }

  private determineSubSeason(
    season: "spring" | "summer" | "autumn" | "winter",
    skinTone: SkinToneAnalysis,
    hairColor: HairColorAnalysis,
    eyeColor: EyeColorAnalysis
  ): string {
    const subSeasons = {
      spring: ["Bright Spring", "Light Spring", "Warm Spring"],
      summer: ["Light Summer", "Cool Summer", "Soft Summer"],
      autumn: ["Soft Autumn", "Warm Autumn", "Deep Autumn"],
      winter: ["Cool Winter", "Deep Winter", "Bright Winter"]
    };
    
    // Simple sub-season logic (can be enhanced)
    return subSeasons[season][0];
  }

  private enhanceColorsForIndividual(
    baseColors: string[],
    skinTone: SkinToneAnalysis,
    hairColor: HairColorAnalysis,
    eyeColor: EyeColorAnalysis
  ): string[] {
    // Add colors that specifically complement the individual's features
    const enhanced = [...baseColors];
    
    // Add complementary colors to eye color
    const eyeComplement = this.getComplementaryColor(eyeColor.dominantColor);
    if (eyeComplement) enhanced.push(eyeComplement);
    
    // Add analogous colors to hair
    const hairAnalogous = this.getAnalogousColors(hairColor.dominantColor);
    enhanced.push(...hairAnalogous.slice(0, 2));
    
    return enhanced;
  }

  private calculateFlatteringScore(
    color: string,
    skinTone: SkinToneAnalysis,
    hairColor: HairColorAnalysis,
    eyeColor: EyeColorAnalysis
  ): number {
    let score = 0.5; // Base score
    
    const colorLab = this.hexToLab(color);
    const skinLab = this.hexToLab(skinTone.dominantTone);
    
    // Contrast with skin tone
    const contrast = this.calculateLabDistance(colorLab, skinLab);
    if (contrast > 30 && contrast < 80) score += 0.2;
    
    // Complement eye color
    const eyeLab = this.hexToLab(eyeColor.dominantColor);
    const eyeContrast = this.calculateLabDistance(colorLab, eyeLab);
    if (eyeContrast > 40) score += 0.1;
    
    // Temperature harmony
    const colorTemp = this.getColorTemperature(colorLab);
    if ((skinTone.undertone === "warm" && colorTemp === "warm") ||
        (skinTone.undertone === "cool" && colorTemp === "cool")) {
      score += 0.2;
    }
    
    return score;
  }

  private calculateSkinToneConfidence(labColors: any[], dominantTones: any[]): number {
    if (labColors.length < 50) return 0.3;
    if (dominantTones.length === 0) return 0.2;
    
    const primaryCount = dominantTones[0].count;
    const totalCount = labColors.length;
    
    return Math.min(0.95, 0.5 + (primaryCount / totalCount) * 0.5);
  }

  private calculateHairColorConfidence(labColors: any[], dominantColors: any[]): number {
    if (labColors.length < 30) return 0.3;
    if (dominantColors.length === 0) return 0.2;
    
    const primaryCount = dominantColors[0].count;
    const totalCount = labColors.length;
    
    return Math.min(0.9, 0.4 + (primaryCount / totalCount) * 0.5);
  }

  private calculateEyeColorConfidence(labColors: any[], dominantColors: any[]): number {
    if (labColors.length < 20) return 0.3;
    if (dominantColors.length === 0) return 0.2;
    
    return Math.min(0.85, 0.5 + (dominantColors[0].count / labColors.length) * 0.35);
  }

  private calculateOverallConfidence(
    skinTone: SkinToneAnalysis,
    hairColor: HairColorAnalysis,
    eyeColor: EyeColorAnalysis,
    faceDetection: any
  ): number {
    const weights = {
      skin: 0.4,
      hair: 0.3,
      eyes: 0.2,
      face: 0.1
    };
    
    return (
      skinTone.confidence * weights.skin +
      hairColor.confidence * weights.hair +
      eyeColor.confidence * weights.eyes +
      faceDetection.detection.score * weights.face
    );
  }

  private assessImageQuality(img: HTMLImageElement): number {
    const resolution = img.width * img.height;
    const aspectRatio = img.width / img.height;
    
    let quality = 0.5;
    
    // Resolution score
    if (resolution > 500000) quality += 0.3;
    else if (resolution > 100000) quality += 0.2;
    else if (resolution > 50000) quality += 0.1;
    
    // Aspect ratio score (prefer portrait or square)
    if (aspectRatio >= 0.7 && aspectRatio <= 1.3) quality += 0.2;
    
    return Math.min(1.0, quality);
  }

  private getComplementaryColor(hexColor: string): string {
    const lab = this.hexToLab(hexColor);
    const complementLab = { l: lab.l, a: -lab.a, b: -lab.b };
    const rgb = this.labToRgb(complementLab.l, complementLab.a, complementLab.b);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  private getAnalogousColors(hexColor: string): string[] {
    const lab = this.hexToLab(hexColor);
    const analogous = [];
    
    for (let i = 1; i <= 2; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const newA = lab.a * Math.cos(angle) - lab.b * Math.sin(angle);
      const newB = lab.a * Math.sin(angle) + lab.b * Math.cos(angle);
      const rgb = this.labToRgb(lab.l, newA, newB);
      analogous.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    
    return analogous;
  }

  private getColorTemperature(labColor: {l: number, a: number, b: number}): "warm" | "cool" | "neutral" {
    if (labColor.a > 0 && labColor.b > 0) return "warm";
    if (labColor.a < 0 && labColor.b < 0) return "cool";
    return "neutral";
  }

  private hexToLab(hex: string): {l: number, a: number, b: number} {
    const rgb = this.hexToRgb(hex);
    return this.rgbToLab(rgb.r, rgb.g, rgb.b);
  }

  // Color conversion utilities
  private rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    const xyz = this.rgbToXyz(r, g, b);
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;
    
    const xr = this.xyzToLab(xyz.x / xn);
    const yr = this.xyzToLab(xyz.y / yn);
    const zr = this.xyzToLab(xyz.z / zn);
    
    const l = 116 * yr - 16;
    const a = 500 * (xr - yr);
    const bValue = 200 * (yr - zr);
    
    return { l, a, b: bValue };
  }

  private labToRgb(l: number, a: number, b: number): { r: number; g: number; b: number } {
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;
    
    const yr = (l + 16) / 116;
    const xr = a / 500 + yr;
    const zr = yr - b / 200;
    
    const x = xn * this.labToXyz(xr);
    const y = yn * this.labToXyz(yr);
    const z = zn * this.labToXyz(zr);
    
    return this.xyzToRgb(x, y, z);
  }

  private rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    return { x, y, z };
  }

  private xyzToRgb(x: number, y: number, z: number): { r: number; g: number; b: number } {
    const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const b = x * 0.0557 + y * -0.2040 + z * 1.0570;
    
    const rNorm = Math.max(0, Math.min(1, r));
    const gNorm = Math.max(0, Math.min(1, g));
    const bNorm = Math.max(0, Math.min(1, b));
    
    const rFinal = rNorm > 0.0031308 ? 1.055 * Math.pow(rNorm, 1/2.4) - 0.055 : 12.92 * rNorm;
    const gFinal = gNorm > 0.0031308 ? 1.055 * Math.pow(gNorm, 1/2.4) - 0.055 : 12.92 * gNorm;
    const bFinal = bNorm > 0.0031308 ? 1.055 * Math.pow(bNorm, 1/2.4) - 0.055 : 12.92 * bNorm;
    
    return {
      r: Math.round(rFinal * 255),
      g: Math.round(gFinal * 255),
      b: Math.round(bFinal * 255)
    };
  }

  private xyzToLab(t: number): number {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);
  }

  private labToXyz(t: number): number {
    return t > 0.206893 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }
}

// Export singleton instance
export const facialColorAnalysisService = new FacialColorAnalysisService();

// Initialize face detection models on module load
if (typeof window !== "undefined") {
  facialColorAnalysisService.initializeFaceAPI().catch((error) => {
    console.warn("Facial color analysis initialization failed:", error);
  });
}
