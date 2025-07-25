// Minimal stubs for broken imports
export const colorSeasonAnalysisService = {
  analyzeColorSeason: async () => ({
    season: 'autumn',
    subSeason: 'warm autumn',
    description: 'Beautiful warm colors',
    characteristics: {
      contrast: 'medium',
      warmth: 'warm',
      clarity: 'soft',
      depth: 'medium'
    },
    idealColors: ['#8B4513', '#CD853F'],
    avoidColors: ['#000000'],
    tips: ['Wear warm colors'],
    clothingRecommendations: {
      colors: ['#8B4513'],
      styles: ['casual']
    },
    makeupRecommendations: {
      lipColors: ['#CD853F'],
      eyeColors: ['#8B4513']
    }
  })
};

export const enhancedFacialFeatureAnalysis = {
  analyzeFacialFeatures: async () => ({
    skinTone: 'medium',
    eyeColor: 'brown',
    hairColor: 'brown'
  })
};

export const accurateClothingAnalyzer = {
  analyzeClothing: async () => ({
    category: 'top',
    style: 'casual',
    colors: ['#000000']
  })
};

export const simpleStyleAI = {
  getRecommendations: async () => []
};

export interface OutfitRecommendation {
  id: string;
  items: any[];
}

export interface WardrobeItem {
  id: string;
  category: string;
}

export interface StyleProfile {
  style: string;
}

export interface EnhancedFacialFeatureColors {
  skinTone: string;
}

export interface ExtractedPalette {
  colors: string[];
}

export const colorExtractionService = {
  extractColors: async () => ({ colors: ['#000000'] })
};