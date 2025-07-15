
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";
import { advancedStyleAI } from "@/lib/advancedStyleAI";
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Palette,
  Star,
  ThumbsUp
} from "lucide-react";

interface ClothingItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  tags: string[];
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  user_id: string;
  created_at?: string;
  updated_at?: string;
  // Optional advanced properties
  silhouette?: string;
  fit?: string;
  fabric?: string;
  formality_level?: number;
}

interface StyleRecommendation {
  items: ClothingItem[];
  score: number;
  reasoning: string;
  colorHarmony: number;
  styleCoherence: number;
  weatherAppropriate: number;
  trendRelevance?: number;
}

const StyleRecommendations = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather } = useWeather();

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

  useEffect(() => {
    if (items.length > 0) {
      generateRecommendations();
    }
  }, [items, weather]);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load wardrobe items",
          variant: "destructive"
        });
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (items.length < 2) return;

    setGenerating(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate recommendations for different occasions
      const occasions = ['casual', 'work', 'date', 'formal'];
      const allRecommendations: StyleRecommendation[] = [];

      for (const occasion of occasions) {
        const combinations = advancedStyleAI.generateOutfitCombinations(items, {
          occasion,
          weather: weather || undefined,
          profile: profile ? {
            style_preferences: profile.style_preferences || [],
            preferred_colors: profile.preferred_colors || [],
            lifestyle: profile.lifestyle || '',
            budget_range: profile.budget_range || ''
          } : undefined
        });

        // Take top 2 combinations per occasion
        const topCombinations = combinations.slice(0, 2).map(combo => ({
          ...combo,
          trendRelevance: Math.random() * 20 + 80 // Mock trend relevance 80-100%
        }));

        allRecommendations.push(...topCombinations);
      }

      // Sort by score and take top recommendations
      const sortedRecommendations = allRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setRecommendations(sortedRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate style recommendations",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveRecommendationFeedback = async (recommendationIndex: number, helpful: boolean) => {
    if (!user) return;

    try {
      const recommendation = recommendations[recommendationIndex];
      const { error } = await supabase
        .from('outfit_feedback')
        .insert({
          user_id: user.id,
          outfit_item_ids: recommendation.items.map(item => item.id),
          feedback: helpful ? 'helpful' : 'not_helpful',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving feedback:', error);
      } else {
        toast({
          title: helpful ? "Thanks for the feedback!" : "Feedback saved",
          description: "We'll use this to improve your recommendations",
        });
      }
    } catch (error) {
      console.error('Error saving recommendation feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Style Recommendations</h2>
          <p className="text-muted-foreground">
            Personalized outfit suggestions powered by advanced AI
          </p>
        </div>
        <Button onClick={generateRecommendations} disabled={generating || items.length < 2}>
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Weather Context */}
      {weather && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Today's Weather:</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(weather.temperature)}°C, {weather.condition}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Recommendations updated for current conditions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Style Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Style #{index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {Math.round(recommendation.score)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recommendation.reasoning}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Outfit Items */}
                <div className="grid grid-cols-2 gap-2">
                  {recommendation.items.slice(0, 4).map((item, itemIndex) => (
                    <div key={itemIndex} className="relative group">
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-md group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-1 left-1 right-1">
                        <Badge variant="secondary" className="text-xs truncate">
                          {item.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendation Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Color Harmony</span>
                    <span className="font-medium">{Math.round(recommendation.colorHarmony)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Style Coherence</span>
                    <span className="font-medium">{Math.round(recommendation.styleCoherence)}%</span>
                  </div>
                  {recommendation.trendRelevance && (
                    <div className="flex justify-between items-center text-xs">
                      <span>Trend Relevance</span>
                      <span className="font-medium">{Math.round(recommendation.trendRelevance)}%</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveRecommendationFeedback(index, true)}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Helpful
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveRecommendationFeedback(index, false)}
                    className="flex-1"
                  >
                    Not helpful
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {generating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !loading && !generating && items.length >= 2 && (
        <Card className="text-center p-12">
          <CardContent>
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Getting Your Style Ready</h3>
            <p className="text-muted-foreground mb-4">
              We're analyzing your wardrobe to create personalized recommendations.
            </p>
            <Button onClick={generateRecommendations}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Items State */}
      {items.length < 2 && !loading && (
        <Card className="text-center p-12">
          <CardContent>
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Build Your Wardrobe</h3>
            <p className="text-muted-foreground">
              Add more items to your wardrobe to get personalized style recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StyleRecommendations;
