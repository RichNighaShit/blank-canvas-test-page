import { WardrobeItem, StyleProfile, OutfitRecommendation, WeatherData } from "./simpleStyleAI";
import { advancedColorTheory, ColorHarmonyResult } from "./advancedColorTheory";

export interface AdvancedContext {
  occasion: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  weather?: WeatherData;
  seasonalPreference?: boolean;
  colorTheoryMode?: boolean;
  formalityLevel?: number; // 1-5 scale
  personalStyle?: string[];
  bodyType?: string;
  skinTone?: string;
  lifestyle?: string[];
}

export interface AdvancedOutfitAnalysis {
  colorHarmonyScore: number;
  colorHarmonyType: string;
  seasonalAppropriate: boolean;
  occasionFit: number;
  timeOfDayFit: number;
  weatherAppropriate: boolean;
  styleCoherence: number;
  versatilityScore: number;
  trendRelevance: number;
  personalAlignment: number;
  overallScore: number;
  insights: string[];
  recommendations: string[];
  colorStory: string;
  styleNarrative: string;
}

export interface EnhancedOutfitRecommendation extends OutfitRecommendation {
  analysis: AdvancedOutfitAnalysis;
  alternativeItems?: WardrobeItem[];
  layeringOptions?: WardrobeItem[];
  accessoryPairings?: WardrobeItem[];
  colorPalette: string[];
  moodBoard?: string[];
  inspirationTags: string[];
}

// Advanced occasion definitions with detailed attributes
const OCCASION_PROFILES = {
  work: {
    formality: 4,
    conservativeness: 4,
    colorPreference: ["navy", "black", "white", "gray", "burgundy"],
    avoidColors: ["neon", "bright pink", "lime"],
    preferredStyles: ["business", "classic", "minimalist"],
    timePreference: ["morning", "afternoon"],
    fabricPreference: ["wool", "cotton", "silk"],
    silhouettePreference: ["structured", "tailored"],
    accessoryLevel: "minimal",
    appropriateCategories: ["blazers", "dress shirts", "trousers", "professional dresses"],
  },
  casual: {
    formality: 2,
    conservativeness: 2,
    colorPreference: ["versatile"],
    avoidColors: [],
    preferredStyles: ["casual", "relaxed", "contemporary"],
    timePreference: ["morning", "afternoon", "evening"],
    fabricPreference: ["cotton", "denim", "jersey"],
    silhouettePreference: ["relaxed", "comfortable"],
    accessoryLevel: "moderate",
    appropriateCategories: ["t-shirts", "jeans", "sneakers", "casual dresses"],
  },
  formal: {
    formality: 5,
    conservativeness: 5,
    colorPreference: ["black", "navy", "white", "deep jewel tones"],
    avoidColors: ["casual prints", "bright casual colors"],
    preferredStyles: ["formal", "elegant", "sophisticated"],
    timePreference: ["evening", "night"],
    fabricPreference: ["silk", "satin", "velvet", "fine wool"],
    silhouettePreference: ["elegant", "flowing", "tailored"],
    accessoryLevel: "elevated",
    appropriateCategories: ["evening gowns", "suits", "formal shoes", "fine jewelry"],
  },
  date: {
    formality: 3,
    conservativeness: 2,
    colorPreference: ["romantic", "flattering"],
    avoidColors: ["overly bright", "clashing"],
    preferredStyles: ["romantic", "chic", "feminine", "sophisticated casual"],
    timePreference: ["evening", "night"],
    fabricPreference: ["soft", "flowing", "textured"],
    silhouettePreference: ["flattering", "romantic"],
    accessoryLevel: "thoughtful",
    appropriateCategories: ["dresses", "blouses", "elegant separates"],
  },
  creative: {
    formality: 2,
    conservativeness: 1,
    colorPreference: ["expressive", "artistic"],
    avoidColors: [],
    preferredStyles: ["artistic", "bohemian", "eclectic", "avant-garde"],
    timePreference: ["morning", "afternoon", "evening"],
    fabricPreference: ["varied", "textured", "unique"],
    silhouettePreference: ["expressive", "layered"],
    accessoryLevel: "expressive",
    appropriateCategories: ["statement pieces", "artistic clothing", "unique accessories"],
  },
  social: {
    formality: 3,
    conservativeness: 2,
    colorPreference: ["friendly", "approachable"],
    avoidColors: ["intimidating dark"],
    preferredStyles: ["social", "approachable", "stylish casual"],
    timePreference: ["afternoon", "evening"],
    fabricPreference: ["comfortable", "stylish"],
    silhouettePreference: ["approachable", "stylish"],
    accessoryLevel: "social",
    appropriateCategories: ["stylish separates", "conversation pieces"],
  }
};

// Seasonal color palettes with psychological associations
const SEASONAL_PALETTES = {
  spring: {
    colors: ["coral", "peach", "yellow-green", "turquoise", "warm pink", "golden yellow"],
    mood: "fresh, energetic, optimistic",
    characteristics: "clear, warm, bright",
    avoidColors: ["muddy", "dark", "cool undertones"],
  },
  summer: {
    colors: ["lavender", "rose", "sage green", "powder blue", "soft pink", "pearl gray"],
    mood: "serene, elegant, refined",
    characteristics: "cool, soft, muted",
    avoidColors: ["warm", "intense", "golden undertones"],
  },
  autumn: {
    colors: ["rust", "burgundy", "forest green", "golden brown", "deep orange", "olive"],
    mood: "warm, rich, sophisticated",
    characteristics: "warm, deep, muted",
    avoidColors: ["cool", "icy", "bright"],
  },
  winter: {
    colors: ["true red", "navy", "black", "white", "emerald", "royal purple"],
    mood: "dramatic, powerful, elegant",
    characteristics: "cool, clear, intense",
    avoidColors: ["muted", "warm", "dusty"],
  },
};

// Advanced color psychology mappings
const COLOR_PSYCHOLOGY = {
  red: { energy: 9, confidence: 8, attention: 9, professionalism: 6, mood: "passionate, energetic" },
  blue: { energy: 5, confidence: 7, attention: 6, professionalism: 9, mood: "trustworthy, calm" },
  green: { energy: 6, confidence: 6, attention: 5, professionalism: 7, mood: "balanced, natural" },
  yellow: { energy: 8, confidence: 7, attention: 8, professionalism: 4, mood: "optimistic, creative" },
  purple: { energy: 6, confidence: 7, attention: 7, professionalism: 6, mood: "creative, luxurious" },
  orange: { energy: 8, confidence: 6, attention: 8, professionalism: 4, mood: "energetic, friendly" },
  pink: { energy: 5, confidence: 5, attention: 6, professionalism: 5, mood: "nurturing, romantic" },
  black: { energy: 4, confidence: 8, attention: 7, professionalism: 9, mood: "powerful, sophisticated" },
  white: { energy: 6, confidence: 6, attention: 5, professionalism: 8, mood: "clean, pure" },
  gray: { energy: 3, confidence: 5, attention: 3, professionalism: 8, mood: "neutral, balanced" },
  brown: { energy: 4, confidence: 6, attention: 4, professionalism: 7, mood: "earthy, reliable" },
  navy: { energy: 4, confidence: 8, attention: 6, professionalism: 9, mood: "trustworthy, classic" },
};

class AdvancedStyleService {
  private seasonalBoost: boolean = true;
  private colorPsychologyWeight: number = 0.3;
  private personalStyleWeight: number = 0.4;
  private occasionWeight: number = 0.3;

  /**
   * Generate advanced outfit recommendations with comprehensive analysis
   */
  async generateAdvancedRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: StyleProfile,
    context: AdvancedContext,
    includeAccessories: boolean = true,
    maxRecommendations: number = 6
  ): Promise<EnhancedOutfitRecommendation[]> {
    try {
      // Pre-filter items based on advanced criteria
      const filteredItems = this.preFilterItems(wardrobeItems, context);
      
      if (filteredItems.length < 2) {
        throw new Error("Insufficient wardrobe items for the selected criteria");
      }

      // Group items by category with enhanced logic
      const itemGroups = this.categorizeItemsAdvanced(filteredItems);
      
      // Generate sophisticated combinations
      const combinations = this.generateSophisticatedCombinations(
        itemGroups,
        context,
        includeAccessories
      );

      // Analyze each combination with advanced metrics
      const analyzedOutfits = await Promise.all(
        combinations.map(items => this.analyzeOutfitAdvanced(items, profile, context))
      );

      // Score and rank recommendations
      const scoredRecommendations = analyzedOutfits
        .map(analysis => this.createEnhancedRecommendation(analysis, context))
        .sort((a, b) => b.analysis.overallScore - a.analysis.overallScore)
        .slice(0, maxRecommendations);

      // Add alternative suggestions and enhancements
      return this.enhanceRecommendationsWithAlternatives(
        scoredRecommendations,
        wardrobeItems,
        context
      );

    } catch (error) {
      console.error("Error in generateAdvancedRecommendations:", error);
      throw error;
    }
  }

  /**
   * Pre-filter items based on advanced context criteria
   */
  private preFilterItems(items: WardrobeItem[], context: AdvancedContext): WardrobeItem[] {
    return items.filter(item => {
      // Occasion appropriateness
      const occasionFit = this.calculateOccasionFit(item, context.occasion);
      if (occasionFit < 0.3) return false;

      // Time of day appropriateness
      const timeFit = this.calculateTimeOfDayFit(item, context.timeOfDay);
      if (timeFit < 0.2) return false;

      // Weather appropriateness
      if (context.weather) {
        const weatherFit = this.calculateWeatherFit(item, context.weather);
        if (weatherFit < 0.3) return false;
      }

      // Seasonal appropriateness
      if (context.seasonalPreference) {
        const seasonalFit = this.calculateSeasonalFit(item);
        if (seasonalFit < 0.4) return false;
      }

      return true;
    });
  }

  /**
   * Enhanced item categorization with sub-categories
   */
  private categorizeItemsAdvanced(items: WardrobeItem[]): {[key: string]: WardrobeItem[]} {
    const categories: {[key: string]: WardrobeItem[]} = {
      tops: [],
      bottoms: [],
      dresses: [],
      outerwear: [],
      shoes: [],
      accessories: [],
      jewelry: [],
      bags: [],
      statement: [], // Statement pieces
      basics: [], // Basic/foundational pieces
    };

    items.forEach(item => {
      const category = item.category.toLowerCase();
      
      // Primary categorization
      if (["tops", "shirts", "blouses", "sweaters", "t-shirts"].includes(category)) {
        categories.tops.push(item);
        // Secondary categorization
        if (item.tags?.includes("basic") || item.style === "minimalist") {
          categories.basics.push(item);
        }
        if (item.tags?.includes("statement") || item.tags?.includes("bold")) {
          categories.statement.push(item);
        }
      } else if (["bottoms", "pants", "jeans", "skirts", "shorts"].includes(category)) {
        categories.bottoms.push(item);
        if (item.tags?.includes("basic")) categories.basics.push(item);
      } else if (category === "dresses") {
        categories.dresses.push(item);
        if (item.tags?.includes("statement")) categories.statement.push(item);
      } else if (["outerwear", "jackets", "coats", "blazers"].includes(category)) {
        categories.outerwear.push(item);
      } else if (["shoes", "boots", "sneakers", "heels"].includes(category)) {
        categories.shoes.push(item);
      } else if (["accessories", "scarves", "hats", "belts"].includes(category)) {
        categories.accessories.push(item);
      } else if (["jewelry", "necklaces", "earrings", "bracelets"].includes(category)) {
        categories.jewelry.push(item);
      } else if (["bags", "purses", "handbags"].includes(category)) {
        categories.bags.push(item);
      }
    });

    return categories;
  }

  /**
   * Generate sophisticated outfit combinations using advanced logic
   */
  private generateSophisticatedCombinations(
    itemGroups: {[key: string]: WardrobeItem[]},
    context: AdvancedContext,
    includeAccessories: boolean
  ): WardrobeItem[][] {
    const combinations: WardrobeItem[][] = [];
    const maxCombinations = 20;

    // Strategy 1: Dress-based outfits
    itemGroups.dresses?.forEach(dress => {
      const outfit = [dress];
      
      // Add shoes
      const compatibleShoes = this.findCompatibleItems(dress, itemGroups.shoes || [], context);
      if (compatibleShoes.length > 0) outfit.push(compatibleShoes[0]);
      
      // Add outerwear if appropriate
      if (this.shouldAddOuterwear(context)) {
        const compatibleOuterwear = this.findCompatibleItems(dress, itemGroups.outerwear || [], context);
        if (compatibleOuterwear.length > 0) outfit.push(compatibleOuterwear[0]);
      }
      
      // Add accessories if enabled
      if (includeAccessories) {
        this.addOptimalAccessories(outfit, itemGroups, context);
      }

      if (outfit.length >= 2) combinations.push(outfit);
    });

    // Strategy 2: Separates-based outfits with color harmony
    const tops = itemGroups.tops || [];
    const bottoms = itemGroups.bottoms || [];
    
    for (let i = 0; i < Math.min(tops.length, 8); i++) {
      for (let j = 0; j < Math.min(bottoms.length, 6); j++) {
        if (combinations.length >= maxCombinations) break;
        
        const top = tops[i];
        const bottom = bottoms[j];
        
        // Check color harmony
        const colorHarmony = this.analyzeColorHarmonyPair(top, bottom);
        if (colorHarmony.confidence < 0.4) continue;
        
        const outfit = [top, bottom];
        
        // Add shoes
        const compatibleShoes = this.findCompatibleItems(
          { color: [...top.color, ...bottom.color] } as WardrobeItem,
          itemGroups.shoes || [],
          context
        );
        if (compatibleShoes.length > 0) outfit.push(compatibleShoes[0]);
        
        // Add layering if appropriate
        if (this.shouldAddLayering(context)) {
          const layeringPieces = this.findLayeringPieces(outfit, itemGroups, context);
          outfit.push(...layeringPieces);
        }
        
        // Add accessories
        if (includeAccessories) {
          this.addOptimalAccessories(outfit, itemGroups, context);
        }

        if (outfit.length >= 3) combinations.push(outfit);
      }
    }

    // Strategy 3: Statement piece focused outfits
    itemGroups.statement?.forEach(statement => {
      const outfit = this.buildAroundStatementPiece(statement, itemGroups, context, includeAccessories);
      if (outfit.length >= 2) combinations.push(outfit);
    });

    return combinations;
  }

  /**
   * Comprehensive outfit analysis with multiple metrics
   */
  private async analyzeOutfitAdvanced(
    items: WardrobeItem[],
    profile: StyleProfile,
    context: AdvancedContext
  ): Promise<{items: WardrobeItem[], analysis: AdvancedOutfitAnalysis}> {
    const analysis: AdvancedOutfitAnalysis = {
      colorHarmonyScore: 0,
      colorHarmonyType: "",
      seasonalAppropriate: false,
      occasionFit: 0,
      timeOfDayFit: 0,
      weatherAppropriate: false,
      styleCoherence: 0,
      versatilityScore: 0,
      trendRelevance: 0,
      personalAlignment: 0,
      overallScore: 0,
      insights: [],
      recommendations: [],
      colorStory: "",
      styleNarrative: "",
    };

    // Color Harmony Analysis
    const colorAnalysis = this.analyzeColorHarmony(items);
    analysis.colorHarmonyScore = colorAnalysis.confidence;
    analysis.colorHarmonyType = colorAnalysis.harmonyType;
    analysis.colorStory = colorAnalysis.description;

    // Seasonal Appropriateness
    analysis.seasonalAppropriate = this.isSeasonallyAppropriate(items);

    // Occasion Fit
    analysis.occasionFit = this.calculateOutfitOccasionFit(items, context.occasion);

    // Time of Day Fit
    analysis.timeOfDayFit = this.calculateOutfitTimeOfDayFit(items, context.timeOfDay);

    // Weather Appropriateness
    if (context.weather) {
      analysis.weatherAppropriate = this.isWeatherAppropriate(items, context.weather);
    } else {
      analysis.weatherAppropriate = true;
    }

    // Style Coherence
    analysis.styleCoherence = this.calculateStyleCoherence(items);

    // Versatility Score
    analysis.versatilityScore = this.calculateVersatilityScore(items);

    // Trend Relevance
    analysis.trendRelevance = this.calculateTrendRelevance(items);

    // Personal Alignment
    analysis.personalAlignment = this.calculatePersonalAlignment(items, profile);

    // Calculate Overall Score
    analysis.overallScore = this.calculateOverallScore(analysis, context);

    // Generate Insights
    analysis.insights = this.generateInsights(items, analysis, context);

    // Generate Recommendations
    analysis.recommendations = this.generateRecommendations(items, analysis);

    // Create Style Narrative
    analysis.styleNarrative = this.createStyleNarrative(items, analysis, context);

    return { items, analysis };
  }

  /**
   * Analyze color harmony using advanced color theory
   */
  private analyzeColorHarmony(items: WardrobeItem[]): ColorHarmonyResult & { description: string } {
    const allColors = items.flatMap(item => item.color);
    const harmonyResult = advancedColorTheory.findBestHarmony(allColors);
    
    let description = `${harmonyResult.harmonyType} color scheme`;
    
    if (harmonyResult.confidence > 0.8) {
      description = `Exceptional ${harmonyResult.harmonyType} color harmony creates visual sophistication`;
    } else if (harmonyResult.confidence > 0.6) {
      description = `Beautiful ${harmonyResult.harmonyType} color coordination enhances the overall look`;
    } else if (harmonyResult.confidence > 0.4) {
      description = `Subtle ${harmonyResult.harmonyType} color relationship provides gentle visual interest`;
    }

    return {
      ...harmonyResult,
      description
    };
  }

  /**
   * Calculate comprehensive outfit scores
   */
  private calculateOverallScore(analysis: AdvancedOutfitAnalysis, context: AdvancedContext): number {
    const weights = {
      colorHarmony: 0.2,
      occasionFit: 0.25,
      timeOfDayFit: 0.15,
      weatherAppropriate: context.weather ? 0.15 : 0,
      styleCoherence: 0.2,
      personalAlignment: 0.25,
      versatility: 0.1,
      trendRelevance: 0.1,
      seasonal: context.seasonalPreference ? 0.1 : 0,
    };

    let score = 0;
    let totalWeight = 0;

    score += analysis.colorHarmonyScore * weights.colorHarmony;
    totalWeight += weights.colorHarmony;

    score += analysis.occasionFit * weights.occasionFit;
    totalWeight += weights.occasionFit;

    score += analysis.timeOfDayFit * weights.timeOfDayFit;
    totalWeight += weights.timeOfDayFit;

    if (context.weather) {
      score += (analysis.weatherAppropriate ? 1 : 0) * weights.weatherAppropriate;
      totalWeight += weights.weatherAppropriate;
    }

    score += analysis.styleCoherence * weights.styleCoherence;
    totalWeight += weights.styleCoherence;

    score += analysis.personalAlignment * weights.personalAlignment;
    totalWeight += weights.personalAlignment;

    score += analysis.versatilityScore * weights.versatility;
    totalWeight += weights.versatility;

    score += analysis.trendRelevance * weights.trendRelevance;
    totalWeight += weights.trendRelevance;

    if (context.seasonalPreference) {
      score += (analysis.seasonalAppropriate ? 1 : 0) * weights.seasonal;
      totalWeight += weights.seasonal;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Generate actionable insights about the outfit
   */
  private generateInsights(
    items: WardrobeItem[],
    analysis: AdvancedOutfitAnalysis,
    context: AdvancedContext
  ): string[] {
    const insights: string[] = [];

    // Color insights
    if (analysis.colorHarmonyScore > 0.8) {
      insights.push(`Exceptional color coordination using ${analysis.colorHarmonyType} harmony`);
    } else if (analysis.colorHarmonyScore < 0.4) {
      insights.push("Consider adjusting color combinations for better visual harmony");
    }

    // Occasion insights
    if (analysis.occasionFit > 0.8) {
      insights.push(`Perfect formality level for ${context.occasion} occasions`);
    } else if (analysis.occasionFit < 0.5) {
      insights.push(`May be too formal/casual for ${context.occasion} events`);
    }

    // Style insights
    if (analysis.styleCoherence > 0.8) {
      insights.push("Excellent style consistency across all pieces");
    }

    // Seasonal insights
    if (analysis.seasonalAppropriate) {
      insights.push("Seasonally appropriate color palette and fabrics");
    }

    // Weather insights
    if (context.weather && !analysis.weatherAppropriate) {
      insights.push("Consider weather conditions when wearing this outfit");
    }

    return insights;
  }

  /**
   * Generate style recommendations for improvement
   */
  private generateRecommendations(items: WardrobeItem[], analysis: AdvancedOutfitAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.colorHarmonyScore < 0.6) {
      recommendations.push("Try adding a neutral accessory to balance the color palette");
    }

    if (analysis.styleCoherence < 0.6) {
      recommendations.push("Consider swapping one piece for better style consistency");
    }

    if (analysis.versatilityScore < 0.5) {
      recommendations.push("Add versatile accessories to increase outfit adaptability");
    }

    return recommendations;
  }

  /**
   * Create a narrative description of the outfit's style story
   */
  private createStyleNarrative(
    items: WardrobeItem[],
    analysis: AdvancedOutfitAnalysis,
    context: AdvancedContext
  ): string {
    const styles = [...new Set(items.map(item => item.style))];
    const dominantStyle = styles[0] || "contemporary";
    const occasion = context.occasion;
    const timeOfDay = context.timeOfDay;

    let narrative = `A ${dominantStyle} ensemble`;
    
    if (analysis.colorHarmonyScore > 0.7) {
      narrative += ` featuring sophisticated ${analysis.colorHarmonyType} color coordination`;
    }
    
    narrative += ` designed for ${occasion} occasions`;
    
    if (timeOfDay === "evening" || timeOfDay === "night") {
      narrative += `, perfect for evening sophistication`;
    } else if (timeOfDay === "morning") {
      narrative += `, ideal for starting the day with confidence`;
    }

    if (analysis.seasonalAppropriate) {
      narrative += `. The seasonal color palette enhances natural harmony`;
    }

    return narrative + ".";
  }

  // Helper methods for specific calculations
  private calculateOccasionFit(item: WardrobeItem, occasion: string): number {
    const profile = OCCASION_PROFILES[occasion as keyof typeof OCCASION_PROFILES];
    if (!profile) return 0.5;

    let score = 0;
    let factors = 0;

    // Direct occasion match
    if (item.occasion.includes(occasion)) {
      score += 1;
      factors += 1;
    }

    // Style alignment
    if (profile.preferredStyles.some(style => item.style.includes(style))) {
      score += 0.8;
      factors += 1;
    }

    // Color appropriateness
    if (profile.colorPreference.some(color => 
      item.color.some(itemColor => itemColor.includes(color))
    )) {
      score += 0.6;
      factors += 1;
    }

    return factors > 0 ? score / factors : 0.3;
  }

  private calculateTimeOfDayFit(item: WardrobeItem, timeOfDay: string): number {
    // Time-based appropriateness logic
    if (timeOfDay === "evening" || timeOfDay === "night") {
      if (item.style === "formal" || item.style === "elegant") return 1;
      if (item.style === "sporty" || item.tags?.includes("casual-only")) return 0.2;
    }
    
    if (timeOfDay === "morning") {
      if (item.style === "casual" || item.style === "business") return 0.9;
      if (item.style === "formal") return 0.4;
    }

    return 0.7; // Default neutral fit
  }

  private calculateWeatherFit(item: WardrobeItem, weather: WeatherData): number {
    if (weather.temperature < 10) {
      if (item.category === "outerwear" || item.tags?.includes("warm")) return 1;
      if (item.tags?.includes("light") || item.tags?.includes("summer")) return 0.2;
    } else if (weather.temperature > 25) {
      if (item.category === "outerwear") return 0.1;
      if (item.tags?.includes("light") || item.tags?.includes("breathable")) return 1;
    }
    return 0.8;
  }

  private calculateSeasonalFit(item: WardrobeItem): number {
    const currentSeason = this.getCurrentSeason();
    if (item.season.includes(currentSeason) || item.season.includes("all")) {
      return 1;
    }
    return 0.6;
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  }

  private analyzeColorHarmonyPair(item1: WardrobeItem, item2: WardrobeItem): ColorHarmonyResult {
    return advancedColorTheory.analyzeColorHarmony(item1.color, item2.color);
  }

  private findCompatibleItems(
    baseItem: WardrobeItem,
    candidates: WardrobeItem[],
    context: AdvancedContext
  ): WardrobeItem[] {
    return candidates
      .filter(candidate => {
        const harmony = this.analyzeColorHarmonyPair(baseItem, candidate);
        return harmony.confidence > 0.4;
      })
      .sort((a, b) => {
        const harmonyA = this.analyzeColorHarmonyPair(baseItem, a);
        const harmonyB = this.analyzeColorHarmonyPair(baseItem, b);
        return harmonyB.confidence - harmonyA.confidence;
      });
  }

  private shouldAddOuterwear(context: AdvancedContext): boolean {
    return !context.weather || context.weather.temperature < 20;
  }

  private shouldAddLayering(context: AdvancedContext): boolean {
    return context.timeOfDay === "evening" || (context.weather?.temperature || 20) < 15;
  }

  private addOptimalAccessories(
    outfit: WardrobeItem[],
    itemGroups: {[key: string]: WardrobeItem[]},
    context: AdvancedContext
  ): void {
    const outfitColors = outfit.flatMap(item => item.color);
    
    // Add one primary accessory
    const accessories = itemGroups.accessories || [];
    const compatibleAccessory = accessories.find(acc => {
      const harmony = advancedColorTheory.analyzeColorHarmony(outfitColors, acc.color);
      return harmony.confidence > 0.4;
    });
    
    if (compatibleAccessory) {
      outfit.push(compatibleAccessory);
    }
  }

  private findLayeringPieces(
    outfit: WardrobeItem[],
    itemGroups: {[key: string]: WardrobeItem[]},
    context: AdvancedContext
  ): WardrobeItem[] {
    // Find appropriate layering pieces like cardigans, blazers
    const layering = itemGroups.outerwear || [];
    return layering
      .filter(item => item.tags?.includes("layering") || item.style === "cardigan")
      .slice(0, 1);
  }

  private buildAroundStatementPiece(
    statement: WardrobeItem,
    itemGroups: {[key: string]: WardrobeItem[]},
    context: AdvancedContext,
    includeAccessories: boolean
  ): WardrobeItem[] {
    const outfit = [statement];
    
    // Find neutral basics to complement the statement piece
    const basics = itemGroups.basics || [];
    const neutralBasics = basics.filter(item => 
      item.color.some(color => ["black", "white", "gray", "navy", "beige"].includes(color))
    );
    
    if (neutralBasics.length > 0) {
      outfit.push(neutralBasics[0]);
    }
    
    // Add minimal accessories
    if (includeAccessories && Math.random() > 0.7) {
      const simpleAccessories = (itemGroups.accessories || [])
        .filter(acc => acc.style === "minimalist" || acc.tags?.includes("simple"));
      if (simpleAccessories.length > 0) {
        outfit.push(simpleAccessories[0]);
      }
    }
    
    return outfit;
  }

  private isSeasonallyAppropriate(items: WardrobeItem[]): boolean {
    const currentSeason = this.getCurrentSeason();
    return items.some(item => 
      item.season.includes(currentSeason) || item.season.includes("all")
    );
  }

  private calculateOutfitOccasionFit(items: WardrobeItem[], occasion: string): number {
    const scores = items.map(item => this.calculateOccasionFit(item, occasion));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateOutfitTimeOfDayFit(items: WardrobeItem[], timeOfDay: string): number {
    const scores = items.map(item => this.calculateTimeOfDayFit(item, timeOfDay));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private isWeatherAppropriate(items: WardrobeItem[], weather: WeatherData): boolean {
    return items.every(item => this.calculateWeatherFit(item, weather) > 0.3);
  }

  private calculateStyleCoherence(items: WardrobeItem[]): number {
    const styles = items.map(item => item.style);
    const uniqueStyles = new Set(styles);
    
    // Perfect coherence: 1 style, Good: 2 styles, Acceptable: 3 styles
    if (uniqueStyles.size === 1) return 1;
    if (uniqueStyles.size === 2) return 0.8;
    if (uniqueStyles.size === 3) return 0.6;
    return 0.4;
  }

  private calculateVersatilityScore(items: WardrobeItem[]): number {
    const versatileCount = items.filter(item => 
      item.style === "versatile" || 
      item.occasion.includes("versatile") ||
      item.tags?.includes("versatile")
    ).length;
    
    return Math.min(1, versatileCount / items.length);
  }

  private calculateTrendRelevance(items: WardrobeItem[]): number {
    const trendyCount = items.filter(item => 
      item.style === "contemporary" || 
      item.tags?.includes("trending") ||
      item.tags?.includes("modern")
    ).length;
    
    return Math.min(1, trendyCount / items.length);
  }

  private calculatePersonalAlignment(items: WardrobeItem[], profile: StyleProfile): number {
    let score = 0;
    let factors = 0;

    // Style preference alignment
    const preferredStyleMatches = items.filter(item => 
      item.style === profile.preferred_style
    ).length;
    score += (preferredStyleMatches / items.length) * 0.4;
    factors += 0.4;

    // Color preference alignment
    if (profile.favorite_colors && profile.favorite_colors.length > 0) {
      const favoriteColorMatches = items.filter(item =>
        item.color.some(color => 
          profile.favorite_colors!.some(fav => color.includes(fav))
        )
      ).length;
      score += (favoriteColorMatches / items.length) * 0.3;
      factors += 0.3;
    }

    // Color palette alignment
    if (profile.color_palette_colors && profile.color_palette_colors.length > 0) {
      const paletteMatches = items.filter(item =>
        item.color.some(color => 
          profile.color_palette_colors!.some(palette => 
            advancedColorTheory.analyzeColorHarmony([color], [palette]).isHarmonious
          )
        )
      ).length;
      score += (paletteMatches / items.length) * 0.3;
      factors += 0.3;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private createEnhancedRecommendation(
    analysis: {items: WardrobeItem[], analysis: AdvancedOutfitAnalysis},
    context: AdvancedContext
  ): EnhancedOutfitRecommendation {
    const { items, analysis: outfitAnalysis } = analysis;
    
    return {
      id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items,
      occasion: context.occasion,
      style: items[0]?.style || "contemporary",
      confidence: outfitAnalysis.overallScore,
      description: this.generateDescription(items, context),
      reasoning: outfitAnalysis.insights,
      analysis: outfitAnalysis,
      colorPalette: [...new Set(items.flatMap(item => item.color))],
      inspirationTags: this.generateInspirationTags(items, context),
    };
  }

  private generateDescription(items: WardrobeItem[], context: AdvancedContext): string {
    const styles = [...new Set(items.map(item => item.style))];
    const dominantStyle = styles[0] || "contemporary";
    
    let description = `Sophisticated ${dominantStyle} ensemble`;
    
    if (context.occasion === "formal") {
      description = `Elegant formal outfit`;
    } else if (context.occasion === "casual") {
      description = `Effortlessly chic casual look`;
    } else if (context.occasion === "work") {
      description = `Professional polished ensemble`;
    }
    
    return description;
  }

  private generateInspirationTags(items: WardrobeItem[], context: AdvancedContext): string[] {
    const tags: string[] = [];
    
    // Style-based tags
    const styles = [...new Set(items.map(item => item.style))];
    tags.push(...styles);
    
    // Occasion-based tags
    tags.push(context.occasion);
    
    // Time-based tags
    tags.push(context.timeOfDay);
    
    // Color-based tags
    const colors = [...new Set(items.flatMap(item => item.color))];
    if (colors.length <= 2) tags.push("minimalist palette");
    if (colors.length >= 4) tags.push("rich palette");
    
    return tags;
  }

  private enhanceRecommendationsWithAlternatives(
    recommendations: EnhancedOutfitRecommendation[],
    allItems: WardrobeItem[],
    context: AdvancedContext
  ): EnhancedOutfitRecommendation[] {
    return recommendations.map(rec => {
      // Find alternative items for each piece in the outfit
      rec.alternativeItems = this.findAlternativeItems(rec.items, allItems, context);
      
      // Find layering options
      rec.layeringOptions = this.findLayeringOptions(rec.items, allItems, context);
      
      // Find additional accessory pairings
      rec.accessoryPairings = this.findAccessoryPairings(rec.items, allItems, context);
      
      return rec;
    });
  }

  private findAlternativeItems(
    outfitItems: WardrobeItem[],
    allItems: WardrobeItem[],
    context: AdvancedContext
  ): WardrobeItem[] {
    const alternatives: WardrobeItem[] = [];
    
    outfitItems.forEach(item => {
      const categoryAlternatives = allItems.filter(candidate => 
        candidate.category === item.category && 
        candidate.id !== item.id &&
        this.calculateOccasionFit(candidate, context.occasion) > 0.5
      );
      
      alternatives.push(...categoryAlternatives.slice(0, 2));
    });
    
    return alternatives;
  }

  private findLayeringOptions(
    outfitItems: WardrobeItem[],
    allItems: WardrobeItem[],
    context: AdvancedContext
  ): WardrobeItem[] {
    return allItems.filter(item => 
      item.category === "outerwear" &&
      !outfitItems.some(outfitItem => outfitItem.id === item.id) &&
      (item.tags?.includes("layering") || item.style === "cardigan")
    ).slice(0, 3);
  }

  private findAccessoryPairings(
    outfitItems: WardrobeItem[],
    allItems: WardrobeItem[],
    context: AdvancedContext
  ): WardrobeItem[] {
    const outfitColors = outfitItems.flatMap(item => item.color);
    
    return allItems.filter(item => 
      ["accessories", "jewelry", "bags"].includes(item.category) &&
      !outfitItems.some(outfitItem => outfitItem.id === item.id) &&
      item.color.some(color => 
        outfitColors.some(outfitColor => 
          advancedColorTheory.analyzeColorHarmony([color], [outfitColor]).isHarmonious
        )
      )
    ).slice(0, 4);
  }
}

export const advancedStyleService = new AdvancedStyleService();
