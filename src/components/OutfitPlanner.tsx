
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Heart, 
  Calendar,
  Thermometer,
  Star
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

interface OutfitCombination {
  items: ClothingItem[];
  score: number;
  reasoning: string;
  colorHarmony: number;
  styleCoherence: number;
  weatherAppropriate: number;
}

const OutfitPlanner = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfitCombinations, setOutfitCombinations] = useState<OutfitCombination[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>("casual");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather } = useWeather();

  const occasions = [
    'casual', 'work', 'formal', 'date', 'party', 'sports', 'travel', 'home'
  ];

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

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

  const generateOutfits = async () => {
    if (items.length < 2) {
      toast({
        title: "Not enough items",
        description: "Add more items to your wardrobe to generate outfits",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      const combinations = advancedStyleAI.generateOutfitCombinations(items, {
        occasion: selectedOccasion,
        weather: weather,
        profile: profile ? {
          style_preferences: profile.style_preferences || [],
          preferred_colors: profile.preferred_colors || [],
          lifestyle: profile.lifestyle || '',
          budget_range: profile.budget_range || ''
        } : undefined
      });

      setOutfitCombinations(combinations);
      
      toast({
        title: "Outfits Generated!",
        description: `Created ${combinations.length} outfit combinations for you`,
      });
    } catch (error) {
      console.error('Error generating outfits:', error);
      toast({
        title: "Error",
        description: "Failed to generate outfit combinations",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveOutfitFeedback = async (outfitId: string, liked: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('outfit_feedback')
        .insert({
          user_id: user.id,
          outfit_combination: outfitId,
          feedback_type: liked ? 'like' : 'dislike',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving feedback:', error);
      } else {
        toast({
          title: liked ? "Outfit Liked!" : "Feedback Saved",
          description: "We'll use this to improve your recommendations",
        });
      }
    } catch (error) {
      console.error('Error saving outfit feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Outfit Planner</h2>
          <p className="text-muted-foreground">
            AI-powered outfit combinations from your wardrobe
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Outfit Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Occasion</label>
              <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {weather && (
              <div>
                <label className="text-sm font-medium mb-2 block">Weather</label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-sm">
                    {Math.round(weather.temperature)}°C, {weather.condition}
                  </span>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Items Available</label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {items.length} wardrobe items
              </div>
            </div>
          </div>

          <Button 
            onClick={generateOutfits} 
            disabled={generating || items.length < 2}
            className="w-full"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Outfits...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Outfit Combinations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Outfit Combinations */}
      {outfitCombinations.length > 0 && (
        <div className="grid gap-6">
          <h3 className="text-xl font-semibold">Your Outfit Combinations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {outfitCombinations.map((outfit, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Outfit #{index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {Math.round(outfit.score)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {outfit.reasoning}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Outfit Items */}
                  <div className="grid grid-cols-2 gap-2">
                    {outfit.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="relative">
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div className="absolute bottom-1 left-1 right-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outfit Scores */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">Color</div>
                      <div className="text-muted-foreground">
                        {Math.round(outfit.colorHarmony)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Style</div>
                      <div className="text-muted-foreground">
                        {Math.round(outfit.styleCoherence)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Weather</div>
                      <div className="text-muted-foreground">
                        {Math.round(outfit.weatherAppropriate)}%
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveOutfitFeedback(`outfit-${index}`, true)}
                      className="flex-1"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Love it
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveOutfitFeedback(`outfit-${index}`, false)}
                      className="flex-1"
                    >
                      Not for me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {outfitCombinations.length === 0 && !loading && !generating && (
        <Card className="text-center p-12">
          <CardContent>
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Create Outfits?</h3>
            <p className="text-muted-foreground mb-4">
              Generate AI-powered outfit combinations from your wardrobe items.
            </p>
            <Button onClick={generateOutfits} disabled={items.length < 2}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Your First Outfits
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OutfitPlanner;
