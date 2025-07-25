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
  color_palette_colors?: string[];
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

import { advancedColorTheory, ColorHarmonyResult } from "./advancedColorTheory";

export class SimpleStyleAI {
  private usedItemsHistory: { [itemId: string]: number } = {};
  private lastGenerationTime: number = 0;
  private readonly ITEM_COOLDOWN_MS = 15000; // 15 seconds before item can be used again (reduced)
  private readonly MAX_ITEM_USAGE_PER_SESSION = 3; // Increased to allow more combinations
  private diversityBoost: boolean = true; // Flag to encourage variety
  private debugMode: boolean = false;
  private performanceMetrics: { [key: string]: number } = {};
  private generationStats: { [key: string]: any } = {};
  private useAdvancedColorTheory: boolean = true; // Enable advanced color theory

  generateRecommendations(
    wardrobeItems: WardrobeItem[],
    profile: StyleProfile,
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData; prioritizeColors?: boolean },
    includeAccessories: boolean = true,
  ): OutfitRecommendation[] {
    return this.measurePerformance("generateRecommendations", () => {
      try {
        this.log("Starting recommendation generation", {
          itemCount: wardrobeItems?.length || 0,
          occasion: context?.occasion,
          weather: context?.weather?.condition,
          temperature: context?.weather?.temperature,
          includeAccessories,
          profileStyle: profile?.preferred_style,
        });

        // Input validation
        if (!wardrobeItems || !Array.isArray(wardrobeItems)) {
          this.log("Invalid wardrobeItems provided", wardrobeItems);
          console.warn("Invalid wardrobeItems provided:", wardrobeItems);
          return [];
        }

        if (wardrobeItems.length === 0) {
          console.info("No wardrobe items provided for recommendations");
          return [];
        }

        if (!profile || !profile.preferred_style) {
          console.warn("Invalid profile provided:", profile);
          return [];
        }

        if (!context || !context.occasion) {
          console.warn("Invalid context provided:", context);
          return [];
        }

        // Validate wardrobe items
        const validItems = wardrobeItems.filter((item) => {
          if (!item || !item.id || !item.category || !item.color) {
            console.warn("Invalid wardrobe item:", item);
            return false;
          }
          return true;
        });

        if (validItems.length === 0) {
          console.warn("No valid wardrobe items found");
          return [];
        }

        const currentTime = Date.now();

        // Reset usage history more frequently for better variety
        if (currentTime - this.lastGenerationTime > 180000) {
          // 3 minutes instead of 5
          this.usedItemsHistory = {};
          this.diversityBoost = true;
        }

        // Gradual decay of usage history to allow items to become "fresh" again
        if (currentTime - this.lastGenerationTime > 60000) {
          // After 1 minute
          Object.keys(this.usedItemsHistory).forEach((itemId) => {
            if (this.usedItemsHistory[itemId] > 0) {
              this.usedItemsHistory[itemId] = Math.max(
                0,
                this.usedItemsHistory[itemId] - 0.5,
              );
            }
          });
        }
        this.lastGenerationTime = currentTime;

        const recommendations: OutfitRecommendation[] = [];

        // Filter items by weather appropriateness first, but be more lenient
        let weatherFilteredItems = context.weather
          ? this.filterByWeather(validItems, context.weather)
          : validItems;

        // If weather filtering eliminated all items, ignore weather restrictions
        if (weatherFilteredItems.length === 0 && validItems.length > 0) {
          console.warn(
            "Weather filtering eliminated all items, ignoring weather restrictions",
          );
          weatherFilteredItems = validItems;
        }

        console.log(
          `Weather filtered items: ${weatherFilteredItems.length} from ${validItems.length} total`,
        );

        if (weatherFilteredItems.length === 0) {
          console.warn("No items available for outfit generation");
          return [];
        }

        // Group items by category
        const itemsByCategory = this.groupByCategory(weatherFilteredItems);

        // Generate combinations prioritizing occasion and color compatibility
        const combinations = this.generateAdvancedCombinations(
          itemsByCategory,
          context.occasion,
          profile.preferred_style,
          includeAccessories,
          context.weather,
          profile, // Pass profile for color preferences
          context.prioritizeColors || false,
        );

        if (combinations.length === 0) {
          console.info("No outfit combinations could be generated");
          return [];
        }

        // Score and filter combinations with more lenient thresholds
        const scoredOutfits = combinations
          .map((outfit) => {
            try {
              return this.scoreOutfit(outfit, profile, context);
            } catch (error) {
              console.warn("Error scoring outfit:", error, outfit);
              return null;
            }
          })
          .filter((outfit) => outfit !== null && outfit.confidence > 0.1); // Much lower threshold to ensure more variety

        console.log(
          `Scored ${scoredOutfits.length} outfits from ${combinations.length} combinations`,
        );

        if (scoredOutfits.length === 0) {
          console.warn(
            "No outfits met minimum confidence threshold. Combinations:",
            combinations.length,
            "Valid items:",
            validItems.length,
          );

          // If no outfits meet threshold, try with even lower threshold or return best attempts
          const allScoredOutfits = combinations
            .map((outfit) => {
              try {
                return this.scoreOutfit(outfit, profile, context);
              } catch (error) {
                return null;
              }
            })
            .filter((outfit) => outfit !== null)
            .sort((a, b) => b.confidence - a.confidence);

          if (allScoredOutfits.length > 0) {
            console.log(
              "Returning best available outfits with lower confidence",
            );
            return allScoredOutfits.slice(0, 3); // Return top 3 even if low confidence
          }

          return [];
        }

        // Enhanced sorting for maximum diversity
        const diverseOutfits = this.selectDiverseOutfits(scoredOutfits);

        // Update usage history
        try {
          diverseOutfits.forEach((outfit) => {
            outfit.items.forEach((item) => {
              this.usedItemsHistory[item.id] =
                (this.usedItemsHistory[item.id] || 0) + 1;
            });
          });
        } catch (error) {
          console.warn("Error updating usage history:", error);
        }

        const finalRecommendations = diverseOutfits.slice(0, 10);

        // Debug logging for failed generations
        if (finalRecommendations.length === 0) {
          console.error("RECOMMENDATION DEBUG:", {
            totalItems: wardrobeItems.length,
            validItems: validItems.length,
            weatherFiltered: weatherFilteredItems.length,
            combinations: combinations.length,
            scoredOutfits: scoredOutfits.length,
            occasion: context.occasion,
            weather: context.weather,
            itemsByCategory: Object.keys(itemsByCategory).map(
              (cat) => `${cat}: ${itemsByCategory[cat].length}`,
            ),
          });
        }

        return finalRecommendations; // Return top 10 diverse outfits
      } catch (error) {
        console.error("Unexpected error in generateRecommendations:", error);
        this.log("Error in generateRecommendations", error);
        return [];
      }
    });
  }

  private calculateDiversityScore(items: WardrobeItem[]): number {
    let score = 1.0;

    // Enhanced diversity calculation
    items.forEach((item) => {
      const usageCount = this.usedItemsHistory[item.id] || 0;
      // Progressive penalty for overused items
      if (usageCount === 0) {
        score += 0.3; // Big bonus for unused items
      } else if (usageCount === 1) {
        score += 0.1; // Small bonus for rarely used
      } else {
        score -= usageCount * 0.15; // Gentler penalty
      }
    });

    // Bonus for style variety within outfit
    const uniqueStyles = new Set(items.map((item) => item.style)).size;
    const uniqueCategories = new Set(items.map((item) => item.category)).size;
    const uniqueColors = new Set(items.flatMap((item) => item.color)).size;

    // Encourage variety but not chaos
    if (uniqueStyles > 1 && uniqueStyles <= 3) score += 0.2;
    if (uniqueCategories >= 3) score += 0.1;
    if (uniqueColors >= 2 && uniqueColors <= 4) score += 0.15;

    return Math.max(0, Math.min(1.5, score)); // Allow scores above 1 for very diverse outfits
  }

  private filterByWeather(
    items: WardrobeItem[],
    weather: WeatherData,
  ): WardrobeItem[] {
    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn("Invalid items provided to filterByWeather");
        return [];
      }

      if (!weather || weather.temperature === undefined) {
        console.warn("Invalid weather data provided, returning all items");
        return items;
      }

      return items.filter((item) => {
        if (!item || !item.category) {
          console.warn("Invalid item in filterByWeather:", item);
          return false;
        }

        try {
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
            return (
              !item.tags?.includes("summer") && !item.tags?.includes("shorts")
            );
          } else if (weather.temperature > 25) {
            // Hot weather - prefer light, breathable items and avoid outerwear
            if (item.category === "outerwear") return false; // Explicitly exclude outerwear in hot weather
            if (
              item.tags?.includes("light") ||
              item.tags?.includes("breathable")
            )
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
            if (
              item.category === "outerwear" &&
              item.tags?.includes("waterproof")
            )
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

          return true; // Default: include all items for mild weather - be more inclusive
        } catch (itemError) {
          console.warn("Error filtering item:", itemError, item);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filterByWeather:", error);
      return items || [];
    }
  }

  /**
   * Generate outfit combinations using advanced color theory principles
   * Falls back to basic logic if no combinations are found
   */
  private generateAdvancedCombinations(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    preferredStyle?: string,
    includeAccessories: boolean = true,
    weather?: WeatherData,
    profile?: StyleProfile,
    prioritizeColors: boolean = false,
  ): WardrobeItem[][] {
    try {
      // Sort items within each category by occasion and color priority
      if (prioritizeColors && profile) {
        itemsByCategory = this.prioritizeItemsByOccasionAndColor(itemsByCategory, occasion, profile);
      }

      // First try advanced color theory approach
      const advancedCombinations = this.generateWithAdvancedColorTheory(
        itemsByCategory,
        occasion,
        preferredStyle,
        includeAccessories,
        weather,
      );

      // If we get good results with advanced theory, use them
      if (advancedCombinations.length >= 3) {
        console.log(
          `Generated ${advancedCombinations.length} combinations using advanced color theory`,
        );
        return advancedCombinations;
      }

      console.log(
        `Advanced color theory yielded ${advancedCombinations.length} combinations, falling back to diverse combinations`,
      );

      // Fallback to existing diverse combinations logic
      const fallbackCombinations = this.generateDiverseCombinations(
        itemsByCategory,
        occasion,
        preferredStyle,
        includeAccessories,
        weather,
      );

      // Combine both approaches for maximum variety
      const allCombinations = [
        ...advancedCombinations,
        ...fallbackCombinations,
      ];

      // Remove duplicates based on item IDs
      const uniqueCombinations = allCombinations.filter(
        (combination, index, array) => {
          const combinationKey = combination
            .map((item) => item.id)
            .sort()
            .join("-");
          return (
            array.findIndex(
              (c) =>
                c
                  .map((item) => item.id)
                  .sort()
                  .join("-") === combinationKey,
            ) === index
          );
        },
      );

      return uniqueCombinations;
    } catch (error) {
      console.error("Error in generateAdvancedCombinations:", error);
      // Complete fallback to existing logic
      return this.generateDiverseCombinations(
        itemsByCategory,
        occasion,
        preferredStyle,
        includeAccessories,
        weather,
      );
    }
  }

  /**
   * Generate combinations using advanced color theory principles
   */
  private generateWithAdvancedColorTheory(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    preferredStyle?: string,
    includeAccessories: boolean = true,
    weather?: WeatherData,
  ): WardrobeItem[][] {
    if (!itemsByCategory || typeof itemsByCategory !== "object") {
      console.warn("Invalid itemsByCategory provided to advanced color theory");
      return [];
    }

    const combinations: WardrobeItem[][] = [];
    const tops = this.shuffleArray(itemsByCategory.tops || []);
    const bottoms = this.shuffleArray(itemsByCategory.bottoms || []);
    const dresses = this.shuffleArray(itemsByCategory.dresses || []);
    const shoes = this.shuffleArray(itemsByCategory.shoes || []);
    const outerwear = this.shuffleArray(itemsByCategory.outerwear || []);
    const accessories = this.shuffleArray(itemsByCategory.accessories || []);

    const shouldExcludeOuterwear = weather && weather.temperature > 25;

    // Sort items by color harmony potential (favor harmonious colors)
    const enhancedTops = this.enhanceItemsWithColorAnalysis(tops);
    const enhancedBottoms = this.enhanceItemsWithColorAnalysis(bottoms);
    const enhancedDresses = this.enhanceItemsWithColorAnalysis(dresses);

    // Generate dress-based outfits with advanced color theory
    for (let i = 0; i < Math.min(enhancedDresses.length, 8); i++) {
      const dress = enhancedDresses[i];

      if (!this.isAppropriateForOccasion(dress, occasion, preferredStyle))
        continue;
      if (
        (this.usedItemsHistory[dress.id] || 0) >=
        this.MAX_ITEM_USAGE_PER_SESSION * 1.5
      )
        continue;

      const outfit = [dress];

      // Find shoes using advanced color harmony
      const harmoniousShoes = shoes.filter((shoe) => {
        const harmonyResult = advancedColorTheory.analyzeColorHarmony(
          dress.color,
          shoe.color,
        );
        return harmonyResult.confidence > 0.6 && harmonyResult.isHarmonious;
      });

      if (harmoniousShoes.length > 0) {
        outfit.push(harmoniousShoes[0]);
      } else {
        // Fallback to basic color matching
        const compatibleShoes = shoes.filter(
          (shoe) =>
            this.colorsWork(dress.color, shoe.color) ||
            this.isNeutralColor(shoe.color),
        );
        if (compatibleShoes.length > 0) {
          outfit.push(compatibleShoes[0]);
        }
      }

      // Add outerwear with color harmony consideration
      if (
        !shouldExcludeOuterwear &&
        Math.random() > 0.6 &&
        outerwear.length > 0
      ) {
        const harmoniousOuterwear = outerwear.filter((coat) => {
          const harmonyResult = advancedColorTheory.analyzeColorHarmony(
            dress.color,
            coat.color,
          );
          return harmonyResult.confidence > 0.5 && harmonyResult.isHarmonious;
        });

        if (harmoniousOuterwear.length > 0) {
          outfit.push(harmoniousOuterwear[0]);
        }
      }

      // Add accessories with color consideration
      if (includeAccessories && accessories.length > 0) {
        const outfitColors = outfit.flatMap((item) => item.color);
        const harmoniousAccessories = accessories.filter((acc) => {
          const harmonyResult = advancedColorTheory.analyzeColorHarmony(
            outfitColors,
            acc.color,
          );
          return (
            harmonyResult.confidence > 0.3 &&
            (harmonyResult.isHarmonious || this.isNeutralColor(acc.color))
          );
        });

        // Prefer accessories that haven't been used much
        const availableAccessories = harmoniousAccessories.filter(
          (acc) => (this.usedItemsHistory[acc.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
        );

        const accessoriesToUse = availableAccessories.length > 0 ? availableAccessories : harmoniousAccessories;

        // Include accessories more reliably - 80% chance instead of 50%
        if (accessoriesToUse.length > 0 && Math.random() > 0.2) {
          outfit.push(accessoriesToUse[0]);
        }
      }

      combinations.push(outfit);
    }

    // Generate top + bottom combinations with advanced color theory
    const maxCombinations = Math.min(
      enhancedTops.length * enhancedBottoms.length,
      25,
    );

    for (let i = 0; i < maxCombinations; i++) {
      const topIndex = i % enhancedTops.length;
      const bottomIndex =
        Math.floor(i / enhancedTops.length) % enhancedBottoms.length;

      const top = enhancedTops[topIndex];
      const bottom = enhancedBottoms[bottomIndex];

      if (
        !this.isAppropriateForOccasion(top, occasion, preferredStyle) ||
        !this.isAppropriateForOccasion(bottom, occasion, preferredStyle)
      ) {
        continue;
      }

      if (
        (this.usedItemsHistory[top.id] || 0) >=
          this.MAX_ITEM_USAGE_PER_SESSION ||
        (this.usedItemsHistory[bottom.id] || 0) >=
          this.MAX_ITEM_USAGE_PER_SESSION
      ) {
        continue;
      }

      // Check color harmony using advanced theory
      const harmonyResult = advancedColorTheory.analyzeColorHarmony(
        top.color,
        bottom.color,
      );

      // Accept if good harmony, or fallback to basic logic
      if (harmonyResult.confidence > 0.6 && harmonyResult.isHarmonious) {
        const outfit = [top, bottom];

        // Add shoes with color harmony consideration
        const outfitColors = [...top.color, ...bottom.color];
        const harmoniousShoes = shoes.filter((shoe) => {
          const shoeHarmony = advancedColorTheory.analyzeColorHarmony(
            outfitColors,
            shoe.color,
          );
          return (
            shoeHarmony.confidence > 0.5 &&
            (shoeHarmony.isHarmonious || this.isNeutralColor(shoe.color))
          );
        });

        if (harmoniousShoes.length > 0) {
          outfit.push(harmoniousShoes[0]);
        }

        // Add outerwear with harmony consideration
        if (
          !shouldExcludeOuterwear &&
          Math.random() > 0.7 &&
          outerwear.length > 0
        ) {
          const harmoniousOuterwear = outerwear.filter((coat) => {
            const coatHarmony = advancedColorTheory.analyzeColorHarmony(
              outfitColors,
              coat.color,
            );
            return coatHarmony.confidence > 0.4 && coatHarmony.isHarmonious;
          });

          if (harmoniousOuterwear.length > 0) {
            outfit.push(harmoniousOuterwear[0]);
          }
        }

        // Add accessories
        if (includeAccessories && accessories.length > 0) {
          const currentOutfitColors = outfit.flatMap((item) => item.color);
          const harmoniousAccessories = accessories.filter((acc) => {
            const accHarmony = advancedColorTheory.analyzeColorHarmony(
              currentOutfitColors,
              acc.color,
            );
            return (
              accHarmony.confidence > 0.3 &&
              (accHarmony.isHarmonious || this.isNeutralColor(acc.color))
            );
          });

          // Prefer accessories that haven't been used much
          const availableAccessories = harmoniousAccessories.filter(
            (acc) => (this.usedItemsHistory[acc.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
          );

          const accessoriesToUse = availableAccessories.length > 0 ? availableAccessories : harmoniousAccessories;

          // Include accessories more reliably - 75% chance instead of 40%
          if (accessoriesToUse.length > 0 && Math.random() > 0.25) {
            outfit.push(accessoriesToUse[0]);
          }
        }

        combinations.push(outfit);
      }
    }

    console.log(
      `Advanced color theory generated ${combinations.length} harmonious combinations`,
    );
    return combinations;
  }

  /**
   * Enhance items with color analysis for better sorting
   */
  private enhanceItemsWithColorAnalysis(items: WardrobeItem[]): WardrobeItem[] {
    return items
      .map((item) => {
        try {
          const colorAnalysis = advancedColorTheory.analyzeColor(
            item.color[0] || "neutral",
          );
          // Add color analysis as metadata (non-persistent)
          (item as any)._colorAnalysis = colorAnalysis;
          return item;
        } catch (error) {
          console.warn("Error analyzing color for item:", item.id, error);
          return item;
        }
      })
      .sort((a, b) => {
        // Sort by color harmony potential and usage history
        const usageA = this.usedItemsHistory[a.id] || 0;
        const usageB = this.usedItemsHistory[b.id] || 0;
        return usageA - usageB; // Prefer less used items
      });
  }

  /**
   * Prioritize items within each category by occasion match and color compatibility
   */
  private prioritizeItemsByOccasionAndColor(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    profile: StyleProfile
  ): { [key: string]: WardrobeItem[] } {
    const prioritizedCategories: { [key: string]: WardrobeItem[] } = {};

    Object.keys(itemsByCategory).forEach(category => {
      const items = itemsByCategory[category];

      // Sort items by priority: occasion match first, then color compatibility
      const sortedItems = items.sort((a, b) => {
        // Priority 1: Occasion match score (higher is better)
        const occasionScoreA = this.calculateOccasionPriority(a, occasion);
        const occasionScoreB = this.calculateOccasionPriority(b, occasion);

        if (occasionScoreA !== occasionScoreB) {
          return occasionScoreB - occasionScoreA;
        }

        // Priority 2: Color compatibility with user preferences (higher is better)
        const colorScoreA = this.calculateColorPriority(a, profile);
        const colorScoreB = this.calculateColorPriority(b, profile);

        if (colorScoreA !== colorScoreB) {
          return colorScoreB - colorScoreA;
        }

        // Priority 3: Usage history (less used is better for variety)
        const usageA = this.usedItemsHistory[a.id] || 0;
        const usageB = this.usedItemsHistory[b.id] || 0;
        return usageA - usageB;
      });

      prioritizedCategories[category] = sortedItems;
    });

    return prioritizedCategories;
  }

  /**
   * Calculate enhanced occasion match priority score (0-5)
   */
  private calculateOccasionPriority(item: WardrobeItem, occasion: string): number {
    let score = 0;

    // Exact occasion match gets highest score
    if (item.occasion.includes(occasion)) {
      score = 5;
    }
    // Versatile items work well for most occasions
    else if (item.occasion.includes("versatile")) {
      score = 4;
    }
    // Smart cross-occasion compatibility
    else if (this.isOccasionCompatible(item, occasion)) {
      score = 3;
    }
    // Casual items can work for some occasions with lower priority
    else if (item.occasion.includes("casual") && this.canCasualWorkFor(occasion)) {
      score = 2;
    }
    // Style-based compatibility as fallback
    else if (this.isStyleCompatibleWithOccasion(item.style, occasion)) {
      score = 1;
    }

    // Bonus for items that work across multiple occasions
    const occasionVersatility = item.occasion.length;
    if (occasionVersatility > 2) {
      score += 0.5;
    }

    // Penalty for items that are too specific for different occasions
    if (this.isOccasionMismatch(item, occasion)) {
      score = Math.max(0, score - 2);
    }

    return Math.min(5, score);
  }

  /**
   * Check if item is compatible with occasion through smart mapping
   */
  private isOccasionCompatible(item: WardrobeItem, occasion: string): boolean {
    const occasionCompatibility = {
      work: ["business", "professional", "smart-casual"],
      business: ["work", "professional", "formal"],
      formal: ["business", "elegant", "evening"],
      casual: ["weekend", "relaxed", "everyday"],
      social: ["casual", "smart-casual", "evening"],
      date: ["evening", "smart-casual", "elegant"],
      evening: ["formal", "date", "social"],
      weekend: ["casual", "relaxed", "leisure"],
      travel: ["casual", "comfortable", "versatile"]
    };

    const compatibleOccasions = occasionCompatibility[occasion as keyof typeof occasionCompatibility] || [];
    return item.occasion.some(itemOccasion => compatibleOccasions.includes(itemOccasion));
  }

  /**
   * Check if casual items can work for the given occasion
   */
  private canCasualWorkFor(occasion: string): boolean {
    const casualFriendlyOccasions = ["social", "weekend", "travel", "creative", "date"];
    return casualFriendlyOccasions.includes(occasion);
  }

  /**
   * Check if item style is compatible with occasion
   */
  private isStyleCompatibleWithOccasion(style: string, occasion: string): boolean {
    const styleOccasionMap = {
      business: ["work", "business", "professional"],
      formal: ["formal", "business", "evening"],
      elegant: ["formal", "date", "evening"],
      casual: ["casual", "weekend", "social"],
      sporty: ["casual", "weekend", "travel"],
      bohemian: ["casual", "creative", "social"],
      minimalist: ["work", "business", "casual"],
      vintage: ["casual", "creative", "social"],
      contemporary: ["work", "casual", "social"]
    };

    const compatibleOccasions = styleOccasionMap[style as keyof typeof styleOccasionMap] || [];
    return compatibleOccasions.includes(occasion);
  }

  /**
   * Check if there's a strong mismatch between item and occasion
   */
  private isOccasionMismatch(item: WardrobeItem, occasion: string): boolean {
    const strongMismatches = {
      formal: ["sporty", "athletic", "loungewear"],
      business: ["party", "beach", "athletic"],
      casual: [], // Casual rarely has strong mismatches
      evening: ["athletic", "loungewear"],
      work: ["party", "beach", "athletic", "loungewear"]
    };

    const mismatches = strongMismatches[occasion as keyof typeof strongMismatches] || [];
    return item.occasion.some(itemOccasion => mismatches.includes(itemOccasion)) ||
           mismatches.includes(item.style);
  }

  /**
   * Calculate enhanced color compatibility priority score (0-5)
   */
  private calculateColorPriority(item: WardrobeItem, profile: StyleProfile): number {
    let score = 0;
    const currentSeason = this.getCurrentSeason();
    const seasonalColors = this.getSeasonalColors(currentSeason);

    // Enhanced favorite colors scoring
    if (profile.favorite_colors && profile.favorite_colors.length > 0) {
      let favoriteColorScore = 0;

      for (const itemColor of item.color) {
        for (const favColor of profile.favorite_colors) {
          // Exact match
          if (itemColor.toLowerCase().includes(favColor.toLowerCase()) ||
              favColor.toLowerCase().includes(itemColor.toLowerCase())) {
            favoriteColorScore = Math.max(favoriteColorScore, 3);
          }
          // Harmonious colors
          else if (this.areColorsHarmonious(itemColor, favColor)) {
            favoriteColorScore = Math.max(favoriteColorScore, 2);
          }
          // Same color family
          else if (this.areInSameColorFamily(itemColor, favColor)) {
            favoriteColorScore = Math.max(favoriteColorScore, 1.5);
          }
        }
      }
      score += favoriteColorScore;
    }

    // Enhanced color palette scoring
    if (profile.color_palette_colors && profile.color_palette_colors.length > 0) {
      let paletteScore = 0;

      for (const itemColor of item.color) {
        for (const paletteColor of profile.color_palette_colors) {
          if (itemColor.toLowerCase().includes(paletteColor.toLowerCase()) ||
              paletteColor.toLowerCase().includes(itemColor.toLowerCase())) {
            paletteScore = Math.max(paletteScore, 1.5);
          } else if (this.areColorsHarmonious(itemColor, paletteColor)) {
            paletteScore = Math.max(paletteScore, 1);
          }
        }
      }
      score += paletteScore;
    }

    // Seasonal color bonus
    const seasonalBonus = item.color.some(itemColor =>
      seasonalColors.some(seasonalColor =>
        itemColor.toLowerCase().includes(seasonalColor.toLowerCase()) ||
        this.areColorsHarmonious(itemColor, seasonalColor)
      )
    ) ? 1 : 0;
    score += seasonalBonus;

    // Neutral colors versatility bonus
    if (this.isNeutralColor(item.color)) {
      score += 0.5;
    }

    // Trend-conscious colors bonus
    const trendColors = this.getTrendColors();
    const trendBonus = item.color.some(itemColor =>
      trendColors.some(trendColor =>
        itemColor.toLowerCase().includes(trendColor.toLowerCase())
      )
    ) ? 0.5 : 0;
    score += trendBonus;

    return Math.min(5, score); // Cap at 5
  }

  /**
   * Check if colors are in the same color family
   */
  private areInSameColorFamily(color1: string, color2: string): boolean {
    const colorFamilies = [
      ["red", "pink", "coral", "rose", "crimson", "burgundy", "salmon"],
      ["blue", "navy", "royal", "sky", "powder", "cerulean", "turquoise"],
      ["green", "emerald", "forest", "sage", "mint", "lime", "olive"],
      ["yellow", "gold", "mustard", "lemon", "cream", "butter", "amber"],
      ["purple", "violet", "lavender", "plum", "magenta", "lilac", "mauve"],
      ["brown", "tan", "beige", "camel", "coffee", "chocolate", "rust"]
    ];

    const c1 = color1.toLowerCase();
    const c2 = color2.toLowerCase();

    return colorFamilies.some(family =>
      family.some(f => c1.includes(f)) && family.some(f => c2.includes(f))
    );
  }

  /**
   * Get seasonal colors for current season
   */
  private getSeasonalColors(season: string): string[] {
    const seasonalPalettes = {
      spring: ["coral", "peach", "yellow", "lime", "turquoise", "pink", "lavender", "mint"],
      summer: ["sage", "powder blue", "rose", "pearl", "champagne", "blush", "mauve", "seafoam"],
      autumn: ["rust", "burgundy", "forest", "gold", "brown", "orange", "olive", "bronze"],
      winter: ["navy", "black", "white", "crimson", "emerald", "royal purple", "silver", "charcoal"]
    };
    return seasonalPalettes[season as keyof typeof seasonalPalettes] || [];
  }

  /**
   * Get current trend colors
   */
  private getTrendColors(): string[] {
    // These could be updated periodically based on fashion trends
    return ["sage", "terracotta", "butter", "lavender", "coral", "navy", "camel", "emerald"];
  }

  /**
   * Simple color harmony check
   */
  private areColorsHarmonious(color1: string, color2: string): boolean {
    const complementaryPairs = [
      ["red", "green"], ["blue", "orange"], ["yellow", "purple"],
      ["pink", "green"], ["teal", "coral"], ["navy", "gold"]
    ];

    const analogousFamilies = [
      ["red", "orange", "pink"], ["blue", "green", "teal"],
      ["yellow", "orange", "gold"], ["purple", "pink", "magenta"]
    ];

    const c1 = color1.toLowerCase();
    const c2 = color2.toLowerCase();

    // Check complementary pairs
    for (const [comp1, comp2] of complementaryPairs) {
      if ((c1.includes(comp1) && c2.includes(comp2)) || (c1.includes(comp2) && c2.includes(comp1))) {
        return true;
      }
    }

    // Check analogous families
    for (const family of analogousFamilies) {
      if (family.some(f => c1.includes(f)) && family.some(f => c2.includes(f))) {
        return true;
      }
    }

    return false;
  }

  private generateDiverseCombinations(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    preferredStyle?: string,
    includeAccessories: boolean = true,
    weather?: WeatherData,
  ): WardrobeItem[][] {
    try {
      if (!itemsByCategory || typeof itemsByCategory !== "object") {
        console.warn("Invalid itemsByCategory provided");
        return [];
      }

      if (!occasion || typeof occasion !== "string") {
        console.warn("Invalid occasion provided");
        return [];
      }

      const combinations: WardrobeItem[][] = [];

      const tops = this.shuffleArray(itemsByCategory.tops || []);
      const bottoms = this.shuffleArray(itemsByCategory.bottoms || []);
      const dresses = this.shuffleArray(itemsByCategory.dresses || []);
      const shoes = this.shuffleArray(itemsByCategory.shoes || []);
      const outerwear = this.shuffleArray(itemsByCategory.outerwear || []);
      const accessories = this.shuffleArray(itemsByCategory.accessories || []);

      console.log(
        `Category breakdown - Tops: ${tops.length}, Bottoms: ${bottoms.length}, Dresses: ${dresses.length}, Shoes: ${shoes.length}, Outerwear: ${outerwear.length}, Accessories: ${accessories.length}`,
      );

      if (tops.length === 0 && bottoms.length === 0 && dresses.length === 0) {
        console.warn(
          "No core clothing items (tops/bottoms/dresses) found for combinations",
        );
        return [];
      }

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

      // Generate dress-based outfits with more variety
      dresses.forEach((dress, index) => {
        if (index > 8) return; // Allow more dress combinations for diversity

        if (
          this.isAppropriateForOccasion(dress, occasion, preferredStyle) &&
          (this.usedItemsHistory[dress.id] || 0) <
            this.MAX_ITEM_USAGE_PER_SESSION * 1.5 // Allow more usage for diversity
        ) {
          const outfit = [dress];

          // Add varied shoes with more flexible matching
          const suitableShoes = shoes.filter(
            (shoe) =>
              (this.colorsWork(dress.color, shoe.color) ||
                this.isFlexibleColorMatch(dress.color, shoe.color)) &&
              (this.usedItemsHistory[shoe.id] || 0) <
                this.MAX_ITEM_USAGE_PER_SESSION * 1.5,
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
          if (includeAccessories && accessories.length > 0) {
            const suitableAccessories = accessories.filter(
              (acc) =>
                (this.usedItemsHistory[acc.id] || 0) <
                this.MAX_ITEM_USAGE_PER_SESSION,
            );

            // Try to find accessories that complement the outfit colors
            const outfitColors = [...dress.color];
            const compatibleAccessories = suitableAccessories.filter(
              (acc) =>
                this.colorsWork(outfitColors, acc.color) ||
                this.isNeutralColor(acc.color) ||
                this.isFlexibleColorMatch(outfitColors, acc.color)
            );

            const accessoriesToUse = compatibleAccessories.length > 0 ? compatibleAccessories : suitableAccessories;

            // Include accessories more reliably - 70% chance
            if (accessoriesToUse.length > 0 && Math.random() > 0.3) {
              outfit.push(accessoriesToUse[0]);
            }
          }

          combinations.push(outfit);
        }
      });

      // Generate top + bottom combinations with enhanced variety
      const maxCombinations = Math.min(tops.length * bottoms.length, 30); // Even more combinations
      const usedPairs = new Set<string>();

      for (let i = 0; i < maxCombinations; i++) {
        // Use different pairing strategies for variety
        let top: WardrobeItem, bottom: WardrobeItem;

        if (i < (tops.length * bottoms.length) / 2) {
          // First half: systematic pairing
          top = tops[i % tops.length];
          bottom = bottoms[Math.floor(i / tops.length) % bottoms.length];
        } else {
          // Second half: random pairing for unexpected combinations
          top = tops[Math.floor(Math.random() * tops.length)];
          bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        }

        const pairKey = `${top.id}-${bottom.id}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

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

        // Use very flexible matching to ensure combinations are generated
        // Always allow combinations, let scoring decide quality
        if (
          true || // Force combinations to be generated
          this.colorsWork(top.color, bottom.color) ||
          this.hasNeutralColors(top.color, bottom.color) ||
          this.isFlexibleColorMatch(top.color, bottom.color)
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

          if (includeAccessories && accessories.length > 0) {
            const availableAccessories = accessories.filter(
              (acc) =>
                (this.usedItemsHistory[acc.id] || 0) <
                this.MAX_ITEM_USAGE_PER_SESSION,
            );

            // Try to find accessories that complement the outfit colors
            const outfitColors = [...top.color, ...bottom.color];
            const compatibleAccessories = availableAccessories.filter(
              (acc) =>
                this.colorsWork(outfitColors, acc.color) ||
                this.isNeutralColor(acc.color) ||
                this.isFlexibleColorMatch(outfitColors, acc.color)
            );

            const accessoriesToUse = compatibleAccessories.length > 0 ? compatibleAccessories : availableAccessories;

            // Include accessories more reliably - 65% chance
            if (accessoriesToUse.length > 0 && Math.random() > 0.35) {
              outfit.push(accessoriesToUse[0]);
            }
          }

          combinations.push(outfit);
        }
      }

      // If no combinations generated, create basic fallback combinations
      if (combinations.length === 0) {
        console.log(
          "No combinations generated by main algorithm, creating fallback combinations",
        );

        // Try to create minimal viable outfits
        if (dresses.length > 0) {
          // Dress + shoes combinations
          for (let i = 0; i < Math.min(dresses.length, 3); i++) {
            const outfit = [dresses[i]];
            if (shoes.length > 0) {
              outfit.push(shoes[i % shoes.length]);
            }
            combinations.push(outfit);
          }
        }

        if (tops.length > 0 && bottoms.length > 0) {
          // Basic top + bottom combinations
          for (let i = 0; i < Math.min(tops.length, bottoms.length, 5); i++) {
            const outfit = [tops[i], bottoms[i % bottoms.length]];
            if (shoes.length > 0) {
              outfit.push(shoes[i % shoes.length]);
            }
            combinations.push(outfit);
          }
        }

        console.log(`Generated ${combinations.length} fallback combinations`);
      }

      return combinations;
    } catch (error) {
      console.error("Error in generateDiverseCombinations:", error);
      return [];
    }
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

  private isFlexibleColorMatch(colors1: string[], colors2: string[]): boolean {
    try {
      // More lenient color matching for diversity
      // Allow combinations that might not be perfect but create interesting looks

      // If one item has neutral colors, it's flexible with most colors
      const neutrals = [
        "black",
        "white",
        "grey",
        "gray",
        "beige",
        "navy",
        "brown",
        "cream",
        "tan",
        "khaki",
        "denim",
      ];
      if (
        colors1.some((c) =>
          neutrals.some((n) => c.toLowerCase().includes(n)),
        ) ||
        colors2.some((c) => neutrals.some((n) => c.toLowerCase().includes(n)))
      ) {
        return true;
      }

      // Allow earth tone combinations (more forgiving)
      const earthTones = [
        "brown",
        "tan",
        "olive",
        "rust",
        "terracotta",
        "sand",
        "camel",
        "khaki",
        "mustard",
      ];
      const hasEarth1 = colors1.some((c) =>
        earthTones.some((e) => c.toLowerCase().includes(e)),
      );
      const hasEarth2 = colors2.some((c) =>
        earthTones.some((e) => c.toLowerCase().includes(e)),
      );
      if (hasEarth1 && hasEarth2) {
        return true;
      }

      // Allow jewel tone combinations (emerald, sapphire, ruby tones)
      const jewelTones = [
        "emerald",
        "ruby",
        "sapphire",
        "amethyst",
        "topaz",
        "garnet",
        "jade",
      ];
      const hasJewel1 = colors1.some((c) =>
        jewelTones.some((j) => c.toLowerCase().includes(j)),
      );
      const hasJewel2 = colors2.some((c) =>
        jewelTones.some((j) => c.toLowerCase().includes(j)),
      );
      if (hasJewel1 || hasJewel2) {
        return true;
      }

      // Allow pastels together (softer, more flexible matching)
      const pastels = [
        "pastel",
        "light",
        "pale",
        "soft",
        "powder",
        "baby",
        "mint",
        "blush",
        "lavender",
        "peach",
      ];
      const hasPastel1 = colors1.some((c) =>
        pastels.some((p) => c.toLowerCase().includes(p)),
      );
      const hasPastel2 = colors2.some((c) =>
        pastels.some((p) => c.toLowerCase().includes(p)),
      );
      if (hasPastel1 && hasPastel2) {
        return true;
      }

      // More lenient same color family matching
      const colorFamilies = {
        reds: [
          "red",
          "pink",
          "rose",
          "coral",
          "salmon",
          "cherry",
          "burgundy",
          "wine",
          "maroon",
        ],
        blues: [
          "blue",
          "navy",
          "royal",
          "sky",
          "powder",
          "denim",
          "indigo",
          "cobalt",
        ],
        greens: [
          "green",
          "forest",
          "olive",
          "sage",
          "mint",
          "lime",
          "emerald",
          "jade",
        ],
        yellows: [
          "yellow",
          "gold",
          "mustard",
          "lemon",
          "butter",
          "cream",
          "ivory",
        ],
        purples: ["purple", "violet", "lavender", "plum", "mauve", "lilac"],
      };

      for (const family of Object.values(colorFamilies)) {
        const inFamily1 = colors1.some((c) =>
          family.some((f) => c.toLowerCase().includes(f)),
        );
        const inFamily2 = colors2.some((c) =>
          family.some((f) => c.toLowerCase().includes(f)),
        );
        if (inFamily1 && inFamily2) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn("Error in isFlexibleColorMatch:", error);
      return false;
    }
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
    try {
      // Input validation
      if (!outfit || !Array.isArray(outfit) || outfit.length === 0) {
        throw new Error("Invalid outfit provided for scoring");
      }

      if (!profile || !profile.preferred_style) {
        throw new Error("Invalid profile provided for scoring");
      }

      if (!context || !context.occasion) {
        throw new Error("Invalid context provided for scoring");
      }

      // Validate outfit items
      const validItems = outfit.filter((item) => {
        if (!item || !item.id || !item.category || !item.color) {
          console.warn("Invalid outfit item:", item);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        throw new Error("No valid items in outfit");
      }

      let confidence = 0;
      const reasoning: string[] = [];

      // Enhanced scoring system with optimized weights
      const scoringWeights = {
        base: 0.05,
        diversity: 0.10,
        style: 0.18,
        colorHarmony: 0.20, // Increased weight for color importance
        occasion: 0.25, // Increased weight for occasion importance
        weather: 0.12,
        completeness: 0.08,
        fashion: 0.06,
        goals: 0.04,
        seasonality: 0.05, // New factor
        versatility: 0.04, // New factor
        trendiness: 0.03, // New factor
      };

      // Base confidence for having valid items
      confidence += scoringWeights.base;

      // Enhanced diversity bonus with better explanations
      const diversityBonus = this.calculateDiversityScore(validItems);
      confidence += diversityBonus * scoringWeights.diversity;

      if (diversityBonus > 1.0) {
        reasoning.push(
          "Exceptional variety - showcases different pieces beautifully",
        );
      } else if (diversityBonus > 0.8) {
        reasoning.push("Features fresh, rarely-used pieces from your wardrobe");
      } else if (diversityBonus > 0.5) {
        reasoning.push("Good variety from your wardrobe collection");
      }

      // Add specific diversity insights
      const uniqueCategories = new Set(validItems.map((item) => item.category))
        .size;
      const uniqueStyles = new Set(validItems.map((item) => item.style)).size;
      const uniqueColors = new Set(validItems.flatMap((item) => item.color))
        .size;

      if (uniqueCategories >= 4) {
        reasoning.push("Great mix of clothing categories");
      }
      if (uniqueStyles > 1) {
        reasoning.push("Interesting style blend");
      }
      if (uniqueColors >= 3 && uniqueColors <= 4) {
        reasoning.push("Perfect color variety");
      }

      // Advanced style matching with cross-style compatibility
      const styleScore = this.calculateAdvancedStyleScore(validItems, profile);
      confidence += styleScore * scoringWeights.style;

      if (styleScore > 0.9) {
        reasoning.push(
          `Perfectly embodies your ${profile.preferred_style} aesthetic`,
        );
      } else if (styleScore > 0.7) {
        reasoning.push(
          `Expertly matches your ${profile.preferred_style} style`,
        );
      } else if (styleScore > 0.5) {
        reasoning.push(
          `Complements your ${profile.preferred_style} preference`,
        );
      }

      // Enhanced color harmony analysis with advanced color theory
      const colorHarmonyScore = this.calculateAdvancedColorHarmony(
        validItems,
        profile,
      );
      confidence += colorHarmonyScore * scoringWeights.colorHarmony;

      // Enhanced reasoning with advanced color theory insights
      if (this.useAdvancedColorTheory) {
        const allColors = validItems.flatMap((item) => item.color);
        const overallHarmony = advancedColorTheory.findBestHarmony(allColors);

        if (colorHarmonyScore > 0.8) {
          reasoning.push(
            `Exceptional ${overallHarmony.harmonyType} color harmony`,
          );
        } else if (colorHarmonyScore > 0.6) {
          reasoning.push(
            `Beautiful ${overallHarmony.harmonyType} color coordination`,
          );
        } else if (colorHarmonyScore > 0.4) {
          reasoning.push(overallHarmony.reasoning || "Nice color balance");
        }

        // Add specific color theory insights
        if (overallHarmony.harmonyType.includes("modern")) {
          reasoning.push("Contemporary color palette");
        } else if (overallHarmony.harmonyType === "seasonal") {
          reasoning.push(`Perfect for ${this.getCurrentSeason()} season`);
        } else if (overallHarmony.harmonyType === "complementary") {
          reasoning.push("Dynamic color contrast creates visual interest");
        } else if (overallHarmony.harmonyType === "monochromatic") {
          reasoning.push("Sophisticated tonal variation");
        }
      } else {
        // Fallback to simple reasoning
        if (colorHarmonyScore > 0.8) {
          reasoning.push("Beautiful color coordination");
        } else if (colorHarmonyScore > 0.6) {
          reasoning.push("Great color harmony");
        } else if (colorHarmonyScore > 0.4) {
          reasoning.push("Nice color balance");
        }
      }

      // Occasion appropriateness with formality levels
      const occasionScore = this.calculateOccasionScore(
        validItems,
        context.occasion,
      );
      confidence += occasionScore * scoringWeights.occasion;

      if (occasionScore > 0.9) {
        reasoning.push(`Perfectly tailored for ${context.occasion} occasions`);
      } else if (occasionScore > 0.7) {
        reasoning.push(`Appropriate for ${context.occasion} settings`);
      }

      // Weather intelligence
      if (context.weather) {
        const weatherScore = this.calculateAdvancedWeatherScore(
          validItems,
          context.weather,
        );
        confidence += weatherScore * scoringWeights.weather;

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
      const completenessScore = this.calculateCompletenessScore(validItems);
      confidence += completenessScore * scoringWeights.completeness;

      if (completenessScore > 0.9) {
        reasoning.push("Perfectly complete and well-balanced outfit");
      } else if (completenessScore > 0.7) {
        reasoning.push("Complete, well-balanced outfit");
      }

      // Trend relevance and fashion rules
      const fashionScore = this.calculateFashionScore(validItems, context);
      confidence += fashionScore * scoringWeights.fashion;

      // Pattern and texture analysis
      const patternAnalysis = this.checkPatternHarmony(validItems);
      const textureAnalysis = this.checkTextureBalance(validItems);

      if (patternAnalysis.score > 0.9) {
        reasoning.push(patternAnalysis.reasoning);
      }

      if (textureAnalysis.score > 0.9) {
        reasoning.push(textureAnalysis.reasoning);
      }

      if (fashionScore > 0.8) {
        reasoning.push("Expertly follows contemporary fashion principles");
      } else if (fashionScore > 0.6) {
        reasoning.push("Follows current fashion trends");
      }

      // Enhanced seasonal intelligence
      const seasonalScore = this.calculateEnhancedSeasonalScore(validItems);
      confidence += seasonalScore * scoringWeights.seasonality;

      if (seasonalScore > 0.8) {
        reasoning.push("Perfect seasonal harmony for " + this.getCurrentSeason());
      } else if (seasonalScore > 0.6) {
        reasoning.push("Season-appropriate styling choices");
      }

      // Versatility scoring
      const versatilityScore = this.calculateVersatilityScore(validItems);
      confidence += versatilityScore * scoringWeights.versatility;

      if (versatilityScore > 0.8) {
        reasoning.push("Highly versatile outfit for multiple occasions");
      } else if (versatilityScore > 0.6) {
        reasoning.push("Good versatility for day-to-evening transition");
      }

      // Trend relevance scoring
      const trendinessScore = this.calculateTrendinessScore(validItems);
      confidence += trendinessScore * scoringWeights.trendiness;

      if (trendinessScore > 0.7) {
        reasoning.push("On-trend styling with contemporary appeal");
      } else if (trendinessScore > 0.5) {
        reasoning.push("Incorporates current fashion elements");
      }

      // Goal alignment (if user has specific goals)
      if (profile.goals && profile.goals.length > 0) {
        const goalScore = this.calculateGoalAlignment(
          validItems,
          profile.goals,
        );
        confidence += goalScore * scoringWeights.goals;

        if (goalScore > 0.8) {
          reasoning.push("Perfectly aligns with your style goals");
        } else if (goalScore > 0.6) {
          reasoning.push("Aligns with your style goals");
        }
      }

      // Ensure confidence is between 0 and 1
      confidence = Math.min(1, Math.max(0, confidence));

      const outfitId = validItems
        .map((item) => item.id)
        .sort()
        .join("-");
      const style = this.determineOverallStyle(validItems);

      return {
        id: outfitId,
        items: validItems,
        occasion: context.occasion,
        style,
        confidence,
        description: this.generateAdvancedDescription(
          validItems,
          context,
          confidence,
        ),
        reasoning,
      };
    } catch (error) {
      console.error("Error in scoreOutfit:", error);
      // Return a minimal valid outfit recommendation
      return {
        id: "error-" + Date.now(),
        items: outfit.filter((item) => item && item.id) || [],
        occasion: context?.occasion || "unknown",
        style: "casual",
        confidence: 0.1,
        description: "Unable to analyze outfit properly",
        reasoning: ["Error occurred during outfit analysis"],
      };
    }
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
    // Much more flexible matching to ensure combinations are generated
    const isOccasionMatch =
      item.occasion.includes(occasion) ||
      item.occasion.includes("versatile") ||
      item.occasion.includes("casual"); // Include casual as it's versatile

    // For formal occasions, be more inclusive
    if (occasion === "formal" || occasion === "business") {
      // Only exclude extremely casual items
      if (item.style === "streetwear" || item.style === "sporty") {
        // But allow if it's the only option or explicitly marked as versatile
        return (
          item.style === "versatile" || item.occasion.includes("versatile")
        );
      }
      return true; // Allow most items for formal occasions
    }

    // For any occasion, be very inclusive to ensure combinations
    return true; // Allow all items, let the scoring system filter appropriateness
  }

  private colorsWork(colors1: string[], colors2: string[]): boolean {
    try {
      if (
        !this.validateColorInput(colors1) ||
        !this.validateColorInput(colors2)
      ) {
        return false;
      }

      // Use advanced color theory first, fallback to basic logic
      if (this.useAdvancedColorTheory) {
        const harmonyResult = advancedColorTheory.analyzeColorHarmony(
          colors1,
          colors2,
        );
        if (harmonyResult.confidence > 0.6) {
          return harmonyResult.isHarmonious;
        }
      }

      // Fallback to simplified approach: Use popular color combinations
      return this.checkPopularColorCombinations(colors1, colors2);
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

  /**
   * Calculate color harmony using advanced color theory principles
   * Enhanced to work with improved color extraction and CIELAB color space
   */
  private calculateAdvancedColorHarmony(
    outfit: WardrobeItem[],
    profile: StyleProfile,
  ): number {
    try {
      if (!this.useAdvancedColorTheory) {
        return this.calculateSimplifiedColorHarmony(outfit, profile);
      }

      const allColors = outfit.flatMap((item) => item.color);
      if (allColors.length === 0) {
        return 0.5; // Neutral score when no color data
      }

      // Normalize colors to hex format for better comparison
      const normalizedColors = allColors.map(color => this.normalizeColorToHex(color));

      // Use advanced color theory to analyze the overall outfit harmony
      const overallHarmony = advancedColorTheory.findBestHarmony(normalizedColors);
      let score = overallHarmony.confidence;

      // Enhanced bonus system for specific harmony types
      const harmonyBonuses: { [key: string]: number } = {
        monochromatic: 0.12,
        complementary: 0.18,
        analogous: 0.15,
        triadic: 0.13,
        seasonal: 0.16,
        neutral: 0.10,
        "modern-complementary": 0.20,
        "modern-monochromatic": 0.14,
        "modern-triadic": 0.15,
        "single-color": 0.08,
      };

      const bonus = harmonyBonuses[overallHarmony.harmonyType] || 0;
      score += bonus;

      // Enhanced pairwise harmony analysis with CIELAB color space
      let pairwiseScore = 0;
      let pairCount = 0;

      for (let i = 0; i < outfit.length; i++) {
        for (let j = i + 1; j < outfit.length; j++) {
          const colors1 = outfit[i].color.map(c => this.normalizeColorToHex(c));
          const colors2 = outfit[j].color.map(c => this.normalizeColorToHex(c));
          
          const pairHarmony = advancedColorTheory.analyzeColorHarmony(colors1, colors2);
          pairwiseScore += pairHarmony.confidence;
          pairCount++;
        }
      }

      if (pairCount > 0) {
        const avgPairwiseScore = pairwiseScore / pairCount;
        score = score * 0.65 + avgPairwiseScore * 0.35; // Weight overall harmony more
      }

      // Enhanced user preference matching with better color comparison
      if (profile.favorite_colors && profile.favorite_colors.length > 0) {
        const favoriteMatches = this.calculateColorMatches(
          normalizedColors, 
          profile.favorite_colors.map(c => this.normalizeColorToHex(c))
        );

        if (favoriteMatches > 0) {
          score += 0.20 * (favoriteMatches / allColors.length); // Higher weight for deliberate choices
        }
      }

      // Enhanced color palette matching with improved accuracy
      if (profile.color_palette_colors && profile.color_palette_colors.length > 0) {
        const paletteMatches = this.calculateColorMatches(
          normalizedColors,
          profile.color_palette_colors.map(c => this.normalizeColorToHex(c))
        );

        if (paletteMatches > 0) {
          score += 0.15 * (paletteMatches / allColors.length); // Moderate weight for analyzed colors
        }
      }

      // Enhanced seasonal color bonus with better matching
      const currentSeason = this.getCurrentSeason();
      const seasonalPalette = advancedColorTheory.getCurrentSeasonalPalette();
      const seasonalMatches = this.calculateColorMatches(
        normalizedColors,
        seasonalPalette.hexPalette
      );

      if (seasonalMatches > 0) {
        score += 0.12 * (seasonalMatches / allColors.length);
      }

      // Additional bonus for color temperature harmony
      const temperatureScore = this.calculateTemperatureHarmony(normalizedColors);
      score += temperatureScore * 0.08;

      // Bonus for color diversity (not too many similar colors)
      const diversityScore = this.calculateColorDiversity(normalizedColors);
      score += diversityScore * 0.05;

      return Math.min(1, Math.max(0, score));
    } catch (error) {
      console.warn(
        "Error in calculateAdvancedColorHarmony, falling back to simplified:",
        error,
      );
      return this.calculateSimplifiedColorHarmony(outfit, profile);
    }
  }

  /**
   * Calculate color matches using CIELAB color space for better accuracy
   */
  private calculateColorMatches(colors1: string[], colors2: string[]): number {
    let matches = 0;
    
    for (const color1 of colors1) {
      for (const color2 of colors2) {
        const distance = this.calculateColorDistance(color1, color2);
        if (distance < 30) { // Threshold for color similarity in CIELAB space
          matches++;
        }
      }
    }
    
    return matches;
  }

  /**
   * Calculate color distance in CIELAB color space
   */
  private calculateColorDistance(color1: string, color2: string): number {
    try {
      const lab1 = this.hexToLab(color1);
      const lab2 = this.hexToLab(color2);
      
      const deltaL = lab1.l - lab2.l;
      const deltaA = lab1.a - lab2.a;
      const deltaB = lab1.b - lab2.b;
      
      return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
    } catch (error) {
      // Fallback to simple hex comparison
      return color1 === color2 ? 0 : 100;
    }
  }

  /**
   * Convert hex color to CIELAB color space
   */
  private hexToLab(hex: string): { l: number; a: number; b: number } {
    const rgb = this.hexToRgb(hex);
    return this.rgbToLab(rgb.r, rgb.g, rgb.b);
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
   * Convert RGB to CIELAB color space
   */
  private rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    // Convert RGB to XYZ
    const xyz = this.rgbToXyz(r, g, b);
    
    // Convert XYZ to CIELAB
    const xn = 0.95047, yn = 1.00000, zn = 1.08883; // D65 illuminant
    
    const xr = this.xyzToLab(xyz.x / xn);
    const yr = this.xyzToLab(xyz.y / yn);
    const zr = this.xyzToLab(xyz.z / zn);
    
    const l = 116 * yr - 16;
    const a = 500 * (xr - yr);
    const bValue = 200 * (yr - zr);
    
    return { l, a, b: bValue };
  }

  /**
   * Convert RGB to XYZ
   */
  private rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    return { x, y, z };
  }

  /**
   * Helper function for CIELAB conversion
   */
  private xyzToLab(t: number): number {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);
  }

  /**
   * Calculate temperature harmony score
   */
  private calculateTemperatureHarmony(colors: string[]): number {
    const temperatures = colors.map(color => this.getColorTemperature(color));
    const warmCount = temperatures.filter(t => t === 'warm').length;
    const coolCount = temperatures.filter(t => t === 'cool').length;
    const neutralCount = temperatures.filter(t => t === 'neutral').length;
    
    // Prefer balanced temperature distribution
    const total = colors.length;
    const balance = 1 - Math.abs(warmCount - coolCount) / total;
    
    return balance * 0.1; // Small bonus for temperature balance
  }

  /**
   * Calculate color diversity score
   */
  private calculateColorDiversity(colors: string[]): number {
    const uniqueColors = new Set(colors).size;
    const totalColors = colors.length;
    
    // Prefer moderate diversity (not too few, not too many)
    if (uniqueColors === 1) return 0; // No diversity
    if (uniqueColors === totalColors) return 0.1; // Maximum diversity
    if (uniqueColors >= totalColors * 0.7) return 0.05; // Good diversity
    return 0.02; // Moderate diversity
  }

  /**
   * Get color temperature
   */
  private getColorTemperature(color: string): "warm" | "cool" | "neutral" {
    try {
      const lab = this.hexToLab(color);
      
      // Warm colors have positive a and b values
      // Cool colors have negative a and b values
      if (lab.a > 5 && lab.b > 5) return "warm";
      if (lab.a < -5 && lab.b < -5) return "cool";
      return "neutral";
    } catch (error) {
      // Fallback to keyword matching
      const warmKeywords = ['red', 'orange', 'yellow', 'pink', 'coral', 'peach'];
      const coolKeywords = ['blue', 'green', 'purple', 'teal', 'navy', 'mint'];
      
      const lowerColor = color.toLowerCase();
      if (warmKeywords.some(k => lowerColor.includes(k))) return "warm";
      if (coolKeywords.some(k => lowerColor.includes(k))) return "cool";
      return "neutral";
    }
  }

  /**
   * Normalize color to hex format for consistent comparison
   */
  private normalizeColorToHex(color: string): string {
    // If already hex format, return as is
    if (color.startsWith('#')) {
      return color.toUpperCase();
    }
    
         // Try to convert color names to hex
     const colorMap: { [key: string]: string } = {
       'red': '#FF0000',
       'blue': '#0000FF',
       'green': '#008000',
       'yellow': '#FFFF00',
       'orange': '#FFA500',
       'purple': '#800080',
       'pink': '#FFC0CB',
       'brown': '#A52A2A',
       'black': '#000000',
       'white': '#FFFFFF',
       'gray': '#808080',
       'grey': '#808080',
       'navy': '#000080',
       'coral': '#FF7F50',
       'teal': '#008080',
       'mint': '#98FB98',
       'sage': '#9CAF88',
       'beige': '#F5F5DC',
       'cream': '#FFFDD0',
       'ivory': '#FFFFF0',
       'charcoal': '#36454F',
       'burgundy': '#800020',
       'forest': '#228B22',
       'olive': '#808000',
       'rust': '#B7410E',
       'gold': '#FFD700',
       'silver': '#C0C0C0',
       'bronze': '#CD7F32',
       'rose': '#FF007F',
       'lavender': '#E6E6FA',
       'plum': '#DDA0DD',
       'mauve': '#E0B0FF',
       'lilac': '#C8A2C8',
       'amethyst': '#9966CC',
       'orchid': '#DA70D6',
       'grape': '#6F2DA8',
       'eggplant': '#614051',
       'crimson': '#DC143C',
       'maroon': '#800000',
       'cherry': '#DE3163',
       'salmon': '#FA8072',
       'blush': '#FFB6C1',
       'fuchsia': '#FF00FF',
       'magenta': '#FF00FF',
       'royal': '#4169E1',
       'sky': '#87CEEB',
       'powder': '#B0E0E6',
       'turquoise': '#40E0D0',
       'cyan': '#00FFFF',
       'cerulean': '#007BA7',
       'cobalt': '#0047AB',
       'indigo': '#4B0082',
       'sapphire': '#0F52BA',
       'lime': '#32CD32',
       'emerald': '#50C878',
       'jade': '#00A86B',
       'kelly': '#4CBB17',
       'hunter': '#355E35',
       'chartreuse': '#7FFF00',
       'seafoam': '#98FF98',
       'mustard': '#FFDB58',
       'lemon': '#FFF700',
       'butter': '#FFF4C4',
       'champagne': '#F7E7CE',
       'amber': '#FFBF00',
       'honey': '#FDB347',
       'canary': '#FFFF99',
       'saffron': '#F4C430',
       'peach': '#FFCBA4',
       'apricot': '#FBCEB1',
       'tangerine': '#FFA500',
       'papaya': '#FFEFD5',
       'persimmon': '#EC5800',
       'violet': '#EE82EE',
       'tan': '#D2B48C',
       'taupe': '#483C32',
       'khaki': '#F0E68C',
       'camel': '#C19A6B',
       'nude': '#E3BC9A',
       'stone': '#928E85',
     };
    
    const lowerColor = color.toLowerCase();
    return colorMap[lowerColor] || '#808080'; // Default to gray if unknown
  }

  private calculateSimplifiedColorHarmony(
    outfit: WardrobeItem[],
    profile: StyleProfile,
  ): number {
    const allColors = outfit.flatMap((item) =>
      item.color.map((c) => c.toLowerCase()),
    );
    let score = 0.5; // Base score

    // Simple scoring based on popular combinations
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
    const neutralCount = allColors.filter((c) =>
      neutrals.some((n) => c.includes(n)),
    ).length;

    // Bonus for neutral base
    if (neutralCount >= allColors.length * 0.5) {
      score += 0.3;
    }

    // Bonus for not too many colors (avoid chaos)
    const uniqueColors = new Set(allColors).size;
    if (uniqueColors <= 4) {
      score += 0.2;
    } else if (uniqueColors > 6) {
      score -= 0.2;
    }

    // Bonus for user's favorite colors (manually selected)
    if (profile.favorite_colors && profile.favorite_colors.length > 0) {
      const favoriteMatches = allColors.filter((color) =>
        profile.favorite_colors!.some((fav) =>
          color.includes(fav.toLowerCase()),
        ),
      ).length;
      if (favoriteMatches > 0) {
        score += 0.2;
      }
    }

    // Bonus for user's color palette colors (from profile picture)
    if (
      profile.color_palette_colors &&
      profile.color_palette_colors.length > 0
    ) {
      const paletteMatches = allColors.filter((color) =>
        profile.color_palette_colors!.some((paletteColor) =>
          color.includes(paletteColor.toLowerCase()),
        ),
      ).length;
      if (paletteMatches > 0) {
        score += 0.15; // Slightly lower than favorite colors
      }
    }

    return Math.min(1, Math.max(0, score));
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
      return `Optimally chosen for warm conditions (${temp}��C) with breathable pieces`;
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

  private selectDiverseOutfits(
    scoredOutfits: OutfitRecommendation[],
  ): OutfitRecommendation[] {
    if (scoredOutfits.length === 0) return [];

    const selected: OutfitRecommendation[] = [];
    const usedItemCombinations = new Set<string>();
    const categoryVariations = new Map<string, number>();
    const styleVariations = new Map<string, number>();
    const colorVariations = new Map<string, number>();

    // Sort by confidence first, then apply diversity filters
    const sortedOutfits = scoredOutfits.sort((a, b) => {
      const diversityA = this.calculateDiversityScore(a.items);
      const diversityB = this.calculateDiversityScore(b.items);

      // Weight diversity more heavily than confidence for variety
      const scoreA = diversityA * 0.7 + a.confidence * 0.3;
      const scoreB = diversityB * 0.7 + b.confidence * 0.3;

      return scoreB - scoreA;
    });

    for (const outfit of sortedOutfits) {
      if (selected.length >= 12) break;

      // Create outfit signature for duplicate detection
      const itemIds = outfit.items
        .map((item) => item.id)
        .sort()
        .join("-");
      const categories = outfit.items
        .map((item) => item.category)
        .sort()
        .join("-");
      const styles = outfit.items
        .map((item) => item.style)
        .sort()
        .join("-");
      const colors = outfit.items
        .flatMap((item) => item.color)
        .sort()
        .join("-");

      // Skip if we've seen this exact combination
      if (usedItemCombinations.has(itemIds)) {
        continue;
      }

      // Ensure variety in categories, styles, and colors
      const categoryCount = categoryVariations.get(categories) || 0;
      const styleCount = styleVariations.get(styles) || 0;
      const colorCount = colorVariations.get(colors) || 0;

      // Allow up to 2 outfits with similar patterns, but encourage variety
      if (categoryCount >= 2 || styleCount >= 2 || colorCount >= 3) {
        // Only skip if we have enough diverse options already
        if (selected.length >= 6) continue;
      }

      // Add outfit to selection
      selected.push(outfit);
      usedItemCombinations.add(itemIds);
      categoryVariations.set(categories, categoryCount + 1);
      styleVariations.set(styles, styleCount + 1);
      colorVariations.set(colors, colorCount + 1);
    }

    // If we don't have enough diverse outfits, fill with remaining best options
    if (selected.length < 8) {
      for (const outfit of sortedOutfits) {
        if (selected.length >= 10) break;

        const itemIds = outfit.items
          .map((item) => item.id)
          .sort()
          .join("-");
        if (!usedItemCombinations.has(itemIds)) {
          selected.push(outfit);
          usedItemCombinations.add(itemIds);
        }
      }
    }

    return selected;
  }

  private checkPopularColorCombinations(
    colors1: string[],
    colors2: string[],
  ): boolean {
    // Simplified color matching based on popular fashion combinations
    const neutrals = [
      "black",
      "white",
      "grey",
      "gray",
      "beige",
      "navy",
      "brown",
      "cream",
      "khaki",
      "tan",
      "nude",
    ];

    // Check if either item is neutral (neutrals go with everything)
    const hasNeutral1 = colors1.some((c) =>
      neutrals.some((n) => c.toLowerCase().includes(n)),
    );
    const hasNeutral2 = colors2.some((c) =>
      neutrals.some((n) => c.toLowerCase().includes(n)),
    );

    if (hasNeutral1 || hasNeutral2) {
      return true;
    }

    // Popular color combinations from fashion data
    const popularCombinations = [
      // Classic combinations
      ["blue", "white"],
      ["navy", "white"],
      ["black", "white"],
      ["red", "blue"],
      ["pink", "green"],
      ["yellow", "blue"],
      // Earth tones
      ["brown", "orange"],
      ["olive", "rust"],
      ["camel", "burgundy"],
      // Modern combinations
      ["coral", "teal"],
      ["mustard", "navy"],
      ["sage", "blush"],
      // Monochromatic variations
      ["light", "dark"],
      ["pale", "deep"],
      ["soft", "bold"],
    ];

    // Check if colors match any popular combination
    for (const [color1, color2] of popularCombinations) {
      const match1 =
        colors1.some((c) => c.toLowerCase().includes(color1.toLowerCase())) &&
        colors2.some((c) => c.toLowerCase().includes(color2.toLowerCase()));
      const match2 =
        colors1.some((c) => c.toLowerCase().includes(color2.toLowerCase())) &&
        colors2.some((c) => c.toLowerCase().includes(color1.toLowerCase()));

      if (match1 || match2) {
        return true;
      }
    }

    // Same color family matching (more lenient)
    const colorFamilies = {
      blues: ["blue", "navy", "teal", "turquoise", "cyan", "denim"],
      reds: ["red", "pink", "coral", "burgundy", "wine", "rose"],
      greens: ["green", "olive", "sage", "mint", "forest", "lime"],
      yellows: ["yellow", "gold", "mustard", "cream", "butter", "ivory"],
      purples: ["purple", "violet", "lavender", "plum", "mauve"],
    };

    for (const family of Object.values(colorFamilies)) {
      const inFamily1 = colors1.some((c) =>
        family.some((f) => c.toLowerCase().includes(f)),
      );
      const inFamily2 = colors2.some((c) =>
        family.some((f) => c.toLowerCase().includes(f)),
      );
      if (inFamily1 && inFamily2) {
        return true;
      }
    }

    // If no specific match, be very permissive to ensure combinations
    return Math.random() > 0.1; // 90% chance colors work together
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

  private validateWardrobeItem(item: WardrobeItem): boolean {
    try {
      if (!item || typeof item !== "object") {
        return false;
      }

      // Required fields
      if (!item.id || typeof item.id !== "string" || item.id.trim() === "") {
        console.warn("Invalid item ID:", item.id);
        return false;
      }

      if (
        !item.name ||
        typeof item.name !== "string" ||
        item.name.trim() === ""
      ) {
        console.warn("Invalid item name:", item.name);
        return false;
      }

      if (
        !item.category ||
        typeof item.category !== "string" ||
        item.category.trim() === ""
      ) {
        console.warn("Invalid item category:", item.category);
        return false;
      }

      if (
        !item.color ||
        !Array.isArray(item.color) ||
        item.color.length === 0
      ) {
        console.warn("Invalid item color:", item.color);
        return false;
      }

      // Validate color array
      if (
        !item.color.every(
          (color) => typeof color === "string" && color.trim() !== "",
        )
      ) {
        console.warn("Invalid colors in item:", item.color);
        return false;
      }

      // Optional fields validation
      if (item.style && typeof item.style !== "string") {
        console.warn("Invalid item style:", item.style);
        return false;
      }

      if (
        item.occasion &&
        (!Array.isArray(item.occasion) ||
          !item.occasion.every((occ) => typeof occ === "string"))
      ) {
        console.warn("Invalid item occasion:", item.occasion);
        return false;
      }

      if (
        item.season &&
        (!Array.isArray(item.season) ||
          !item.season.every((season) => typeof season === "string"))
      ) {
        console.warn("Invalid item season:", item.season);
        return false;
      }

      if (
        item.tags &&
        (!Array.isArray(item.tags) ||
          !item.tags.every((tag) => typeof tag === "string"))
      ) {
        console.warn("Invalid item tags:", item.tags);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating wardrobe item:", error);
      return false;
    }
  }

  private validateStyleProfile(profile: StyleProfile): boolean {
    try {
      if (!profile || typeof profile !== "object") {
        return false;
      }

      if (
        !profile.id ||
        typeof profile.id !== "string" ||
        profile.id.trim() === ""
      ) {
        console.warn("Invalid profile ID:", profile.id);
        return false;
      }

      if (
        !profile.preferred_style ||
        typeof profile.preferred_style !== "string" ||
        profile.preferred_style.trim() === ""
      ) {
        console.warn("Invalid preferred style:", profile.preferred_style);
        return false;
      }

      if (
        profile.favorite_colors &&
        (!Array.isArray(profile.favorite_colors) ||
          !profile.favorite_colors.every((color) => typeof color === "string"))
      ) {
        console.warn("Invalid favorite colors:", profile.favorite_colors);
        return false;
      }

      if (
        profile.goals &&
        (!Array.isArray(profile.goals) ||
          !profile.goals.every((goal) => typeof goal === "string"))
      ) {
        console.warn("Invalid goals:", profile.goals);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating style profile:", error);
      return false;
    }
  }

  private validateGenerationContext(context: {
    occasion: string;
    timeOfDay?: string;
    weather?: WeatherData;
  }): boolean {
    try {
      if (!context || typeof context !== "object") {
        return false;
      }

      if (
        !context.occasion ||
        typeof context.occasion !== "string" ||
        context.occasion.trim() === ""
      ) {
        console.warn("Invalid occasion:", context.occasion);
        return false;
      }

      if (context.timeOfDay && typeof context.timeOfDay !== "string") {
        console.warn("Invalid time of day:", context.timeOfDay);
        return false;
      }

      if (context.weather && !this.validateWeatherData(context.weather)) {
        console.warn("Invalid weather data:", context.weather);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating generation context:", error);
      return false;
    }
  }

  private validateWeatherData(weather: WeatherData): boolean {
    try {
      if (!weather || typeof weather !== "object") {
        return false;
      }

      if (
        weather.temperature === undefined ||
        typeof weather.temperature !== "number"
      ) {
        console.warn("Invalid temperature:", weather.temperature);
        return false;
      }

      if (!weather.condition || typeof weather.condition !== "string") {
        console.warn("Invalid weather condition:", weather.condition);
        return false;
      }

      if (
        weather.humidity !== undefined &&
        typeof weather.humidity !== "number"
      ) {
        console.warn("Invalid humidity:", weather.humidity);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating weather data:", error);
      return false;
    }
  }

  private sanitizeWardrobeItems(items: WardrobeItem[]): WardrobeItem[] {
    try {
      if (!Array.isArray(items)) {
        return [];
      }

      return items
        .filter((item) => this.validateWardrobeItem(item))
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          category: item.category.trim().toLowerCase(),
          color: item.color
            .map((c) => c.trim().toLowerCase())
            .filter((c) => c !== ""),
          style: item.style?.trim().toLowerCase() || "casual",
          occasion: item.occasion
            ?.map((o) => o.trim().toLowerCase())
            .filter((o) => o !== "") || ["casual"],
          season: item.season
            ?.map((s) => s.trim().toLowerCase())
            .filter((s) => s !== "") || ["all"],
          tags:
            item.tags
              ?.map((t) => t.trim().toLowerCase())
              .filter((t) => t !== "") || [],
        }));
    } catch (error) {
      console.error("Error sanitizing wardrobe items:", error);
      return [];
    }
  }

  /**
   * Calculate enhanced seasonal appropriateness score
   */
  private calculateEnhancedSeasonalScore(outfit: WardrobeItem[]): number {
    try {
      const currentSeason = this.getCurrentSeason();
      const seasonalColors = this.getSeasonalColors(currentSeason);
      const allColors = outfit.flatMap((item) => item.color);

      if (allColors.length === 0) return 0.5;

      let score = 0;

      // Color seasonal match
      const colorMatches = allColors.filter(color =>
        seasonalColors.some(seasonalColor =>
          color.toLowerCase().includes(seasonalColor.toLowerCase()) ||
          this.areColorsHarmonious(color, seasonalColor)
        )
      ).length;

      const colorScore = colorMatches / allColors.length;
      score += colorScore * 0.6; // 60% weight for colors

      // Fabric seasonal appropriateness
      const seasonalFabrics = this.getSeasonalFabrics(currentSeason);
      const fabricScore = outfit.filter(item =>
        item.tags && seasonalFabrics.some(fabric =>
          item.tags!.some(tag => tag.toLowerCase().includes(fabric))
        )
      ).length / outfit.length;
      score += fabricScore * 0.4; // 40% weight for fabrics

      return Math.min(1, score);
    } catch (error) {
      console.warn("Error calculating enhanced seasonal score:", error);
      return 0.5;
    }
  }

  /**
   * Calculate outfit versatility score
   */
  private calculateVersatilityScore(outfit: WardrobeItem[]): number {
    let score = 0;
    const totalItems = outfit.length;

    // Multi-occasion items
    const versatileItems = outfit.filter(item =>
      item.occasion.includes("versatile") || item.occasion.length > 2
    ).length;
    score += (versatileItems / totalItems) * 0.4;

    // Neutral/basic items that mix well
    const basicItems = outfit.filter(item =>
      this.isNeutralColor(item.color) ||
      item.tags?.includes("basic") ||
      item.style === "minimalist"
    ).length;
    score += (basicItems / totalItems) * 0.3;

    // Mix-and-match potential
    const mixableStyles = ["casual", "smart-casual", "minimalist", "contemporary"];
    const mixableItems = outfit.filter(item =>
      mixableStyles.includes(item.style)
    ).length;
    score += (mixableItems / totalItems) * 0.3;

    return Math.min(1, score);
  }

  /**
   * Calculate trend relevance score
   */
  private calculateTrendinessScore(outfit: WardrobeItem[]): number {
    let score = 0;
    const totalItems = outfit.length;

    // Trend colors
    const trendColors = this.getTrendColors();
    const trendColorItems = outfit.filter(item =>
      item.color.some(color =>
        trendColors.some(trendColor =>
          color.toLowerCase().includes(trendColor.toLowerCase())
        )
      )
    ).length;
    score += (trendColorItems / totalItems) * 0.4;

    // Contemporary styles
    const contemporaryStyles = ["contemporary", "modern", "minimalist", "smart-casual"];
    const contemporaryItems = outfit.filter(item =>
      contemporaryStyles.includes(item.style) ||
      item.tags?.includes("contemporary") ||
      item.tags?.includes("modern")
    ).length;
    score += (contemporaryItems / totalItems) * 0.4;

    // Current silhouettes and cuts
    const trendTags = ["oversized", "cropped", "high-waisted", "wide-leg", "structured"];
    const trendItems = outfit.filter(item =>
      item.tags && trendTags.some(tag =>
        item.tags!.some(itemTag => itemTag.toLowerCase().includes(tag))
      )
    ).length;
    score += (trendItems / totalItems) * 0.2;

    return Math.min(1, score);
  }

  /**
   * Get seasonal fabric preferences
   */
  private getSeasonalFabrics(season: string): string[] {
    const seasonalFabrics = {
      spring: ["cotton", "linen", "silk", "light wool", "denim"],
      summer: ["linen", "cotton", "silk", "chiffon", "jersey"],
      autumn: ["wool", "cashmere", "denim", "leather", "corduroy"],
      winter: ["wool", "cashmere", "velvet", "tweed", "fleece"]
    };
    return seasonalFabrics[season as keyof typeof seasonalFabrics] || [];
  }

  private calculateSeasonalColorScore(outfit: WardrobeItem[]): number {
    try {
      const currentSeason = this.getCurrentSeason();
      const allColors = outfit.flatMap((item) => item.color);

      if (allColors.length === 0) {
        return 0.5;
      }

      const seasonalPalette = this.getSeasonalColorPalette(currentSeason);
      let seasonalMatches = 0;
      let totalColors = allColors.length;

      allColors.forEach((color) => {
        const normalizedColor = this.normalizeColor(color);
        if (
          seasonalPalette.some(
            (seasonalColor) =>
              normalizedColor.includes(seasonalColor) ||
              seasonalColor.includes(normalizedColor),
          )
        ) {
          seasonalMatches++;
        }
      });

      // Also give bonus for items that specify appropriate seasons
      const seasonalItems = outfit.filter(
        (item) =>
          item.season &&
          (item.season.includes(currentSeason) ||
            item.season.includes("all") ||
            item.season.includes("year-round")),
      ).length;

      const seasonalItemBonus = (seasonalItems / outfit.length) * 0.3;
      const colorScore = (seasonalMatches / totalColors) * 0.7;

      return Math.min(1, colorScore + seasonalItemBonus);
    } catch (error) {
      console.warn("Error calculating seasonal color score:", error);
      return 0.5;
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) {
      return "spring";
    } else if (month >= 6 && month <= 8) {
      return "summer";
    } else if (month >= 9 && month <= 11) {
      return "autumn";
    } else {
      return "winter";
    }
  }

  private enhanceColorMatchingWithSeason(
    colors1: string[],
    colors2: string[],
    season?: string,
  ): boolean {
    const currentSeason = season || this.getCurrentSeason();
    const seasonalPalette = this.getSeasonalColorPalette(currentSeason);

    // Check if both color sets have seasonal colors
    const colors1Seasonal = colors1.some((color) =>
      seasonalPalette.some((seasonal) =>
        color.toLowerCase().includes(seasonal),
      ),
    );
    const colors2Seasonal = colors2.some((color) =>
      seasonalPalette.some((seasonal) =>
        color.toLowerCase().includes(seasonal),
      ),
    );

    // Bonus for seasonal color combinations
    if (colors1Seasonal && colors2Seasonal) {
      return true;
    }

    return this.colorsWork(colors1, colors2);
  }

  // Debugging and Performance Monitoring Methods
  public enableDebugMode(enabled: boolean = true): void {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? "enabled" : "disabled"}`);
  }

  public getPerformanceMetrics(): { [key: string]: number } {
    return { ...this.performanceMetrics };
  }

  public getGenerationStats(): { [key: string]: any } {
    return { ...this.generationStats };
  }

  public resetStats(): void {
    this.performanceMetrics = {};
    this.generationStats = {};
    this.usedItemsHistory = {};
    this.log("Statistics and history reset");
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[StyleAI ${timestamp}] ${message}`, data || "");
    }
  }

  private measurePerformance<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.performanceMetrics[operation] =
        (this.performanceMetrics[operation] || 0) + duration;
      this.log(`Performance: ${operation} took ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.log(
        `Performance: ${operation} failed after ${duration.toFixed(2)}ms`,
        error,
      );
      throw error;
    }
  }

  private updateGenerationStats(stats: { [key: string]: any }): void {
    Object.keys(stats).forEach((key) => {
      if (typeof stats[key] === "number") {
        this.generationStats[key] =
          (this.generationStats[key] || 0) + stats[key];
      } else {
        this.generationStats[key] = stats[key];
      }
    });
  }

  public getDetailedAnalysis(
    outfit: WardrobeItem[],
    profile: StyleProfile,
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData },
  ): any {
    if (!this.debugMode) {
      console.warn("Debug mode must be enabled to get detailed analysis");
      return null;
    }

    try {
      const analysis = {
        outfit: outfit.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })),
        scores: {
          diversity: this.calculateDiversityScore(outfit),
          style: this.calculateAdvancedStyleScore(outfit, profile),
          colorHarmony: this.calculateColorHarmonyScore(outfit, profile),
          occasion: this.calculateOccasionScore(outfit, context.occasion),
          completeness: this.calculateCompletenessScore(outfit),
          fashion: this.calculateFashionScore(outfit, context),
          seasonal: this.calculateSeasonalColorScore(outfit),
        },
        analysis: {
          patterns: this.checkPatternHarmony(outfit),
          textures: this.checkTextureBalance(outfit),
          colors: {
            all: outfit.flatMap((item) => item.color),
            temperature: this.calculateColorTemperature(
              outfit.flatMap((item) => item.color),
            ),
            seasonal: this.getCurrentSeason(),
          },
          items: outfit.map((item) => ({
            ...item,
            fabricWeight: this.calculateFabricWeight(item),
            patterns: this.getPatternsFromItem(item),
            textures: this.getTexturesFromItem(item),
          })),
        },
        metadata: {
          timestamp: new Date().toISOString(),
          usageHistory: { ...this.usedItemsHistory },
          season: this.getCurrentSeason(),
        },
      };

      if (context.weather) {
        analysis.scores["weather"] = this.calculateAdvancedWeatherScore(
          outfit,
          context.weather,
        );
      }

      if (profile.goals && profile.goals.length > 0) {
        analysis.scores["goals"] = this.calculateGoalAlignment(
          outfit,
          profile.goals,
        );
      }

      return analysis;
    } catch (error) {
      console.error("Error generating detailed analysis:", error);
      return null;
    }
  }
}

// Export a singleton instance
export const simpleStyleAI = new SimpleStyleAI();
