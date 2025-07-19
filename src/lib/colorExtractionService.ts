/**
 * Advanced Color Extraction Service
 *
 * This service provides sophisticated color extraction from images using:
 * - Face detection for better color analysis
 * - Smart cropping to focus on face regions
 * - High-quality color extraction with perceptual uniformity
 * - Fallback mechanisms for edge cases
 */

import * as faceapi from "face-api.js";
import { extractColors } from "extract-colors";
import SmartCrop from "smartcrop";

export interface ExtractedPalette {
  colors: string[]; // Hex color codes
  confidence: number; // 0-1 confidence score
  source: "face" | "full-image" | "fallback";
  metadata?: {
    faceDetected: boolean;
    colorCount: number;
    dominantColor: string;
  };
}

export interface ColorExtractionOptions {
  colorCount?: number; // Number of colors to extract (default: 6)
  quality?: number; // Extraction quality 1-10 (default: 5)
  fallbackToFullImage?: boolean; // If no face detected, use full image (default: true)
  minColorDistance?: number; // Minimum perceptual distance between colors (default: 10)
}

class ColorExtractionService {
  private faceApiInitialized = false;
  private readonly modelBasePath = "/models"; // Path to face-api.js models

  /**
   * Initialize face-api.js models
   * This should be called once when the app starts
   */
  async initializeFaceAPI(): Promise<void> {
    if (this.faceApiInitialized) return;

    try {
      // Load only the models we need for face detection
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelBasePath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelBasePath),
      ]);

      this.faceApiInitialized = true;
      console.log("Face-API models loaded successfully");
    } catch (error) {
      console.warn("Failed to load Face-API models:", error);
      // Continue without face detection
    }
  }

  /**
   * Extract color palette from image with face detection
   */
  async extractPalette(
    imageInput: string | File | Blob,
    options: ColorExtractionOptions = {},
  ): Promise<ExtractedPalette> {
    const {
      colorCount = 6,
      quality = 5,
      fallbackToFullImage = true,
      minColorDistance = 10,
    } = options;

    try {
      // Convert input to image element
      const img = await this.loadImage(imageInput);

      // Attempt face detection if Face-API is available
      let croppedImage = img;
      let faceDetected = false;

      if (this.faceApiInitialized) {
        try {
          const faceBox = await this.detectFace(img);
          if (faceBox) {
            croppedImage = await this.cropToFace(img, faceBox);
            faceDetected = true;
          }
        } catch (error) {
          console.warn("Face detection failed, using full image:", error);
        }
      }

      // If no face detected and fallback disabled, try smart crop
      if (!faceDetected && !fallbackToFullImage) {
        try {
          croppedImage = await this.smartCrop(img);
        } catch (error) {
          console.warn("Smart crop failed, using full image:", error);
        }
      }

      // Extract colors from the processed image
      const extractedColors = await this.extractColorsFromImage(croppedImage, {
        colorCount,
        quality,
        minColorDistance,
      });

      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(
        extractedColors,
        faceDetected,
        img.width,
        img.height,
      );

      const result: ExtractedPalette = {
        colors: extractedColors,
        confidence,
        source: faceDetected
          ? "face"
          : fallbackToFullImage
            ? "full-image"
            : "fallback",
        metadata: {
          faceDetected,
          colorCount: extractedColors.length,
          dominantColor: extractedColors[0] || "#000000",
        },
      };

      return result;
    } catch (error) {
      console.error("Color extraction failed:", error);

      // Return fallback palette
      return {
        colors: [
          "#8B4513",
          "#D2691E",
          "#F4A460",
          "#DEB887",
          "#F5DEB3",
          "#FFFFFF",
        ],
        confidence: 0.1,
        source: "fallback",
        metadata: {
          faceDetected: false,
          colorCount: 6,
          dominantColor: "#8B4513",
        },
      };
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
   * Extract colors from image using extract-colors library
   */
  private async extractColorsFromImage(
    img: HTMLImageElement,
    options: {
      colorCount: number;
      quality: number;
      minColorDistance: number;
    },
  ): Promise<string[]> {
    try {
      // Convert image to canvas for processing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Extract colors using extract-colors
      const extractedColors = await extractColors(canvas, {
        pixels: 10000, // Number of pixels to sample
        distance: options.minColorDistance,
        splitPower: 10,
        colorValidator: (
          red: number,
          green: number,
          blue: number,
          alpha = 255,
        ) => {
          // Filter out very dark, very light, or transparent colors
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
          return alpha > 128 && brightness > 20 && brightness < 235;
        },
        saturationDistance: 0.2,
        lightnessDistance: 0.2,
        hueDistance: 0.083333333,
      });

      // Convert to hex and limit count
      const hexColors = extractedColors
        .slice(0, options.colorCount)
        .map((color) => color.hex.toUpperCase());

      // Ensure we have at least some colors
      if (hexColors.length === 0) {
        return ["#8B7355", "#D4A574", "#F5E6D3"]; // Fallback skin tones
      }

      return hexColors;
    } catch (error) {
      console.error("Color extraction error:", error);
      return ["#8B7355", "#D4A574", "#F5E6D3"]; // Fallback colors
    }
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(
    colors: string[],
    faceDetected: boolean,
    imageWidth: number,
    imageHeight: number,
  ): number {
    let confidence = 0.5; // Base confidence

    // Face detection bonus
    if (faceDetected) confidence += 0.3;

    // Color count bonus
    if (colors.length >= 5) confidence += 0.1;
    if (colors.length >= 3) confidence += 0.05;

    // Image quality bonus
    const pixelCount = imageWidth * imageHeight;
    if (pixelCount > 400 * 400) confidence += 0.1; // High resolution
    if (pixelCount > 200 * 200) confidence += 0.05; // Medium resolution

    // Penalize if very few colors extracted
    if (colors.length < 3) confidence -= 0.2;

    return Math.max(0.1, Math.min(1.0, confidence));
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
