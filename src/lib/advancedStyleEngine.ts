
import { WardrobeItem, StyleProfile, OutfitRecommendation, OutfitContext, WeatherData, UserFeedback } from '@/types/wardrobe';

// Color theory and fashion rules engine
class ColorTheory {
  private static readonly NEUTRAL_COLORS = [
    'black', 'white', 'grey', 'gray', 'beige', 'navy', 'brown', 'cream', 'tan', 'khaki'
  ];

  private static readonly COMPLEMENTARY_PAIRS = [
    ['red', 'green'], ['blue', 'orange'], ['yellow', 'purple'], ['pink', 'mint'],
    ['coral', 'teal'], ['burgundy', 'forest'], ['lavender', 'sage']
  ];

  private static readonly ANALOGOUS_GROUPS = [
    ['red', 'orange', 'pink'], ['blue', 'purple', 'teal'], ['green', 'yellow', 'lime'],
    ['brown', 'tan', 'beige'], ['navy', 'blue', 'teal']
  ];

  static calculateColorHarmony(colors: string[]): number {
    if (colors.length < 2) return 1;

    const colorLower = colors.map(c => c.toLowerCase());
    let harmonyScore = 0;
    let totalComparisons = 0;

    // Check for neutral combinations (always harmonious)
    const neutralCount = colorLower.filter(c => 
      this.NEUTRAL_COLORS.some(neutral => c.includes(neutral))
    ).length;

    if (neutralCount >= colors.length - 1) {
      harmonyScore += 0.8;
    }

    // Check complementary colors
    for (const [color1, color2] of this.COMPLEMENTARY_PAIRS) {
      const hasColor1 = colorLower.some(c => c.includes(color1));
      const hasColor2 = colorLower.some(c => c.includes(color2));
      if (hasColor1 && hasColor2) {
        harmonyScore += 0.7;
        totalComparisons++;
      }
    }

    // Check analogous colors
    for (const group of this.ANALOGOUS_GROUPS) {
      const matchingColors = colorLower.filter(c => 
        group.some(groupColor => c.includes(groupColor))
      ).length;
      if (matchingColors >= 2) {
        harmonyScore += 0.6;
        totalComparisons++;
      }
    }

    // Penalize too many different colors
    if (colors.length > 4) {
      harmonyScore -= 0.2;
    }

    return Math.min(1, Math.max(0, harmonyScore / Math.max(1, totalComparisons)));
  }

  static isSeasonallyAppropriate(colors: string[], season: string): boolean {
    const seasonalColors = {
      spring: ['pink', 'yellow', 'green', 'light', 'pastel'],
      summer: ['white', 'light', 'bright', 'coral', 'turquoise'],
      fall: ['brown', 'orange', 'red', 'burgundy', 'gold', 'rust'],
      winter: ['black', 'white', 'navy', 'grey', 'jewel', 'deep']
    };

    const seasonColors = seasonalColors[season as keyof typeof seasonalColors] || [];
    return colors.some(color => 
      seasonColors.some(seasonColor => 
        color.toLowerCase().includes(seasonColor)
      )
    );
  }
}

class FashionRules {
  static calculateStyleCoherence(items: WardrobeItem[]): number {
    if (items.length < 2) return 1;

    const styles = items.map(item => item.style);
    const uniqueStyles = new Set(styles);

    // Perfect coherence if all items have the same style
    if (uniqueStyles.size === 1) return 1;

    // Check for compatible style combinations
    const compatibleCombos = [
      ['casual', 'smart-casual'],
      ['business', 'formal'],
      ['bohemian', 'casual'],
      ['minimalist', 'modern'],
      ['vintage', 'classic']
    ];

    for (const combo of compatibleCombos) {
      const matchingStyles = styles.filter(style => combo.includes(style));
      if (matchingStyles.length === styles.length) {
        return 0.8;
      }
    }

    // Penalize completely mismatched styles
    return Math.max(0.3, 1 - (uniqueStyles.size - 1) * 0.2);
  }

  static isOccasionAppropriate(items: WardrobeItem[], occasion: string): number {
    const appropriateItems = items.filter(item => 
      item.occasion.includes(occasion) || 
      item.occasion.includes('versatile') ||
      (occasion === 'casual' && item.occasion.includes('everyday'))
    );

    return appropriateItems.length / items.length;
  }

  static calculateWeatherAppropriate(items: WardrobeItem[], weather: WeatherData): number {
    let score = 0;
    const temp = weather.temperature;
    const condition = weather.condition.toLowerCase();

    items.forEach(item => {
      const tags = item.tags.map(t => t.toLowerCase());
      const category = item.category.toLowerCase();

      // Temperature appropriateness
      if (temp < 5) {
        // Very cold
        if (category === 'outerwear' || tags.includes('warm') || tags.includes('insulated')) score += 1;
        if (tags.includes('wool') || tags.includes('fleece')) score += 0.5;
        if (tags.includes('shorts') || tags.includes('tank')) score -= 1;
      } else if (temp < 15) {
        // Cool
        if (tags.includes('long-sleeve') || category === 'outerwear') score += 0.5;
        if (tags.includes('light') && category !== 'outerwear') score += 0.3;
      } else if (temp > 25) {
        // Hot
        if (category === 'outerwear') score -= 1;
        if (tags.includes('light') || tags.includes('breathable')) score += 1;
        if (tags.includes('shorts') || tags.includes('tank')) score += 0.5;
        if (tags.includes('heavy') || tags.includes('wool')) score -= 0.5;
      }

      // Weather condition appropriateness
      if (condition.includes('rain')) {
        if (tags.includes('waterproof') || tags.includes('water-resistant')) score += 1;
        if (category === 'shoes' && !tags.includes('open-toe')) score += 0.5;
      }

      if (condition.includes('snow')) {
        if (category === 'outerwear' || tags.includes('warm')) score += 1;
        if (tags.includes('boots') || tags.includes('closed-toe')) score += 0.5;
      }
    });

    return Math.max(0, Math.min(1, score / items.length));
  }
}

class UserLearning {
  private static feedbackHistory: Map<string, UserFeedback[]> = new Map();

  static addFeedback(userId: string, feedback: UserFeedback) {
    if (!this.feedbackHistory.has(userId)) {
      this.feedbackHistory.set(userId, []);
    }
    this.feedbackHistory.get(userId)!.push(feedback);
  }

  static getUserPreferences(userId: string): {
    preferredStyles: string[];
    preferredColors: string[];
    preferredCategories: string[];
    avoidedCombinations: string[][];
  } {
    const feedbacks = this.feedbackHistory.get(userId) || [];
    const liked = feedbacks.filter(f => f.rating >= 4);
    const disliked = feedbacks.filter(f => f.rating <= 2);

    return {
      preferredStyles: this.extractPreferences(liked, 'style'),
      preferredColors: this.extractPreferences(liked, 'colors'),
      preferredCategories: this.extractPreferences(liked, 'categories'),
      avoidedCombinations: this.extractAvoidedCombinations(disliked)
    };
  }

  private static extractPreferences(feedbacks: UserFeedback[], type: string): string[] {
    // This would analyze feedback to extract preferences
    // Simplified implementation for now
    return [];
  }

  private static extractAvoidedCombinations(feedbacks: UserFeedback[]): string[][] {
    // This would analyze disliked combinations
    // Simplified implementation for now
    return [];
  }
}

export class AdvancedStyleEngine {
  private cache: Map<string, OutfitRecommendation[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  generateRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: StyleProfile,
    context: OutfitContext,
    options: {
      maxRecommendations?: number;
      includeAccessories?: boolean;
      diversityFactor?: number;
    } = {}
  ): OutfitRecommendation[] {
    const {
      maxRecommendations = 6,
      includeAccessories = true,
      diversityFactor = 0.7
    } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(wardrobeItems, profile, context, options);
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Filter items based on context
    const filteredItems = this.filterItemsByContext(wardrobeItems, context);
    
    if (filteredItems.length < 2) {
      return [];
    }

    // Generate outfit combinations
    const combinations = this.generateCombinations(filteredItems, includeAccessories);
    
    // Score each combination
    const scoredOutfits = combinations.map(items => 
      this.scoreOutfit(items, profile, context)
    );

    // Apply diversity and personal preferences
    const recommendations = this.selectDiverseRecommendations(
      scoredOutfits,
      maxRecommendations,
      diversityFactor
    );

    // Cache results
    this.cache.set(cacheKey, recommendations);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

    return recommendations;
  }

  private filterItemsByContext(items: WardrobeItem[], context: OutfitContext): WardrobeItem[] {
    return items.filter(item => {
      // Occasion filter
      if (!item.occasion.includes(context.occasion) && 
          !item.occasion.includes('versatile') && 
          !(context.occasion === 'casual' && item.occasion.includes('everyday'))) {
        return false;
      }

      // Season filter
      if (context.season) {
        if (!item.season.includes(context.season) && 
            !item.season.includes('all') && 
            !item.season.includes('year-round')) {
          return false;
        }
      }

      // Weather-based filtering
      if (context.weather) {
        const temp = context.weather.temperature;
        const tags = item.tags.map(t => t.toLowerCase());
        
        // Exclude inappropriate items for extreme weather
        if (temp > 30 && item.category === 'outerwear') return false;
        if (temp < 0 && tags.includes('shorts')) return false;
        if (context.weather.condition.includes('rain') && tags.includes('delicate')) return false;
      }

      return true;
    });
  }

  private generateCombinations(items: WardrobeItem[], includeAccessories: boolean): WardrobeItem[][] {
    const combinations: WardrobeItem[][] = [];
    const categories = this.groupByCategory(items);

    const tops = categories.tops || [];
    const bottoms = categories.bottoms || [];
    const dresses = categories.dresses || [];
    const shoes = categories.shoes || [];
    const outerwear = categories.outerwear || [];
    const accessories = includeAccessories ? (categories.accessories || []) : [];

    // Generate dress-based outfits
    dresses.forEach(dress => {
      shoes.forEach(shoe => {
        const outfit = [dress, shoe];
        
        // Add outerwear occasionally
        if (Math.random() > 0.7 && outerwear.length > 0) {
          const compatibleOuterwear = outerwear.find(coat => 
            ColorTheory.calculateColorHarmony([...dress.color, ...coat.color]) > 0.5
          );
          if (compatibleOuterwear) outfit.push(compatibleOuterwear);
        }

        // Add accessories
        if (accessories.length > 0 && Math.random() > 0.6) {
          const accessory = accessories[Math.floor(Math.random() * accessories.length)];
          outfit.push(accessory);
        }

        combinations.push(outfit);
      });
    });

    // Generate top + bottom combinations
    tops.forEach(top => {
      bottoms.forEach(bottom => {
        if (ColorTheory.calculateColorHarmony([...top.color, ...bottom.color]) > 0.4) {
          shoes.forEach(shoe => {
            const outfit = [top, bottom, shoe];

            // Add outerwear
            if (Math.random() > 0.8 && outerwear.length > 0) {
              const compatibleOuterwear = outerwear.find(coat =>
                ColorTheory.calculateColorHarmony([...top.color, ...bottom.color, ...coat.color]) > 0.4
              );
              if (compatibleOuterwear) outfit.push(compatibleOuterwear);
            }

            // Add accessories
            if (accessories.length > 0 && Math.random() > 0.7) {
              const accessory = accessories[Math.floor(Math.random() * accessories.length)];
              outfit.push(accessory);
            }

            combinations.push(outfit);
          });
        }
      });
    });

    return combinations.slice(0, 50); // Limit combinations for performance
  }

  private scoreOutfit(items: WardrobeItem[], profile: StyleProfile, context: OutfitContext): OutfitRecommendation {
    const colors = items.flatMap(item => item.color);
    
    // Calculate individual scores
    const colorHarmony = ColorTheory.calculateColorHarmony(colors);
    const styleCoherence = FashionRules.calculateStyleCoherence(items);
    const weatherAppropriate = context.weather ? 
      FashionRules.calculateWeatherAppropriate(items, context.weather) : 0.8;
    
    // Personal fit score
    const personalFit = this.calculatePersonalFit(items, profile);
    
    // Trend relevance (simplified)
    const trendRelevance = this.calculateTrendRelevance(items);
    
    // Versatility score
    const versatility = this.calculateVersatility(items);

    // Weighted overall confidence
    const confidence = (
      colorHarmony * 0.25 +
      styleCoherence * 0.25 +
      weatherAppropriate * 0.15 +
      personalFit * 0.20 +
      trendRelevance * 0.10 +
      versatility * 0.05
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      items, colorHarmony, styleCoherence, weatherAppropriate, personalFit, context
    );

    return {
      id: items.map(i => i.id).join('-'),
      items,
      occasion: context.occasion,
      style: this.determineOverallStyle(items),
      confidence: Math.min(1, Math.max(0, confidence)),
      description: this.generateDescription(items, context),
      reasoning,
      colorHarmony,
      styleCoherence,
      weatherAppropriate,
      trendRelevance,
      versatility,
      personalFit
    };
  }

  private calculatePersonalFit(items: WardrobeItem[], profile: StyleProfile): number {
    let score = 0;
    let factors = 0;

    // Style preference match
    const styleMatches = items.filter(item => item.style === profile.preferred_style).length;
    score += (styleMatches / items.length) * 0.4;
    factors += 0.4;

    // Color preference match
    if (profile.favorite_colors.length > 0) {
      const colorMatches = items.filter(item => 
        item.color.some(itemColor => 
          profile.favorite_colors.some(favColor => 
            itemColor.toLowerCase().includes(favColor.toLowerCase())
          )
        )
      ).length;
      score += (colorMatches / items.length) * 0.3;
      factors += 0.3;
    }

    // Goal alignment
    if (profile.goals.length > 0) {
      const goalAlignment = this.calculateGoalAlignment(items, profile.goals);
      score += goalAlignment * 0.3;
      factors += 0.3;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateGoalAlignment(items: WardrobeItem[], goals: string[]): number {
    // Simplified goal alignment calculation
    const goalKeywords = {
      'professional': ['business', 'formal', 'blazer', 'dress-shirt'],
      'casual': ['casual', 'comfortable', 'relaxed'],
      'trendy': ['trendy', 'modern', 'fashionable'],
      'minimalist': ['minimalist', 'simple', 'basic'],
      'sustainable': ['sustainable', 'eco', 'organic']
    };

    let alignment = 0;
    goals.forEach(goal => {
      const keywords = goalKeywords[goal.toLowerCase() as keyof typeof goalKeywords] || [];
      const matchingItems = items.filter(item => 
        keywords.some(keyword => 
          item.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
          item.style.toLowerCase().includes(keyword)
        )
      );
      alignment += matchingItems.length / items.length;
    });

    return Math.min(1, alignment / goals.length);
  }

  private calculateTrendRelevance(items: WardrobeItem[]): number {
    // Simplified trend calculation - could be enhanced with actual trend data
    const trendyKeywords = ['trendy', 'modern', 'contemporary', 'current', '2024'];
    const trendyItems = items.filter(item => 
      trendyKeywords.some(keyword => 
        item.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        item.style.toLowerCase().includes(keyword)
      )
    );
    
    return trendyItems.length / items.length;
  }

  private calculateVersatility(items: WardrobeItem[]): number {
    const versatileItems = items.filter(item => 
      item.occasion.includes('versatile') || 
      item.occasion.length > 2 ||
      item.season.includes('all') ||
      item.season.length > 2
    );
    
    return versatileItems.length / items.length;
  }

  private generateReasoning(
    items: WardrobeItem[],
    colorHarmony: number,
    styleCoherence: number,
    weatherAppropriate: number,
    personalFit: number,
    context: OutfitContext
  ): string[] {
    const reasoning: string[] = [];

    if (colorHarmony > 0.8) {
      reasoning.push("Excellent color harmony with complementary tones");
    } else if (colorHarmony > 0.6) {
      reasoning.push("Good color coordination");
    }

    if (styleCoherence > 0.8) {
      reasoning.push("Perfectly cohesive style throughout");
    } else if (styleCoherence > 0.6) {
      reasoning.push("Well-matched style elements");
    }

    if (weatherAppropriate > 0.8 && context.weather) {
      reasoning.push(`Ideal for ${context.weather.condition} weather (${context.weather.temperature}°C)`);
    }

    if (personalFit > 0.8) {
      reasoning.push("Perfectly matches your personal style preferences");
    } else if (personalFit > 0.6) {
      reasoning.push("Aligns well with your style profile");
    }

    const categories = new Set(items.map(item => item.category));
    if (categories.size >= 3) {
      reasoning.push("Complete outfit with all essential pieces");
    }

    return reasoning.slice(0, 3); // Limit to top 3 reasons
  }

  private selectDiverseRecommendations(
    outfits: OutfitRecommendation[],
    maxRecommendations: number,
    diversityFactor: number
  ): OutfitRecommendation[] {
    // Sort by confidence first
    const sortedOutfits = outfits.sort((a, b) => b.confidence - a.confidence);
    
    const selected: OutfitRecommendation[] = [];
    const usedItems = new Set<string>();

    for (const outfit of sortedOutfits) {
      if (selected.length >= maxRecommendations) break;

      // Check diversity - how many items are already used
      const itemOverlap = outfit.items.filter(item => usedItems.has(item.id)).length;
      const overlapRatio = itemOverlap / outfit.items.length;

      // Accept outfit if it's diverse enough or has very high confidence
      if (overlapRatio < (1 - diversityFactor) || outfit.confidence > 0.9) {
        selected.push(outfit);
        outfit.items.forEach(item => usedItems.add(item.id));
      }
    }

    return selected;
  }

  private groupByCategory(items: WardrobeItem[]): Record<string, WardrobeItem[]> {
    const groups: Record<string, WardrobeItem[]> = {};
    
    items.forEach(item => {
      const category = item.category.toLowerCase();
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }

  private determineOverallStyle(items: WardrobeItem[]): string {
    const styles = items.map(item => item.style);
    const styleCounts = styles.reduce((acc, style) => {
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'casual';
  }

  private generateDescription(items: WardrobeItem[], context: OutfitContext): string {
    const categories = items.map(item => item.category);
    const style = this.determineOverallStyle(items);
    
    let description = '';
    
    if (categories.includes('dresses')) {
      description = `Elegant ${style} dress ensemble`;
    } else {
      const tops = categories.filter(cat => ['tops', 'shirts', 'blouses'].includes(cat));
      const bottoms = categories.filter(cat => ['bottoms', 'pants', 'skirts'].includes(cat));
      
      if (tops.length > 0 && bottoms.length > 0) {
        description = `Stylish ${style} combination`;
      } else {
        description = `Coordinated ${style} outfit`;
      }
    }

    description += ` perfect for ${context.occasion}`;

    if (context.weather) {
      if (context.weather.temperature < 10) {
        description += ' with cozy layers';
      } else if (context.weather.temperature > 25) {
        description += ' in breathable fabrics';
      }
    }

    return description;
  }

  private generateCacheKey(
    items: WardrobeItem[],
    profile: StyleProfile,
    context: OutfitContext,
    options: any
  ): string {
    const itemIds = items.map(i => i.id).sort().join(',');
    const contextStr = JSON.stringify(context);
    const optionsStr = JSON.stringify(options);
    const profileStr = `${profile.preferred_style}-${profile.favorite_colors.join(',')}-${profile.goals.join(',')}`;
    
    return `${itemIds}-${profileStr}-${contextStr}-${optionsStr}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? expiry > Date.now() : false;
  }

  // Method to add user feedback for learning
  addUserFeedback(userId: string, feedback: UserFeedback) {
    UserLearning.addFeedback(userId, feedback);
  }

  // Method to get user preferences for personalization
  getUserPreferences(userId: string) {
    return UserLearning.getUserPreferences(userId);
  }
}

export const advancedStyleEngine = new AdvancedStyleEngine();
