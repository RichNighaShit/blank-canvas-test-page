import {
  WardrobeItem,
  WeatherData,
  StyleProfile,
  OutfitRecommendation,
} from "./simpleStyleAI";

export interface EnhancedStyleProfile extends StyleProfile {
  body_type?: string;
  lifestyle?: string;
  color_preferences?: string[];
  style_goals?: string[];
  budget_range?: string;
  age_range?: string;
  profession?: string;
}

export interface StyleContext {
  occasion: string;
  timeOfDay?: string;
  weather?: WeatherData;
  season?: string;
  mood?: string;
  location?: string;
  event_type?: string;
}

export interface EnhancedOutfitRecommendation extends OutfitRecommendation {
  style_score: number;
  weather_score: number;
  color_harmony_score: number;
  trend_score: number;
  versatility_score: number;
  tags: string[];
  similar_outfits?: string[];
  styling_tips: string[];
  accessory_suggestions: string[];
}

export class EnhancedStyleAI {
  private userHistory: { [userId: string]: any } = {};
  private popularCombinations: Map<string, number> = new Map();

  // Color harmony rules based on color theory
  private readonly COLOR_HARMONY_RULES = {
    complementary: [
      ["red", "green"],
      ["blue", "orange"],
      ["yellow", "purple"],
      ["pink", "mint"],
      ["navy", "coral"],
      ["burgundy", "forest"],
    ],
    analogous: [
      ["red", "orange", "yellow"],
      ["blue", "purple", "pink"],
      ["green", "yellow", "lime"],
      ["navy", "blue", "teal"],
    ],
    neutral_pairs: [
      ["black", "white"],
      ["grey", "beige"],
      ["cream", "brown"],
      ["navy", "white"],
      ["charcoal", "ivory"],
    ],
  };

  // Trend scoring based on current fashion trends
  private readonly TREND_SCORES = {
    oversized: 0.9,
    minimalist: 0.8,
    vintage: 0.7,
    sustainable: 0.9,
    athleisure: 0.8,
    bohemian: 0.6,
    preppy: 0.7,
    streetwear: 0.8,
  };

  generateEnhancedRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: EnhancedStyleProfile,
    context: StyleContext,
    includeAccessories: boolean = true,
    maxRecommendations: number = 8,
  ): EnhancedOutfitRecommendation[] {
    // Pre-filter items based on context
    const contextFilteredItems = this.filterByContext(wardrobeItems, context);

    // Group items by category for better combination generation
    const itemsByCategory = this.groupByCategory(contextFilteredItems);

    // Generate smart combinations using multiple strategies
    const combinations = this.generateSmartCombinations(
      itemsByCategory,
      context,
      profile,
      includeAccessories,
    );

    // Score each combination using enhanced metrics
    const scoredRecommendations = combinations.map((combination) =>
      this.scoreEnhancedOutfit(combination, profile, context),
    );

    // Apply advanced filtering and ranking
    const finalRecommendations = this.rankAndFilterRecommendations(
      scoredRecommendations,
      profile,
      context,
      maxRecommendations,
    );

    // Update user history for personalization
    this.updateUserHistory(profile.id, finalRecommendations, context);

    return finalRecommendations;
  }

  private filterByContext(
    items: WardrobeItem[],
    context: StyleContext,
  ): WardrobeItem[] {
    return items.filter((item) => {
      // Weather appropriateness
      if (
        context.weather &&
        !this.isWeatherAppropriate(item, context.weather)
      ) {
        return false;
      }

      // Occasion matching
      if (
        !item.occasion.some(
          (occ) =>
            occ.toLowerCase().includes(context.occasion.toLowerCase()) ||
            context.occasion.toLowerCase().includes(occ.toLowerCase()),
        )
      ) {
        return false;
      }

      // Season matching
      if (context.season && item.season.length > 0) {
        return item.season.some(
          (season) => season.toLowerCase() === context.season?.toLowerCase(),
        );
      }

      return true;
    });
  }

  private generateSmartCombinations(
    itemsByCategory: { [category: string]: WardrobeItem[] },
    context: StyleContext,
    profile: EnhancedStyleProfile,
    includeAccessories: boolean,
  ): WardrobeItem[][] {
    const combinations: WardrobeItem[][] = [];

    // Essential categories for complete outfits
    const tops =
      itemsByCategory["top"] ||
      itemsByCategory["shirt"] ||
      itemsByCategory["blouse"] ||
      [];
    const bottoms =
      itemsByCategory["bottom"] ||
      itemsByCategory["pants"] ||
      itemsByCategory["skirt"] ||
      [];
    const dresses = itemsByCategory["dress"] || [];
    const shoes = itemsByCategory["shoes"] || itemsByCategory["footwear"] || [];
    const outerwear =
      itemsByCategory["outerwear"] || itemsByCategory["jacket"] || [];
    const accessories = includeAccessories
      ? [
          ...(itemsByCategory["accessory"] || []),
          ...(itemsByCategory["jewelry"] || []),
          ...(itemsByCategory["bag"] || []),
        ]
      : [];

    // Strategy 1: Top + Bottom + Shoes combinations
    tops.forEach((top) => {
      bottoms.forEach((bottom) => {
        if (this.areItemsCompatible(top, bottom, context)) {
          const baseCombo = [top, bottom];

          // Add shoes if available
          const suitableShoes = shoes.filter((shoe) =>
            this.isShoeAppropriate(shoe, context, [top, bottom]),
          );

          suitableShoes.forEach((shoe) => {
            const combo = [...baseCombo, shoe];

            // Optionally add outerwear
            if (context.weather && this.needsOuterwear(context.weather)) {
              const suitableOuterwear = outerwear.filter((outer) =>
                this.isOuterwearCompatible(outer, combo, context),
              );

              if (suitableOuterwear.length > 0) {
                combo.push(suitableOuterwear[0]);
              }
            }

            // Add accessories
            if (includeAccessories && accessories.length > 0) {
              const suitableAccessories = accessories
                .filter((acc) =>
                  this.isAccessoryCompatible(acc, combo, context),
                )
                .slice(0, 2); // Limit to 2 accessories
              combo.push(...suitableAccessories);
            }

            if (combo.length >= 3) {
              // Minimum viable outfit
              combinations.push(combo);
            }
          });
        }
      });
    });

    // Strategy 2: Dress-based combinations
    dresses.forEach((dress) => {
      const combo = [dress];

      // Add shoes
      const suitableShoes = shoes.filter((shoe) =>
        this.isShoeAppropriate(shoe, context, [dress]),
      );

      if (suitableShoes.length > 0) {
        combo.push(suitableShoes[0]);

        // Add outerwear if needed
        if (context.weather && this.needsOuterwear(context.weather)) {
          const suitableOuterwear = outerwear.filter((outer) =>
            this.isOuterwearCompatible(outer, combo, context),
          );

          if (suitableOuterwear.length > 0) {
            combo.push(suitableOuterwear[0]);
          }
        }

        // Add accessories
        if (includeAccessories && accessories.length > 0) {
          const suitableAccessories = accessories
            .filter((acc) => this.isAccessoryCompatible(acc, combo, context))
            .slice(0, 2);
          combo.push(...suitableAccessories);
        }

        combinations.push(combo);
      }
    });

    return combinations.slice(0, 20); // Limit initial combinations
  }

  private scoreEnhancedOutfit(
    items: WardrobeItem[],
    profile: EnhancedStyleProfile,
    context: StyleContext,
  ): EnhancedOutfitRecommendation {
    // Calculate individual scoring components
    const styleScore = this.calculateStyleScore(items, profile);
    const weatherScore = context.weather
      ? this.calculateWeatherScore(items, context.weather)
      : 1.0;
    const colorHarmonyScore = this.calculateColorHarmonyScore(items);
    const trendScore = this.calculateTrendScore(items);
    const versatilityScore = this.calculateVersatilityScore(items);

    // Weighted overall confidence score
    const confidence =
      styleScore * 0.3 +
      weatherScore * 0.2 +
      colorHarmonyScore * 0.2 +
      trendScore * 0.15 +
      versatilityScore * 0.15;

    // Generate description and reasoning
    const description = this.generateOutfitDescription(items, context);
    const reasoning = this.generateReasoning(items, profile, context, {
      styleScore,
      weatherScore,
      colorHarmonyScore,
      trendScore,
      versatilityScore,
    });

    // Generate styling tips and accessory suggestions
    const stylingTips = this.generateStylingTips(items, context);
    const accessorySuggestions = this.generateAccessorySuggestions(
      items,
      context,
    );

    // Extract style tags
    const tags = this.extractStyleTags(items, context);

    return {
      id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items,
      occasion: context.occasion,
      style: this.determineOverallStyle(items),
      confidence,
      description,
      reasoning,
      style_score: styleScore,
      weather_score: weatherScore,
      color_harmony_score: colorHarmonyScore,
      trend_score: trendScore,
      versatility_score: versatilityScore,
      tags,
      styling_tips: stylingTips,
      accessory_suggestions: accessorySuggestions,
    };
  }

  private calculateStyleScore(
    items: WardrobeItem[],
    profile: EnhancedStyleProfile,
  ): number {
    let score = 0.5; // Base score

    // Match with preferred style
    const outfitStyles = items.flatMap((item) =>
      item.style ? [item.style] : [],
    );
    const styleMatches = outfitStyles.filter(
      (style) => style.toLowerCase() === profile.preferred_style?.toLowerCase(),
    ).length;

    score += (styleMatches / items.length) * 0.4;

    // Color preference matching
    if (profile.color_preferences) {
      const outfitColors = items.flatMap((item) => item.color);
      const colorMatches = outfitColors.filter((color) =>
        profile.color_preferences?.some((prefColor) =>
          color.toLowerCase().includes(prefColor.toLowerCase()),
        ),
      ).length;

      score += (colorMatches / outfitColors.length) * 0.3;
    }

    return Math.min(score, 1.0);
  }

  private calculateColorHarmonyScore(items: WardrobeItem[]): number {
    const colors = items.flatMap((item) => item.color);
    let harmonyScore = 0.5;

    // Check for complementary colors
    for (const [color1, color2] of this.COLOR_HARMONY_RULES.complementary) {
      if (
        colors.some((c) => c.toLowerCase().includes(color1)) &&
        colors.some((c) => c.toLowerCase().includes(color2))
      ) {
        harmonyScore += 0.3;
      }
    }

    // Check for neutral combinations
    for (const [color1, color2] of this.COLOR_HARMONY_RULES.neutral_pairs) {
      if (
        colors.some((c) => c.toLowerCase().includes(color1)) &&
        colors.some((c) => c.toLowerCase().includes(color2))
      ) {
        harmonyScore += 0.2;
      }
    }

    return Math.min(harmonyScore, 1.0);
  }

  private calculateTrendScore(items: WardrobeItem[]): number {
    const styles = items.flatMap((item) => (item.style ? [item.style] : []));
    const tags = items.flatMap((item) => item.tags || []);

    let trendScore = 0.5;

    // Check against trend scores
    [...styles, ...tags].forEach((tag) => {
      const score =
        this.TREND_SCORES[tag.toLowerCase() as keyof typeof this.TREND_SCORES];
      if (score) {
        trendScore += score * 0.1;
      }
    });

    return Math.min(trendScore, 1.0);
  }

  private calculateVersatilityScore(items: WardrobeItem[]): number {
    // Items that can be worn to multiple occasions are more versatile
    const allOccasions = items.flatMap((item) => item.occasion);
    const uniqueOccasions = new Set(allOccasions);

    return Math.min(uniqueOccasions.size / 5, 1.0); // Normalize to max 5 occasions
  }

  private generateOutfitDescription(
    items: WardrobeItem[],
    context: StyleContext,
  ): string {
    const mainPieces = items.filter((item) =>
      ["top", "bottom", "dress", "shirt", "blouse", "pants", "skirt"].includes(
        item.category,
      ),
    );

    const styles = [
      ...new Set(items.flatMap((item) => (item.style ? [item.style] : []))),
    ];
    const primaryStyle = styles[0] || "stylish";

    if (mainPieces.length === 1 && mainPieces[0].category === "dress") {
      return `A ${primaryStyle} ${mainPieces[0].color.join(" and ")} dress perfect for ${context.occasion}`;
    } else {
      const topPiece = mainPieces.find((item) =>
        ["top", "shirt", "blouse"].includes(item.category),
      );
      const bottomPiece = mainPieces.find((item) =>
        ["bottom", "pants", "skirt"].includes(item.category),
      );

      if (topPiece && bottomPiece) {
        return `A ${primaryStyle} combination featuring a ${topPiece.color.join(" ")} ${topPiece.category} with ${bottomPiece.color.join(" ")} ${bottomPiece.category}`;
      }
    }

    return `A carefully curated ${primaryStyle} outfit for ${context.occasion}`;
  }

  private generateStylingTips(
    items: WardrobeItem[],
    context: StyleContext,
  ): string[] {
    const tips: string[] = [];

    // Weather-based tips
    if (context.weather) {
      if (context.weather.temperature < 10) {
        tips.push("Layer with a warm scarf or jacket for extra warmth");
      } else if (context.weather.temperature > 25) {
        tips.push("Choose breathable fabrics and lighter colors to stay cool");
      }

      if (context.weather.condition.includes("rain")) {
        tips.push("Consider waterproof footwear and a light jacket");
      }
    }

    // Occasion-specific tips
    if (context.occasion.includes("formal")) {
      tips.push("Ensure all pieces are well-fitted and pressed");
      tips.push("Add a classic watch or subtle jewelry");
    } else if (context.occasion.includes("casual")) {
      tips.push("Roll up sleeves or add casual accessories for a relaxed look");
    }

    // Color coordination tips
    const colors = items.flatMap((item) => item.color);
    if (colors.includes("black") && colors.includes("white")) {
      tips.push("Classic black and white never goes out of style");
    }

    return tips.slice(0, 3); // Limit to 3 tips
  }

  private generateAccessorySuggestions(
    items: WardrobeItem[],
    context: StyleContext,
  ): string[] {
    const suggestions: string[] = [];

    const hasAccessories = items.some((item) =>
      ["accessory", "jewelry", "bag"].includes(item.category),
    );

    if (!hasAccessories) {
      if (context.occasion.includes("formal")) {
        suggestions.push("Add a classic watch or elegant necklace");
        suggestions.push("Consider a structured handbag or clutch");
      } else {
        suggestions.push("Try a casual crossbody bag or backpack");
        suggestions.push("Add some fun jewelry or a statement piece");
      }
    }

    // Shoe suggestions if missing
    const hasShoes = items.some((item) =>
      ["shoes", "footwear"].includes(item.category),
    );

    if (!hasShoes) {
      if (context.occasion.includes("formal")) {
        suggestions.push("Complete with dress shoes or heels");
      } else {
        suggestions.push("Pair with comfortable sneakers or casual shoes");
      }
    }

    return suggestions.slice(0, 3);
  }

  // Helper methods
  private groupByCategory(items: WardrobeItem[]): {
    [category: string]: WardrobeItem[];
  } {
    return items.reduce(
      (groups, item) => {
        const category = item.category.toLowerCase();
        groups[category] = groups[category] || [];
        groups[category].push(item);
        return groups;
      },
      {} as { [category: string]: WardrobeItem[] },
    );
  }

  private areItemsCompatible(
    item1: WardrobeItem,
    item2: WardrobeItem,
    context: StyleContext,
  ): boolean {
    // Style compatibility
    if (item1.style && item2.style && item1.style !== item2.style) {
      const compatibleStyles = [
        ["casual", "streetwear"],
        ["formal", "business"],
        ["bohemian", "vintage"],
      ];

      const isCompatible = compatibleStyles.some(
        (pair) => pair.includes(item1.style) && pair.includes(item2.style),
      );

      if (!isCompatible) return false;
    }

    // Occasion compatibility
    const commonOccasions = item1.occasion.filter((occ) =>
      item2.occasion.includes(occ),
    );

    return commonOccasions.length > 0;
  }

  private isWeatherAppropriate(
    item: WardrobeItem,
    weather: WeatherData,
  ): boolean {
    if (weather.temperature < 10) {
      return (
        !item.tags?.includes("lightweight") && !item.tags?.includes("summer")
      );
    } else if (weather.temperature > 25) {
      return !item.tags?.includes("heavy") && !item.tags?.includes("winter");
    }
    return true;
  }

  private needsOuterwear(weather: WeatherData): boolean {
    return weather.temperature < 15 || weather.condition.includes("rain");
  }

  private isShoeAppropriate(
    shoe: WardrobeItem,
    context: StyleContext,
    otherItems: WardrobeItem[],
  ): boolean {
    const formalOccasions = ["business", "formal", "wedding", "interview"];
    const casualOccasions = ["casual", "weekend", "shopping", "gym"];

    if (formalOccasions.some((occ) => context.occasion.includes(occ))) {
      return shoe.tags?.includes("formal") || shoe.tags?.includes("dress");
    } else if (casualOccasions.some((occ) => context.occasion.includes(occ))) {
      return (
        shoe.tags?.includes("casual") || shoe.tags?.includes("comfortable")
      );
    }

    return true;
  }

  private isOuterwearCompatible(
    outerwear: WardrobeItem,
    items: WardrobeItem[],
    context: StyleContext,
  ): boolean {
    return outerwear.occasion.some((occ) => context.occasion.includes(occ));
  }

  private isAccessoryCompatible(
    accessory: WardrobeItem,
    items: WardrobeItem[],
    context: StyleContext,
  ): boolean {
    return accessory.occasion.some((occ) => context.occasion.includes(occ));
  }

  private rankAndFilterRecommendations(
    recommendations: EnhancedOutfitRecommendation[],
    profile: EnhancedStyleProfile,
    context: StyleContext,
    maxRecommendations: number,
  ): EnhancedOutfitRecommendation[] {
    return recommendations
      .filter((rec) => rec.confidence > 0.4) // Minimum quality threshold
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxRecommendations);
  }

  private updateUserHistory(
    userId: string,
    recommendations: EnhancedOutfitRecommendation[],
    context: StyleContext,
  ): void {
    if (!this.userHistory[userId]) {
      this.userHistory[userId] = { recommendations: [], contexts: [] };
    }

    this.userHistory[userId].recommendations.push(...recommendations);
    this.userHistory[userId].contexts.push(context);

    // Keep only last 50 recommendations per user
    if (this.userHistory[userId].recommendations.length > 50) {
      this.userHistory[userId].recommendations =
        this.userHistory[userId].recommendations.slice(-50);
    }
  }

  private generateReasoning(
    items: WardrobeItem[],
    profile: EnhancedStyleProfile,
    context: StyleContext,
    scores: any,
  ): string[] {
    const reasoning: string[] = [];

    if (scores.styleScore > 0.7) {
      reasoning.push(
        `Perfect match for your ${profile.preferred_style} style preference`,
      );
    }

    if (scores.colorHarmonyScore > 0.7) {
      reasoning.push("Colors complement each other beautifully");
    }

    if (scores.weatherScore > 0.8 && context.weather) {
      reasoning.push(
        `Ideal for ${context.weather.condition} weather at ${context.weather.temperature}°C`,
      );
    }

    if (scores.trendScore > 0.7) {
      reasoning.push("Incorporates current fashion trends");
    }

    return reasoning;
  }

  private extractStyleTags(
    items: WardrobeItem[],
    context: StyleContext,
  ): string[] {
    const tags = new Set<string>();

    items.forEach((item) => {
      if (item.style) tags.add(item.style);
      if (item.tags) item.tags.forEach((tag) => tags.add(tag));
    });

    tags.add(context.occasion);
    if (context.season) tags.add(context.season);

    return Array.from(tags).slice(0, 5);
  }

  private determineOverallStyle(items: WardrobeItem[]): string {
    const styles = items.flatMap((item) => (item.style ? [item.style] : []));
    const styleCount = styles.reduce(
      (acc, style) => {
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      },
      {} as { [style: string]: number },
    );

    return (
      Object.entries(styleCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "versatile"
    );
  }

  calculateWeatherScore(items: WardrobeItem[], weather: WeatherData): number {
    let score = 0.5;

    items.forEach((item) => {
      if (this.isWeatherAppropriate(item, weather)) {
        score += 0.2;
      }
    });

    return Math.min(score, 1.0);
  }
}

export const enhancedStyleAI = new EnhancedStyleAI();
