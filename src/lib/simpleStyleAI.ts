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
}

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // clear, rain, snow, clouds, etc.
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
}

export interface OutfitRecommendation {
  id: string;
  items: WardrobeItem[];
  occasion: string;
  style: string;
  confidence: number;
  description: string;
  reasoning: string[];
}

export class SimpleStyleAI {
  private usedItemsHistory: { [itemId: string]: number } = {};
  private lastGenerationTime: number = 0;
  private readonly ITEM_COOLDOWN_MS = 30000; // 30 seconds before item can be used again
  private readonly MAX_ITEM_USAGE_PER_SESSION = 2; // Max times an item can appear in one session

  generateRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: StyleProfile,
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData },
    includeAccessories: boolean = true,
  ): OutfitRecommendation[] {
    const currentTime = Date.now();

    // Reset usage history if it's been more than 5 minutes since last generation
    if (currentTime - this.lastGenerationTime > 300000) {
      this.usedItemsHistory = {};
    }
    this.lastGenerationTime = currentTime;

    const recommendations: OutfitRecommendation[] = [];

    // Filter items by weather appropriateness first
    const weatherFilteredItems = context.weather
      ? this.filterByWeather(wardrobeItems, context.weather)
      : wardrobeItems;

    // Group items by category
    const itemsByCategory = this.groupByCategory(weatherFilteredItems);

    // Generate diverse outfit combinations with weather context
    const combinations = this.generateDiverseCombinations(
      itemsByCategory,
      context.occasion,
      profile.preferred_style,
      includeAccessories,
      context.weather,
    );

    // Score and filter combinations
    const scoredOutfits = combinations
      .map((outfit) => this.scoreOutfit(outfit, profile, context))
      .filter((outfit) => outfit.confidence > 0.4); // Lower threshold for more variety

    // Sort by diversity score (prioritize unused items) then confidence
    const diverseOutfits = scoredOutfits
      .sort((a, b) => {
        const diversityScoreA = this.calculateDiversityScore(a.items);
        const diversityScoreB = this.calculateDiversityScore(b.items);

        // If diversity scores are similar, sort by confidence
        if (Math.abs(diversityScoreA - diversityScoreB) < 0.1) {
          return b.confidence - a.confidence;
        }
        return diversityScoreB - diversityScoreA;
      })
      .slice(0, 8); // Generate more options

    // Update usage history
    diverseOutfits.forEach((outfit) => {
      outfit.items.forEach((item) => {
        this.usedItemsHistory[item.id] =
          (this.usedItemsHistory[item.id] || 0) + 1;
      });
    });

    return diverseOutfits.slice(0, 6); // Return top 6 diverse outfits
  }

  private calculateDiversityScore(items: WardrobeItem[]): number {
    let score = 1.0;

    items.forEach((item) => {
      const usageCount = this.usedItemsHistory[item.id] || 0;
      // Heavily penalize frequently used items
      score -= usageCount * 0.3;
    });

    return Math.max(0, score);
  }

  private filterByWeather(
    items: WardrobeItem[],
    weather: WeatherData,
  ): WardrobeItem[] {
    return items.filter((item) => {
      // Temperature-based filtering
      if (weather.temperature < 10) {
        // Cold weather - prefer warm items
        if (item.category === "outerwear" || item.tags?.includes("warm"))
          return true;
        if (item.category === "tops" && item.tags?.includes("long-sleeve"))
          return true;
        if (item.category === "bottoms" && item.tags?.includes("pants"))
          return true;
        if (item.category === "shoes" && item.tags?.includes("boots"))
          return true;
        return !item.tags?.includes("summer") && !item.tags?.includes("shorts");
      } else if (weather.temperature > 25) {
        // Hot weather - prefer light, breathable items and avoid outerwear
        if (item.category === "outerwear") return false; // Explicitly exclude outerwear in hot weather
        if (item.tags?.includes("light") || item.tags?.includes("breathable"))
          return true;
        if (item.category === "tops" && item.tags?.includes("short-sleeve"))
          return true;
        if (item.category === "bottoms" && item.tags?.includes("shorts"))
          return true;
        // Exclude heavy winter items and warm clothing
        if (
          item.tags?.includes("heavy") ||
          item.tags?.includes("wool") ||
          item.tags?.includes("winter") ||
          item.tags?.includes("warm")
        )
          return false;
        return true;
      }

      // Weather condition filtering
      if (weather.condition === "rain") {
        if (item.category === "outerwear" && item.tags?.includes("waterproof"))
          return true;
        if (item.category === "shoes" && !item.tags?.includes("open-toe"))
          return true;
        return !item.tags?.includes("delicate");
      }

      if (weather.condition === "snow") {
        if (item.category === "outerwear" && item.tags?.includes("warm"))
          return true;
        if (item.category === "shoes" && item.tags?.includes("boots"))
          return true;
        return (
          !item.tags?.includes("summer") && !item.tags?.includes("open-toe")
        );
      }

      return true; // Default: include all items for mild weather
    });
  }

  private generateDiverseCombinations(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    preferredStyle?: string,
    includeAccessories: boolean = true,
    weather?: WeatherData,
  ): WardrobeItem[][] {
    const combinations: WardrobeItem[][] = [];

    const tops = this.shuffleArray(itemsByCategory.tops || []);
    const bottoms = this.shuffleArray(itemsByCategory.bottoms || []);
    const dresses = this.shuffleArray(itemsByCategory.dresses || []);
    const shoes = this.shuffleArray(itemsByCategory.shoes || []);
    const outerwear = this.shuffleArray(itemsByCategory.outerwear || []);
    const accessories = this.shuffleArray(itemsByCategory.accessories || []);

    // Check if we should exclude outerwear due to high temperature
    const shouldExcludeOuterwear = weather && weather.temperature > 25;

    // Prioritize less-used items
    const sortByUsage = (a: WardrobeItem, b: WardrobeItem) => {
      const usageA = this.usedItemsHistory[a.id] || 0;
      const usageB = this.usedItemsHistory[b.id] || 0;
      return usageA - usageB;
    };

    tops.sort(sortByUsage);
    bottoms.sort(sortByUsage);
    dresses.sort(sortByUsage);
    shoes.sort(sortByUsage);

    // Generate dress-based outfits with variety
    dresses.forEach((dress, index) => {
      if (index > 4) return; // Limit to prevent too many combinations

      if (
        this.isAppropriateForOccasion(dress, occasion, preferredStyle) &&
        (this.usedItemsHistory[dress.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
      ) {
        const outfit = [dress];

        // Add varied shoes
        const suitableShoes = shoes.filter(
          (shoe) =>
            this.colorsWork(dress.color, shoe.color) &&
            (this.usedItemsHistory[shoe.id] || 0) <
              this.MAX_ITEM_USAGE_PER_SESSION,
        );

        if (suitableShoes.length > 0) {
          outfit.push(suitableShoes[0]);
        }

        // Add outerwear only if temperature allows (strictly no outerwear above 25°C)
        if (
          !shouldExcludeOuterwear &&
          Math.random() > 0.6 &&
          outerwear.length > 0
        ) {
          const suitableOuterwear = outerwear.find(
            (coat) =>
              this.colorsWork(dress.color, coat.color) &&
              (this.usedItemsHistory[coat.id] || 0) <
                this.MAX_ITEM_USAGE_PER_SESSION,
          );
          if (suitableOuterwear) outfit.push(suitableOuterwear);
        }

        // Add accessories only if user wants them
        if (
          includeAccessories &&
          Math.random() > 0.5 &&
          accessories.length > 0
        ) {
          const suitableAccessory = accessories.find(
            (acc) =>
              (this.usedItemsHistory[acc.id] || 0) <
              this.MAX_ITEM_USAGE_PER_SESSION,
          );
          if (suitableAccessory) outfit.push(suitableAccessory);
        }

        combinations.push(outfit);
      }
    });

    // Generate top + bottom combinations with more variety
    const maxCombinations = Math.min(tops.length, bottoms.length, 15); // Limit combinations

    for (let i = 0; i < maxCombinations; i++) {
      const top = tops[i % tops.length];
      const bottom = bottoms[Math.floor(i / tops.length) % bottoms.length];

      if (
        !this.isAppropriateForOccasion(top, occasion, preferredStyle) ||
        !this.isAppropriateForOccasion(bottom, occasion, preferredStyle)
      )
        continue;

      if (
        (this.usedItemsHistory[top.id] || 0) >=
          this.MAX_ITEM_USAGE_PER_SESSION ||
        (this.usedItemsHistory[bottom.id] || 0) >=
          this.MAX_ITEM_USAGE_PER_SESSION
      )
        continue;

      // Use more flexible color matching for variety
      if (
        this.colorsWork(top.color, bottom.color) ||
        this.hasNeutralColors(top.color, bottom.color)
      ) {
        const outfit = [top, bottom];

        // Add shoes with variety
        const availableShoes = shoes.filter(
          (shoe) =>
            (this.usedItemsHistory[shoe.id] || 0) <
            this.MAX_ITEM_USAGE_PER_SESSION,
        );

        if (availableShoes.length > 0) {
          // Pick shoes that work with the outfit, prefer less used ones
          const suitableShoes = availableShoes.filter(
            (shoe) =>
              this.colorsWork([...top.color, ...bottom.color], shoe.color) ||
              this.isNeutralColor(shoe.color),
          );

          if (suitableShoes.length > 0) {
            outfit.push(suitableShoes[0]);
          }
        }

        // Add outerwear only if temperature allows (strictly no outerwear above 25°C)
        if (
          !shouldExcludeOuterwear &&
          Math.random() > 0.7 &&
          outerwear.length > 0
        ) {
          const availableOuterwear = outerwear.find(
            (coat) =>
              (this.usedItemsHistory[coat.id] || 0) <
              this.MAX_ITEM_USAGE_PER_SESSION,
          );
          if (availableOuterwear) outfit.push(availableOuterwear);
        }

        if (
          includeAccessories &&
          Math.random() > 0.6 &&
          accessories.length > 0
        ) {
          const availableAccessory = accessories.find(
            (acc) =>
              (this.usedItemsHistory[acc.id] || 0) <
              this.MAX_ITEM_USAGE_PER_SESSION,
          );
          if (availableAccessory) outfit.push(availableAccessory);
        }

        combinations.push(outfit);
      }
    }

    return combinations;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private hasNeutralColors(colors1: string[], colors2: string[]): boolean {
    const neutrals = [
      "black",
      "white",
      "grey",
      "gray",
      "beige",
      "navy",
      "brown",
      "cream",
    ];
    return (
      colors1.some((c) => neutrals.includes(c.toLowerCase())) &&
      colors2.some((c) => neutrals.includes(c.toLowerCase()))
    );
  }

  private groupByCategory(items: WardrobeItem[]): {
    [key: string]: WardrobeItem[];
  } {
    const groups: { [key: string]: WardrobeItem[] } = {};

    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }

  private scoreOutfit(
    outfit: WardrobeItem[],
    profile: StyleProfile,
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData },
  ): OutfitRecommendation {
    let confidence = 0;
    const reasoning: string[] = [];

    // Base confidence for having items
    confidence += 0.2;

    // Diversity bonus - reward outfits with less-used items
    const diversityBonus = this.calculateDiversityScore(outfit) * 0.15;
    confidence += diversityBonus;

    if (diversityBonus > 0.1) {
      reasoning.push("Features fresh combinations from your wardrobe");
    }

    // Advanced style matching with cross-style compatibility
    const styleScore = this.calculateAdvancedStyleScore(outfit, profile);
    confidence += styleScore * 0.25;

    if (styleScore > 0.8) {
      reasoning.push(
        `Expertly matches your ${profile.preferred_style} aesthetic`,
      );
    } else if (styleScore > 0.6) {
      reasoning.push(
        `Complements your ${profile.preferred_style} style preference`,
      );
    }

    // Enhanced color harmony analysis
    const colorHarmonyScore = this.calculateColorHarmonyScore(outfit, profile);
    confidence += colorHarmonyScore * 0.2;

    if (colorHarmonyScore > 0.8) {
      reasoning.push("Exceptional color harmony creates visual flow");
    } else if (colorHarmonyScore > 0.6) {
      reasoning.push("Well-balanced color palette");
    }

    // Occasion appropriateness with formality levels
    const occasionScore = this.calculateOccasionScore(outfit, context.occasion);
    confidence += occasionScore * 0.25;

    if (occasionScore > 0.9) {
      reasoning.push(`Perfectly tailored for ${context.occasion} occasions`);
    } else if (occasionScore > 0.7) {
      reasoning.push(`Appropriate for ${context.occasion} settings`);
    }

    // Weather intelligence
    if (context.weather) {
      const weatherScore = this.calculateAdvancedWeatherScore(
        outfit,
        context.weather,
      );
      confidence += weatherScore * 0.2;

      if (weatherScore > 0.8) {
        reasoning.push(
          this.getAdvancedWeatherReasoning(outfit, context.weather),
        );
      } else if (weatherScore < 0.3) {
        confidence -= 0.1; // Penalty for poor weather matching
        reasoning.push(
          `Consider weather conditions (${Math.round(context.weather.temperature)}°C)`,
        );
      }
    }

    // Outfit completeness and balance
    const completenessScore = this.calculateCompletenessScore(outfit);
    confidence += completenessScore * 0.15;

    if (completenessScore > 0.8) {
      reasoning.push("Complete, well-balanced outfit");
    }

    // Trend relevance and fashion rules
    const fashionScore = this.calculateFashionScore(outfit, context);
    confidence += fashionScore * 0.1;

    if (fashionScore > 0.7) {
      reasoning.push("Follows contemporary fashion principles");
    }

    // Goal alignment (if user has specific goals)
    if (profile.goals && profile.goals.length > 0) {
      const goalScore = this.calculateGoalAlignment(outfit, profile.goals);
      confidence += goalScore * 0.1;

      if (goalScore > 0.6) {
        reasoning.push("Aligns with your style goals");
      }
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.min(1, Math.max(0, confidence));

    const outfitId = outfit
      .map((item) => item.id)
      .sort()
      .join("-");
    const style = this.determineOverallStyle(outfit);

    return {
      id: outfitId,
      items: outfit,
      occasion: context.occasion,
      style,
      confidence,
      description: this.generateAdvancedDescription(
        outfit,
        context,
        confidence,
      ),
      reasoning,
    };
  }

  private calculateWeatherScore(
    outfit: WardrobeItem[],
    weather: WeatherData,
  ): number {
    let score = 0;
    let totalItems = outfit.length;

    outfit.forEach((item) => {
      if (weather.temperature < 10) {
        // Cold weather scoring
        if (item.category === "outerwear" || item.tags?.includes("warm"))
          score += 1;
        if (item.tags?.includes("long-sleeve")) score += 0.5;
        if (item.tags?.includes("boots") || item.tags?.includes("closed-toe"))
          score += 0.5;
        if (item.tags?.includes("summer") || item.tags?.includes("shorts"))
          score -= 0.5;
      } else if (weather.temperature > 25) {
        // Hot weather scoring
        if (item.category === "outerwear") score -= 1; // Heavily penalize outerwear in hot weather
        if (item.tags?.includes("light") || item.tags?.includes("breathable"))
          score += 1;
        if (
          item.tags?.includes("short-sleeve") ||
          item.tags?.includes("shorts")
        )
          score += 0.5;
        if (
          item.tags?.includes("heavy") ||
          item.tags?.includes("wool") ||
          item.tags?.includes("winter") ||
          item.tags?.includes("warm")
        )
          score -= 0.5;
      }

      if (weather.condition === "rain") {
        if (item.tags?.includes("waterproof")) score += 1;
        if (item.category === "shoes" && !item.tags?.includes("open-toe"))
          score += 0.5;
        if (item.tags?.includes("delicate")) score -= 0.5;
      }

      if (weather.condition === "snow") {
        if (item.tags?.includes("warm") || item.tags?.includes("insulated"))
          score += 1;
        if (item.tags?.includes("boots")) score += 0.5;
        if (item.tags?.includes("open-toe")) score -= 1;
      }
    });

    return Math.max(0, Math.min(1, score / totalItems));
  }

  private getWeatherReasoning(
    outfit: WardrobeItem[],
    weather: WeatherData,
  ): string {
    if (weather.temperature < 10) {
      return `Perfect for cold weather (${weather.temperature}°C) with warm layers`;
    } else if (weather.temperature > 25) {
      const hasOuterwear = outfit.some((item) => item.category === "outerwear");
      if (hasOuterwear) {
        return `Note: Outerwear not recommended for temperatures above 25°C (${weather.temperature}°C)`;
      }
      return `Ideal for warm weather (${weather.temperature}°C) with breathable fabrics - no outerwear needed`;
    }

    if (weather.condition === "rain") {
      return `Weather-appropriate for rainy conditions`;
    }

    if (weather.condition === "snow") {
      return `Suitable for snowy weather with proper coverage`;
    }

    return `Well-suited for current weather conditions`;
  }

  private isAppropriateForOccasion(
    item: WardrobeItem,
    occasion: string,
    preferredStyle?: string,
  ): boolean {
    // Stricter category matching
    const isOccasionMatch =
      item.occasion.includes(occasion) || item.occasion.includes("versatile");

    // For formal occasions, be more strict
    if (occasion === "formal" || occasion === "business") {
      if (item.style === "casual" || item.style === "streetwear") {
        return false; // Don't allow casual/streetwear for formal occasions
      }
      return (
        isOccasionMatch || item.style === "formal" || item.style === "business"
      );
    }

    // For casual occasions, allow more flexibility but prefer matching style
    if (occasion === "casual") {
      return isOccasionMatch || item.occasion.includes("casual");
    }

    // For other occasions, use original logic but consider style preference
    if (preferredStyle && item.style === preferredStyle) {
      return true;
    }

    return isOccasionMatch || item.occasion.includes("casual");
  }

  private colorsWork(colors1: string[], colors2: string[]): boolean {
    try {
      if (
        !this.validateColorInput(colors1) ||
        !this.validateColorInput(colors2)
      ) {
        return false;
      }

      // Enhanced neutral colors with more variations
      const neutrals = [
        "black",
        "white",
        "grey",
        "gray",
        "beige",
        "navy",
        "brown",
        "cream",
        "ivory",
        "charcoal",
        "khaki",
        "tan",
        "taupe",
        "nude",
        "sand",
        "stone",
        "off-white",
        "bone",
        "champagne",
        "mushroom",
        "camel",
        "chocolate",
        "coffee",
        "pewter",
      ];

      // If either item has neutrals, they work with almost everything
      if (
        colors1.some((c) =>
          neutrals.some((n) => c.toLowerCase().includes(n)),
        ) ||
        colors2.some((c) => neutrals.some((n) => c.toLowerCase().includes(n)))
      ) {
        return true;
      }

      // Exact color matches
      if (
        colors1.some((c1) =>
          colors2.some((c2) => c1.toLowerCase() === c2.toLowerCase()),
        )
      ) {
        return true;
      }

      // Complementary colors
      if (this.areComplementary(colors1, colors2)) {
        return true;
      }

      // Analogous colors (colors next to each other on color wheel)
      if (this.areAnalogous(colors1, colors2)) {
        return true;
      }

      // Triadic colors (three colors evenly spaced on color wheel)
      if (this.areTriadic(colors1, colors2)) {
        return true;
      }

      // Monochromatic scheme (different shades of same color)
      if (this.areMonochromatic(colors1, colors2)) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn("Error in colorsWork:", error);
      return false;
    }
  }

  private colorsMatch(colors1: string[], colors2: string[]): boolean {
    return colors1.some((c1) =>
      colors2.some((c2) => c1.toLowerCase() === c2.toLowerCase()),
    );
  }

  private isNeutralColor(colors: string[]): boolean {
    try {
      if (!this.validateColorInput(colors)) return false;

      const neutrals = [
        "black",
        "white",
        "grey",
        "gray",
        "beige",
        "navy",
        "brown",
        "cream",
        "ivory",
        "charcoal",
        "khaki",
        "tan",
        "taupe",
        "nude",
        "sand",
        "stone",
        "off-white",
        "bone",
        "champagne",
        "mushroom",
        "camel",
        "chocolate",
        "coffee",
        "pewter",
      ];
      return colors.some((color) =>
        neutrals.some((n) => color.toLowerCase().includes(n)),
      );
    } catch (error) {
      console.warn("Error in isNeutralColor:", error);
      return false;
    }
  }

  private areComplementary(colors1: string[], colors2: string[]): boolean {
    try {
      if (
        !this.validateColorInput(colors1) ||
        !this.validateColorInput(colors2)
      ) {
        return false;
      }

      const complementaryPairs = [
        ["red", "green"],
        ["green", "red"],
        ["blue", "orange"],
        ["orange", "blue"],
        ["yellow", "purple"],
        ["purple", "yellow"],
        ["pink", "green"],
        ["green", "pink"],
        ["teal", "coral"],
        ["coral", "teal"],
        ["magenta", "lime"],
        ["lime", "magenta"],
        ["cyan", "red"],
        ["red", "cyan"],
        ["navy", "gold"],
        ["gold", "navy"],
        ["burgundy", "forest"],
        ["forest", "burgundy"],
        ["rust", "teal"],
        ["teal", "rust"],
      ];

      return complementaryPairs.some(
        ([color1, color2]) =>
          colors1.some((c1) => c1.toLowerCase().includes(color1)) &&
          colors2.some((c2) => c2.toLowerCase().includes(color2)),
      );
    } catch (error) {
      console.warn("Error in areComplementary:", error);
      return false;
    }
  }

  private hasGoodColorHarmony(outfit: WardrobeItem[]): boolean {
    const allColors = outfit.flatMap((item) => item.color);
    const uniqueColors = [...new Set(allColors.map((c) => c.toLowerCase()))];

    if (uniqueColors.length > 4) return false;

    const neutrals = [
      "black",
      "white",
      "grey",
      "gray",
      "beige",
      "navy",
      "brown",
    ];
    const neutralCount = uniqueColors.filter((color) =>
      neutrals.some((neutral) => color.includes(neutral)),
    ).length;

    if (neutralCount >= uniqueColors.length - 1) return true;

    return true;
  }

  private determineOverallStyle(outfit: WardrobeItem[]): string {
    const styles = outfit.map((item) => item.style);
    const styleCounts: { [key: string]: number } = {};

    styles.forEach((style) => {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });

    return (
      Object.entries(styleCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "casual"
    );
  }

  private generateDescription(
    outfit: WardrobeItem[],
    context: { occasion: string; weather?: WeatherData },
  ): string {
    const categories = outfit.map((item) => item.category);
    const style = this.determineOverallStyle(outfit);

    let description = "";
    if (categories.includes("dresses")) {
      description = `A ${style} dress ensemble perfect for ${context.occasion}`;
    } else {
      const topCategory =
        categories.find((cat) => ["tops", "shirts"].includes(cat)) || "top";
      const bottomCategory =
        categories.find((cat) =>
          ["bottoms", "pants", "skirts"].includes(cat),
        ) || "bottom";
      description = `A ${style} combination with ${topCategory} and ${bottomCategory} for ${context.occasion}`;
    }

    // Add weather context
    if (context.weather) {
      if (context.weather.temperature < 10) {
        description += ` (warm layers for cold weather)`;
      } else if (context.weather.temperature > 25) {
        description += ` (light fabrics for warm weather)`;
      }

      if (context.weather.condition === "rain") {
        description += ` with weather protection`;
      }
    }

    return description;
  }

  private calculateAdvancedStyleScore(
    outfit: WardrobeItem[],
    profile: StyleProfile,
  ): number {
    let score = 0;
    const totalItems = outfit.length;

    // Direct style matches
    const exactMatches = outfit.filter(
      (item) => item.style === profile.preferred_style,
    ).length;
    score += (exactMatches / totalItems) * 0.6;

    // Versatile items work with any style
    const versatileItems = outfit.filter(
      (item) => item.style === "versatile",
    ).length;
    score += (versatileItems / totalItems) * 0.4;

    // Cross-style compatibility matrix
    const styleCompatibility: { [key: string]: string[] } = {
      casual: ["casual", "smart-casual", "streetwear", "bohemian"],
      formal: ["formal", "business", "elegant", "classic"],
      business: ["business", "formal", "smart-casual", "classic"],
      bohemian: ["bohemian", "casual", "artistic", "vintage"],
      streetwear: ["streetwear", "casual", "urban", "sporty"],
      vintage: ["vintage", "classic", "bohemian", "elegant"],
      sporty: ["sporty", "casual", "streetwear", "athletic"],
      elegant: ["elegant", "formal", "classic", "sophisticated"],
    };

    const compatibleStyles = styleCompatibility[profile.preferred_style] || [
      profile.preferred_style,
    ];
    const compatibleItems = outfit.filter(
      (item) =>
        compatibleStyles.includes(item.style) || item.style === "versatile",
    ).length;

    score = Math.max(score, compatibleItems / totalItems);

    return Math.min(1, score);
  }

  private calculateColorHarmonyScore(
    outfit: WardrobeItem[],
    profile: StyleProfile,
  ): number {
    const allColors = outfit.flatMap((item) =>
      item.color.map((c) => c.toLowerCase()),
    );
    let score = 0.5; // Base score

    // Color theory principles
    const colorCategories = {
      neutrals: [
        "black",
        "white",
        "grey",
        "gray",
        "beige",
        "navy",
        "brown",
        "cream",
        "nude",
        "khaki",
      ],
      warm: [
        "red",
        "orange",
        "yellow",
        "pink",
        "coral",
        "burgundy",
        "rust",
        "gold",
      ],
      cool: [
        "blue",
        "green",
        "purple",
        "teal",
        "mint",
        "lavender",
        "turquoise",
      ],
      earth: ["brown", "tan", "olive", "terracotta", "sand", "camel"],
    };

    const neutralCount = allColors.filter((c) =>
      colorCategories.neutrals.some((n) => c.includes(n)),
    ).length;
    const warmCount = allColors.filter((c) =>
      colorCategories.warm.some((w) => c.includes(w)),
    ).length;
    const coolCount = allColors.filter((c) =>
      colorCategories.cool.some((co) => c.includes(co)),
    ).length;
    const earthCount = allColors.filter((c) =>
      colorCategories.earth.some((e) => c.includes(e)),
    ).length;

    // Monochromatic bonus (similar colors)
    if (
      warmCount >= allColors.length * 0.7 ||
      coolCount >= allColors.length * 0.7
    ) {
      score += 0.2;
    }

    // Neutral base bonus
    if (neutralCount >= allColors.length * 0.5) {
      score += 0.3;
    }

    // Earth tone harmony
    if (earthCount >= allColors.length * 0.6) {
      score += 0.2;
    }

    // Avoid color chaos (too many different color families)
    const colorFamilies = [
      warmCount > 0 ? 1 : 0,
      coolCount > 0 ? 1 : 0,
      neutralCount > 0 ? 1 : 0,
      earthCount > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    if (colorFamilies > 3) {
      score -= 0.2;
    }

    // Favorite color bonus
    if (profile.favorite_colors && profile.favorite_colors.length > 0) {
      const favoriteMatches = allColors.filter((color) =>
        profile.favorite_colors!.some((fav) =>
          color.includes(fav.toLowerCase()),
        ),
      ).length;
      if (favoriteMatches > 0) {
        score += 0.15;
      }
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateOccasionScore(
    outfit: WardrobeItem[],
    occasion: string,
  ): number {
    let score = 0;
    const totalItems = outfit.length;

    // Occasion formality levels
    const formalityLevels: { [key: string]: number } = {
      formal: 5,
      business: 4,
      "smart-casual": 3,
      casual: 2,
      sport: 1,
      loungewear: 0,
    };

    const targetFormality = formalityLevels[occasion] || 2;

    outfit.forEach((item) => {
      // Direct occasion match
      if (item.occasion.includes(occasion)) {
        score += 1;
        return;
      }

      // Versatile items work for most occasions
      if (item.occasion.includes("versatile")) {
        score += 0.8;
        return;
      }

      // Check formality compatibility
      const itemFormalities = item.occasion.map(
        (occ) => formalityLevels[occ] || 2,
      );
      const closestFormality = itemFormalities.reduce((prev, curr) =>
        Math.abs(curr - targetFormality) < Math.abs(prev - targetFormality)
          ? curr
          : prev,
      );

      const formalityDiff = Math.abs(closestFormality - targetFormality);
      if (formalityDiff <= 1) {
        score += 0.7;
      } else if (formalityDiff <= 2) {
        score += 0.4;
      }
    });

    return Math.min(1, score / totalItems);
  }

  private calculateAdvancedWeatherScore(
    outfit: WardrobeItem[],
    weather: WeatherData,
  ): number {
    let score = 0;
    let totalItems = outfit.length;

    outfit.forEach((item) => {
      let itemScore = 0;

      // Temperature appropriateness
      if (weather.temperature < 5) {
        // Very cold
        if (
          item.category === "outerwear" &&
          item.tags?.some((tag) =>
            ["heavy", "winter", "insulated", "warm"].includes(tag),
          )
        )
          itemScore += 1;
        if (
          item.tags?.some((tag) =>
            ["wool", "fleece", "thermal", "long-sleeve"].includes(tag),
          )
        )
          itemScore += 0.5;
        if (item.category === "shoes" && item.tags?.includes("boots"))
          itemScore += 0.5;
        if (item.tags?.some((tag) => ["summer", "thin", "light"].includes(tag)))
          itemScore -= 0.5;
      } else if (weather.temperature < 15) {
        // Cold
        if (item.category === "outerwear" || item.tags?.includes("warm"))
          itemScore += 0.8;
        if (item.tags?.includes("long-sleeve")) itemScore += 0.4;
        if (
          item.tags?.some((tag) =>
            ["summer", "shorts", "sleeveless"].includes(tag),
          )
        )
          itemScore -= 0.3;
      } else if (weather.temperature < 25) {
        // Mild
        if (item.tags?.some((tag) => ["light", "medium"].includes(tag)))
          itemScore += 0.5;
        if (item.category === "outerwear" && weather.temperature > 20)
          itemScore -= 0.2;
      } else if (weather.temperature < 30) {
        // Warm
        if (
          item.tags?.some((tag) =>
            ["light", "breathable", "cotton", "linen"].includes(tag),
          )
        )
          itemScore += 0.8;
        if (
          item.tags?.some((tag) => ["short-sleeve", "sleeveless"].includes(tag))
        )
          itemScore += 0.4;
        if (item.category === "outerwear") itemScore -= 0.8;
        if (item.tags?.some((tag) => ["heavy", "wool", "warm"].includes(tag)))
          itemScore -= 0.4;
      } else {
        // Hot
        if (
          item.tags?.some((tag) =>
            ["very-light", "breathable", "linen", "mesh"].includes(tag),
          )
        )
          itemScore += 1;
        if (
          item.tags?.some((tag) =>
            ["sleeveless", "shorts", "open-toe"].includes(tag),
          )
        )
          itemScore += 0.6;
        if (item.category === "outerwear") itemScore -= 1;
        if (
          item.tags?.some((tag) =>
            ["heavy", "wool", "long-sleeve", "warm"].includes(tag),
          )
        )
          itemScore -= 0.6;
      }

      // Weather condition appropriateness
      if (weather.condition === "rain") {
        if (
          item.tags?.some((tag) =>
            ["waterproof", "water-resistant"].includes(tag),
          )
        )
          itemScore += 0.8;
        if (item.category === "shoes" && !item.tags?.includes("open-toe"))
          itemScore += 0.4;
        if (item.tags?.includes("delicate")) itemScore -= 0.4;
      }

      if (weather.condition === "snow") {
        if (
          item.tags?.some((tag) =>
            ["insulated", "warm", "waterproof"].includes(tag),
          )
        )
          itemScore += 0.8;
        if (item.category === "shoes" && item.tags?.includes("boots"))
          itemScore += 0.6;
        if (item.tags?.includes("open-toe")) itemScore -= 0.8;
      }

      if (weather.condition === "windy") {
        if (
          item.category === "outerwear" ||
          item.tags?.includes("wind-resistant")
        )
          itemScore += 0.4;
        if (item.tags?.some((tag) => ["loose", "flowing"].includes(tag)))
          itemScore -= 0.2;
      }

      score += Math.max(0, itemScore);
    });

    return Math.min(1, Math.max(0, score / totalItems));
  }

  private calculateCompletenessScore(outfit: WardrobeItem[]): number {
    const categories = outfit.map((item) => item.category.toLowerCase());
    let score = 0.5; // Base score

    // Essential items check
    const hasTop =
      categories.some((c) =>
        ["tops", "shirts", "blouses", "sweaters"].includes(c),
      ) || categories.includes("dresses");
    const hasBottom =
      categories.some((c) =>
        ["bottoms", "pants", "skirts", "shorts"].includes(c),
      ) || categories.includes("dresses");
    const hasShoes = categories.includes("shoes");

    if (hasTop) score += 0.2;
    if (hasBottom) score += 0.2;
    if (hasShoes) score += 0.1;

    // Dress as complete outfit
    if (categories.includes("dresses")) {
      score += 0.3;
    }

    // Layering appropriateness
    if (categories.includes("outerwear") && outfit.length >= 3) {
      score += 0.1;
    }

    // Avoid over-accessorizing
    const accessoryCount = categories.filter((c) =>
      ["accessories", "jewelry", "bags", "hats", "scarves", "belts"].includes(
        c,
      ),
    ).length;

    if (accessoryCount <= 2) {
      score += 0.1;
    } else if (accessoryCount > 3) {
      score -= 0.1;
    }

    return Math.min(1, score);
  }

  private calculateFashionScore(
    outfit: WardrobeItem[],
    context: { occasion: string; timeOfDay?: string },
  ): number {
    let score = 0.5;

    // Fashion rules and trends
    const categories = outfit.map((item) => item.category.toLowerCase());
    const styles = outfit.map((item) => item.style.toLowerCase());

    // Advanced pattern analysis
    const patternAnalysis = this.checkPatternHarmony(outfit);
    score += patternAnalysis.score * 0.3;

    // Advanced texture analysis
    const textureAnalysis = this.checkTextureBalance(outfit);
    score += textureAnalysis.score * 0.2;

    // Fit and silhouette balance
    const fitted = outfit.filter((item) =>
      item.tags?.includes("fitted"),
    ).length;
    const loose = outfit.filter((item) => item.tags?.includes("loose")).length;

    if (fitted > 0 && loose > 0 && outfit.length > 2) {
      score += 0.1; // Good fit balance
    }

    // Fabric weight balance
    const fabricWeights = outfit.map((item) =>
      this.calculateFabricWeight(item),
    );
    const uniqueWeights = [...new Set(fabricWeights)];
    if (uniqueWeights.length >= 2 && uniqueWeights.length <= 3) {
      score += 0.1; // Good weight variety
    }

    // Time appropriateness
    if (context.timeOfDay === "evening" || context.timeOfDay === "night") {
      if (
        styles.some((s) => ["elegant", "formal", "sophisticated"].includes(s))
      ) {
        score += 0.1;
      }
    }

    return Math.min(1, score);
  }

  private calculateGoalAlignment(
    outfit: WardrobeItem[],
    goals: string[],
  ): number {
    let score = 0;

    goals.forEach((goal) => {
      const goalLower = goal.toLowerCase();

      if (
        goalLower.includes("confident") ||
        goalLower.includes("professional")
      ) {
        if (
          outfit.some((item) =>
            ["business", "formal", "structured"].includes(item.style),
          )
        ) {
          score += 0.3;
        }
      }

      if (goalLower.includes("comfortable") || goalLower.includes("casual")) {
        if (
          outfit.some(
            (item) =>
              item.tags?.includes("comfortable") || item.style === "casual",
          )
        ) {
          score += 0.3;
        }
      }

      if (goalLower.includes("trendy") || goalLower.includes("fashion")) {
        if (
          outfit.some((item) =>
            ["trendy", "modern", "contemporary"].includes(item.style),
          )
        ) {
          score += 0.3;
        }
      }

      if (goalLower.includes("versatile")) {
        if (
          outfit.every(
            (item) =>
              item.style === "versatile" || item.occasion.includes("versatile"),
          )
        ) {
          score += 0.4;
        }
      }
    });

    return Math.min(1, score / goals.length);
  }

  private generateAdvancedDescription(
    outfit: WardrobeItem[],
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData },
    confidence: number,
  ): string {
    const categories = outfit.map((item) => item.category.toLowerCase());
    const styles = [...new Set(outfit.map((item) => item.style))];
    const colors = [...new Set(outfit.flatMap((item) => item.color))];

    let description = "";

    // Style-based descriptions
    if (styles.includes("formal") || styles.includes("business")) {
      description = "Sophisticated and polished ensemble";
    } else if (styles.includes("casual")) {
      description = "Effortlessly stylish casual look";
    } else if (styles.includes("bohemian")) {
      description = "Free-spirited bohemian combination";
    } else if (styles.includes("streetwear")) {
      description = "Urban-inspired streetwear outfit";
    } else if (styles.includes("elegant")) {
      description = "Elegantly curated ensemble";
    } else {
      description = "Thoughtfully styled outfit";
    }

    // Add color description
    if (colors.length <= 2) {
      description += ` in ${colors.join(" and ")}`;
    } else if (
      colors.includes("black") ||
      colors.includes("white") ||
      colors.includes("navy")
    ) {
      description += " with classic color palette";
    } else {
      description += " with harmonious colors";
    }

    // Add confidence-based qualifier
    if (confidence > 0.8) {
      description = "Perfectly " + description.toLowerCase();
    } else if (confidence > 0.6) {
      description = "Beautifully " + description.toLowerCase();
    }

    return description;
  }

  private getAdvancedWeatherReasoning(
    outfit: WardrobeItem[],
    weather: WeatherData,
  ): string {
    const temp = Math.round(weather.temperature);

    if (weather.temperature < 10) {
      return `Expertly layered for cold weather (${temp}°C) with proper insulation`;
    } else if (weather.temperature > 25) {
      return `Optimally chosen for warm conditions (${temp}°C) with breathable pieces`;
    } else if (weather.condition === "rain") {
      return `Weather-smart choices for rainy conditions with protective elements`;
    } else if (weather.condition === "snow") {
      return `Winter-ready ensemble with appropriate coverage for snowy weather`;
    }

    return `Perfectly suited for today's weather (${temp}°C, ${weather.condition})`;
  }

  private areAnalogous(colors1: string[], colors2: string[]): boolean {
    try {
      // Analogous colors are next to each other on the color wheel
      const analogousGroups = [
        ["red", "orange", "pink"],
        ["orange", "yellow", "red"],
        ["yellow", "green", "orange"],
        ["green", "blue", "yellow"],
        ["blue", "purple", "green"],
        ["purple", "red", "blue"],
        ["pink", "red", "purple"],
        ["teal", "blue", "green"],
        ["coral", "orange", "pink"],
        ["lime", "green", "yellow"],
      ];

      return analogousGroups.some(
        (group) =>
          colors1.some((c1) =>
            group.some((g) => c1.toLowerCase().includes(g)),
          ) &&
          colors2.some((c2) => group.some((g) => c2.toLowerCase().includes(g))),
      );
    } catch (error) {
      console.warn("Error in areAnalogous:", error);
      return false;
    }
  }

  private areTriadic(colors1: string[], colors2: string[]): boolean {
    try {
      // Triadic colors are evenly spaced on the color wheel
      const triadicGroups = [
        ["red", "blue", "yellow"],
        ["orange", "green", "purple"],
        ["pink", "teal", "lime"],
        ["coral", "navy", "gold"],
      ];

      return triadicGroups.some(
        (group) =>
          colors1.some((c1) =>
            group.some((g) => c1.toLowerCase().includes(g)),
          ) &&
          colors2.some((c2) => group.some((g) => c2.toLowerCase().includes(g))),
      );
    } catch (error) {
      console.warn("Error in areTriadic:", error);
      return false;
    }
  }

  private areMonochromatic(colors1: string[], colors2: string[]): boolean {
    try {
      // Monochromatic colors are different shades of the same color
      const monochromaticGroups = [
        [
          "red",
          "crimson",
          "burgundy",
          "maroon",
          "cherry",
          "rose",
          "pink",
          "coral",
        ],
        ["blue", "navy", "royal", "sky", "powder", "teal", "turquoise", "cyan"],
        ["green", "forest", "olive", "lime", "mint", "sage", "emerald", "jade"],
        ["yellow", "gold", "mustard", "lemon", "cream", "butter", "champagne"],
        ["purple", "violet", "lavender", "plum", "magenta", "lilac", "mauve"],
        ["orange", "peach", "apricot", "coral", "rust", "amber", "bronze"],
        [
          "brown",
          "tan",
          "beige",
          "taupe",
          "khaki",
          "camel",
          "coffee",
          "chocolate",
        ],
      ];

      return monochromaticGroups.some(
        (group) =>
          colors1.some((c1) =>
            group.some((g) => c1.toLowerCase().includes(g)),
          ) &&
          colors2.some((c2) => group.some((g) => c2.toLowerCase().includes(g))),
      );
    } catch (error) {
      console.warn("Error in areMonochromatic:", error);
      return false;
    }
  }

  private validateColorInput(colors: string[]): boolean {
    return (
      colors &&
      Array.isArray(colors) &&
      colors.length > 0 &&
      colors.every(
        (color) => typeof color === "string" && color.trim().length > 0,
      )
    );
  }

  private normalizeColor(color: string): string {
    return color
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
  }

  private getSeasonalColorPalette(season: string): string[] {
    const seasonalPalettes = {
      spring: [
        "coral",
        "peach",
        "yellow",
        "lime",
        "turquoise",
        "pink",
        "orange",
        "gold",
      ],
      summer: [
        "lavender",
        "rose",
        "sage",
        "powder blue",
        "mint",
        "pearl",
        "champagne",
        "mauve",
      ],
      autumn: [
        "rust",
        "burgundy",
        "forest",
        "gold",
        "brown",
        "orange",
        "olive",
        "bronze",
      ],
      winter: [
        "navy",
        "black",
        "white",
        "crimson",
        "royal blue",
        "emerald",
        "silver",
        "purple",
      ],
    };

    return seasonalPalettes[season as keyof typeof seasonalPalettes] || [];
  }

  private calculateColorTemperature(
    colors: string[],
  ): "warm" | "cool" | "neutral" {
    const warmColors = [
      "red",
      "orange",
      "yellow",
      "pink",
      "coral",
      "gold",
      "rust",
      "burgundy",
    ];
    const coolColors = [
      "blue",
      "green",
      "purple",
      "teal",
      "mint",
      "lavender",
      "turquoise",
      "cyan",
    ];

    let warmCount = 0;
    let coolCount = 0;

    colors.forEach((color) => {
      const normalizedColor = this.normalizeColor(color);
      if (warmColors.some((w) => normalizedColor.includes(w))) warmCount++;
      if (coolColors.some((c) => normalizedColor.includes(c))) coolCount++;
    });

    if (warmCount > coolCount) return "warm";
    if (coolCount > warmCount) return "cool";
    return "neutral";
  }

  private getPatternsFromItem(item: WardrobeItem): string[] {
    const patternTags = [
      "striped",
      "polka-dot",
      "floral",
      "geometric",
      "plaid",
      "checkered",
      "paisley",
      "animal-print",
      "leopard",
      "zebra",
      "abstract",
      "tribal",
      "damask",
      "toile",
      "houndstooth",
      "tartan",
      "argyle",
      "chevron",
      "herringbone",
      "dots",
      "stripes",
    ];

    return (item.tags || []).filter((tag) =>
      patternTags.some((pattern) => tag.toLowerCase().includes(pattern)),
    );
  }

  private getTexturesFromItem(item: WardrobeItem): string[] {
    const textureTags = [
      "silk",
      "cotton",
      "linen",
      "wool",
      "cashmere",
      "denim",
      "leather",
      "suede",
      "velvet",
      "satin",
      "chiffon",
      "lace",
      "knit",
      "jersey",
      "tweed",
      "corduroy",
      "fleece",
      "mesh",
      "canvas",
      "flannel",
      "organza",
      "taffeta",
      "crepe",
      "tulle",
      "mohair",
      "angora",
      "bamboo",
      "polyester",
      "rayon",
      "spandex",
      "nylon",
    ];

    return (item.tags || []).filter((tag) =>
      textureTags.some((texture) => tag.toLowerCase().includes(texture)),
    );
  }

  private checkPatternHarmony(outfit: WardrobeItem[]): {
    score: number;
    reasoning: string;
  } {
    try {
      const patternedItems = outfit.filter(
        (item) => this.getPatternsFromItem(item).length > 0,
      );
      const patternCount = patternedItems.length;

      if (patternCount === 0) {
        return {
          score: 0.8,
          reasoning: "Clean, solid colors create elegant simplicity",
        };
      }

      if (patternCount === 1) {
        return {
          score: 1.0,
          reasoning: "Single pattern creates perfect focal point",
        };
      }

      if (patternCount === 2) {
        // Check if patterns are compatible
        const patterns1 = this.getPatternsFromItem(patternedItems[0]);
        const patterns2 = this.getPatternsFromItem(patternedItems[1]);

        // Different scales work well together
        const hasSmallPattern =
          patterns1.some((p) => p.includes("dots") || p.includes("small")) ||
          patterns2.some((p) => p.includes("dots") || p.includes("small"));
        const hasLargePattern =
          patterns1.some(
            (p) => p.includes("floral") || p.includes("geometric"),
          ) ||
          patterns2.some(
            (p) => p.includes("floral") || p.includes("geometric"),
          );

        if (hasSmallPattern && hasLargePattern) {
          return {
            score: 0.9,
            reasoning: "Expertly mixed patterns with different scales",
          };
        }

        // Similar pattern families
        const patternFamilies = {
          geometric: [
            "geometric",
            "chevron",
            "herringbone",
            "houndstooth",
            "plaid",
            "checkered",
          ],
          organic: ["floral", "paisley", "animal-print", "abstract"],
          linear: ["striped", "chevron", "herringbone"],
        };

        for (const family of Object.values(patternFamilies)) {
          const family1Match = patterns1.some((p) =>
            family.some((f) => p.includes(f)),
          );
          const family2Match = patterns2.some((p) =>
            family.some((f) => p.includes(f)),
          );

          if (family1Match && family2Match) {
            return {
              score: 0.8,
              reasoning: "Well-coordinated patterns from same family",
            };
          }
        }

        return {
          score: 0.6,
          reasoning: "Mixed patterns - proceed with caution",
        };
      }

      // More than 2 patterns - generally not recommended
      return {
        score: 0.3,
        reasoning: "Too many patterns may create visual chaos",
      };
    } catch (error) {
      console.warn("Error in checkPatternHarmony:", error);
      return { score: 0.5, reasoning: "Pattern analysis unavailable" };
    }
  }

  private checkTextureBalance(outfit: WardrobeItem[]): {
    score: number;
    reasoning: string;
  } {
    try {
      const textures = outfit.flatMap((item) => this.getTexturesFromItem(item));
      const uniqueTextures = [...new Set(textures)];

      if (uniqueTextures.length === 0) {
        return { score: 0.5, reasoning: "Texture information not available" };
      }

      if (uniqueTextures.length === 1) {
        return {
          score: 0.7,
          reasoning: "Uniform texture creates cohesive look",
        };
      }

      if (uniqueTextures.length === 2 || uniqueTextures.length === 3) {
        // Check for good texture combinations
        const textureGroups = {
          smooth: ["silk", "satin", "cotton", "polyester", "rayon"],
          textured: ["wool", "tweed", "corduroy", "knit", "fleece"],
          structured: ["denim", "canvas", "leather", "suede"],
          delicate: ["lace", "chiffon", "organza", "tulle"],
        };

        // Different texture groups work well together
        const representedGroups = Object.entries(textureGroups).filter(
          ([, materials]) =>
            uniqueTextures.some((texture) =>
              materials.some((material) => texture.includes(material)),
            ),
        );

        if (representedGroups.length >= 2) {
          return {
            score: 0.9,
            reasoning: "Excellent texture contrast creates visual interest",
          };
        }

        return { score: 0.8, reasoning: "Good texture variety" };
      }

      // Too many different textures
      return {
        score: 0.4,
        reasoning: "Too many textures may overwhelm the look",
      };
    } catch (error) {
      console.warn("Error in checkTextureBalance:", error);
      return { score: 0.5, reasoning: "Texture analysis unavailable" };
    }
  }

  private calculateFabricWeight(
    item: WardrobeItem,
  ): "light" | "medium" | "heavy" {
    const lightFabrics = [
      "silk",
      "chiffon",
      "organza",
      "cotton",
      "linen",
      "rayon",
    ];
    const heavyFabrics = [
      "wool",
      "denim",
      "leather",
      "suede",
      "velvet",
      "tweed",
      "corduroy",
    ];

    const textures = this.getTexturesFromItem(item);

    if (textures.some((t) => lightFabrics.some((f) => t.includes(f))))
      return "light";
    if (textures.some((t) => heavyFabrics.some((f) => t.includes(f))))
      return "heavy";
    return "medium";
  }
}

// Export a singleton instance
export const simpleStyleAI = new SimpleStyleAI();
