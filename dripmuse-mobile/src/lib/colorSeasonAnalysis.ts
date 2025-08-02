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
        blushColors: ['#FFB6C1', '#F08080', '#FFA07A', '#FFCCCB'],
        eyebrowColor: this.getEyebrowColor(hairColor.color),
        mascara: '#8B4513',
        highlighter: '#FFFACD',
        bronzer: '#DEB887',
        nailColors: ['#FFB6C1', '#FF8E8E', '#87CEEB', '#98FB98']
      },
      summer: {
        foundation: foundationColor,
        lipColors: ['#DDA0DD', '#DA70D6', '#9370DB', '#B0E0E6', '#E6E6FA'],
        eyeColors: ['#B0E0E6', '#DDA0DD', '#9370DB', '#8FBC8F', '#C0C0C0'],
        blushColors: ['#DDA0DD', '#E6E6FA', '#F0E68C', '#FFCDD2'],
        eyebrowColor: this.getEyebrowColor(hairColor.color),
        mascara: '#696969',
        highlighter: '#F0F8FF',
        bronzer: '#D2B48C',
        nailColors: ['#DDA0DD', '#B0E0E6', '#9370DB', '#E6E6FA']
      },
      autumn: {
        foundation: foundationColor,
        lipColors: ['#A0522D', '#CD853F', '#D2691E', '#B22222', '#8B4513'],
        eyeColors: ['#8B4513', '#A0522D', '#DAA520', '#228B22', '#CD853F'],
        blushColors: ['#BC8F8F', '#F4A460', '#DEB887', '#FFAB91'],
        eyebrowColor: this.getEyebrowColor(hairColor.color),
        mascara: '#8B4513',
        highlighter: '#DAA520',
        bronzer: '#CD853F',
        nailColors: ['#A0522D', '#8B4513', '#DAA520', '#B22222']
      },
      winter: {
        foundation: foundationColor,
        lipColors: ['#DC143C', '#B22222', '#8B008B', '#000080', '#C62828'],
        eyeColors: ['#000080', '#8B008B', '#2F4F4F', '#696969', '#37474F'],
        blushColors: ['#DC143C', '#9370DB', '#4682B4', '#E91E63'],
        eyebrowColor: this.getEyebrowColor(hairColor.color),
        mascara: '#000000',
        highlighter: '#E6E6FA',
        bronzer: '#A9A9A9',
        nailColors: ['#DC143C', '#8B008B', '#000080', '#9370DB']
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

  private getEyebrowColor(hairColor: string): string {
    const rgb = this.hexToRgb(hairColor);
    // Make eyebrow color slightly darker than hair
    const adjusted = {
      r: Math.max(0, rgb.r - 30),
      g: Math.max(0, rgb.g - 30),
      b: Math.max(0, rgb.b - 30)
    };
    return this.rgbToHex(adjusted.r, adjusted.g, adjusted.b);
  }

  private getProfessionalInsights(palette: ColorPalette, characteristics: any) {
    const season = palette.colorSeason;
    const insights = {
      spring: {
        colorHarmony: 'Your natural coloring creates a fresh, vibrant harmony. The warm undertones in your skin paired with your hair and eye colors create an energetic, youthful appearance that works best with clear, bright colors.',
        personalBranding: 'Your color palette suggests an approachable, energetic personal brand. In professional settings, use your natural warmth to convey trustworthiness and enthusiasm while maintaining clarity and freshness.',
        seasonalAdjustments: 'In summer, embrace brighter versions of your palette. In winter, add depth with richer warm tones while maintaining your natural brightness.',
        photographyTips: 'You photograph beautifully in natural light. Avoid harsh shadows and opt for warm, golden hour lighting. Bright backgrounds complement your coloring.',
        shoppingStrategy: 'Look for "warm" and "bright" descriptors when shopping. Avoid anything labeled "cool" or "muted". Test colors against your face in natural light before purchasing.'
      },
      summer: {
        colorHarmony: 'Your coloring creates a sophisticated, elegant harmony with cool undertones. The soft contrast between your features gives you a refined, timeless beauty that works best with muted, cool colors.',
        personalBranding: 'Your palette suggests a refined, trustworthy personal brand. In professional settings, your natural elegance conveys competence and reliability.',
        seasonalAdjustments: 'In summer, embrace lighter versions of your palette. In winter, add richness with deeper cool tones while maintaining your natural softness.',
        photographyTips: 'You look stunning in soft, diffused lighting. Avoid harsh, warm lighting. Cool-toned backgrounds and overcast lighting are most flattering.',
        shoppingStrategy: 'Look for "cool" and "soft" descriptors. Avoid anything too bright or warm. Your colors often have gray undertones, so test in various lighting conditions.'
      },
      autumn: {
        colorHarmony: 'Your rich, warm coloring creates a luxurious, earthy harmony. The depth and richness of your natural colors give you a sophisticated, grounded appearance that works best with warm, muted colors.',
        personalBranding: 'Your palette suggests a sophisticated, reliable personal brand. Your natural richness conveys depth, experience, and trustworthiness.',
        seasonalAdjustments: 'In autumn, you can wear the richest versions of your palette. In spring, lighten your colors while maintaining warmth. Winter calls for your deepest, richest tones.',
        photographyTips: 'You look magnificent in warm, golden lighting. Rich, textured backgrounds complement your coloring. Avoid cool, harsh lighting.',
        shoppingStrategy: 'Look for "warm", "rich", and "muted" descriptors. Avoid cool or icy colors. Your colors often have golden or bronze undertones.'
      },
      winter: {
        colorHarmony: 'Your high-contrast coloring creates a striking, dramatic harmony. The clear definition between your features gives you a bold, confident appearance that works best with clear, cool colors.',
        personalBranding: 'Your palette suggests a confident, authoritative personal brand. Your natural drama conveys leadership and decisiveness.',
        seasonalAdjustments: 'You can wear your boldest colors year-round. In summer, opt for clearer versions. In winter, embrace your deepest, most dramatic tones.',
        photographyTips: 'You excel in high-contrast lighting. Bold backgrounds and dramatic lighting enhance your natural intensity. Avoid soft, muted lighting.',
        shoppingStrategy: 'Look for "bold", "clear", and "cool" descriptors. Avoid warm or muted colors. Your colors are often pure and saturated without yellow undertones.'
      }
    };
    return insights[season as keyof typeof insights] || insights.spring;
  }

  private getDetailedAnalysis(palette: ColorPalette) {
    return {
      skinToneAnalysis: `Your ${palette.skinTone.name} skin with ${palette.skinTone.undertone} undertones provides the foundation for your color harmony. This undertone determines whether warm or cool colors will be most flattering on you.`,
      hairColorAnalysis: `Your ${palette.hairColor.name} hair color adds ${palette.hairColor.category === 'blonde' ? 'lightness and warmth' : palette.hairColor.category === 'brunette' ? 'depth and richness' : palette.hairColor.category === 'black' ? 'drama and contrast' : 'warmth and vibrancy'} to your overall appearance.`,
      eyeColorAnalysis: `Your ${palette.eyeColor.name} eyes ${palette.eyeColor.category === 'blue' ? 'add cool clarity' : palette.eyeColor.category === 'brown' ? 'provide warm depth' : palette.eyeColor.category === 'green' ? 'bring natural warmth' : palette.eyeColor.category === 'hazel' ? 'offer versatile beauty' : 'contribute unique character'} to your color story.`,
      overallHarmony: `The combination of your skin, hair, and eye colors creates a ${palette.colorSeason} color harmony that is best enhanced by colors that share similar temperature and intensity characteristics.`
    };
  }

  private getLifestyleRecommendations(season: string) {
    const recommendations = {
      spring: {
        business: ['Navy blazer with coral blouse', 'Warm gray suit with bright accessories', 'Cream blazer with turquoise top'],
        casual: ['Bright coral sweater with cream jeans', 'Turquoise dress with gold accessories', 'Yellow top with navy bottoms'],
        evening: ['Emerald cocktail dress', 'Navy gown with gold details', 'Bright fuchsia evening wear'],
        travel: ['Warm neutrals as base', 'One bright accent piece', 'Comfortable fabrics in your colors']
      },
      summer: {
        business: ['Soft gray suit with lavender blouse', 'Navy with powder blue accents', 'Soft white with cool accessories'],
        casual: ['Soft blue sweater with gray jeans', 'Lavender dress with silver jewelry', 'Rose pink top with navy bottoms'],
        evening: ['Soft navy evening dress', 'Dusty rose gown', 'Cool gray formal wear'],
        travel: ['Cool neutrals as foundation', 'Soft colored accessories', 'Comfortable, flowing fabrics']
      },
      autumn: {
        business: ['Rich brown suit with gold blouse', 'Forest green blazer with cream top', 'Camel coat with bronze accents'],
        casual: ['Rust sweater with dark jeans', 'Olive green dress with gold jewelry', 'Camel top with brown bottoms'],
        evening: ['Deep emerald evening dress', 'Rich burgundy gown', 'Bronze formal wear'],
        travel: ['Rich earth tones', 'Luxurious textures', 'Warm metallic accessories']
      },
      winter: {
        business: ['Black suit with white blouse', 'Navy with bright white accents', 'Charcoal with jewel-toned top'],
        casual: ['Black sweater with bright scarf', 'White dress with bold accessories', 'Navy top with black bottoms'],
        evening: ['Classic black evening dress', 'Royal blue gown', 'Jewel-toned formal wear'],
        travel: ['High-contrast basics', 'One statement piece', 'Quality over quantity']
      }
    };
    return recommendations[season as keyof typeof recommendations] || recommendations.spring;
  }

  private getColorCombinations(season: string) {
    const combinations = {
      spring: [
        { name: 'Fresh Garden', colors: ['#87CEEB', '#98FB98', '#FFB6C1'], occasion: 'Casual Day', description: 'Soft blue, light green, and pink create a fresh, natural look' },
        { name: 'Sunset Glow', colors: ['#FF6B6B', '#FFD700', '#FFA500'], occasion: 'Evening Out', description: 'Warm coral, gold, and orange evoke a beautiful sunset' },
        { name: 'Professional Spring', colors: ['#4682B4', '#F5F5DC', '#FF6B6B'], occasion: 'Business', description: 'Steel blue, beige, and coral for professional warmth' }
      ],
      summer: [
        { name: 'Lavender Dreams', colors: ['#E6E6FA', '#DDA0DD', '#9370DB'], occasion: 'Romantic', description: 'Soft lavender tones create an elegant, romantic palette' },
        { name: 'Ocean Breeze', colors: ['#B0E0E6', '#87CEEB', '#4682B4'], occasion: 'Casual', description: 'Cool blues evoke a peaceful ocean feeling' },
        { name: 'Executive Summer', colors: ['#2F4F4F', '#C0C0C0', '#DDA0DD'], occasion: 'Business', description: 'Charcoal, silver, and mauve for sophisticated authority' }
      ],
      autumn: [
        { name: 'Forest Walk', colors: ['#228B22', '#8B4513', '#D2691E'], occasion: 'Casual', description: 'Deep green, brown, and orange reflect autumn nature' },
        { name: 'Golden Hour', colors: ['#DAA520', '#CD853F', '#BC8F8F'], occasion: 'Evening', description: 'Rich golds and browns capture the warmth of golden hour' },
        { name: 'Executive Autumn', colors: ['#8B4513', '#F5F5DC', '#DAA520'], occasion: 'Business', description: 'Brown, cream, and gold for warm professional presence' }
      ],
      winter: [
        { name: 'Classic Drama', colors: ['#000000', '#FFFFFF', '#DC143C'], occasion: 'Formal', description: 'Black, white, and red create timeless dramatic elegance' },
        { name: 'Royal Jewels', colors: ['#4B0082', '#8B008B', '#000080'], occasion: 'Evening', description: 'Deep purples and navy create regal sophistication' },
        { name: 'Power Executive', colors: ['#2F4F4F', '#FFFFFF', '#8B008B'], occasion: 'Business', description: 'Charcoal, white, and purple for commanding presence' }
      ]
    };
    return combinations[season as keyof typeof combinations] || combinations.spring;
  }
}

export const colorSeasonAnalysisService = new ColorSeasonAnalysisService();
