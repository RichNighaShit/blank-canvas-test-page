// Enhanced stub implementation for style AI
export interface StyleRecommendation {
  id: string;
  items: string[];
  style: string;
  occasion: string;
  confidence: number;
  description?: string;
  reasoning?: string;
}

export interface OutfitRecommendation {
  id: string;
  items: string[];
  style: string;
  occasion: string;
  confidence: number;
  description?: string;
  reasoning?: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url?: string;
}

export interface StyleProfile {
  preferredStyles: string[];
  bodyType?: string;
  colorPreferences: string[];
  lifestyle: string;
}

export const simpleStyleAI = {
  generateRecommendations: async (
    wardrobeItems?: WardrobeItem[], 
    styleProfile?: StyleProfile, 
    weather?: any, 
    occasion?: string
  ): Promise<StyleRecommendation[]> => {
    return [
      {
        id: '1',
        items: ['Blue shirt', 'Dark jeans', 'White sneakers'],
        style: 'casual',
        occasion: 'everyday',
        confidence: 0.9,
        description: 'A comfortable casual outfit perfect for everyday wear.',
        reasoning: 'This combination offers comfort and style for daily activities.'
      }
    ];
  }
};