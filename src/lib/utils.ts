import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { accurateColorPaletteService, type AccurateColorAnalysis } from "./accurateColorPaletteService";
import { enhancedFacialFeatureAnalysis, type EnhancedFacialFeatureColors } from "./enhancedFacialFeatureAnalysis";
import { colorExtractionService, type ExtractedPalette } from "./colorExtractionService";

/**
 * Utility function for conditionally joining classNames together and merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind class merging
 *
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged and deduplicated class string
 *
 * @example
 * ```tsx
 * cn("text-red-500", "text-blue-500") // Returns: "text-blue-500" (last one wins)
 * cn("px-4", { "py-2": true, "m-2": false }) // Returns: "px-4 py-2"
 * cn(["text-sm", "font-bold"], undefined, null) // Returns: "text-sm font-bold"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * High-accuracy color analysis for diverse users
 * Optimized for detecting blonde hair, blue eyes, and all skin tones
 */
export async function analyzeUserColors(imageInput: string | File | Blob): Promise<AccurateColorAnalysis> {
  return accurateColorPaletteService.analyzeUserColors(imageInput);
}

/**
 * Enhanced facial feature analysis
 * Better detection of light features and diverse characteristics
 */
export async function analyzeFacialFeatures(imageInput: string | File | Blob): Promise<EnhancedFacialFeatureColors> {
  return enhancedFacialFeatureAnalysis.detectFacialFeatureColors(imageInput);
}

/**
 * Standard color palette extraction with enhancements
 */
export async function extractColorPalette(imageInput: string | File | Blob, options?: any): Promise<ExtractedPalette> {
  return colorExtractionService.extractPalette(imageInput, options);
}

/**
 * Quick color analysis for basic use cases
 */
export async function quickColorAnalysis(imageInput: string | File | Blob): Promise<{
  skinColor: string;
  hairColor: string;
  eyeColor: string;
  dominantColors: string[];
  confidence: number;
}> {
  try {
    const analysis = await accurateColorPaletteService.analyzeUserColors(imageInput);

    return {
      skinColor: analysis.facialFeatures.skinTone.color,
      hairColor: analysis.facialFeatures.hairColor.color,
      eyeColor: analysis.facialFeatures.eyeColor.color,
      dominantColors: analysis.colorProfile.dominantColors,
      confidence: analysis.facialFeatures.overallConfidence
    };
  } catch (error) {
    console.error('Quick color analysis failed:', error);
    return {
      skinColor: '#E4B48C',
      hairColor: '#8B4513',
      eyeColor: '#654321',
      dominantColors: ['#E4B48C', '#8B4513', '#654321'],
      confidence: 0.3
    };
  }
}

/**
 * Utility to validate if a color is well-detected
 */
export function isColorWellDetected(confidence: number): boolean {
  return confidence >= 0.7;
}

/**
 * Get user-friendly description of color accuracy
 */
export function getAccuracyDescription(confidence: number): string {
  if (confidence >= 0.9) return 'Excellent accuracy';
  if (confidence >= 0.8) return 'Very good accuracy';
  if (confidence >= 0.7) return 'Good accuracy';
  if (confidence >= 0.6) return 'Fair accuracy';
  if (confidence >= 0.5) return 'Moderate accuracy';
  return 'Low accuracy - consider retaking photo';
}
