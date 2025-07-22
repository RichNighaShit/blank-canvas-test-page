/**
 * Professional Color Season Analysis
 * 
 * Based on established color analysis systems like Seasonal Color Analysis,
 * 12-Season System, and professional color consulting principles.
 */

import type { ColorPalette } from '@/data/predefinedColorPalettes';

export interface ColorSeasonAnalysis {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  subSeason: string;
  characteristics: {
    contrast: 'high' | 'medium' | 'low';
    warmth: 'warm' | 'cool' | 'neutral';
    clarity: 'clear' | 'soft' | 'muted';
    depth: 'light' | 'medium' | 'deep';
  };
  idealColors: {
    category: string;
    colors: string[];
    description: string;
  }[];
  avoidColors: {
    category: string;
    colors: string[];
    reason: string;
  }[];
  clothingRecommendations: {
    neutrals: string[];
    accents: string[];
    metallics: 'gold' | 'silver' | 'both';
    patterns: string[];
    wardrobeFormula: {
      neutrals: number;
      accents: number;
      statement: number;
    };
    bestFabrics: string[];
    stylePersonality: string;
  };
  makeupRecommendations: {
    foundation: string;
    lipColors: string[];
    eyeColors: string[];
    blushColors: string[];
    eyebrowColor: string;
    mascara: string;
    highlighter: string;
    bronzer: string;
    nailColors: string[];
  };
  personalityTraits: string[];
  description: string;
  tips: string[];
  professionalInsights: {
    colorHarmony: string;
    personalBranding: string;
    seasonalAdjustments: string;
    photographyTips: string;
    shoppingStrategy: string;
  };
  detailedAnalysis: {
    skinToneAnalysis: string;
    hairColorAnalysis: string;
    eyeColorAnalysis: string;
    overallHarmony: string;
  };
  lifestyleRecommendations: {
    business: string[];
    casual: string[];
    evening: string[];
    travel: string[];
  };
  colorCombinations: {
    name: string;
    colors: string[];
    occasion: string;
    description: string;
  }[];
}

class ColorSeasonAnalysisService {
  /**
   * Analyze color season based on selected palette
   */
  analyzeColorSeason(palette: ColorPalette): ColorSeasonAnalysis {
    const { skinTone, hairColor, eyeColor, category } = palette;
    
    // Determine characteristics
    const characteristics = this.analyzeCharacteristics(palette);
    
    // Get detailed season analysis
    const seasonAnalysis = this.getSeasonAnalysis(palette.colorSeason, characteristics, category);
    
    return {
      season: palette.colorSeason,
      subSeason: seasonAnalysis.subSeason,
      characteristics,
      idealColors: seasonAnalysis.idealColors,
      avoidColors: seasonAnalysis.avoidColors,
      clothingRecommendations: this.getEnhancedClothingRecommendations(seasonAnalysis.clothingRecommendations, palette),
      makeupRecommendations: this.getEnhancedMakeupRecommendations(palette),
      personalityTraits: seasonAnalysis.personalityTraits,
      description: seasonAnalysis.description,
      tips: seasonAnalysis.tips,
      professionalInsights: this.getProfessionalInsights(palette, characteristics),
      detailedAnalysis: this.getDetailedAnalysis(palette),
      lifestyleRecommendations: this.getLifestyleRecommendations(palette.colorSeason),
      colorCombinations: this.getColorCombinations(palette.colorSeason)
    };
  }

  private analyzeCharacteristics(palette: ColorPalette) {
    const { skinTone, hairColor, eyeColor, category } = palette;
    
    // Determine contrast level
    const contrast = this.determineContrast(skinTone.color, hairColor.color, eyeColor.color);
    
    // Determine warmth
    const warmth = skinTone.undertone === 'neutral' ? 'neutral' : skinTone.undertone;
    
    // Determine clarity based on saturation
    const clarity = this.determineClarity(palette);
    
    // Determine depth
    const depth = this.determineDepth(category);
    
    return { contrast, warmth, clarity, depth };
  }

  private determineContrast(skinColor: string, hairColor: string, eyeColor: string): 'high' | 'medium' | 'low' {
    const skinRgb = this.hexToRgb(skinColor);
    const hairRgb = this.hexToRgb(hairColor);
    const eyeRgb = this.hexToRgb(eyeColor);
    
    const skinBrightness = (skinRgb.r * 299 + skinRgb.g * 587 + skinRgb.b * 114) / 1000;
    const hairBrightness = (hairRgb.r * 299 + hairRgb.g * 587 + hairRgb.b * 114) / 1000;
    
    const contrastDiff = Math.abs(skinBrightness - hairBrightness);
    
    if (contrastDiff > 120) return 'high';
    if (contrastDiff > 60) return 'medium';
    return 'low';
  }

  private determineClarity(palette: ColorPalette): 'clear' | 'soft' | 'muted' {
    // More sophisticated clarity analysis based on color intensity and saturation
    const { skinTone, hairColor, eyeColor } = palette;

    // Calculate color saturation levels
    const skinSaturation = this.getColorSaturation(skinTone.color);
    const hairSaturation = this.getColorSaturation(hairColor.color);
    const eyeSaturation = this.getColorSaturation(eyeColor.color);

    const avgSaturation = (skinSaturation + hairSaturation + eyeSaturation) / 3;

    // Clear types: high contrast, bright colors
    if (avgSaturation > 0.6 ||
        (hairColor.category === 'black' && eyeColor.category === 'blue') ||
        (hairColor.category === 'blonde' && eyeColor.category === 'blue') ||
        (hairColor.category === 'red' || hairColor.category === 'auburn')) {
      return 'clear';
    }

    // Soft types: medium saturation, blended colors
    if (avgSaturation > 0.3 ||
        skinTone.undertone === 'neutral' ||
        eyeColor.category === 'hazel' ||
        hairColor.category === 'brown') {
      return 'soft';
    }

    // Muted types: low saturation, grayed colors
    return 'muted';
  }

  private getColorSaturation(hexColor: string): number {
    const rgb = this.hexToRgb(hexColor);
    const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
    const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
    return max === 0 ? 0 : (max - min) / max;
  }

  private determineDepth(category: string): 'light' | 'medium' | 'deep' {
    if (['very-fair', 'fair'].includes(category)) return 'light';
    if (['light', 'medium', 'olive'].includes(category)) return 'medium';
    return 'deep';
  }

  private getSeasonAnalysis(season: string, characteristics: any, category: string) {
    const seasonData = {
      spring: {
        subSeason: this.getSpringSubSeason(characteristics, category),
        idealColors: [
          {
            category: 'Bright Colors',
            colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
            description: 'Clear, warm, and vibrant colors that enhance your natural glow'
          },
          {
            category: 'Neutrals',
            colors: ['#F5F5DC', '#FAEBD7', '#FFE4B5', '#DEB887', '#D2B48C', '#BC8F8F'],
            description: 'Warm, light neutrals that complement your coloring'
          },
          {
            category: 'Pastels',
            colors: ['#FFB6C1', '#FFCCCB', '#E0FFFF', '#F0FFF0', '#FFFACD', '#E6E6FA'],
            description: 'Fresh, clear pastels that brighten your complexion'
          }
        ],
        avoidColors: [
          {
            category: 'Cool/Dark Colors',
            colors: ['#000000', '#2C3E50', '#34495E', '#8B008B', '#4B0082'],
            reason: 'These colors can overwhelm your delicate coloring and make you look washed out'
          }
        ],
        clothingRecommendations: {
          neutrals: ['#F5F5DC', '#FAEBD7', '#FFE4B5', '#DEB887'],
          accents: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
          metallics: 'gold' as const,
          patterns: ['Floral prints', 'Small geometric patterns', 'Watercolor effects']
        },
        personalityTraits: ['Fresh', 'Youthful', 'Energetic', 'Optimistic', 'Warm'],
        description: 'Spring types have a warm, fresh, and youthful appearance with clear, bright coloring.',
        tips: [
          'Wear colors that are clear and bright rather than muted or dusty',
          'Gold jewelry enhances your warm undertones better than silver',
          'Avoid black near your face - try navy or warm brown instead',
          'Fresh, dewy makeup looks are most flattering'
        ]
      },
      summer: {
        subSeason: this.getSummerSubSeason(characteristics, category),
        idealColors: [
          {
            category: 'Cool Soft Colors',
            colors: ['#B0E0E6', '#DDA0DD', '#E6E6FA', '#F0F8FF', '#E0FFFF', '#FFEFD5'],
            description: 'Soft, cool colors with gray undertones that harmonize with your coloring'
          },
          {
            category: 'Muted Tones',
            colors: ['#9370DB', '#8FBC8F', '#20B2AA', '#87CEEB', '#DEB887', '#D2B48C'],
            description: 'Gentle, sophisticated colors that enhance your natural elegance'
          },
          {
            category: 'Cool Neutrals',
            colors: ['#F5F5F5', '#E6E6FA', '#C0C0C0', '#A9A9A9', '#696969', '#2F4F4F'],
            description: 'Cool-toned neutrals that complement your undertones'
          }
        ],
        avoidColors: [
          {
            category: 'Warm/Bright Colors',
            colors: ['#FF4500', '#FFD700', '#FF6347', '#FF8C00', '#FFA500'],
            reason: 'Warm, bright colors can clash with your cool undertones and appear harsh'
          }
        ],
        clothingRecommendations: {
          neutrals: ['#F5F5F5', '#E6E6FA', '#C0C0C0', '#A9A9A9'],
          accents: ['#B0E0E6', '#DDA0DD', '#9370DB', '#8FBC8F'],
          metallics: 'silver' as const,
          patterns: ['Subtle stripes', 'Soft florals', 'Watercolor prints']
        },
        personalityTraits: ['Elegant', 'Sophisticated', 'Gentle', 'Refined', 'Classic'],
        description: 'Summer types have cool, soft coloring with a refined and elegant appearance.',
        tips: [
          'Choose soft, muted colors over bright or vivid ones',
          'Silver jewelry complements your cool undertones',
          'Soft, natural makeup enhances your gentle beauty',
          'Avoid colors that are too warm or too dark near your face'
        ]
      },
      autumn: {
        subSeason: this.getAutumnSubSeason(characteristics, category),
        idealColors: [
          {
            category: 'Rich Earth Tones',
            colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#F4A460'],
            description: 'Deep, warm earth tones that reflect your natural richness'
          },
          {
            category: 'Golden Colors',
            colors: ['#DAA520', '#B8860B', '#FFD700', '#FFA500', '#FF8C00', '#DEB887'],
            description: 'Golden and bronze tones that enhance your warm undertones'
          },
          {
            category: 'Deep Jewel Tones',
            colors: ['#8B0000', '#006400', '#8B008B', '#2F4F4F', '#556B2F', '#8FBC8F'],
            description: 'Rich, deep colors that complement your intensity'
          }
        ],
        avoidColors: [
          {
            category: 'Cool/Icy Colors',
            colors: ['#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0E0E6', '#AFEEEE'],
            reason: 'Cool, icy colors can make you appear washed out and tired'
          }
        ],
        clothingRecommendations: {
          neutrals: ['#8B4513', '#A0522D', '#CD853F', '#D2691E'],
          accents: ['#DAA520', '#B8860B', '#8B0000', '#006400'],
          metallics: 'gold' as const,
          patterns: ['Paisley', 'Animal prints', 'Rich plaids', 'Geometric designs']
        },
        personalityTraits: ['Rich', 'Warm', 'Earthy', 'Sophisticated', 'Bold'],
        description: 'Autumn types have warm, rich coloring with depth and intensity.',
        tips: [
          'Embrace rich, warm colors that reflect your natural depth',
          'Gold and bronze metallics are most flattering',
          'Avoid icy or pale colors that can wash you out',
          'Rich, warm makeup tones enhance your natural beauty'
        ]
      },
      winter: {
        subSeason: this.getWinterSubSeason(characteristics, category),
        idealColors: [
          {
            category: 'Bold Colors',
            colors: ['#000000', '#FF0000', '#0000FF', '#800080', '#008000', '#FFFFFF'],
            description: 'Clear, bold colors that match your high contrast and intensity'
          },
          {
            category: 'Jewel Tones',
            colors: ['#4B0082', '#8B008B', '#006400', '#8B0000', '#000080', '#2F4F4F'],
            description: 'Rich jewel tones that enhance your dramatic coloring'
          },
          {
            category: 'Cool Colors',
            colors: ['#E6E6FA', '#B0E0E6', '#AFEEEE', '#F0F8FF', '#E0FFFF', '#C0C0C0'],
            description: 'Cool, clear colors that harmonize with your undertones'
          }
        ],
        avoidColors: [
          {
            category: 'Warm/Muted Colors',
            colors: ['#DAA520', '#B8860B', '#D2691E', '#BC8F8F', '#CD853F'],
            reason: 'Warm, muted colors can make you appear dull and tired'
          }
        ],
        clothingRecommendations: {
          neutrals: ['#000000', '#FFFFFF', '#C0C0C0', '#2F4F4F'],
          accents: ['#FF0000', '#0000FF', '#800080', '#008000'],
          metallics: 'silver' as const,
          patterns: ['Bold stripes', 'Geometric patterns', 'High contrast prints']
        },
        personalityTraits: ['Dramatic', 'Bold', 'Striking', 'Confident', 'Cool'],
        description: 'Winter types have cool, high-contrast coloring with dramatic intensity.',
        tips: [
          'Embrace bold, clear colors that match your intensity',
          'Silver and platinum metallics are most flattering',
          'Avoid warm, muted colors that can dull your appearance',
          'Bold, defined makeup enhances your striking features'
        ]
      }
    };

    return seasonData[season as keyof typeof seasonData];
  }

  private getSpringSubSeason(characteristics: any, category: string): string {
    if (characteristics.clarity === 'clear' && characteristics.contrast === 'high') {
      return 'Clear Spring';
    }
    if (characteristics.warmth === 'warm' && characteristics.depth === 'light') {
      return 'Light Spring';
    }
    return 'True Spring';
  }

  private getSummerSubSeason(characteristics: any, category: string): string {
    if (characteristics.clarity === 'soft' && characteristics.contrast === 'low') {
      return 'Soft Summer';
    }
    if (characteristics.depth === 'light') {
      return 'Light Summer';
    }
    return 'True Summer';
  }

  private getAutumnSubSeason(characteristics: any, category: string): string {
    if (characteristics.depth === 'deep') {
      return 'Deep Autumn';
    }
    if (characteristics.clarity === 'soft') {
      return 'Soft Autumn';
    }
    return 'True Autumn';
  }

  private getWinterSubSeason(characteristics: any, category: string): string {
    if (characteristics.contrast === 'high' && characteristics.clarity === 'clear') {
      return 'Clear Winter';
    }
    if (characteristics.depth === 'deep') {
      return 'Deep Winter';
    }
    return 'True Winter';
  }

  private getEnhancedClothingRecommendations(baseRecommendations: any, palette: ColorPalette) {
    return {
      ...baseRecommendations,
      wardrobeFormula: {
        neutrals: 60,
        accents: 30,
        statement: 10
      },
      bestFabrics: this.getBestFabrics(palette.colorSeason),
      stylePersonality: this.getStylePersonality(palette.colorSeason)
    };
  }

  private getBestFabrics(season: string): string[] {
    const fabricData = {
      spring: ['Cotton', 'Linen', 'Silk', 'Lightweight wools', 'Chiffon'],
      summer: ['Silk', 'Cotton', 'Crepe', 'Soft knits', 'Flowing fabrics'],
      autumn: ['Wool', 'Tweed', 'Corduroy', 'Suede', 'Rich textures'],
      winter: ['Silk', 'Wool gabardine', 'Crisp cotton', 'Leather', 'Structured fabrics']
    };
    return fabricData[season as keyof typeof fabricData] || [];
  }

  private getStylePersonality(season: string): string {
    const personalityData = {
      spring: 'Fresh & Youthful - Natural, approachable style with vibrant energy',
      summer: 'Elegant & Refined - Sophisticated, gentle style with timeless appeal',
      autumn: 'Rich & Earthy - Warm, luxurious style with natural sophistication',
      winter: 'Bold & Dramatic - Striking, confident style with sharp elegance'
    };
    return personalityData[season as keyof typeof personalityData] || '';
  }

  private getEnhancedMakeupRecommendations(palette: ColorPalette) {
    const { colorSeason, skinTone, hairColor, eyeColor } = palette;

    // Use actual skin tone color for foundation
    const foundationColor = this.adjustFoundationTone(skinTone.color);

    const makeupData = {
      spring: {
        foundation: foundationColor,
        lipColors: ['#FF6B6B', '#FF8E8E', '#FFB6C1', '#F08080', '#FFA07A'],
        eyeColors: ['#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FFB6C1'],
        blushColors: ['#FFB6C1', '#F08080', '#FFA07A', '#FFCCCB']
      },
      summer: {
        foundation: foundationColor,
        lipColors: ['#DDA0DD', '#DA70D6', '#9370DB', '#B0E0E6', '#E6E6FA'],
        eyeColors: ['#B0E0E6', '#DDA0DD', '#9370DB', '#8FBC8F', '#C0C0C0'],
        blushColors: ['#DDA0DD', '#E6E6FA', '#F0E68C', '#FFCDD2']
      },
      autumn: {
        foundation: foundationColor,
        lipColors: ['#A0522D', '#CD853F', '#D2691E', '#B22222', '#8B4513'],
        eyeColors: ['#8B4513', '#A0522D', '#DAA520', '#228B22', '#CD853F'],
        blushColors: ['#BC8F8F', '#F4A460', '#DEB887', '#FFAB91']
      },
      winter: {
        foundation: foundationColor,
        lipColors: ['#DC143C', '#B22222', '#8B008B', '#000080', '#C62828'],
        eyeColors: ['#000080', '#8B008B', '#2F4F4F', '#696969', '#37474F'],
        blushColors: ['#DC143C', '#9370DB', '#4682B4', '#E91E63']
      }
    };

    return makeupData[colorSeason];
  }

  private adjustFoundationTone(skinColor: string): string {
    // Use the actual skin tone with slight adjustment for foundation match
    const rgb = this.hexToRgb(skinColor);

    // Slightly adjust for better foundation match
    const adjusted = {
      r: Math.min(255, Math.max(0, rgb.r + 2)),
      g: Math.min(255, Math.max(0, rgb.g + 1)),
      b: Math.min(255, Math.max(0, rgb.b + 1))
    };

    return this.rgbToHex(adjusted.r, adjusted.g, adjusted.b);
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}

export const colorSeasonAnalysisService = new ColorSeasonAnalysisService();
