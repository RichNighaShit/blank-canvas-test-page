
export interface WardrobeItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  tags: string[];
  silhouette?: string;
  fit?: string;
  fabric?: string;
  formality_level?: number; // 1-10 scale
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed?: number;
  description?: string;
  location?: string;
}

export interface StyleProfile {
  id: string;
  preferred_style: string;
  favorite_colors?: string[];
  goals?: string[];
  body_type?: string;
  style_preferences?: {
    formality: number; // 1-10
    boldness: number; // 1-10
    minimalism: number; // 1-10
  };
}

export interface OutfitRecommendation {
  id: string;
  items: WardrobeItem[];
  occasion: string;
  style: string;
  confidence: number;
  description: string;
  reasoning: string[];
  style_score: number;
  color_harmony_score: number;
  weather_appropriateness: number;
  trend_relevance: number;
}

interface ColorHarmony {
  primary: string;
  secondary: string[];
  accent: string[];
  neutrals: string[];
}

class ColorTheoryEngine {
  private colorMap: { [key: string]: { hue: number; saturation: number; lightness: number } } = {
    'red': { hue: 0, saturation: 100, lightness: 50 },
    'orange': { hue: 30, saturation: 100, lightness: 50 },
    'yellow': { hue: 60, saturation: 100, lightness: 50 },
    'green': { hue: 120, saturation: 100, lightness: 50 },
    'blue': { hue: 240, saturation: 100, lightness: 50 },
    'purple': { hue: 270, saturation: 100, lightness: 50 },
    'pink': { hue: 330, saturation: 100, lightness: 75 },
    'brown': { hue: 30, saturation: 40, lightness: 30 },
    'black': { hue: 0, saturation: 0, lightness: 0 },
    'white': { hue: 0, saturation: 0, lightness: 100 },
    'grey': { hue: 0, saturation: 0, lightness: 50 },
    'gray': { hue: 0, saturation: 0, lightness: 50 },
    'beige': { hue: 30, saturation: 20, lightness: 80 },
    'navy': { hue: 240, saturation: 100, lightness: 25 },
    'cream': { hue: 50, saturation: 20, lightness: 90 }
  };

  private neutralColors = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'cream', 'brown'];

  calculateColorHarmony(colors: string[]): number {
    if (colors.length < 2) return 0.5;

    let harmonyScore = 0;
    let totalComparisons = 0;

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = this.parseColor(colors[i]);
        const color2 = this.parseColor(colors[j]);
        
        if (color1 && color2) {
          harmonyScore += this.calculatePairHarmony(color1, color2);
          totalComparisons++;
        }
      }
    }

    return totalComparisons > 0 ? harmonyScore / totalComparisons : 0.5;
  }

  private parseColor(colorName: string): { hue: number; saturation: number; lightness: number } | null {
    const normalizedColor = colorName.toLowerCase().trim();
    return this.colorMap[normalizedColor] || null;
  }

  private calculatePairHarmony(color1: any, color2: any): number {
    // Check for neutrals - they go with everything
    if (color1.saturation === 0 || color2.saturation === 0) return 0.9;

    const hueDiff = Math.abs(color1.hue - color2.hue);
    const adjustedHueDiff = Math.min(hueDiff, 360 - hueDiff);

    // Complementary colors (opposite on color wheel)
    if (adjustedHueDiff >= 150 && adjustedHueDiff <= 210) return 0.85;
    
    // Analogous colors (adjacent on color wheel)
    if (adjustedHueDiff <= 30) return 0.8;
    
    // Triadic colors (120 degrees apart)
    if (Math.abs(adjustedHueDiff - 120) <= 15) return 0.75;
    
    // Split-complementary
    if ((adjustedHueDiff >= 135 && adjustedHueDiff <= 165) || 
        (adjustedHueDiff >= 195 && adjustedHueDiff <= 225)) return 0.7;

    // Default compatibility
    return 0.4;
  }

  generateColorPalette(baseColors: string[]): ColorHarmony {
    const primaryColor = baseColors[0] || 'navy';
    const primary = this.parseColor(primaryColor);
    
    if (!primary) {
      return {
        primary: primaryColor,
        secondary: ['white', 'black'],
        accent: ['grey'],
        neutrals: ['beige', 'cream']
      };
    }

    const complementaryHue = (primary.hue + 180) % 360;
    const analogousHues = [
      (primary.hue + 30) % 360,
      (primary.hue - 30 + 360) % 360
    ];

    return {
      primary: primaryColor,
      secondary: this.findColorsByHue(analogousHues),
      accent: this.findColorsByHue([complementaryHue]),
      neutrals: this.neutralColors
    };
  }

  private findColorsByHue(hues: number[]): string[] {
    return hues.map(hue => {
      const closestColor = Object.entries(this.colorMap).reduce((closest, [name, color]) => {
        const currentDiff = Math.abs(color.hue - hue);
        const closestDiff = Math.abs(this.colorMap[closest].hue - hue);
        return currentDiff < closestDiff ? name : closest;
      }, 'blue');
      return closestColor;
    });
  }
}

class StyleIntelligenceEngine {
  private styleRules = {
    casual: {
      formality: [1, 4],
      silhouettes: ['relaxed', 'oversized', 'regular'],
      fabrics: ['cotton', 'denim', 'jersey', 'knit'],
      combinations: {
        'tops': ['t-shirt', 'sweater', 'hoodie', 'blouse'],
        'bottoms': ['jeans', 'shorts', 'leggings', 'casual pants']
      }
    },
    business: {
      formality: [6, 8],
      silhouettes: ['tailored', 'structured', 'fitted'],
      fabrics: ['wool', 'cotton blend', 'polyester', 'silk'],
      combinations: {
        'tops': ['blouse', 'button-down', 'blazer'],
        'bottoms': ['trousers', 'pencil skirt', 'dress pants']
      }
    },
    formal: {
      formality: [8, 10],
      silhouettes: ['tailored', 'fitted', 'structured'],
      fabrics: ['silk', 'wool', 'cashmere', 'satin'],
      combinations: {
        'tops': ['dress shirt', 'silk blouse', 'formal blazer'],
        'bottoms': ['formal trousers', 'evening skirt', 'dress pants']
      }
    },
    bohemian: {
      formality: [2, 5],
      silhouettes: ['flowy', 'relaxed', 'oversized'],
      fabrics: ['cotton', 'linen', 'chiffon', 'crochet'],
      combinations: {
        'tops': ['peasant blouse', 'kimono', 'off-shoulder top'],
        'bottoms': ['maxi skirt', 'wide-leg pants', 'flowy shorts']
      }
    }
  };

  calculateStyleCoherence(items: WardrobeItem[], targetStyle: string): number {
    const rules = this.styleRules[targetStyle as keyof typeof this.styleRules];
    if (!rules) return 0.5;

    let coherenceScore = 0;
    let totalChecks = 0;

    items.forEach(item => {
      // Check formality level
      if (item.formality_level) {
        const isInRange = item.formality_level >= rules.formality[0] && 
                         item.formality_level <= rules.formality[1];
        coherenceScore += isInRange ? 1 : 0;
        totalChecks++;
      }

      // Check silhouette compatibility
      if (item.silhouette && rules.silhouettes.includes(item.silhouette)) {
        coherenceScore += 1;
        totalChecks++;
      }

      // Check fabric appropriateness
      if (item.fabric && rules.fabrics.includes(item.fabric)) {
        coherenceScore += 1;
        totalChecks++;
      }

      // Check category combinations
      const categoryItems = rules.combinations[item.category as keyof typeof rules.combinations];
      if (categoryItems) {
        const itemTypeMatch = categoryItems.some(type => 
          item.name.toLowerCase().includes(type) || 
          item.tags.some(tag => tag.toLowerCase().includes(type))
        );
        coherenceScore += itemTypeMatch ? 1 : 0;
        totalChecks++;
      }
    });

    return totalChecks > 0 ? coherenceScore / totalChecks : 0.5;
  }

  validateOutfitStructure(items: WardrobeItem[]): { isValid: boolean; score: number; issues: string[] } {
    const categories = items.map(item => item.category.toLowerCase());
    const issues: string[] = [];
    let structureScore = 1.0;

    // Check for essential pieces
    const hasTop = categories.some(cat => ['tops', 'shirts', 'blouses', 'sweaters'].includes(cat));
    const hasBottom = categories.some(cat => ['bottoms', 'pants', 'skirts', 'shorts'].includes(cat));
    const hasDress = categories.includes('dresses');
    const hasShoes = categories.some(cat => ['shoes', 'footwear'].includes(cat));

    // Must have either (top + bottom) OR dress
    if (!hasDress && (!hasTop || !hasBottom)) {
      issues.push('Incomplete outfit: needs either a dress or both top and bottom');
      structureScore -= 0.4;
    }

    // Recommend shoes
    if (!hasShoes) {
      issues.push('Consider adding footwear to complete the look');
      structureScore -= 0.1;
    }

    // Check for style conflicts
    const formalityLevels = items.filter(item => item.formality_level).map(item => item.formality_level!);
    if (formalityLevels.length > 1) {
      const maxFormality = Math.max(...formalityLevels);
      const minFormality = Math.min(...formalityLevels);
      if (maxFormality - minFormality > 4) {
        issues.push('Formality mismatch: mixing very casual and formal pieces');
        structureScore -= 0.3;
      }
    }

    return {
      isValid: structureScore > 0.6,
      score: Math.max(0, structureScore),
      issues
    };
  }
}

class WeatherStyleEngine {
  calculateWeatherAppropriateness(items: WardrobeItem[], weather: WeatherData): number {
    let appropriatenessScore = 0;
    let totalChecks = 0;

    items.forEach(item => {
      // Temperature appropriateness
      const tempScore = this.calculateTemperatureScore(item, weather.temperature);
      appropriatenessScore += tempScore;
      totalChecks++;

      // Weather condition appropriateness
      const conditionScore = this.calculateConditionScore(item, weather.condition);
      appropriatenessScore += conditionScore;
      totalChecks++;

      // Fabric breathability for humidity
      if (weather.humidity > 70) {
        const breathabilityScore = this.calculateBreathabilityScore(item);
        appropriatenessScore += breathabilityScore;
        totalChecks++;
      }
    });

    return totalChecks > 0 ? appropriatenessScore / totalChecks : 0.5;
  }

  private calculateTemperatureScore(item: WardrobeItem, temperature: number): number {
    // Very cold (< 0°C)
    if (temperature < 0) {
      if (item.category === 'outerwear' && item.tags.includes('insulated')) return 1.0;
      if (item.tags.includes('wool') || item.tags.includes('thermal')) return 0.9;
      if (item.category === 'tops' && item.tags.includes('long-sleeve')) return 0.7;
      if (item.tags.includes('summer') || item.tags.includes('shorts')) return 0.1;
      return 0.6;
    }
    
    // Cold (0-10°C)
    if (temperature < 10) {
      if (item.category === 'outerwear') return 0.9;
      if (item.tags.includes('warm') || item.tags.includes('wool')) return 0.8;
      if (item.tags.includes('long-sleeve')) return 0.7;
      if (item.tags.includes('summer')) return 0.2;
      return 0.6;
    }
    
    // Cool (10-18°C)
    if (temperature < 18) {
      if (item.category === 'outerwear' && item.tags.includes('light')) return 0.8;
      if (item.tags.includes('long-sleeve')) return 0.8;
      if (item.tags.includes('layering')) return 0.9;
      if (item.tags.includes('heavy')) return 0.3;
      return 0.7;
    }
    
    // Warm (18-25°C)
    if (temperature < 25) {
      if (item.category === 'outerwear') return 0.4;
      if (item.tags.includes('light') || item.tags.includes('breathable')) return 0.9;
      if (item.tags.includes('cotton')) return 0.8;
      if (item.tags.includes('heavy') || item.tags.includes('wool')) return 0.4;
      return 0.8;
    }
    
    // Hot (25°C+)
    if (item.category === 'outerwear') return 0.1;
    if (item.tags.includes('light') || item.tags.includes('breathable')) return 1.0;
    if (item.tags.includes('linen') || item.tags.includes('cotton')) return 0.9;
    if (item.tags.includes('short-sleeve') || item.tags.includes('shorts')) return 0.9;
    if (item.tags.includes('heavy') || item.tags.includes('wool')) return 0.2;
    return 0.7;
  }

  private calculateConditionScore(item: WardrobeItem, condition: string): number {
    switch (condition.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        if (item.tags.includes('waterproof') || item.tags.includes('water-resistant')) return 1.0;
        if (item.category === 'outerwear') return 0.8;
        if (item.fabric === 'leather' || item.fabric === 'suede') return 0.2;
        if (item.tags.includes('delicate')) return 0.3;
        return 0.7;
      
      case 'snow':
        if (item.tags.includes('insulated') || item.tags.includes('warm')) return 1.0;
        if (item.category === 'shoes' && item.tags.includes('boots')) return 0.9;
        if (item.tags.includes('open-toe')) return 0.1;
        return 0.6;
      
      case 'windy':
        if (item.silhouette === 'fitted' || item.silhouette === 'structured') return 0.9;
        if (item.silhouette === 'flowy' || item.tags.includes('loose')) return 0.4;
        return 0.7;
      
      default:
        return 0.8;
    }
  }

  private calculateBreathabilityScore(item: WardrobeItem): number {
    if (item.fabric === 'linen' || item.fabric === 'cotton') return 1.0;
    if (item.tags.includes('breathable') || item.tags.includes('moisture-wicking')) return 0.9;
    if (item.fabric === 'synthetic' || item.fabric === 'polyester') return 0.5;
    if (item.fabric === 'wool' || item.fabric === 'cashmere') return 0.3;
    return 0.7;
  }

  generateLayeringStrategy(items: WardrobeItem[], weather: WeatherData): {
    base: WardrobeItem[];
    mid: WardrobeItem[];
    outer: WardrobeItem[];
    accessories: WardrobeItem[];
  } {
    const strategy = {
      base: items.filter(item => ['tops', 'bottoms', 'dresses'].includes(item.category)),
      mid: items.filter(item => item.tags.includes('layering') || ['sweaters', 'cardigans'].includes(item.category)),
      outer: items.filter(item => item.category === 'outerwear'),
      accessories: items.filter(item => ['accessories', 'shoes'].includes(item.category))
    };

    // Adjust based on temperature
    if (weather.temperature > 20) {
      strategy.outer = []; // Remove outerwear for warm weather
      strategy.mid = strategy.mid.filter(item => item.tags.includes('light'));
    }

    return strategy;
  }
}

export class AdvancedStyleAI {
  private colorEngine = new ColorTheoryEngine();
  private styleEngine = new StyleIntelligenceEngine();
  private weatherEngine = new WeatherStyleEngine();
  private userFeedbackHistory: { [userId: string]: { [outfitId: string]: number } } = {};

  generateRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: StyleProfile,
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData },
    includeAccessories: boolean = true
  ): OutfitRecommendation[] {
    console.log('Advanced AI generating recommendations for:', {
      itemCount: wardrobeItems.length,
      occasion: context.occasion,
      weather: context.weather?.temperature
    });

    // Pre-filter items by occasion and season
    const seasonalItems = this.filterBySeasonAndOccasion(wardrobeItems, context);
    
    if (seasonalItems.length < 2) {
      console.log('Insufficient items for recommendations');
      return [];
    }

    // Generate outfit combinations using advanced logic
    const combinations = this.generateIntelligentCombinations(
      seasonalItems, 
      profile, 
      context, 
      includeAccessories
    );

    // Score each combination comprehensively
    const scoredOutfits = combinations.map(items => 
      this.comprehensiveOutfitScoring(items, profile, context)
    );

    // Filter and sort by overall quality
    const qualityOutfits = scoredOutfits
      .filter(outfit => outfit.confidence > 0.6)
      .sort((a, b) => {
        // Prioritize by overall quality score
        const aQuality = (a.confidence + a.style_score + a.color_harmony_score) / 3;
        const bQuality = (b.confidence + b.style_score + b.color_harmony_score) / 3;
        return bQuality - aQuality;
      });

    console.log(`Generated ${qualityOutfits.length} quality recommendations`);
    return qualityOutfits.slice(0, 6);
  }

  private filterBySeasonAndOccasion(items: WardrobeItem[], context: any): WardrobeItem[] {
    const currentMonth = new Date().getMonth();
    const currentSeason = this.getCurrentSeason(currentMonth);

    return items.filter(item => {
      // Season filtering
      const seasonMatch = item.season.includes(currentSeason) || 
                         item.season.includes('all') || 
                         item.season.length === 0;

      // Occasion filtering with flexibility
      const occasionMatch = item.occasion.includes(context.occasion) ||
                           item.occasion.includes('versatile') ||
                           item.occasion.includes('casual') ||
                           (context.occasion === 'casual' && item.occasion.length === 0);

      return seasonMatch && occasionMatch;
    });
  }

  private getCurrentSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private generateIntelligentCombinations(
    items: WardrobeItem[],
    profile: StyleProfile,
    context: any,
    includeAccessories: boolean
  ): WardrobeItem[][] {
    const combinations: WardrobeItem[][] = [];
    
    // Group items by category for intelligent pairing
    const itemsByCategory = this.groupItemsByCategory(items);
    
    // Generate dress-based outfits
    if (itemsByCategory.dresses) {
      itemsByCategory.dresses.forEach(dress => {
        const outfit = [dress];
        
        // Add complementary pieces
        this.addComplementaryPieces(outfit, itemsByCategory, profile, context);
        
        if (this.isOutfitValid(outfit)) {
          combinations.push([...outfit]);
        }
      });
    }

    // Generate top + bottom combinations
    if (itemsByCategory.tops && itemsByCategory.bottoms) {
      itemsByCategory.tops.forEach(top => {
        itemsByCategory.bottoms.forEach(bottom => {
          // Check style compatibility before proceeding
          if (this.areItemsStyleCompatible(top, bottom, profile.preferred_style)) {
            const outfit = [top, bottom];
            
            // Add complementary pieces
            this.addComplementaryPieces(outfit, itemsByCategory, profile, context);
            
            if (this.isOutfitValid(outfit)) {
              combinations.push([...outfit]);
            }
          }
        });
      });
    }

    return combinations.slice(0, 20); // Limit combinations for performance
  }

  private groupItemsByCategory(items: WardrobeItem[]) {
    const groups: { [key: string]: WardrobeItem[] } = {};
    
    items.forEach(item => {
      const category = item.category.toLowerCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return groups;
  }

  private areItemsStyleCompatible(item1: WardrobeItem, item2: WardrobeItem, preferredStyle: string): boolean {
    // Check color compatibility
    const colorHarmony = this.colorEngine.calculateColorHarmony([...item1.color, ...item2.color]);
    if (colorHarmony < 0.4) return false;

    // Check formality compatibility
    if (item1.formality_level && item2.formality_level) {
      const formalityDiff = Math.abs(item1.formality_level - item2.formality_level);
      if (formalityDiff > 3) return false;
    }

    // Check style compatibility
    const styleCoherence = this.styleEngine.calculateStyleCoherence([item1, item2], preferredStyle);
    return styleCoherence > 0.5;
  }

  private addComplementaryPieces(
    outfit: WardrobeItem[], 
    itemsByCategory: { [key: string]: WardrobeItem[] },
    profile: StyleProfile,
    context: any
  ) {
    // Add shoes if available
    if (itemsByCategory.shoes && !outfit.some(item => item.category === 'shoes')) {
      const compatibleShoes = itemsByCategory.shoes.find(shoe => 
        this.isItemCompatibleWithOutfit(shoe, outfit, profile)
      );
      if (compatibleShoes) outfit.push(compatibleShoes);
    }

    // Add outerwear based on weather
    if (context.weather && context.weather.temperature < 18 && itemsByCategory.outerwear) {
      const suitableOuterwear = itemsByCategory.outerwear.find(jacket => 
        this.isItemCompatibleWithOutfit(jacket, outfit, profile) &&
        this.weatherEngine.calculateWeatherAppropriateness([jacket], context.weather) > 0.7
      );
      if (suitableOuterwear) outfit.push(suitableOuterwear);
    }

    // Add accessories if requested
    if (includeAccessories && itemsByCategory.accessories) {
      const suitableAccessory = itemsByCategory.accessories.find(accessory => 
        this.isItemCompatibleWithOutfit(accessory, outfit, profile)
      );
      if (suitableAccessory) outfit.push(suitableAccessory);
    }
  }

  private isItemCompatibleWithOutfit(item: WardrobeItem, outfit: WardrobeItem[], profile: StyleProfile): boolean {
    const allItems = [...outfit, item];
    
    // Check color harmony
    const allColors = allItems.flatMap(i => i.color);
    const colorScore = this.colorEngine.calculateColorHarmony(allColors);
    
    // Check style coherence
    const styleScore = this.styleEngine.calculateStyleCoherence(allItems, profile.preferred_style);
    
    return colorScore > 0.5 && styleScore > 0.5;
  }

  private isOutfitValid(outfit: WardrobeItem[]): boolean {
    const validation = this.styleEngine.validateOutfitStructure(outfit);
    return validation.isValid;
  }

  private comprehensiveOutfitScoring(
    items: WardrobeItem[],
    profile: StyleProfile,
    context: any
  ): OutfitRecommendation {
    // Color harmony scoring
    const allColors = items.flatMap(item => item.color);
    const colorHarmonyScore = this.colorEngine.calculateColorHarmony(allColors);

    // Style coherence scoring
    const styleScore = this.styleEngine.calculateStyleCoherence(items, profile.preferred_style);

    // Weather appropriateness
    const weatherScore = context.weather ? 
      this.weatherEngine.calculateWeatherAppropriateness(items, context.weather) : 0.7;

    // Structure validation
    const structureValidation = this.styleEngine.validateOutfitStructure(items);

    // Calculate overall confidence
    const confidence = (
      colorHarmonyScore * 0.25 +
      styleScore * 0.3 +
      weatherScore * 0.2 +
      structureValidation.score * 0.15 +
      this.calculateTrendRelevance(items) * 0.1
    );

    // Generate reasoning
    const reasoning = this.generateOutfitReasoning(items, {
      colorScore: colorHarmonyScore,
      styleScore,
      weatherScore,
      structureScore: structureValidation.score
    });

    return {
      id: items.map(i => i.id).sort().join('-'),
      items,
      occasion: context.occasion,
      style: this.determineOutfitStyle(items),
      confidence: Math.min(1, Math.max(0, confidence)),
      description: this.generateAdvancedDescription(items, context),
      reasoning,
      style_score: styleScore,
      color_harmony_score: colorHarmonyScore,
      weather_appropriateness: weatherScore,
      trend_relevance: this.calculateTrendRelevance(items)
    };
  }

  private calculateTrendRelevance(items: WardrobeItem[]): number {
    // Simple trend scoring based on item tags and recency
    const trendTags = ['trendy', 'contemporary', 'modern', 'updated', 'current'];
    let trendScore = 0;
    
    items.forEach(item => {
      const hasTrendTags = item.tags.some(tag => 
        trendTags.some(trendTag => tag.toLowerCase().includes(trendTag))
      );
      if (hasTrendTags) trendScore += 0.2;
    });

    return Math.min(1, trendScore);
  }

  private generateOutfitReasoning(items: WardrobeItem[], scores: any): string[] {
    const reasoning: string[] = [];

    if (scores.colorScore > 0.8) {
      reasoning.push('Excellent color harmony with sophisticated palette coordination');
    } else if (scores.colorScore > 0.6) {
      reasoning.push('Good color balance with complementary tones');
    }

    if (scores.styleScore > 0.8) {
      reasoning.push('Perfect style coherence matching your aesthetic preferences');
    } else if (scores.styleScore > 0.6) {
      reasoning.push('Cohesive styling with consistent fashion sensibility');
    }

    if (scores.weatherScore > 0.8) {
      reasoning.push('Ideally suited for current weather conditions');
    }

    if (scores.structureScore > 0.9) {
      reasoning.push('Impeccable outfit structure with perfect proportions');
    }

    // Add specific combination insights
    const categories = items.map(item => item.category);
    if (categories.includes('dresses')) {
      reasoning.push('Elegant dress-based ensemble with coordinated accessories');
    } else if (categories.includes('tops') && categories.includes('bottoms')) {
      reasoning.push('Classic separates combination with balanced proportions');
    }

    return reasoning.slice(0, 3); // Limit to top 3 reasons
  }

  private determineOutfitStyle(items: WardrobeItem[]): string {
    const styles = items.map(item => item.style);
    const styleFrequency: { [key: string]: number } = {};
    
    styles.forEach(style => {
      styleFrequency[style] = (styleFrequency[style] || 0) + 1;
    });

    return Object.entries(styleFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'contemporary';
  }

  private generateAdvancedDescription(items: WardrobeItem[], context: any): string {
    const style = this.determineOutfitStyle(items);
    const categories = items.map(item => item.category);
    
    let description = '';
    
    if (categories.includes('dresses')) {
      description = `Sophisticated ${style} dress ensemble`;
    } else {
      description = `Curated ${style} combination`;
    }

    // Add context
    description += ` perfect for ${context.occasion}`;

    // Add weather context
    if (context.weather) {
      if (context.weather.temperature < 10) {
        description += ' with weather-appropriate layering';
      } else if (context.weather.temperature > 25) {
        description += ' optimized for warm weather comfort';
      }
    }

    return description;
  }

  // Learning from user feedback
  recordUserFeedback(userId: string, outfitId: string, rating: number) {
    if (!this.userFeedbackHistory[userId]) {
      this.userFeedbackHistory[userId] = {};
    }
    this.userFeedbackHistory[userId][outfitId] = rating;
  }

  private getUserPreferenceWeight(userId: string, outfit: WardrobeItem[]): number {
    const userHistory = this.userFeedbackHistory[userId];
    if (!userHistory) return 1.0;

    // Simple preference learning - could be much more sophisticated
    const outfitColors = outfit.flatMap(item => item.color);
    const outfitStyles = outfit.map(item => item.style);
    
    let preferenceScore = 1.0;
    
    Object.entries(userHistory).forEach(([outfitId, rating]) => {
      // This is a simplified version - in reality you'd store outfit details
      // and do more sophisticated preference matching
      if (rating > 3) {
        preferenceScore += 0.1;
      } else if (rating < 3) {
        preferenceScore -= 0.1;
      }
    });

    return Math.max(0.5, Math.min(2.0, preferenceScore));
  }
}

// Export singleton instance
export const advancedStyleAI = new AdvancedStyleAI();
