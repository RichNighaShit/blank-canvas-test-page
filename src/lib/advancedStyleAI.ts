import { Color } from 'color2k';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string[];
  style: string;
  tags: string[];
  occasion: string[];
  season: string[];
  photo_url: string;
  // Optional advanced properties
  silhouette?: string;
  fit?: string;
  fabric?: string;
  formality_level?: number;
}

interface UserProfile {
  style_preferences?: string[];
  body_type?: string;
  preferred_colors?: string[];
  lifestyle?: string;
  budget_range?: string;
}

class AdvancedStyleAI {
  // Color Theory Methods
  private calculateColorHarmony(color1: string[], color2: string[]): number {
    let harmonyScore = 0;
    for (const c1 of color1) {
      for (const c2 of color2) {
        harmonyScore += this.getColorHarmonyScore(c1, c2);
      }
    }
    return harmonyScore / (color1.length * color2.length);
  }

  private getColorHarmonyScore(color1: string, color2: string): number {
    try {
      const col1 = new Color(color1);
      const col2 = new Color(color2);

      const hueDifference = Math.abs(col1.get('h') - col2.get('h'));
      const saturationDifference = Math.abs(col1.get('s') - col2.get('s'));
      const lightnessDifference = Math.abs(col1.get('l') - col2.get('l'));

      let harmonyScore = 0;

      // Complementary colors
      if (hueDifference > 150 && hueDifference < 190) {
        harmonyScore += 0.8;
      }

      // Analogous colors
      if (hueDifference < 30) {
        harmonyScore += 0.6;
      }

      // Similar saturation and lightness
      if (saturationDifference < 0.2 && lightnessDifference < 0.2) {
        harmonyScore += 0.5;
      }

      return harmonyScore;
    } catch (error) {
      console.error(`Error calculating color harmony for ${color1} and ${color2}:`, error);
      return 0;
    }
  }

  private getItemSilhouette(item: ClothingItem): string {
    if (item.silhouette) return item.silhouette;
    
    // Fallback analysis based on category and style
    const { category, style } = item;
    
    if (category === 'tops') {
      if (style.includes('fitted') || style.includes('slim')) return 'fitted';
      if (style.includes('oversized') || style.includes('loose')) return 'oversized';
      if (style.includes('cropped')) return 'cropped';
      return 'regular';
    }
    
    if (category === 'bottoms') {
      if (style.includes('skinny') || style.includes('tight')) return 'skinny';
      if (style.includes('wide') || style.includes('baggy')) return 'wide-leg';
      if (style.includes('straight')) return 'straight';
      return 'regular';
    }
    
    if (category === 'dresses') {
      if (style.includes('a-line')) return 'a-line';
      if (style.includes('bodycon') || style.includes('fitted')) return 'fitted';
      if (style.includes('flowy') || style.includes('loose')) return 'flowy';
      return 'regular';
    }
    
    return 'regular';
  }

  private getItemFit(item: ClothingItem): string {
    if (item.fit) return item.fit;
    
    // Fallback analysis
    if (item.style.includes('oversized')) return 'oversized';
    if (item.style.includes('fitted') || item.style.includes('slim')) return 'fitted';
    if (item.style.includes('relaxed') || item.style.includes('loose')) return 'relaxed';
    return 'regular';
  }

  private getItemFabric(item: ClothingItem): string {
    if (item.fabric) return item.fabric;
    
    // Fallback analysis based on category and style
    if (item.category === 'dresses' && item.style.includes('formal')) return 'silk';
    if (item.category === 'tops' && item.style.includes('casual')) return 'cotton';
    if (item.category === 'bottoms' && item.style.includes('denim')) return 'denim';
    if (item.category === 'outerwear') return 'wool';
    return 'cotton';
  }

  private getItemFormalityLevel(item: ClothingItem): number {
    if (item.formality_level !== undefined) return item.formality_level;
    
    // Fallback analysis (0-10 scale)
    if (item.occasion.includes('formal') || item.occasion.includes('business')) return 8;
    if (item.occasion.includes('semi-formal') || item.occasion.includes('date')) return 6;
    if (item.occasion.includes('smart-casual')) return 4;
    if (item.occasion.includes('casual')) return 2;
    return 5; // neutral
  }

  generateOutfitCombinations(
    items: ClothingItem[], 
    preferences: {
      occasion?: string;
      weather?: any;
      profile?: UserProfile;
    }
  ): Array<{
    items: ClothingItem[];
    score: number;
    reasoning: string;
    colorHarmony: number;
    styleCoherence: number;
    weatherAppropriate: number;
  }> {
    const combinations: any[] = [];
    const { occasion = 'casual', weather, profile } = preferences;

    // Generate combinations by category
    const tops = items.filter(item => item.category === 'tops');
    const bottoms = items.filter(item => item.category === 'bottoms');
    const dresses = items.filter(item => item.category === 'dresses');
    const outerwear = items.filter(item => item.category === 'outerwear');
    const shoes = items.filter(item => item.category === 'shoes');
    const accessories = items.filter(item => item.category === 'accessories');

    // Generate top + bottom combinations
    tops.forEach(top => {
      bottoms.forEach(bottom => {
        const combination = [top, bottom];
        
        // Add shoes if available
        if (shoes.length > 0) {
          const bestShoe = this.findBestMatchingItem(shoes, combination, occasion);
          if (bestShoe) combination.push(bestShoe);
        }

        // Add outerwear based on weather
        if (weather?.temperature < 15 && outerwear.length > 0) {
          const bestOuterwear = this.findBestMatchingItem(outerwear, combination, occasion);
          if (bestOuterwear) combination.push(bestOuterwear);
        }

        const score = this.scoreOutfitCombination(combination, { occasion, weather, profile });
        
        combinations.push({
          items: combination,
          score: score.total,
          reasoning: score.reasoning,
          colorHarmony: score.colorHarmony,
          styleCoherence: score.styleCoherence,
          weatherAppropriate: score.weatherAppropriate
        });
      });
    });

    // Generate dress-based combinations
    dresses.forEach(dress => {
      const combination = [dress];
      
      // Add shoes
      if (shoes.length > 0) {
        const bestShoe = this.findBestMatchingItem(shoes, combination, occasion);
        if (bestShoe) combination.push(bestShoe);
      }

      // Add outerwear if needed
      if (weather?.temperature < 18 && outerwear.length > 0) {
        const bestOuterwear = this.findBestMatchingItem(outerwear, combination, occasion);
        if (bestOuterwear) combination.push(bestOuterwear);
      }

      const score = this.scoreOutfitCombination(combination, { occasion, weather, profile });
      
      combinations.push({
        items: combination,
        score: score.total,
        reasoning: score.reasoning,
        colorHarmony: score.colorHarmony,
        styleCoherence: score.styleCoherence,
        weatherAppropriate: score.weatherAppropriate
      });
    });

    // Sort by score and return top combinations
    return combinations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private findBestMatchingItem(items: ClothingItem[], existingItems: ClothingItem[], occasion: string): ClothingItem | null {
    if (items.length === 0) return null;

    return items.reduce((best, current) => {
      const currentScore = this.scoreItemMatch(current, existingItems, occasion);
      const bestScore = best ? this.scoreItemMatch(best, existingItems, occasion) : 0;
      return currentScore > bestScore ? current : best;
    }, null as ClothingItem | null);
  }

  private scoreItemMatch(item: ClothingItem, existingItems: ClothingItem[], occasion: string): number {
    let score = 0;

    // Color harmony
    existingItems.forEach(existingItem => {
      score += this.calculateColorHarmony(existingItem.color, item.color) * 0.4;
    });

    // Occasion appropriateness
    if (item.occasion.includes(occasion)) score += 0.3;

    // Style coherence
    const itemFormality = this.getItemFormalityLevel(item);
    const avgFormality = existingItems.reduce((sum, existing) => 
      sum + this.getItemFormalityLevel(existing), 0) / existingItems.length;
    
    score += (1 - Math.abs(itemFormality - avgFormality) / 10) * 0.3;

    return score;
  }

  private scoreOutfitCombination(
    items: ClothingItem[], 
    preferences: { occasion?: string; weather?: any; profile?: UserProfile }
  ): {
    total: number;
    colorHarmony: number;
    styleCoherence: number;
    weatherAppropriate: number;
    reasoning: string;
  } {
    let colorHarmony = 0;
    let styleCoherence = 0;
    let weatherAppropriate = 0.8; // default good weather appropriateness

    // Calculate color harmony
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        colorHarmony += this.calculateColorHarmony(items[i].color, items[j].color);
      }
    }
    colorHarmony = items.length > 1 ? colorHarmony / ((items.length * (items.length - 1)) / 2) : 0.8;

    // Calculate style coherence
    const formalityLevels = items.map(item => this.getItemFormalityLevel(item));
    const avgFormality = formalityLevels.reduce((sum, level) => sum + level, 0) / formalityLevels.length;
    const formalityVariance = formalityLevels.reduce((sum, level) => sum + Math.pow(level - avgFormality, 2), 0) / formalityLevels.length;
    styleCoherence = Math.max(0, 1 - formalityVariance / 25); // normalize variance

    // Weather appropriateness
    if (preferences.weather) {
      const temp = preferences.weather.temperature;
      const hasOuterwear = items.some(item => item.category === 'outerwear');
      const hasLightClothing = items.some(item => 
        item.category === 'tops' && (item.style.includes('tank') || item.style.includes('sleeveless'))
      );

      if (temp < 10 && !hasOuterwear) weatherAppropriate = 0.3;
      else if (temp > 25 && hasOuterwear) weatherAppropriate = 0.4;
      else if (temp > 30 && !hasLightClothing) weatherAppropriate = 0.6;
    }

    // Occasion appropriateness
    const occasionMatch = preferences.occasion ? 
      items.filter(item => item.occasion.includes(preferences.occasion!)).length / items.length : 0.7;

    const total = (colorHarmony * 0.25 + styleCoherence * 0.35 + weatherAppropriate * 0.2 + occasionMatch * 0.2) * 100;

    const reasoning = this.generateOutfitReasoning(items, {
      colorHarmony,
      styleCoherence,
      weatherAppropriate,
      occasionMatch
    });

    return {
      total,
      colorHarmony: colorHarmony * 100,
      styleCoherence: styleCoherence * 100,
      weatherAppropriate: weatherAppropriate * 100,
      reasoning
    };
  }

  private generateOutfitReasoning(items: ClothingItem[], scores: any): string {
    const reasons = [];

    if (scores.colorHarmony > 0.7) {
      reasons.push("Excellent color coordination");
    } else if (scores.colorHarmony > 0.5) {
      reasons.push("Good color balance");
    }

    if (scores.styleCoherence > 0.8) {
      reasons.push("Cohesive style aesthetic");
    }

    if (scores.weatherAppropriate > 0.8) {
      reasons.push("Perfect for current weather");
    }

    if (reasons.length === 0) {
      reasons.push("Balanced outfit combination");
    }

    return reasons.join(" • ");
  }
}

export const advancedStyleAI = new AdvancedStyleAI();
