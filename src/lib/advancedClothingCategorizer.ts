
import { accurateClothingAnalyzer } from './accurateClothingAnalyzer';

// Enhanced clothing type detection with multiple analysis methods
export interface ClothingCategorizationResult {
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string[];
  detectionMethods: string[];
}

export interface ImageAnalysisData {
  dominantColors: string[];
  imageAspectRatio: number;
  imageDimensions: { width: number; height: number };
  fileName?: string;
  fileSize?: number;
}

class AdvancedClothingCategorizer {
  private categoryKeywords = {
    tops: {
      primary: ['shirt', 'top', 'blouse', 'sweater', 'hoodie', 'tshirt', 't-shirt', 'tank', 'pullover', 'cardigan', 'polo', 'henley', 'tee'],
      secondary: ['crew', 'vneck', 'scoop', 'mock', 'turtle', 'collar', 'sleeve', 'long-sleeve', 'short-sleeve'],
      brands: ['nike', 'adidas', 'uniqlo', 'zara', 'h&m'],
    },
    bottoms: {
      primary: ['pants', 'jeans', 'trousers', 'shorts', 'leggings', 'skirt', 'slacks', 'chinos', 'joggers', 'sweatpants'],
      secondary: ['denim', 'cargo', 'bootcut', 'straight', 'skinny', 'wide-leg', 'high-waist', 'low-rise'],
      brands: ['levis', 'gap', 'old-navy'],
    },
    dresses: {
      primary: ['dress', 'gown', 'frock', 'sundress', 'cocktail', 'evening'],
      secondary: ['maxi', 'midi', 'mini', 'a-line', 'bodycon', 'wrap', 'shift', 'sheath'],
      brands: [],
    },
    outerwear: {
      primary: ['jacket', 'coat', 'blazer', 'parka', 'windbreaker', 'bomber', 'trench', 'peacoat', 'overcoat'],
      secondary: ['zip-up', 'button-up', 'hooded', 'lined', 'insulated', 'waterproof'],
      brands: ['north-face', 'patagonia', 'columbia'],
    },
    shoes: {
      primary: ['shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'sandal', 'sandals', 'heel', 'heels', 'pump', 'pumps', 'loafer', 'loafers', 'oxford', 'oxfords', 'runner', 'runners'],
      secondary: ['athletic', 'running', 'walking', 'dress', 'casual', 'formal', 'high-top', 'low-top'],
      brands: ['nike', 'adidas', 'vans', 'converse', 'jordans'],
    },
    accessories: {
      primary: ['bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'belt', 'watch', 'jewelry', 'necklace', 'bracelet', 'earrings', 'ring', 'sunglasses'],
      secondary: ['leather', 'canvas', 'designer', 'vintage', 'statement'],
      brands: ['coach', 'gucci', 'prada', 'louis-vuitton'],
    },
  };

  private aspectRatioHeuristics = {
    tops: { min: 0.7, max: 1.4 }, // Usually squarish to slightly tall
    bottoms: { min: 0.5, max: 1.2 }, // Often taller than wide
    dresses: { min: 0.4, max: 0.8 }, // Usually tall and narrow
    outerwear: { min: 0.8, max: 1.5 }, // Similar to tops but can be wider
    shoes: { min: 1.2, max: 3.0 }, // Usually wider than tall
    accessories: { min: 0.5, max: 2.5 }, // Very variable
  };

  private colorPatternHeuristics = {
    tops: {
      commonColors: ['white', 'black', 'gray', 'blue', 'red', 'green'],
      avoidColors: [],
      patterns: ['solid', 'stripes', 'graphic'],
    },
    bottoms: {
      commonColors: ['blue', 'black', 'gray', 'brown', 'khaki'],
      avoidColors: [],
      patterns: ['solid', 'denim'],
    },
    dresses: {
      commonColors: ['black', 'red', 'blue', 'floral'],
      avoidColors: [],
      patterns: ['solid', 'floral', 'geometric'],
    },
    outerwear: {
      commonColors: ['black', 'gray', 'brown', 'navy', 'olive'],
      avoidColors: ['bright-pink', 'neon'],
      patterns: ['solid'],
    },
    shoes: {
      commonColors: ['black', 'brown', 'white', 'gray'],
      avoidColors: [],
      patterns: ['solid', 'leather'],
    },
    accessories: {
      commonColors: ['black', 'brown', 'gold', 'silver'],
      avoidColors: [],
      patterns: ['solid', 'textured'],
    },
  };

  async categorizeClothing(
    imageFile: File | string,
    additionalContext?: { fileName?: string; userHint?: string }
  ): Promise<ClothingCategorizationResult> {
    console.log('🧠 Starting advanced clothing categorization...');
    
    const analysisResults: { method: string; category: string; confidence: number; reasoning: string }[] = [];
    
    try {
      // Method 1: Filename Analysis (Fast and often accurate)
      if (additionalContext?.fileName) {
        const filenameResult = this.analyzeFromFilename(additionalContext.fileName);
        analysisResults.push({
          method: 'filename',
          category: filenameResult.category,
          confidence: filenameResult.confidence,
          reasoning: filenameResult.reasoning,
        });
        console.log('📁 Filename analysis:', filenameResult);
      }

      // Method 2: Image Analysis (Aspect ratio, colors, patterns)
      let imageAnalysis: ImageAnalysisData | null = null;
      try {
        imageAnalysis = await this.analyzeImageProperties(imageFile);
        const imageResult = this.analyzeFromImageProperties(imageAnalysis);
        analysisResults.push({
          method: 'image-properties',
          category: imageResult.category,
          confidence: imageResult.confidence,
          reasoning: imageResult.reasoning,
        });
        console.log('🖼️ Image properties analysis:', imageResult);
      } catch (error) {
        console.warn('Image analysis failed:', error);
      }

      // Method 3: Advanced AI Analysis (Using existing accurate analyzer)
      try {
        const aiResult = await accurateClothingAnalyzer.analyzeClothing(imageFile);
        if (aiResult.isClothing && aiResult.category) {
          analysisResults.push({
            method: 'ai-analysis',
            category: aiResult.category,
            confidence: aiResult.confidence,
            reasoning: `AI detected ${aiResult.category} with ${Math.round(aiResult.confidence * 100)}% confidence`,
          });
          console.log('🤖 AI analysis:', aiResult);
        }
      } catch (error) {
        console.warn('AI analysis failed:', error);
      }

      // Method 4: Context Analysis (User hints, etc.)
      if (additionalContext?.userHint) {
        const contextResult = this.analyzeFromContext(additionalContext.userHint);
        analysisResults.push({
          method: 'context',
          category: contextResult.category,
          confidence: contextResult.confidence,
          reasoning: contextResult.reasoning,
        });
        console.log('💭 Context analysis:', contextResult);
      }

      // Combine results using weighted voting
      const finalResult = this.combineAnalysisResults(analysisResults, imageAnalysis);
      console.log('✅ Final categorization result:', finalResult);
      
      return finalResult;

    } catch (error) {
      console.error('Error in clothing categorization:', error);
      return this.getFallbackResult();
    }
  }

  private analyzeFromFilename(fileName: string): { category: string; confidence: number; reasoning: string } {
    const normalizedName = fileName.toLowerCase().replace(/[-_\.]/g, ' ');
    const words = normalizedName.split(' ');
    
    let bestMatch = { category: 'tops', confidence: 0.3, reasoning: 'Default fallback' };
    
    // Check for exact keyword matches
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const allKeywords = [...keywords.primary, ...keywords.secondary, ...keywords.brands];
      
      for (const word of words) {
        const exactMatch = allKeywords.find(keyword => 
          keyword.toLowerCase() === word || word.includes(keyword.toLowerCase())
        );
        
        if (exactMatch) {
          const confidence = keywords.primary.includes(exactMatch) ? 0.9 : 0.7;
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              category,
              confidence,
              reasoning: `Found keyword "${exactMatch}" in filename`,
            };
          }
        }
      }
    }
    
    // Check for partial matches and context
    if (bestMatch.confidence < 0.6) {
      for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        const partialMatches = keywords.primary.filter(keyword =>
          words.some(word => word.includes(keyword) || keyword.includes(word))
        );
        
        if (partialMatches.length > 0) {
          const confidence = Math.min(0.6, 0.3 + (partialMatches.length * 0.1));
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              category,
              confidence,
              reasoning: `Partial match with keywords: ${partialMatches.join(', ')}`,
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  private async analyzeImageProperties(imageFile: File | string): Promise<ImageAnalysisData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Get basic image properties
          const aspectRatio = img.width / img.height;
          
          // Try to extract colors using canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          canvas.width = Math.min(img.width, 300);
          canvas.height = Math.min(img.height, 300);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Simple color extraction
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const dominantColors = this.extractDominantColors(imageData);
          
          resolve({
            dominantColors,
            imageAspectRatio: aspectRatio,
            imageDimensions: { width: img.width, height: img.height },
            fileName: typeof imageFile !== 'string' ? imageFile.name : undefined,
            fileSize: typeof imageFile !== 'string' ? imageFile.size : undefined,
          });
          
          URL.revokeObjectURL(img.src);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (typeof imageFile === 'string') {
        img.src = imageFile;
      } else {
        img.src = URL.createObjectURL(imageFile);
      }
    });
  }

  private extractDominantColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip very light or very dark pixels (likely background)
      const brightness = (r + g + b) / 3;
      if (brightness < 30 || brightness > 225) continue;
      
      const colorKey = this.rgbToColorName(r, g, b);
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Return top 3 colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  }

  private rgbToColorName(r: number, g: number, b: number): string {
    // Simple color categorization
    const total = r + g + b;
    if (total < 100) return 'black';
    if (total > 650) return 'white';
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max - min < 30) {
      return total < 300 ? 'gray' : 'light-gray';
    }
    
    if (r > g && r > b) {
      if (r > 200 && g < 100 && b < 100) return 'red';
      if (r > 150 && g > 100 && b < 100) return 'orange';
      if (r > 100 && g > 80 && b > 80) return 'pink';
    } else if (g > r && g > b) {
      if (g > 150 && r < 100 && b < 100) return 'green';
      if (g > 200 && r > 150 && b < 100) return 'yellow';
    } else if (b > r && b > g) {
      if (b > 150 && r < 100 && g < 100) return 'blue';
      if (b > 100 && r > 80 && g < 80) return 'purple';
    }
    
    return 'neutral';
  }

  private analyzeFromImageProperties(imageAnalysis: ImageAnalysisData): { category: string; confidence: number; reasoning: string } {
    let bestMatch = { category: 'tops', confidence: 0.2, reasoning: 'Default based on image properties' };
    const reasoning = [];
    
    // Aspect ratio analysis
    for (const [category, ratioRange] of Object.entries(this.aspectRatioHeuristics)) {
      const { min, max } = ratioRange;
      if (imageAnalysis.imageAspectRatio >= min && imageAnalysis.imageAspectRatio <= max) {
        const centerDistance = Math.abs(imageAnalysis.imageAspectRatio - (min + max) / 2);
        const normalizedDistance = centerDistance / ((max - min) / 2);
        const confidence = 0.5 + (0.3 * (1 - normalizedDistance));
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category,
            confidence,
            reasoning: `Aspect ratio ${imageAnalysis.imageAspectRatio.toFixed(2)} fits ${category} range`,
          };
        }
        reasoning.push(`Aspect ratio fits ${category}`);
      }
    }
    
    // Color analysis boost
    if (imageAnalysis.dominantColors.length > 0) {
      for (const [category, colorHeuristics] of Object.entries(this.colorPatternHeuristics)) {
        const matchingColors = imageAnalysis.dominantColors.filter(color =>
          colorHeuristics.commonColors.includes(color)
        );
        const avoidedColors = imageAnalysis.dominantColors.filter(color =>
          colorHeuristics.avoidColors.includes(color)
        );
        
        if (matchingColors.length > 0 && avoidedColors.length === 0) {
          if (bestMatch.category === category) {
            bestMatch.confidence = Math.min(0.8, bestMatch.confidence + 0.2);
            reasoning.push(`Color pattern supports ${category}`);
          }
        }
      }
    }
    
    return { ...bestMatch, reasoning: reasoning.join('; ') || bestMatch.reasoning };
  }

  private analyzeFromContext(userHint: string): { category: string; confidence: number; reasoning: string } {
    const normalizedHint = userHint.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const allKeywords = [...keywords.primary, ...keywords.secondary];
      
      for (const keyword of allKeywords) {
        if (normalizedHint.includes(keyword)) {
          return {
            category,
            confidence: 0.7,
            reasoning: `User context suggests "${keyword}" → ${category}`,
          };
        }
      }
    }
    
    return { category: 'tops', confidence: 0.1, reasoning: 'No clear context signals' };
  }

  private combineAnalysisResults(
    results: { method: string; category: string; confidence: number; reasoning: string }[],
    imageAnalysis: ImageAnalysisData | null
  ): ClothingCategorizationResult {
    if (results.length === 0) {
      return this.getFallbackResult();
    }
    
    // Weight different methods
    const methodWeights = {
      'filename': 0.4,
      'ai-analysis': 0.35,
      'image-properties': 0.15,
      'context': 0.1,
    };
    
    // Calculate weighted scores for each category
    const categoryScores = new Map<string, { score: number; methods: string[]; reasoning: string[] }>();
    
    for (const result of results) {
      const weight = methodWeights[result.method] || 0.1;
      const weightedScore = result.confidence * weight;
      
      const existing = categoryScores.get(result.category);
      if (existing) {
        existing.score += weightedScore;
        existing.methods.push(result.method);
        existing.reasoning.push(result.reasoning);
      } else {
        categoryScores.set(result.category, {
          score: weightedScore,
          methods: [result.method],
          reasoning: [result.reasoning],
        });
      }
    }
    
    // Find the best category
    let bestCategory = 'tops';
    let bestScore = 0;
    let bestData = { methods: ['fallback'], reasoning: ['Default fallback'] };
    
    for (const [category, data] of categoryScores.entries()) {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestCategory = category;
        bestData = data;
      }
    }
    
    // Determine subcategory
    const subcategory = this.determineSubcategory(bestCategory, imageAnalysis);
    
    return {
      category: bestCategory,
      subcategory,
      confidence: Math.min(0.95, bestScore * 2), // Scale up confidence
      reasoning: bestData.reasoning,
      detectionMethods: bestData.methods,
    };
  }

  private determineSubcategory(category: string, imageAnalysis: ImageAnalysisData | null): string {
    // Simple subcategory mapping
    const subcategoryMap = {
      tops: 'shirt',
      bottoms: 'pants',
      dresses: 'dress',
      outerwear: 'jacket',
      shoes: 'sneakers',
      accessories: 'accessory',
    };
    
    return subcategoryMap[category] || 'item';
  }

  private getFallbackResult(): ClothingCategorizationResult {
    return {
      category: 'tops',
      subcategory: 'shirt',
      confidence: 0.3,
      reasoning: ['Fallback analysis - manual categorization recommended'],
      detectionMethods: ['fallback'],
    };
  }
}

export const advancedClothingCategorizer = new AdvancedClothingCategorizer();
