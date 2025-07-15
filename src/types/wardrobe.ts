
// Unified type definitions for the wardrobe system
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
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface StyleProfile {
  id: string;
  preferred_style: string;
  favorite_colors: string[];
  goals: string[];
  body_type?: string;
  lifestyle?: string;
  budget_range?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed?: number;
  description?: string;
  location?: string;
}

export interface OutfitRecommendation {
  id: string;
  items: WardrobeItem[];
  occasion: string;
  style: string;
  confidence: number;
  description: string;
  reasoning: string[];
  colorHarmony: number;
  styleCoherence: number;
  weatherAppropriate: number;
  trendRelevance: number;
  versatility: number;
  personalFit: number;
}

export interface OutfitContext {
  occasion: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: WeatherData;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  formality?: 'casual' | 'business' | 'formal' | 'athletic';
}

export interface UserFeedback {
  outfitId: string;
  rating: number; // 1-5
  feedback: 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
  notes?: string;
  timestamp: Date;
}
