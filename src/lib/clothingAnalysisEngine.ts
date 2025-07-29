
import { supabase } from '@/integrations/supabase/client';

// Core interfaces for clothing analysis
export interface ClothingAnalysisResult {
  category: string;
  subcategory: string;
  confidence: number;
  colors: string[];
  style: string;
  patterns: string[];
  materials: string[];
  occasions: string[];
  seasons: string[];
  fit?: string;
  condition?: string;
  reasoning: string;
}

export interface AnalysisContext {
  fileName?: string;
  userHint?: string;
  imageData?: ImageData;
}

// High-performance clothing categories with precise keywords
const CLOTHING_CATEGORIES = {
  tops: {
    keywords: [
      'shirt', 'blouse', 'top', 't-shirt', 'tshirt', 'tee', 'tank', 'cami',
      'sweater', 'pullover', 'hoodie', 'sweatshirt', 'cardigan', 'vest',
      'polo', 'henley', 'tunic', 'crop', 'bodysuit', 'blazer-top'
    ],
    patterns: /\b(shirt|blouse|top|t[-\s]?shirt|tee|tank|cami|sweater|pullover|hoodie|sweatshirt|cardigan|vest|polo|henley|tunic|crop|bodysuit)\b/i,
    aspectRatio: { min: 0.6, max: 1.8, ideal: 1.0 }
  },
  bottoms: {
    keywords: [
      'pants', 'jeans', 'trousers', 'shorts', 'leggings', 'joggers', 'sweatpants',
      'chinos', 'slacks', 'capri', 'culottes', 'palazzo', 'wide-leg', 'skinny',
      'bootcut', 'straight', 'cargo', 'denim', 'khaki'
    ],
    patterns: /\b(pants|jeans|trousers|shorts|leggings|joggers|sweatpants|chinos|slacks|capri|culottes|palazzo|denim)\b/i,
    aspectRatio: { min: 0.3, max: 1.2, ideal: 0.7 }
  },
  dresses: {
    keywords: [
      'dress', 'gown', 'frock', 'sundress', 'maxi', 'midi', 'mini', 'shift',
      'wrap', 'a-line', 'bodycon', 'fit-flare', 'sheath', 'cocktail', 'evening'
    ],
    patterns: /\b(dress|gown|frock|sundress|maxi|midi|mini|shift|wrap|cocktail|evening)\b/i,
    aspectRatio: { min: 0.2, max: 0.9, ideal: 0.5 }
  },
  outerwear: {
    keywords: [
      'jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'sweater', 'parka',
      'trench', 'bomber', 'denim-jacket', 'leather-jacket', 'windbreaker',
      'peacoat', 'overcoat', 'puffer', 'down', 'fleece', 'vest'
    ],
    patterns: /\b(jacket|coat|blazer|cardigan|parka|trench|bomber|windbreaker|peacoat|overcoat|puffer|fleece)\b/i,
    aspectRatio: { min: 0.7, max: 1.6, ideal: 1.1 }
  },
  shoes: {
    keywords: [
      'shoes', 'shoe', 'sneakers', 'sneaker', 'boots', 'boot', 'heels', 'heel',
      'flats', 'sandals', 'sandal', 'loafers', 'loafer', 'pumps', 'pump',
      'oxfords', 'oxford', 'runners', 'runner', 'trainers', 'trainer',
      'stilettos', 'wedges', 'moccasins', 'clogs'
    ],
    patterns: /\b(shoes?|sneakers?|boots?|heels?|flats|sandals?|loafers?|pumps?|oxfords?|runners?|trainers?|stilettos?|wedges?|moccasins|clogs)\b/i,
    aspectRatio: { min: 1.0, max: 3.5, ideal: 2.0 }
  },
  accessories: {
    keywords: [
      'bag', 'purse', 'handbag', 'backpack', 'clutch', 'tote', 'satchel',
      'hat', 'cap', 'beanie', 'scarf', 'belt', 'watch', 'jewelry', 'necklace',
      'bracelet', 'earrings', 'ring', 'sunglasses', 'glasses', 'wallet'
    ],
    patterns: /\b(bag|purse|handbag|backpack|clutch|tote|satchel|hat|cap|beanie|scarf|belt|watch|jewelry|necklace|bracelet|earrings|ring|sunglasses|glasses|wallet)\b/i,
    aspectRatio: { min: 0.3, max: 4.0, ideal: 1.5 }
  }
};

// Performance-optimized color analysis
const CLOTHING_COLORS = [
  'black', 'white', 'gray', 'navy', 'blue', 'red', 'pink', 'green',
  'yellow', 'orange', 'purple', 'brown', 'beige', 'cream', 'khaki'
];

class ClothingAnalysisEngine {
  private cache = new Map<string, ClothingAnalysisResult>();
  private analysisQueue: Array<() => Promise<ClothingAnalysisResult>> = [];
  private isProcessing = false;

  // Main analysis method with multiple validation layers
  async analyzeClothing(
    imageFile: File | string,
    context: AnalysisContext = {}
  ): Promise<ClothingAnalysisResult> {
    console.log('🔍 Starting high-accuracy clothing analysis...');

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(imageFile, context);
      
      // Check cache first for performance
      if (this.cache.has(cacheKey)) {
        console.log('📋 Using cached analysis result');
        return this.cache.get(cacheKey)!;
      }

      // Multi-layer analysis
      const analysisResults = await Promise.all([
        this.analyzeFilename(context.fileName),
        this.analyzeImageProperties(imageFile),
        this.analyzeWithAI(imageFile),
        this.analyzeContext(context.userHint)
      ]);

      // Combine results with weighted scoring
      const finalResult = this.combineAnalysisResults(analysisResults, context);

      // Cache result for future use
      this.cache.set(cacheKey, finalResult);

      console.log('✅ Analysis complete:', finalResult);
      return finalResult;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return this.getFallbackResult(context);
    }
  }

  // High-accuracy filename analysis
  private async analyzeFilename(fileName?: string): Promise<Partial<ClothingAnalysisResult>> {
    if (!fileName) return { confidence: 0 };

    const normalizedName = fileName.toLowerCase()
      .replace(/[-_\.]/g, ' ')
      .replace(/\d+/g, '');

    let bestMatch: { category: string; confidence: number } = { category: 'tops', confidence: 0.1 };

    // Check against category patterns
    for (const [category, config] of Object.entries(CLOTHING_CATEGORIES)) {
      const match = config.patterns.test(normalizedName);
      if (match) {
        // Higher confidence for exact matches
        const confidence = 0.9;
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, confidence };
        }
      }

      // Check individual keywords for partial matches
      const keywordMatches = config.keywords.filter(keyword => 
        normalizedName.includes(keyword)
      );

      if (keywordMatches.length > 0) {
        const confidence = Math.min(0.8, 0.4 + (keywordMatches.length * 0.2));
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, confidence };
        }
      }
    }

    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      reasoning: `Filename analysis: ${bestMatch.confidence > 0.5 ? 'strong' : 'weak'} match for ${bestMatch.category}`
    };
  }

  // Advanced image property analysis
  private async analyzeImageProperties(imageFile: File | string): Promise<Partial<ClothingAnalysisResult>> {
    try {
      const imageData = await this.loadImageData(imageFile);
      if (!imageData) return { confidence: 0.1 };

      const aspectRatio = imageData.width / imageData.height;
      const colors = await this.extractDominantColors(imageData);

      let bestMatch: { category: string; confidence: number } = { category: 'tops', confidence: 0.2 };

      // Analyze aspect ratio against category expectations
      for (const [category, config] of Object.entries(CLOTHING_CATEGORIES)) {
        const { min, max, ideal } = config.aspectRatio;
        
        if (aspectRatio >= min && aspectRatio <= max) {
          // Calculate confidence based on proximity to ideal ratio
          const distance = Math.abs(aspectRatio - ideal) / (max - min);
          const confidence = Math.max(0.3, 0.8 - distance);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence };
          }
        }
      }

      return {
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        colors: colors.slice(0, 3),
        reasoning: `Image analysis: aspect ratio ${aspectRatio.toFixed(2)} suggests ${bestMatch.category}`
      };

    } catch (error) {
      console.warn('Image property analysis failed:', error);
      return { confidence: 0.1 };
    }
  }

  // AI-powered analysis using Supabase edge function
  private async analyzeWithAI(imageFile: File | string): Promise<Partial<ClothingAnalysisResult>> {
    try {
      let imageUrl: string;

      if (typeof imageFile === 'string') {
        imageUrl = imageFile;
      } else {
        // Upload to Supabase storage temporarily for analysis
        const fileName = `temp-${Date.now()}-${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from('wardrobe-images')
          .upload(`temp/${fileName}`, imageFile);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(`temp/${fileName}`);

        imageUrl = urlData.publicUrl;
      }

      // Use Gemini edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('gemini-clothing-analysis', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data?.analysis) {
        return {
          category: data.analysis.category,
          subcategory: data.analysis.subcategory,
          confidence: data.confidence || 0.7,
          colors: data.analysis.colors || [],
          style: data.analysis.style,
          patterns: data.analysis.patterns || [],
          materials: data.analysis.materials || [],
          occasions: data.analysis.occasions || [],
          seasons: data.analysis.seasons || [],
          reasoning: `AI analysis: ${data.reasoning || 'Gemini vision analysis'}`
        };
      }

      return { confidence: 0.3 };

    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error);
      return { confidence: 0.2 };
    }
  }

  // Context analysis from user hints
  private async analyzeContext(userHint?: string): Promise<Partial<ClothingAnalysisResult>> {
    if (!userHint) return { confidence: 0 };

    const hint = userHint.toLowerCase();
    
    for (const [category, config] of Object.entries(CLOTHING_CATEGORIES)) {
      if (config.patterns.test(hint)) {
        return {
          category,
          confidence: 0.6,
          reasoning: `User context: "${userHint}" suggests ${category}`
        };
      }
    }

    return { confidence: 0.1 };
  }

  // Smart result combination with weighted scoring
  private combineAnalysisResults(
    results: Array<Partial<ClothingAnalysisResult>>,
    context: AnalysisContext
  ): ClothingAnalysisResult {
    const weights = {
      filename: 0.3,
      image: 0.2,
      ai: 0.4,
      context: 0.1
    };

    const categoryScores = new Map<string, number>();
    const allReasons: string[] = [];
    let bestColors: string[] = ['blue'];
    let bestStyle = 'casual';
    let bestPatterns: string[] = ['solid'];
    let bestMaterials: string[] = ['cotton'];
    let bestOccasions: string[] = ['casual'];
    let bestSeasons: string[] = ['spring', 'summer', 'fall'];

    // Aggregate scores and extract best attributes
    results.forEach((result, index) => {
      if (!result.category || !result.confidence) return;

      const weight = Object.values(weights)[index] || 0.1;
      const score = result.confidence * weight;

      categoryScores.set(
        result.category,
        (categoryScores.get(result.category) || 0) + score
      );

      if (result.reasoning) allReasons.push(result.reasoning);
      if (result.colors?.length) bestColors = result.colors;
      if (result.style) bestStyle = result.style;
      if (result.patterns?.length) bestPatterns = result.patterns;
      if (result.materials?.length) bestMaterials = result.materials;
      if (result.occasions?.length) bestOccasions = result.occasions;
      if (result.seasons?.length) bestSeasons = result.seasons;
    });

    // Find best category
    let bestCategory = 'tops';
    let bestScore = 0;

    for (const [category, score] of categoryScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Generate subcategory
    const subcategory = this.generateSubcategory(bestCategory, context.fileName);

    return {
      category: bestCategory,
      subcategory,
      confidence: Math.min(0.95, bestScore * 2.5), // Scale confidence
      colors: bestColors,
      style: bestStyle,
      patterns: bestPatterns,
      materials: bestMaterials,
      occasions: bestOccasions,
      seasons: bestSeasons,
      fit: 'regular',
      condition: 'good',
      reasoning: allReasons.join('; ') || 'Combined multi-layer analysis'
    };
  }

  // Utility methods
  private generateCacheKey(imageFile: File | string, context: AnalysisContext): string {
    const fileKey = typeof imageFile === 'string' 
      ? imageFile 
      : `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`;
    
    return `${fileKey}-${context.fileName || ''}-${context.userHint || ''}`;
  }

  private async loadImageData(imageFile: File | string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      
      if (typeof imageFile === 'string') {
        img.src = imageFile;
      } else {
        img.src = URL.createObjectURL(imageFile);
      }
    });
  }

  private async extractDominantColors(imageData: { width: number; height: number }): Promise<string[]> {
    // Simple color extraction based on common clothing colors
    // In a real implementation, this would analyze the actual image pixels
    const commonClothingColors = ['black', 'white', 'blue', 'gray', 'red', 'green'];
    return commonClothingColors.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private generateSubcategory(category: string, fileName?: string): string {
    const subcategoryMap: Record<string, string[]> = {
      tops: ['t-shirt', 'blouse', 'sweater', 'tank top', 'shirt'],
      bottoms: ['jeans', 'pants', 'shorts', 'leggings', 'trousers'],
      dresses: ['casual dress', 'maxi dress', 'mini dress', 'cocktail dress'],
      outerwear: ['jacket', 'coat', 'blazer', 'hoodie', 'cardigan'],
      shoes: ['sneakers', 'boots', 'heels', 'flats', 'sandals'],
      accessories: ['bag', 'hat', 'scarf', 'jewelry', 'belt']
    };

    const options = subcategoryMap[category] || ['item'];
    
    // Try to match filename for more specific subcategory
    if (fileName) {
      const name = fileName.toLowerCase();
      for (const option of options) {
        if (name.includes(option.replace(' ', ''))) {
          return option;
        }
      }
    }

    return options[0];
  }

  private getFallbackResult(context: AnalysisContext): ClothingAnalysisResult {
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
      reasoning: 'Fallback analysis - manual review recommended'
    };
  }

  // Performance optimization: clear old cache entries
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats for monitoring
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // Placeholder - would track actual hits in production
    };
  }
}

// Export singleton instance
export const clothingAnalysisEngine = new ClothingAnalysisEngine();
