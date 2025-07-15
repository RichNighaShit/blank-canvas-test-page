import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";
import { advancedStyleAI, OutfitRecommendation, WardrobeItem, StyleProfile } from "@/lib/advancedStyleAI";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { Sparkles, Calendar as CalendarIcon, Zap, Star, Crown } from "lucide-react";

interface PlannedOutfit {
  id: string;
  date: Date;
  occasion: string;
  items: WardrobeItem[];
  weather?: string;
  notes?: string;
  confidence?: number;
  reasoning?: string[];
  advanced_scores?: {
    style_score: number;
    color_harmony_score: number;
    weather_appropriateness: number;
    trend_relevance: number;
  };
}

export const OutfitPlanner = () => {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeItem[]>([]);
  const [currentOutfitDetails, setCurrentOutfitDetails] = useState<OutfitRecommendation | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather } = useWeather();

  // Performance optimization
  const { executeWithCache } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.OUTFIT_PLANNER,
    enableCaching: true,
    enableMonitoring: true
  });

  const occasions = ['casual', 'work', 'formal', 'party', 'sport', 'travel', 'date', 'business'];

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
      loadPlannedOutfits();
    }
  }, [user]);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Enhanced mapping for advanced AI
      const enhancedItems: WardrobeItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        photo_url: item.photo_url || '',
        category: item.category,
        color: item.color || [],
        style: item.style || 'casual',
        occasion: item.occasion || ['casual'],
        season: item.season || ['all'],
        tags: item.tags || [],
        silhouette: item.silhouette || 'regular',
        fit: item.fit || 'regular',
        fabric: item.fabric,
        formality_level: item.formality_level || inferFormalityLevel(item)
      }));

      setWardrobeItems(enhancedItems);
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
    }
  };

  const inferFormalityLevel = (item: any): number => {
    const name = item.name.toLowerCase();
    const category = item.category.toLowerCase();
    const style = item.style?.toLowerCase() || '';
    
    if (name.includes('formal') || name.includes('evening') || category.includes('suit')) return 9;
    if (name.includes('business') || name.includes('blazer') || style.includes('business')) return 7;
    if (name.includes('smart') || name.includes('dress shirt')) return 6;
    if (name.includes('casual') || name.includes('t-shirt') || name.includes('jeans')) return 3;
    if (name.includes('athletic') || name.includes('gym') || name.includes('sport')) return 2;
    
    return 5;
  };

  const loadPlannedOutfits = () => {
    const saved = localStorage.getItem('advancedPlannedOutfits');
    if (saved) {
      const outfits = JSON.parse(saved).map((outfit: any) => ({
        ...outfit,
        date: new Date(outfit.date)
      }));
      setPlannedOutfits(outfits);
    }
  };

  const savePlannedOutfits = (outfits: PlannedOutfit[]) => {
    localStorage.setItem('advancedPlannedOutfits', JSON.stringify(outfits));
    setPlannedOutfits(outfits);
  };

  const generateAdvancedOutfitForDate = async () => {
    if (wardrobeItems.length < 2) {
      toast({
        title: "Insufficient wardrobe data",
        description: "Add more items to enable advanced AI outfit generation.",
        variant: "destructive"
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile required",
        description: "Complete your profile for personalized advanced recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create enhanced style profile for advanced AI
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || 'casual',
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || [],
        body_type: profile.body_type,
        style_preferences: {
          formality: inferFormalityPreference(profile.preferred_style),
          boldness: profile.goals?.includes('bold') ? 8 : 5,
          minimalism: profile.goals?.includes('minimalist') ? 8 : 5
        }
      };

      console.log('Generating advanced outfit with enhanced profile:', styleProfile);

      // Use cached execution for advanced AI recommendations
      const recommendations = await executeWithCache(
        `advanced_planner_${selectedOccasion}_${selectedDate.getTime()}_${user.id}`,
        async () => advancedStyleAI.generateRecommendations(
          wardrobeItems,
          styleProfile,
          {
            occasion: selectedOccasion,
            timeOfDay: 'day',
            weather: weather || undefined
          },
          true // Include accessories for comprehensive planning
        ),
        10 * 60 * 1000 // 10 minutes cache
      );

      if (recommendations.length === 0) {
        toast({
          title: "No advanced recommendations",
          description: "The AI couldn't generate suitable outfits with current preferences. Try adjusting your criteria.",
          variant: "destructive"
        });
        return;
      }

      // Use the highest-scoring recommendation
      const bestOutfit = recommendations[0];
      setCurrentOutfit(bestOutfit.items);
      setCurrentOutfitDetails(bestOutfit);
      
      toast({
        title: "Advanced AI Outfit Generated!",
        description: `${bestOutfit.description} (${Math.round(bestOutfit.confidence * 100)}% AI confidence)`,
      });
    } catch (error) {
      console.error('Error generating advanced outfit:', error);
      toast({
        title: "Advanced generation failed",
        description: "Please try again. The AI is still learning your preferences.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const inferFormalityPreference = (style: string): number => {
    switch (style?.toLowerCase()) {
      case 'formal': return 9;
      case 'business': return 7;
      case 'smart-casual': return 6;
      case 'casual': return 4;
      case 'bohemian': return 3;
      case 'streetwear': return 2;
      default: return 5;
    }
  };

  const saveAdvancedOutfitForDate = () => {
    if (currentOutfit.length === 0) {
      toast({
        title: "No outfit to save",
        description: "Generate an advanced outfit first.",
        variant: "destructive"
      });
      return;
    }

    const newOutfit: PlannedOutfit = {
      id: Date.now().toString(),
      date: selectedDate,
      occasion: selectedOccasion,
      items: currentOutfit,
      weather: weather?.condition || 'mild',
      confidence: currentOutfitDetails?.confidence,
      reasoning: currentOutfitDetails?.reasoning,
      advanced_scores: currentOutfitDetails ? {
        style_score: currentOutfitDetails.style_score,
        color_harmony_score: currentOutfitDetails.color_harmony_score,
        weather_appropriateness: currentOutfitDetails.weather_appropriateness,
        trend_relevance: currentOutfitDetails.trend_relevance
      } : undefined
    };

    const updatedOutfits = [...plannedOutfits.filter(o => 
      o.date.toDateString() !== selectedDate.toDateString()
    ), newOutfit];

    savePlannedOutfits(updatedOutfits);
    setCurrentOutfit([]);
    setCurrentOutfitDetails(null);

    toast({
      title: "Advanced Outfit Saved!",
      description: `AI-curated outfit planned for ${selectedDate.toLocaleDateString()}.`,
    });
  };

  const generateAdvancedWeeklyOutfits = async () => {
    if (!profile) {
      toast({
        title: "Profile required",
        description: "Complete your profile for advanced weekly planning.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const startDate = new Date(selectedDate);
      const weeklyOutfits: PlannedOutfit[] = [];

      // Create enhanced style profile
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || 'casual',
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || [],
        body_type: profile.body_type,
        style_preferences: {
          formality: inferFormalityPreference(profile.preferred_style),
          boldness: profile.goals?.includes('bold') ? 8 : 5,
          minimalism: profile.goals?.includes('minimalist') ? 8 : 5
        }
      };

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Skip if advanced outfit already exists for this date
        if (getOutfitForDate(currentDate)) continue;

        // Smart occasion selection based on day
        const dayOfWeek = currentDate.getDay();
        let occasion = 'casual';
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          occasion = 'work'; // Weekdays
        } else if (dayOfWeek === 6) {
          occasion = 'casual'; // Saturday - more relaxed
        } else {
          occasion = 'casual'; // Sunday - comfortable
        }

        try {
          // Use cached execution for each day's advanced outfit
          const recommendations = await executeWithCache(
            `advanced_weekly_${occasion}_${currentDate.getTime()}_${user.id}`,
            async () => advancedStyleAI.generateRecommendations(
              wardrobeItems,
              styleProfile,
              {
                occasion,
                timeOfDay: 'day',
                weather: weather || undefined
              },
              true // Include accessories
            ),
            15 * 60 * 1000 // 15 minutes cache for weekly planning
          );

          if (recommendations.length > 0) {
            const bestOutfit = recommendations[0];
            weeklyOutfits.push({
              id: `advanced_${currentDate.getTime()}`,
              date: currentDate,
              occasion,
              items: bestOutfit.items,
              weather: weather?.condition || 'mild',
              confidence: bestOutfit.confidence,
              reasoning: bestOutfit.reasoning,
              advanced_scores: {
                style_score: bestOutfit.style_score,
                color_harmony_score: bestOutfit.color_harmony_score,
                weather_appropriateness: bestOutfit.weather_appropriateness,
                trend_relevance: bestOutfit.trend_relevance
              }
            });
          }
        } catch (error) {
          console.error(`Error generating advanced outfit for ${currentDate.toDateString()}:`, error);
          // Continue with other days even if one fails
        }
      }

      const updatedOutfits = [...plannedOutfits, ...weeklyOutfits];
      savePlannedOutfits(updatedOutfits);

      toast({
        title: "Advanced Weekly Planning Complete!",
        description: `Generated ${weeklyOutfits.length} AI-optimized outfits with style intelligence.`,
      });
    } catch (error) {
      console.error('Error generating advanced weekly outfits:', error);
      toast({
        title: "Advanced planning failed",
        description: "Please try again. The AI is optimizing your weekly style strategy.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getOutfitForDate = (date: Date): PlannedOutfit | undefined => {
    return plannedOutfits.find(outfit => 
      outfit.date.toDateString() === date.toDateString()
    );
  };

  const existingOutfit = getOutfitForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Calendar and Controls */}
        <Card className="shadow-card border-2 border-purple-100 dark:border-purple-900">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Advanced Outfit Planning</CardTitle>
                <CardDescription>AI-powered style scheduling with intelligence</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-lg border-2 border-purple-100 dark:border-purple-800"
              modifiers={{
                planned: plannedOutfits.map(o => o.date),
                advanced: plannedOutfits.filter(o => o.advanced_scores).map(o => o.date)
              }}
              modifiersStyles={{
                planned: { backgroundColor: 'hsl(var(--primary))', color: 'white' },
                advanced: { backgroundColor: 'hsl(262 83% 58%)', color: 'white', fontWeight: 'bold' }
              }}
            />
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Smart Occasion Detection</label>
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger className="border-2">
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

              <div className="space-y-3">
                <Button 
                  onClick={generateAdvancedOutfitForDate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isGenerating ? (
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Advanced AI Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Advanced Outfit
                    </div>
                  )}
                </Button>
                
                <Button 
                  onClick={generateAdvancedWeeklyOutfits}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full border-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/20"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Plan Advanced Week
                </Button>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">AI Features</span>
                </div>
                <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-0.5">
                  <li>• Color harmony optimization</li>
                  <li>• Weather-adaptive styling</li>
                  <li>• Trend relevance analysis</li>
                  <li>• Style coherence scoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Current/Generated Outfit */}
        <Card className="shadow-card border-2 border-blue-100 dark:border-blue-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  {existingOutfit ? (
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-purple-600" />
                      Advanced Planned Outfit
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                      Generated Outfit
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedDate.toLocaleDateString()} • {selectedOccasion}
                  {currentOutfitDetails && (
                    <span className="ml-2 text-xs font-semibold text-purple-600">
                      AI Confidence: {Math.round(currentOutfitDetails.confidence * 100)}%
                    </span>
                  )}
                </CardDescription>
              </div>
              {(existingOutfit?.advanced_scores || currentOutfitDetails) && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Advanced
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {existingOutfit ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {existingOutfit.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="aspect-square relative overflow-hidden rounded-xl ring-2 ring-purple-100 dark:ring-purple-900">
                      <img 
                        src={item.photo_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Advanced Scoring Display */}
                {existingOutfit.advanced_scores && (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">{Math.round(existingOutfit.advanced_scores.style_score * 100)}</div>
                      <div className="text-xs text-muted-foreground">Style</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{Math.round(existingOutfit.advanced_scores.color_harmony_score * 100)}</div>
                      <div className="text-xs text-muted-foreground">Color</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{Math.round(existingOutfit.advanced_scores.weather_appropriateness * 100)}</div>
                      <div className="text-xs text-muted-foreground">Weather</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-pink-600">{Math.round(existingOutfit.advanced_scores.trend_relevance * 100)}</div>
                      <div className="text-xs text-muted-foreground">Trend</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {existingOutfit.items.map(item => (
                    <div key={item.id} className="text-sm text-muted-foreground">
                      • {item.name}
                    </div>
                  ))}
                </div>

                {existingOutfit.reasoning && existingOutfit.reasoning.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="font-semibold flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Analysis:
                    </div>
                    {existingOutfit.reasoning.slice(0, 2).map((reason, index) => (
                      <div key={index}>• {reason}</div>
                    ))}
                  </div>
                )}

                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const updated = plannedOutfits.filter(o => o.id !== existingOutfit.id);
                    savePlannedOutfits(updated);
                  }}
                >
                  Remove Advanced Plan
                </Button>
              </div>
            ) : currentOutfit.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {currentOutfit.slice(0, 4).map((item) => (
                    <div key={item.id} className="aspect-square relative overflow-hidden rounded-xl ring-2 ring-blue-100 dark:ring-blue-900">
                      <img 
                        src={item.photo_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advanced Scoring for Current Outfit */}
                {currentOutfitDetails && (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">{Math.round(currentOutfitDetails.style_score * 100)}</div>
                      <div className="text-xs text-muted-foreground">Style</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{Math.round(currentOutfitDetails.color_harmony_score * 100)}</div>
                      <div className="text-xs text-muted-foreground">Color</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{Math.round(currentOutfitDetails.weather_appropriateness * 100)}</div>
                      <div className="text-xs text-muted-foreground">Weather</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-pink-600">{Math.round(currentOutfitDetails.trend_relevance * 100)}</div>
                      <div className="text-xs text-muted-foreground">Trend</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {currentOutfit.map(item => (
                    <div key={item.id} className="text-sm text-muted-foreground">
                      • {item.name}
                    </div>
                  ))}
                </div>

                {currentOutfitDetails?.reasoning && currentOutfitDetails.reasoning.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="font-semibold flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      Advanced AI Insights:
                    </div>
                    {currentOutfitDetails.reasoning.slice(0, 2).map((reason, index) => (
                      <div key={index}>• {reason}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={saveAdvancedOutfitForDate} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Save Advanced Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentOutfit([]);
                      setCurrentOutfitDetails(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-muted-foreground mb-2 font-medium">
                  Ready for Advanced AI Generation
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate sophisticated outfits with color theory, style intelligence & weather optimization
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Upcoming Outfits */}
        <Card className="shadow-card border-2 border-green-100 dark:border-green-900">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-green-600" />
              Advanced Planned Outfits
            </CardTitle>
            <CardDescription>
              AI-curated outfits with intelligence scoring
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {plannedOutfits
                .filter(outfit => outfit.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((outfit) => (
                  <div key={outfit.id} className="flex items-center gap-3 p-4 border-2 border-purple-100 dark:border-purple-900 rounded-xl bg-gradient-to-r from-purple-50/30 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {outfit.date.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold">
                          {outfit.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {outfit.advanced_scores && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Advanced
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {outfit.occasion} • {outfit.items.length} items
                        {outfit.confidence && (
                          <span className="ml-1 font-semibold">• {Math.round(outfit.confidence * 100)}% AI match</span>
                        )}
                      </p>
                      {outfit.advanced_scores && (
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1 rounded">
                            Style: {Math.round(outfit.advanced_scores.style_score * 100)}
                          </span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">
                            Color: {Math.round(outfit.advanced_scores.color_harmony_score * 100)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex -space-x-1">
                      {outfit.items.slice(0, 3).map((item, index) => (
                        <img
                          key={item.id}
                          src={item.photo_url}
                          alt={item.name}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                          style={{ zIndex: 3 - index }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              
              {plannedOutfits.filter(outfit => outfit.date >= new Date()).length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No advanced outfits planned</p>
                  <p className="text-xs text-muted-foreground">Generate intelligent outfit combinations above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
