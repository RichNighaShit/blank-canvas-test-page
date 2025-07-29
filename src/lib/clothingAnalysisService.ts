
import { clothingAnalysisEngine, ClothingAnalysisResult, AnalysisContext } from './clothingAnalysisEngine';

// Simple interface for components to use
export class ClothingAnalysisService {
  // Analyze clothing with smart fallbacks and performance optimization
  static async analyzeClothingItem(
    imageFile: File,
    options: {
      fileName?: string;
      userHint?: string;
      enableCache?: boolean;
    } = {}
  ): Promise<ClothingAnalysisResult> {
    console.log('🧠 Analyzing clothing item with enhanced engine...');

    const context: AnalysisContext = {
      fileName: options.fileName || imageFile.name,
      userHint: options.userHint
    };

    try {
      const result = await clothingAnalysisEngine.analyzeClothing(imageFile, context);
      
      console.log('📊 Analysis Results:', {
        category: result.category,
        confidence: `${Math.round(result.confidence * 100)}%`,
        colors: result.colors,
        reasoning: result.reasoning
      });

      return result;
    } catch (error) {
      console.error('❌ Clothing analysis failed:', error);
      
      // Return intelligent fallback
      return {
        category: 'tops',
        subcategory: 't-shirt',
        confidence: 0.3,
        colors: ['blue'],
        style: 'casual',
        patterns: ['solid'],
        materials: ['cotton'],
        occasions: ['casual'],
        seasons: ['spring', 'summer', 'fall'],
        fit: 'regular',
        condition: 'good',
        reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Quick category detection for fast UI updates
  static async quickCategoryDetection(fileName: string): Promise<{ category: string; confidence: number }> {
    const normalizedName = fileName.toLowerCase().replace(/[-_\.]/g, ' ');
    
    // Quick regex patterns for immediate feedback
    const patterns = {
      tops: /\b(shirt|blouse|top|t[-\s]?shirt|tee|tank|sweater|hoodie)\b/i,
      bottoms: /\b(pants|jeans|shorts|leggings|trousers)\b/i,
      dresses: /\b(dress|gown|maxi|midi|mini)\b/i,
      outerwear: /\b(jacket|coat|blazer|cardigan)\b/i,
      shoes: /\b(shoe|sneaker|boot|heel|sandal|pump)\b/i,
      accessories: /\b(bag|purse|hat|scarf|belt|watch|jewelry)\b/i
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalizedName)) {
        return { category, confidence: 0.8 };
      }
    }

    return { category: 'tops', confidence: 0.3 };
  }

  // Performance utilities
  static clearAnalysisCache(): void {
    clothingAnalysisEngine.clearCache();
  }

  static getCacheStats(): { size: number; hitRate: number } {
    return clothingAnalysisEngine.getCacheStats();
  }
}

export default ClothingAnalysisService;
