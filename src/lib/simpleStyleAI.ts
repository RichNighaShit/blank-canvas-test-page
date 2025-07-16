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
    includeAccessories: boolean = true
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
    const combinations = this.generateDiverseCombinations(itemsByCategory, context.occasion, profile.preferred_style, includeAccessories, context.weather);
    
    // Score and filter combinations
    const scoredOutfits = combinations.map(outfit => 
      this.scoreOutfit(outfit, profile, context)
    ).filter(outfit => outfit.confidence > 0.4); // Lower threshold for more variety
    
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
    diverseOutfits.forEach(outfit => {
      outfit.items.forEach(item => {
        this.usedItemsHistory[item.id] = (this.usedItemsHistory[item.id] || 0) + 1;
      });
    });

    return diverseOutfits.slice(0, 6); // Return top 6 diverse outfits
  }

  private calculateDiversityScore(items: WardrobeItem[]): number {
    let score = 1.0;
    
    items.forEach(item => {
      const usageCount = this.usedItemsHistory[item.id] || 0;
      // Heavily penalize frequently used items
      score -= (usageCount * 0.3);
    });
    
    return Math.max(0, score);
  }

  private filterByWeather(items: WardrobeItem[], weather: WeatherData): WardrobeItem[] {
    return items.filter(item => {
      // Temperature-based filtering
      if (weather.temperature < 10) {
        // Cold weather - prefer warm items
        if (item.category === 'outerwear' || item.tags?.includes('warm')) return true;
        if (item.category === 'tops' && item.tags?.includes('long-sleeve')) return true;
        if (item.category === 'bottoms' && item.tags?.includes('pants')) return true;
        if (item.category === 'shoes' && item.tags?.includes('boots')) return true;
        return !item.tags?.includes('summer') && !item.tags?.includes('shorts');
      } else if (weather.temperature > 25) {
        // Hot weather - prefer light, breathable items and avoid outerwear
        if (item.category === 'outerwear') return false; // Explicitly exclude outerwear in hot weather
        if (item.tags?.includes('light') || item.tags?.includes('breathable')) return true;
        if (item.category === 'tops' && item.tags?.includes('short-sleeve')) return true;
        if (item.category === 'bottoms' && item.tags?.includes('shorts')) return true;
        // Exclude heavy winter items and warm clothing
        if (item.tags?.includes('heavy') || item.tags?.includes('wool') || item.tags?.includes('winter') || item.tags?.includes('warm')) return false;
        return true;
      }

      // Weather condition filtering
      if (weather.condition === 'rain') {
        if (item.category === 'outerwear' && item.tags?.includes('waterproof')) return true;
        if (item.category === 'shoes' && !item.tags?.includes('open-toe')) return true;
        return !item.tags?.includes('delicate');
      }

      if (weather.condition === 'snow') {
        if (item.category === 'outerwear' && item.tags?.includes('warm')) return true;
        if (item.category === 'shoes' && item.tags?.includes('boots')) return true;
        return !item.tags?.includes('summer') && !item.tags?.includes('open-toe');
      }

      return true; // Default: include all items for mild weather
    });
  }

  private generateDiverseCombinations(
    itemsByCategory: { [key: string]: WardrobeItem[] },
    occasion: string,
    preferredStyle?: string,
    includeAccessories: boolean = true,
    weather?: WeatherData
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
      
      if (this.isAppropriateForOccasion(dress, occasion, preferredStyle) && 
          (this.usedItemsHistory[dress.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION) {
        
        const outfit = [dress];
        
        // Add varied shoes
        const suitableShoes = shoes.filter(shoe => 
          this.colorsWork(dress.color, shoe.color) && 
          (this.usedItemsHistory[shoe.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
        );
        
        if (suitableShoes.length > 0) {
          outfit.push(suitableShoes[0]);
        }
        
        // Add outerwear only if temperature allows (strictly no outerwear above 25°C)
        if (!shouldExcludeOuterwear && Math.random() > 0.6 && outerwear.length > 0) {
          const suitableOuterwear = outerwear.find(coat => 
            this.colorsWork(dress.color, coat.color) &&
            (this.usedItemsHistory[coat.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
          );
          if (suitableOuterwear) outfit.push(suitableOuterwear);
        }
        
        // Add accessories only if user wants them
        if (includeAccessories && Math.random() > 0.5 && accessories.length > 0) {
          const suitableAccessory = accessories.find(acc => 
            (this.usedItemsHistory[acc.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
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
      
      if (!this.isAppropriateForOccasion(top, occasion, preferredStyle) || 
          !this.isAppropriateForOccasion(bottom, occasion, preferredStyle)) continue;
          
      if ((this.usedItemsHistory[top.id] || 0) >= this.MAX_ITEM_USAGE_PER_SESSION ||
          (this.usedItemsHistory[bottom.id] || 0) >= this.MAX_ITEM_USAGE_PER_SESSION) continue;
      
      // Use more flexible color matching for variety
      if (this.colorsWork(top.color, bottom.color) || this.hasNeutralColors(top.color, bottom.color)) {
        const outfit = [top, bottom];
        
        // Add shoes with variety
        const availableShoes = shoes.filter(shoe => 
          (this.usedItemsHistory[shoe.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
        );
        
        if (availableShoes.length > 0) {
          // Pick shoes that work with the outfit, prefer less used ones
          const suitableShoes = availableShoes.filter(shoe => 
            this.colorsWork([...top.color, ...bottom.color], shoe.color) ||
            this.isNeutralColor(shoe.color)
          );
          
          if (suitableShoes.length > 0) {
            outfit.push(suitableShoes[0]);
          }
        }
        
        // Add outerwear only if temperature allows (strictly no outerwear above 25°C)
        if (!shouldExcludeOuterwear && Math.random() > 0.7 && outerwear.length > 0) {
          const availableOuterwear = outerwear.find(coat => 
            (this.usedItemsHistory[coat.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
          );
          if (availableOuterwear) outfit.push(availableOuterwear);
        }
        
        if (includeAccessories && Math.random() > 0.6 && accessories.length > 0) {
          const availableAccessory = accessories.find(acc => 
            (this.usedItemsHistory[acc.id] || 0) < this.MAX_ITEM_USAGE_PER_SESSION
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
    const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'brown', 'cream'];
    return colors1.some(c => neutrals.includes(c.toLowerCase())) &&
           colors2.some(c => neutrals.includes(c.toLowerCase()));
  }

  private groupByCategory(items: WardrobeItem[]): { [key: string]: WardrobeItem[] } {
    const groups: { [key: string]: WardrobeItem[] } = {};
    
    items.forEach(item => {
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
    context: { occasion: string; timeOfDay?: string; weather?: WeatherData }
  ): OutfitRecommendation {
    let confidence = 0;
    const reasoning: string[] = [];
    
    // Base confidence for having items
    confidence += 0.3;
    
    // Diversity bonus - reward outfits with less-used items
    const diversityBonus = this.calculateDiversityScore(outfit) * 0.2;
    confidence += diversityBonus;
    
    if (diversityBonus > 0.15) {
      reasoning.push('Features fresh combinations from your wardrobe');
    }
    
    // Style matching
    const styleMatches = outfit.filter(item => 
      item.style === profile.preferred_style || 
      item.style === 'versatile'
    ).length;
    const styleScore = styleMatches / outfit.length;
    confidence += styleScore * 0.25;
    
    if (styleScore > 0.7) {
      reasoning.push(`Matches your ${profile.preferred_style} style preference`);
    }
    
    // Color preferences
    if (profile.favorite_colors && profile.favorite_colors.length > 0) {
      const outfitColors = outfit.flatMap(item => item.color);
      const favoriteColorMatches = outfitColors.filter(color => 
        profile.favorite_colors!.some(favColor => 
          color.toLowerCase().includes(favColor.toLowerCase())
        )
      ).length;
      
      if (favoriteColorMatches > 0) {
        confidence += 0.15;
        reasoning.push('Incorporates your favorite colors');
      }
    }
    
    // Occasion appropriateness
    const occasionMatches = outfit.filter(item => 
      item.occasion.includes(context.occasion) || 
      item.occasion.includes('versatile') ||
      item.occasion.includes('casual')
    ).length;
    
    if (occasionMatches === outfit.length) {
      confidence += 0.2;
      reasoning.push(`Perfect for ${context.occasion} occasions`);
    }
    
    // Weather appropriateness
    if (context.weather) {
      const weatherScore = this.calculateWeatherScore(outfit, context.weather);
      confidence += weatherScore * 0.15;
      
      if (weatherScore > 0.7) {
        reasoning.push(this.getWeatherReasoning(outfit, context.weather));
      }
    }
    
    // Color harmony
    if (this.hasGoodColorHarmony(outfit)) {
      confidence += 0.1;
      reasoning.push('Harmonious color palette');
    }
    
    // Ensure confidence is between 0 and 1
    confidence = Math.min(1, Math.max(0, confidence));
    
    const outfitId = outfit.map(item => item.id).sort().join('-');
    const style = this.determineOverallStyle(outfit);
    
    return {
      id: outfitId,
      items: outfit,
      occasion: context.occasion,
      style,
      confidence,
      description: this.generateDescription(outfit, context),
      reasoning
    };
  }

  private calculateWeatherScore(outfit: WardrobeItem[], weather: WeatherData): number {
    let score = 0;
    let totalItems = outfit.length;
    
    outfit.forEach(item => {
      if (weather.temperature < 10) {
        // Cold weather scoring
        if (item.category === 'outerwear' || item.tags?.includes('warm')) score += 1;
        if (item.tags?.includes('long-sleeve')) score += 0.5;
        if (item.tags?.includes('boots') || item.tags?.includes('closed-toe')) score += 0.5;
        if (item.tags?.includes('summer') || item.tags?.includes('shorts')) score -= 0.5;
      } else if (weather.temperature > 25) {
        // Hot weather scoring
        if (item.category === 'outerwear') score -= 1; // Heavily penalize outerwear in hot weather
        if (item.tags?.includes('light') || item.tags?.includes('breathable')) score += 1;
        if (item.tags?.includes('short-sleeve') || item.tags?.includes('shorts')) score += 0.5;
        if (item.tags?.includes('heavy') || item.tags?.includes('wool') || item.tags?.includes('winter') || item.tags?.includes('warm')) score -= 0.5;
      }
      
      if (weather.condition === 'rain') {
        if (item.tags?.includes('waterproof')) score += 1;
        if (item.category === 'shoes' && !item.tags?.includes('open-toe')) score += 0.5;
        if (item.tags?.includes('delicate')) score -= 0.5;
      }
      
      if (weather.condition === 'snow') {
        if (item.tags?.includes('warm') || item.tags?.includes('insulated')) score += 1;
        if (item.tags?.includes('boots')) score += 0.5;
        if (item.tags?.includes('open-toe')) score -= 1;
      }
    });
    
    return Math.max(0, Math.min(1, score / totalItems));
  }

  private getWeatherReasoning(outfit: WardrobeItem[], weather: WeatherData): string {
    if (weather.temperature < 10) {
      return `Perfect for cold weather (${weather.temperature}°C) with warm layers`;
    } else if (weather.temperature > 25) {
      const hasOuterwear = outfit.some(item => item.category === 'outerwear');
      if (hasOuterwear) {
        return `Note: Outerwear not recommended for temperatures above 25°C (${weather.temperature}°C)`;
      }
      return `Ideal for warm weather (${weather.temperature}°C) with breathable fabrics - no outerwear needed`;
    }
    
    if (weather.condition === 'rain') {
      return `Weather-appropriate for rainy conditions`;
    }
    
    if (weather.condition === 'snow') {
      return `Suitable for snowy weather with proper coverage`;
    }
    
    return `Well-suited for current weather conditions`;
  }

  private isAppropriateForOccasion(item: WardrobeItem, occasion: string, preferredStyle?: string): boolean {
    // Stricter category matching
    const isOccasionMatch = item.occasion.includes(occasion) || 
                           item.occasion.includes('versatile');
    
    // For formal occasions, be more strict
    if (occasion === 'formal' || occasion === 'business') {
      if (item.style === 'casual' || item.style === 'streetwear') {
        return false; // Don't allow casual/streetwear for formal occasions
      }
      return isOccasionMatch || item.style === 'formal' || item.style === 'business';
    }
    
    // For casual occasions, allow more flexibility but prefer matching style
    if (occasion === 'casual') {
      return isOccasionMatch || item.occasion.includes('casual');
    }
    
    // For other occasions, use original logic but consider style preference
    if (preferredStyle && item.style === preferredStyle) {
      return true;
    }
    
    return isOccasionMatch || item.occasion.includes('casual');
  }

  private colorsWork(colors1: string[], colors2: string[]): boolean {
    const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy'];
    
    if (colors1.some(c => neutrals.includes(c.toLowerCase())) || 
        colors2.some(c => neutrals.includes(c.toLowerCase()))) {
      return true;
    }
    
    if (colors1.some(c1 => colors2.some(c2 => c1.toLowerCase() === c2.toLowerCase()))) {
      return true;
    }
    
    if (this.areComplementary(colors1, colors2)) {
      return true;
    }
    
    return false;
  }

  private colorsMatch(colors1: string[], colors2: string[]): boolean {
    return colors1.some(c1 => colors2.some(c2 => c1.toLowerCase() === c2.toLowerCase()));
  }

  private isNeutralColor(colors: string[]): boolean {
    const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'brown'];
    return colors.some(color => neutrals.includes(color.toLowerCase()));
  }

  private areComplementary(colors1: string[], colors2: string[]): boolean {
    const complementaryPairs = [
      ['red', 'green'],
      ['blue', 'orange'],
      ['yellow', 'purple'],
      ['pink', 'green']
    ];
    
    return complementaryPairs.some(([color1, color2]) => 
      colors1.some(c1 => c1.toLowerCase().includes(color1)) &&
      colors2.some(c2 => c2.toLowerCase().includes(color2))
    );
  }

  private hasGoodColorHarmony(outfit: WardrobeItem[]): boolean {
    const allColors = outfit.flatMap(item => item.color);
    const uniqueColors = [...new Set(allColors.map(c => c.toLowerCase()))];
    
    if (uniqueColors.length > 4) return false;
    
    const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'brown'];
    const neutralCount = uniqueColors.filter(color => 
      neutrals.some(neutral => color.includes(neutral))
    ).length;
    
    if (neutralCount >= uniqueColors.length - 1) return true;
    
    return true;
  }

  private determineOverallStyle(outfit: WardrobeItem[]): string {
    const styles = outfit.map(item => item.style);
    const styleCounts: { [key: string]: number } = {};
    
    styles.forEach(style => {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });
    
    return Object.entries(styleCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'casual';
  }

  private generateDescription(outfit: WardrobeItem[], context: { occasion: string; weather?: WeatherData }): string {
    const categories = outfit.map(item => item.category);
    const style = this.determineOverallStyle(outfit);
    
    let description = '';
    if (categories.includes('dresses')) {
      description = `A ${style} dress ensemble perfect for ${context.occasion}`;
    } else {
      const topCategory = categories.find(cat => ['tops', 'shirts'].includes(cat)) || 'top';
      const bottomCategory = categories.find(cat => ['bottoms', 'pants', 'skirts'].includes(cat)) || 'bottom';
      description = `A ${style} combination with ${topCategory} and ${bottomCategory} for ${context.occasion}`;
    }
    
    // Add weather context
    if (context.weather) {
      if (context.weather.temperature < 10) {
        description += ` (warm layers for cold weather)`;
      } else if (context.weather.temperature > 25) {
        description += ` (light fabrics for warm weather)`;
      }
      
      if (context.weather.condition === 'rain') {
        description += ` with weather protection`;
      }
    }
    
    return description;
  }
}

// Export a singleton instance
export const simpleStyleAI = new SimpleStyleAI();
