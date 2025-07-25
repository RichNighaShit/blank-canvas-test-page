// Color season analysis - Simplified stub
export interface ColorSeasonAnalysis {
  season: string;
  subSeason?: string;
  description?: string;
  characteristics?: {
    contrast: 'high' | 'medium' | 'low';
    warmth: 'warm' | 'cool' | 'neutral';
    clarity: 'clear' | 'soft' | 'muted';
    depth: 'light' | 'medium' | 'deep';
  };
  contrast: 'high' | 'medium' | 'low';
  warmth: 'warm' | 'cool' | 'neutral';
  clarity: 'clear' | 'soft' | 'muted';
  depth: 'light' | 'medium' | 'deep';
  palette: string[];
  idealColors?: string[];
  avoidColors?: string[];
  tips?: string[];
  clothingRecommendations?: any;
  makeupRecommendations?: any;
}

export const colorSeasonAnalysisService = {
  analyzeColorSeason: async (imageFile: File): Promise<ColorSeasonAnalysis> => {
    return {
      season: 'autumn',
      subSeason: 'warm autumn',
      description: 'Beautiful warm colors that complement your natural features',
      characteristics: {
        contrast: 'medium',
        warmth: 'warm',
        clarity: 'soft',
        depth: 'medium'
      },
      contrast: 'medium',
      warmth: 'warm',
      clarity: 'soft',
      depth: 'medium',
      palette: ['#8B4513', '#CD853F', '#F4A460', '#DEB887'],
      idealColors: ['#8B4513', '#CD853F'],
      avoidColors: ['#000000', '#ffffff'],
      tips: ['Wear warm, earthy colors'],
      clothingRecommendations: {
        colors: ['#8B4513'],
        styles: ['casual']
      },
      makeupRecommendations: {
        lipColors: ['#CD853F'],
        eyeColors: ['#8B4513']
      }
    };
  }
};

export const analyzeColorSeason = async (imageFile: File): Promise<ColorSeasonAnalysis> => {
  return colorSeasonAnalysisService.analyzeColorSeason(imageFile);
};

export const determineColorSeason = (features: any): ColorSeasonAnalysis => {
  return {
    season: 'autumn',
    contrast: 'medium', 
    warmth: 'warm',
    clarity: 'soft',
    depth: 'medium',
    palette: ['#8B4513', '#CD853F', '#F4A460', '#DEB887']
  };
};