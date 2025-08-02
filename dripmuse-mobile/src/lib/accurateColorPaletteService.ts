/**
 * Accurate Color Palette Service - v1.0
 * 
 * Specialized service for extracting accurate color palettes from diverse users.
 * Designed to handle blonde hair, blue eyes, fair skin, and all other variations
 * with high precision for a 1M+ user database.
 */

import { colorExtractionService, type ExtractedPalette } from './colorExtractionService';
import { enhancedFacialFeatureAnalysis, type EnhancedFacialFeatureColors } from './enhancedFacialFeatureAnalysis';
import { advancedColorTheory } from './advancedColorTheory';

export interface AccurateColorAnalysis {
  palette: ExtractedPalette;
  facialFeatures: EnhancedFacialFeatureColors;
  colorProfile: {
    dominantColors: string[];
    skinTone: {
      color: string;
      description: string;
      undertone: string;
      lightness: string;
    };
    hairColor: {
      color: string;
      description: string;
      category: string;
    };
    eyeColor: {
      color: string;
      description: string;
      category: string;
    };
    seasonalProfile: {
      season: string;
      confidence: number;
      recommendedColors: string[];
    };
    accuracyMetrics: {
      overallAccuracy: number;
      skinAccuracy: number;
      hairAccuracy: number;
      eyeAccuracy: number;
      processingTime: number;
    };
  };
  recommendations: {
    complementaryColors: string[];
    harmonizingColors: string[];
    avoidColors: string[];
    bestMatches: string[];
  };
}

class AccurateColorPaletteService {
  
  /**
   * Extract comprehensive color analysis for any user type
   */
  async analyzeUserColors(imageInput: string | File | Blob): Promise<AccurateColorAnalysis> {
    const startTime = performance.now();
    
    try {
      // Step 1: Enhanced facial feature analysis
      console.log('🔍 Starting enhanced facial feature analysis...');
      const facialFeatures = await enhancedFacialFeatureAnalysis.detectFacialFeatureColors(imageInput);
      
      // Step 2: Advanced color palette extraction
      console.log('🎨 Extracting color palette...');
      const palette = await colorExtractionService.extractPalette(imageInput, {
        colorCount: 12,
        quality: 9,
        fallbackToFullImage: true,
        minColorDistance: 12,
        includeSkinTones: true,
        validateAccessibility: true
      });
      
      // Step 3: Color profile generation
      console.log('📊 Generating color profile...');
      const colorProfile = this.generateColorProfile(facialFeatures, palette);
      
      // Step 4: Generate recommendations
      console.log('💡 Creating color recommendations...');
      const recommendations = this.generateColorRecommendations(facialFeatures, palette);
      
      const processingTime = performance.now() - startTime;
      
      // Step 5: Calculate accuracy metrics
      const accuracyMetrics = this.calculateAccuracyMetrics(facialFeatures, palette, processingTime);
      
      console.log(`✅ Analysis completed in ${processingTime.toFixed(0)}ms with ${accuracyMetrics.overallAccuracy}% accuracy`);
      
      return {
        palette,
        facialFeatures,
        colorProfile: {
          ...colorProfile,
          accuracyMetrics
        },
        recommendations
      };
      
    } catch (error) {
      console.error('❌ Color analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Generate comprehensive color profile
   */
  private generateColorProfile(facialFeatures: EnhancedFacialFeatureColors, palette: ExtractedPalette) {
    // Extract dominant colors prioritizing facial features
    const dominantColors = this.extractDominantColors(facialFeatures, palette);
    
    // Determine seasonal profile
    const seasonalProfile = this.determineSeasonalProfile(facialFeatures, dominantColors);
    
    return {
      dominantColors,
      skinTone: {
        color: facialFeatures.skinTone.color,
        description: facialFeatures.skinTone.description,
        undertone: facialFeatures.skinTone.undertone,
        lightness: facialFeatures.skinTone.lightness
      },
      hairColor: {
        color: facialFeatures.hairColor.color,
        description: facialFeatures.hairColor.description,
        category: facialFeatures.hairColor.category
      },
      eyeColor: {
        color: facialFeatures.eyeColor.color,
        description: facialFeatures.eyeColor.description,
        category: facialFeatures.eyeColor.category
      },
      seasonalProfile
    };
  }

  /**
   * Extract dominant colors with facial feature prioritization
   */
  private extractDominantColors(facialFeatures: EnhancedFacialFeatureColors, palette: ExtractedPalette): string[] {
    const dominantColors: string[] = [];
    
    // Always include facial feature colors if detected
    if (facialFeatures.detectedFeatures) {
      dominantColors.push(facialFeatures.skinTone.color);
      dominantColors.push(facialFeatures.hairColor.color);
      dominantColors.push(facialFeatures.eyeColor.color);
    }
    
    // Add other significant colors from palette
    const otherColors = palette.colors.filter(color => 
      !dominantColors.some(existing => 
        this.calculateColorDistance(color, existing) < 30
      )
    );
    
    // Take top 5 additional colors
    dominantColors.push(...otherColors.slice(0, 5));
    
    return dominantColors.slice(0, 8); // Maximum 8 dominant colors
  }

  /**
   * Determine seasonal color profile
   */
  private determineSeasonalProfile(facialFeatures: EnhancedFacialFeatureColors, dominantColors: string[]) {
    const { skinTone, hairColor, eyeColor } = facialFeatures;
    
    // Analyze color temperature and characteristics
    const isWarmSkin = ['warm', 'yellow', 'olive'].includes(skinTone.undertone);
    const isCoolSkin = ['cool', 'pink'].includes(skinTone.undertone);
    const isLightFeatures = skinTone.lightness === 'very-fair' || skinTone.lightness === 'fair';
    const isDarkFeatures = skinTone.lightness === 'dark' || skinTone.lightness === 'very-dark';
    
    const isBlondeHair = hairColor.category === 'blonde';
    const isBlueEyes = eyeColor.category === 'blue';
    const isLightEyes = ['blue', 'green', 'gray'].includes(eyeColor.category);
    
    let season = 'neutral';
    let confidence = 0.6;
    
    // Spring: warm, light, clear
    if (isWarmSkin && isLightFeatures && (isBlondeHair || isLightEyes)) {
      season = 'spring';
      confidence = 0.85;
    }
    // Summer: cool, light, soft
    else if (isCoolSkin && isLightFeatures && isLightEyes) {
      season = 'summer';
      confidence = 0.8;
    }
    // Autumn: warm, dark, rich
    else if (isWarmSkin && (hairColor.category === 'red' || hairColor.category === 'auburn' || 
                           (hairColor.category === 'brown' && !isLightFeatures))) {
      season = 'autumn';
      confidence = 0.8;
    }
    // Winter: cool, high contrast
    else if (isCoolSkin && (isDarkFeatures || (isLightFeatures && hairColor.category === 'black'))) {
      season = 'winter';
      confidence = 0.8;
    }
    
    // Get recommended colors for the season
    const seasonalPalette = advancedColorTheory.getCurrentSeasonalPalette();
    const recommendedColors = season === seasonalPalette.season 
      ? seasonalPalette.hexPalette
      : this.getGenericRecommendedColors(isWarmSkin);
    
    return {
      season,
      confidence,
      recommendedColors: recommendedColors.slice(0, 8)
    };
  }

  /**
   * Generate color recommendations
   */
  private generateColorRecommendations(facialFeatures: EnhancedFacialFeatureColors, palette: ExtractedPalette) {
    const { skinTone, hairColor, eyeColor } = facialFeatures;
    
    // Generate complementary colors
    const complementaryColors = this.generateComplementaryColors(facialFeatures);
    
    // Generate harmonizing colors
    const harmonizingColors = this.generateHarmonizingColors(facialFeatures);
    
    // Determine colors to avoid
    const avoidColors = this.getColorsToAvoid(facialFeatures);
    
    // Find best matches from current palette
    const bestMatches = this.findBestMatches(facialFeatures, palette);
    
    return {
      complementaryColors,
      harmonizingColors,
      avoidColors,
      bestMatches
    };
  }

  /**
   * Generate complementary colors based on facial features
   */
  private generateComplementaryColors(facialFeatures: EnhancedFacialFeatureColors): string[] {
    const colors: string[] = [];
    
    // Generate complementary colors for skin tone
    const skinComplement = advancedColorTheory.generateHarmoniousColors(
      facialFeatures.skinTone.color, 
      'complementary'
    );
    colors.push(...skinComplement);
    
    // Generate complementary colors for eye color
    const eyeComplement = advancedColorTheory.generateHarmoniousColors(
      facialFeatures.eyeColor.color, 
      'complementary'
    );
    colors.push(...eyeComplement);
    
    return this.removeDuplicateColors(colors).slice(0, 6);
  }

  /**
   * Generate harmonizing colors
   */
  private generateHarmonizingColors(facialFeatures: EnhancedFacialFeatureColors): string[] {
    const colors: string[] = [];
    
    // Analogous colors for skin tone
    const skinAnalogous = advancedColorTheory.generateHarmoniousColors(
      facialFeatures.skinTone.color, 
      'analogous'
    );
    colors.push(...skinAnalogous);
    
    // Monochromatic variations
    const skinMonochromatic = advancedColorTheory.generateHarmoniousColors(
      facialFeatures.skinTone.color, 
      'monochromatic'
    );
    colors.push(...skinMonochromatic);
    
    return this.removeDuplicateColors(colors).slice(0, 8);
  }

  /**
   * Determine colors to avoid based on facial features
   */
  private getColorsToAvoid(facialFeatures: EnhancedFacialFeatureColors): string[] {
    const avoidColors: string[] = [];
    const { skinTone, hairColor, eyeColor } = facialFeatures;
    
    // Colors that clash with skin undertone
    if (skinTone.undertone === 'warm') {
      avoidColors.push('#FF69B4', '#87CEEB', '#E6E6FA'); // Cool pinks and blues
    } else if (skinTone.undertone === 'cool') {
      avoidColors.push('#FFA500', '#FFD700', '#FF4500'); // Warm oranges and yellows
    }
    
    // Colors too similar to hair (wash out effect)
    if (hairColor.category === 'blonde') {
      avoidColors.push('#FFFF99', '#FFFACD', '#F5DEB3'); // Very light yellows
    } else if (hairColor.category === 'brown') {
      avoidColors.push('#8B4513', '#A0522D', '#D2B48C'); // Similar browns
    }
    
    // Colors that compete with eye color
    if (eyeColor.category === 'blue') {
      avoidColors.push('#0000FF', '#4169E1'); // Competing blues
    } else if (eyeColor.category === 'green') {
      avoidColors.push('#00FF00', '#32CD32'); // Competing greens
    }
    
    return this.removeDuplicateColors(avoidColors);
  }

  /**
   * Find best color matches from current palette
   */
  private findBestMatches(facialFeatures: EnhancedFacialFeatureColors, palette: ExtractedPalette): string[] {
    const scores: Array<{ color: string; score: number }> = [];
    
    palette.colors.forEach(color => {
      let score = 0;
      
      // Score based on harmony with skin tone
      const skinHarmony = advancedColorTheory.analyzeColorHarmony([color], [facialFeatures.skinTone.color]);
      score += skinHarmony.confidence * 40;
      
      // Score based on eye color enhancement
      const eyeHarmony = advancedColorTheory.analyzeColorHarmony([color], [facialFeatures.eyeColor.color]);
      score += eyeHarmony.confidence * 30;
      
      // Score based on seasonal appropriateness
      const seasonalPalette = advancedColorTheory.getCurrentSeasonalPalette();
      const isSeasonalColor = seasonalPalette.hexPalette.some(seasonColor => 
        this.calculateColorDistance(color, seasonColor) < 50
      );
      if (isSeasonalColor) score += 20;
      
      // Bonus for complementary relationships
      if (skinHarmony.harmonyType === 'complementary' || eyeHarmony.harmonyType === 'complementary') {
        score += 10;
      }
      
      scores.push({ color, score });
    });
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.color);
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(facialFeatures: EnhancedFacialFeatureColors, palette: ExtractedPalette, processingTime: number) {
    const skinAccuracy = facialFeatures.skinTone.confidence * 100;
    const hairAccuracy = facialFeatures.hairColor.confidence * 100;
    const eyeAccuracy = facialFeatures.eyeColor.confidence * 100;
    const overallAccuracy = facialFeatures.overallConfidence * 100;
    
    return {
      overallAccuracy: Math.round(overallAccuracy),
      skinAccuracy: Math.round(skinAccuracy),
      hairAccuracy: Math.round(hairAccuracy),
      eyeAccuracy: Math.round(eyeAccuracy),
      processingTime: Math.round(processingTime)
    };
  }

  /**
   * Get generic recommended colors based on skin warmth
   */
  private getGenericRecommendedColors(isWarmSkin: boolean): string[] {
    if (isWarmSkin) {
      return ['#FF7F50', '#FFD700', '#32CD32', '#FF69B4', '#FFA500', '#98FB98', '#DDA0DD', '#F0E68C'];
    } else {
      return ['#87CEEB', '#E6E6FA', '#98FB98', '#DDA0DD', '#B0E0E6', '#F0E68C', '#FFB6C1', '#D3D3D3'];
    }
  }

  /**
   * Remove duplicate colors
   */
  private removeDuplicateColors(colors: string[]): string[] {
    const unique: string[] = [];
    colors.forEach(color => {
      const isDuplicate = unique.some(existing => 
        this.calculateColorDistance(color, existing) < 15
      );
      if (!isDuplicate) {
        unique.push(color);
      }
    });
    return unique;
  }

  /**
   * Calculate perceptual color distance
   */
  private calculateColorDistance(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const deltaR = rgb1.r - rgb2.r;
    const deltaG = rgb1.g - rgb2.g;
    const deltaB = rgb1.b - rgb2.b;
    
    return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
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
   * Fallback analysis for error cases
   */
  private getFallbackAnalysis(): AccurateColorAnalysis {
    const fallbackPalette: ExtractedPalette = {
      colors: ['#E4B48C', '#8B4513', '#4682B4', '#228B22', '#DC143C', '#FFD700'],
      confidence: 0.3,
      source: 'fallback',
      metadata: {
        faceDetected: false,
        colorCount: 6,
        dominantColor: '#E4B48C',
        skinTones: ['#E4B48C'],
        colorHarmony: 'neutral',
        accessibilityScore: 0.7,
        colorTemperature: 'neutral',
        colorSeason: 'neutral'
      }
    };

    const fallbackFeatures: EnhancedFacialFeatureColors = {
      skinTone: { 
        color: '#E4B48C', 
        lightness: 'light', 
        undertone: 'neutral', 
        confidence: 0.3,
        description: 'Light skin with neutral undertones'
      },
      hairColor: { 
        color: '#8B4513', 
        description: 'Medium Brown', 
        category: 'brown',
        confidence: 0.3 
      },
      eyeColor: { 
        color: '#654321', 
        description: 'Brown', 
        category: 'brown',
        confidence: 0.3 
      },
      overallConfidence: 0.3,
      detectedFeatures: false
    };

    return {
      palette: fallbackPalette,
      facialFeatures: fallbackFeatures,
      colorProfile: {
        dominantColors: fallbackPalette.colors,
        skinTone: {
          color: fallbackFeatures.skinTone.color,
          description: fallbackFeatures.skinTone.description,
          undertone: fallbackFeatures.skinTone.undertone,
          lightness: fallbackFeatures.skinTone.lightness
        },
        hairColor: {
          color: fallbackFeatures.hairColor.color,
          description: fallbackFeatures.hairColor.description,
          category: fallbackFeatures.hairColor.category
        },
        eyeColor: {
          color: fallbackFeatures.eyeColor.color,
          description: fallbackFeatures.eyeColor.description,
          category: fallbackFeatures.eyeColor.category
        },
        seasonalProfile: {
          season: 'neutral',
          confidence: 0.3,
          recommendedColors: fallbackPalette.colors
        },
        accuracyMetrics: {
          overallAccuracy: 30,
          skinAccuracy: 30,
          hairAccuracy: 30,
          eyeAccuracy: 30,
          processingTime: 0
        }
      },
      recommendations: {
        complementaryColors: ['#FF7F50', '#87CEEB', '#98FB98'],
        harmonizingColors: ['#F4A460', '#DEB887', '#D2B48C'],
        avoidColors: ['#FF69B4', '#00FF00'],
        bestMatches: fallbackPalette.colors.slice(0, 3)
      }
    };
  }
}

export const accurateColorPaletteService = new AccurateColorPaletteService();
