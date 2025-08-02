import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Calendar as CalendarIcon,
  Heart,
  Eye,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Settings,
  AlertCircle,
  Palette,
  Clock,
  CloudSun,
  Shirt,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { usePerformance } from "@/hooks/usePerformance";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  simpleStyleAI,
  OutfitRecommendation,
  WardrobeItem,
  StyleProfile,
  WeatherData,
} from "@/lib/simpleStyleAI";
import { advancedColorTheory } from "@/lib/advancedColorTheory";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { OptimizedImage } from "./OptimizedImage";
import { getErrorMessage, logError } from "@/lib/errorUtils";
import AdvancedVirtualTryOn from "./AdvancedVirtualTryOn";

// Enhanced interface for planned outfits with color theory insights
interface EnhancedPlannedOutfit {
  id: string;
  date: Date;
  occasion: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  items: WardrobeItem[];
  weather?: WeatherData;
  notes?: string;
  confidence: number;
  reasoning: string[];
  colorHarmony: {
    type: string;
    confidence: number;
    description: string;
  };
  styleScore: number;
  seasonalAppropriate: boolean;
}

// Advanced occasion types with formality and context
const ADVANCED_OCCASIONS = {
  work: {
    label: "Professional Work",
    formality: 4,
    timePreference: ["morning", "afternoon"],
    colorPreference: "neutral",
    description: "Business meetings, office environment",
  },
  business: {
    label: "Business Meeting",
    formality: 5,
    timePreference: ["morning", "afternoon"],
    colorPreference: "sophisticated",
    description: "Important meetings, presentations",
  },
  casual: {
    label: "Casual Day",
    formality: 2,
    timePreference: ["morning", "afternoon", "evening"],
    colorPreference: "versatile",
    description: "Everyday activities, relaxed settings",
  },
  social: {
    label: "Social Gathering",
    formality: 3,
    timePreference: ["afternoon", "evening"],
    colorPreference: "expressive",
    description: "Friends meetup, casual parties",
  },
  date: {
    label: "Date Night",
    formality: 4,
    timePreference: ["evening", "night"],
    colorPreference: "romantic",
    description: "Romantic dinner, special occasions",
  },
  formal: {
    label: "Formal Event",
    formality: 5,
    timePreference: ["evening", "night"],
    colorPreference: "elegant",
    description: "Gala, wedding, formal dinner",
  },
  weekend: {
    label: "Weekend Leisure",
    formality: 1,
    timePreference: ["morning", "afternoon"],
    colorPreference: "comfortable",
    description: "Weekend errands, leisure activities",
  },
  travel: {
    label: "Travel",
    formality: 2,
    timePreference: ["morning", "afternoon"],
    colorPreference: "practical",
    description: "Airport, long journeys, comfort-focused",
  },
  creative: {
    label: "Creative Work",
    formality: 2,
    timePreference: ["morning", "afternoon", "evening"],
    colorPreference: "artistic",
    description: "Studio work, creative meetings, artistic events",
  },
  fitness: {
    label: "Fitness Activity",
    formality: 1,
    timePreference: ["morning", "afternoon", "evening"],
    colorPreference: "energetic",
    description: "Gym, yoga, outdoor activities",
  },
};

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning (6AM-12PM)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (12PM-6PM)", icon: "☀️" },
  { value: "evening", label: "Evening (6PM-10PM)", icon: "🌆" },
  { value: "night", label: "Night (10PM+)", icon: "🌙" },
];

const AdvancedStyleAssistant: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather, getWeatherAdvice, getWeatherStatus } = useWeather(profile?.location);
  const { toast } = useToast();
  const { executeWithCache, debounce } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching: true,
    enableMonitoring: true,
  });

  // Core state
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [plannedOutfits, setPlannedOutfits] = useState<EnhancedPlannedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preference state
  const [selectedOccasion, setSelectedOccasion] = useState<string>("casual");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>("afternoon");
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [colorTheoryMode, setColorTheoryMode] = useState<boolean>(true);
  const [weatherConsideration, setWeatherConsideration] = useState<boolean>(true);

  // Planning state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planningNotes, setPlanningNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // UI state
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitRecommendation | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("recommendations");

  // Load wardrobe items with enhanced validation
  const loadWardrobeItems = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `enhanced_wardrobe_${user.id}`;
      const cachedItems = PerformanceCache.get<WardrobeItem[]>(
        cacheKey,
        CACHE_NAMESPACES.WARDROBE_ITEMS,
      );

      if (cachedItems && cachedItems.length > 0) {
        setWardrobeItems(cachedItems);
        setLoading(false);
        return;
      }

      const { data: items, error: fetchError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (fetchError) {
        throw new Error(getErrorMessage(fetchError));
      }

      const enhancedItems: WardrobeItem[] = (items || [])
        .filter(item => item && item.id && item.name && item.category)
        .map((item) => ({
          id: item.id,
          name: item.name || "Unnamed Item",
          photo_url: item.photo_url || "",
          category: item.category || "other",
          color: Array.isArray(item.color) ? item.color : [],
          style: item.style || "casual",
          occasion: Array.isArray(item.occasion) ? item.occasion : ["casual"],
          season: Array.isArray(item.season) ? item.season : ["all"],
          tags: Array.isArray(item.tags) ? item.tags : [],
        }));

      setWardrobeItems(enhancedItems);

      // Cache for 15 minutes
      if (enhancedItems.length > 0) {
        PerformanceCache.set(cacheKey, enhancedItems, {
          ttl: 15 * 60 * 1000,
          namespace: CACHE_NAMESPACES.WARDROBE_ITEMS,
        });
      }
    } catch (error) {
      console.error("Error loading wardrobe items:", error);
      setError(getErrorMessage(error));
      logError(error, "Error loading wardrobe items in AdvancedStyleAssistant");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Enhanced recommendation generation with advanced color theory
  const generateAdvancedRecommendations = useCallback(async () => {
    if (!user || !profile || wardrobeItems.length === 0) return;

    try {
      setIsGenerating(true);
      setError(null);

      const occasion = ADVANCED_OCCASIONS[selectedOccasion as keyof typeof ADVANCED_OCCASIONS];
      const isTimeAppropriate = occasion?.timePreference.includes(selectedTimeOfDay);

      // Filter items based on advanced criteria
      let filteredItems = wardrobeItems.filter((item) => {
        // Basic occasion filtering
        const occasionMatch = 
          item.occasion.includes(selectedOccasion) ||
          item.occasion.includes("versatile") ||
          item.occasion.includes("casual");

        // Weather appropriateness
        const weatherMatch = !weatherConsideration || !weather || 
          isWeatherAppropriate(item, weather);

        // Time of day appropriateness
        const timeMatch = !occasion || isTimeAppropriate || 
          isTimeOfDayAppropriate(item, selectedTimeOfDay);

        return occasionMatch && weatherMatch && timeMatch;
      });

      // Apply color theory filtering if enabled
      if (colorTheoryMode && profile.color_palette_colors) {
        filteredItems = enhanceWithColorTheory(filteredItems, profile.color_palette_colors);
      }

      // Handle accessories
      if (!includeAccessories) {
        filteredItems = filteredItems.filter(
          (item) => !["accessories", "jewelry", "bags", "hats", "belts", "scarves"]
            .includes(item.category.toLowerCase())
        );
      }

      if (filteredItems.length === 0) {
        setError("No suitable items found for the selected criteria. Try adjusting your preferences.");
        setRecommendations([]);
        return;
      }

      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || "casual",
        favorite_colors: Array.isArray(profile.favorite_colors) ? profile.favorite_colors : [],
        color_palette_colors: Array.isArray(profile.color_palette_colors) ? profile.color_palette_colors : [],
        goals: Array.isArray(profile.goals) ? profile.goals : [],
      };

      const context = {
        occasion: selectedOccasion,
        timeOfDay: selectedTimeOfDay,
        weather: weatherConsideration ? weather : undefined,
      };

      // Generate recommendations with caching
      const cacheKey = `advanced_recs_${selectedOccasion}_${selectedTimeOfDay}_${includeAccessories}_${colorTheoryMode}_${user.id}`;
      
      const recs = await executeWithCache(
        cacheKey,
        async () => simpleStyleAI.generateRecommendations(
          filteredItems,
          styleProfile,
          context,
          includeAccessories,
        ),
        5 * 60 * 1000, // 5 minutes cache
      );

      // Enhance recommendations with advanced insights
      const enhancedRecs = await enhanceRecommendationsWithInsights(recs, context);
      setRecommendations(enhancedRecs);

    } catch (error) {
      console.error("Error generating advanced recommendations:", error);
      setError(getErrorMessage(error));
      logError(error, "Error generating advanced recommendations");
    } finally {
      setIsGenerating(false);
    }
  }, [
    user,
    profile,
    wardrobeItems,
    selectedOccasion,
    selectedTimeOfDay,
    includeAccessories,
    colorTheoryMode,
    weatherConsideration,
    weather,
    executeWithCache,
  ]);

  // Plan outfit for specific date
  const planOutfitForDate = useCallback(async () => {
    if (!selectedDate || recommendations.length === 0) return;

    try {
      const bestRecommendation = recommendations[0]; // Highest confidence recommendation
      
      const plannedOutfit: EnhancedPlannedOutfit = {
        id: `planned_${Date.now()}`,
        date: selectedDate,
        occasion: selectedOccasion,
        timeOfDay: selectedTimeOfDay as any,
        items: bestRecommendation.items,
        weather: weather || undefined,
        notes: planningNotes,
        confidence: bestRecommendation.confidence,
        reasoning: bestRecommendation.reasoning,
        colorHarmony: await analyzeColorHarmony(bestRecommendation.items),
        styleScore: calculateStyleScore(bestRecommendation.items),
        seasonalAppropriate: isSeasonallyAppropriate(bestRecommendation.items),
      };

      setPlannedOutfits(prev => [...prev, plannedOutfit]);
      setPlanningNotes("");
      
      toast({
        title: "Outfit Planned!",
        description: `Successfully planned outfit for ${selectedDate.toDateString()}`,
      });

    } catch (error) {
      console.error("Error planning outfit:", error);
      toast({
        title: "Planning Failed",
        description: "Failed to plan outfit. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedDate, recommendations, selectedOccasion, selectedTimeOfDay, planningNotes, weather, toast]);

  // Helper functions for advanced logic
  const isWeatherAppropriate = (item: WardrobeItem, weather: WeatherData): boolean => {
    if (weather.temperature < 10) {
      return !item.tags?.includes("summer") && !item.tags?.includes("light");
    } else if (weather.temperature > 25) {
      return item.category !== "outerwear" && !item.tags?.includes("heavy");
    }
    return true;
  };

  const isTimeOfDayAppropriate = (item: WardrobeItem, timeOfDay: string): boolean => {
    if (timeOfDay === "evening" || timeOfDay === "night") {
      return !item.tags?.includes("casual-only") && item.style !== "sporty";
    }
    return true;
  };

  const enhanceWithColorTheory = (items: WardrobeItem[], userPalette: string[]): WardrobeItem[] => {
    return items.filter(item => {
      const itemColors = item.color;
      return itemColors.some(color => 
        userPalette.some(paletteColor => 
          advancedColorTheory.analyzeColorHarmony([color], [paletteColor]).isHarmonious
        )
      );
    });
  };

  const enhanceRecommendationsWithInsights = async (
    recs: OutfitRecommendation[],
    context: any
  ): Promise<OutfitRecommendation[]> => {
    return recs.map(rec => ({
      ...rec,
      reasoning: [
        ...rec.reasoning,
        ...generateAdvancedReasoning(rec, context),
      ],
    }));
  };

  const generateAdvancedReasoning = (rec: OutfitRecommendation, context: any): string[] => {
    const reasoning: string[] = [];
    
    // Color theory insights
    const colors = rec.items.flatMap(item => item.color);
    const harmony = advancedColorTheory.findBestHarmony(colors);
    if (harmony.confidence > 0.7) {
      reasoning.push(`Excellent ${harmony.harmonyType} color harmony`);
    }

    // Occasion-specific insights
    const occasion = ADVANCED_OCCASIONS[context.occasion as keyof typeof ADVANCED_OCCASIONS];
    if (occasion) {
      reasoning.push(`Perfect formality level for ${occasion.label.toLowerCase()}`);
    }

    // Seasonal insights
    const season = getCurrentSeason();
    const seasonalColors = getSeasonalPalette(season);
    const seasonalMatch = colors.some(color => seasonalColors.includes(color));
    if (seasonalMatch) {
      reasoning.push(`Seasonal color palette for ${season}`);
    }

    return reasoning;
  };

  const analyzeColorHarmony = async (items: WardrobeItem[]) => {
    const colors = items.flatMap(item => item.color);
    const harmony = advancedColorTheory.findBestHarmony(colors);
    return {
      type: harmony.harmonyType,
      confidence: harmony.confidence,
      description: harmony.reasoning || "Color analysis complete",
    };
  };

  const calculateStyleScore = (items: WardrobeItem[]): number => {
    // Complex style scoring based on coherence, appropriateness, and aesthetic appeal
    const styles = items.map(item => item.style);
    const uniqueStyles = new Set(styles);
    const coherenceScore = uniqueStyles.size <= 2 ? 0.9 : 0.6;
    return coherenceScore;
  };

  const isSeasonallyAppropriate = (items: WardrobeItem[]): boolean => {
    const currentSeason = getCurrentSeason();
    return items.some(item => 
      item.season.includes(currentSeason) || item.season.includes("all")
    );
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  };

  const getSeasonalPalette = (season: string): string[] => {
    const palettes = {
      spring: ["coral", "peach", "yellow", "lime", "turquoise"],
      summer: ["lavender", "rose", "sage", "powder blue", "mint"],
      autumn: ["rust", "burgundy", "forest", "gold", "brown"],
      winter: ["navy", "black", "white", "crimson", "emerald"],
    };
    return palettes[season as keyof typeof palettes] || [];
  };

  // Initialize data loading
  useEffect(() => {
    if (user && profile) {
      loadWardrobeItems();
    }
  }, [user, profile, loadWardrobeItems]);

  // Generate recommendations when preferences change
  const debouncedGenerateRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    if (debounce) {
      debouncedGenerateRef.current = debounce(generateAdvancedRecommendations, 500);
    }

    return () => {
      if (debouncedGenerateRef.current && typeof debouncedGenerateRef.current.cancel === "function") {
        debouncedGenerateRef.current.cancel();
      }
    };
  }, [debounce, generateAdvancedRecommendations]);

  useEffect(() => {
    if (wardrobeItems.length > 0 && debouncedGenerateRef.current) {
      debouncedGenerateRef.current();
    }
  }, [wardrobeItems, selectedOccasion, selectedTimeOfDay, includeAccessories, colorTheoryMode, weatherConsideration]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">Loading Advanced Style Assistant...</h3>
            <p className="text-muted-foreground">Analyzing your wardrobe with AI and color theory</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && wardrobeItems.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Style Assistant</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadWardrobeItems} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const availableOccasions = Object.keys(ADVANCED_OCCASIONS);

  return (
    <div className="space-y-6">
      {/* Advanced Preferences Panel */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Advanced Style Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Occasion Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Occasion
              </Label>
              <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOccasions.map((occasion) => {
                    const info = ADVANCED_OCCASIONS[occasion as keyof typeof ADVANCED_OCCASIONS];
                    return (
                      <SelectItem key={occasion} value={occasion}>
                        <div className="flex flex-col">
                          <span>{info.label}</span>
                          <span className="text-xs text-muted-foreground">{info.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Time of Day */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time of Day
              </Label>
              <Select value={selectedTimeOfDay} onValueChange={setSelectedTimeOfDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OF_DAY_OPTIONS.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.icon} {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="accessories"
                  checked={includeAccessories}
                  onCheckedChange={setIncludeAccessories}
                />
                <Label htmlFor="accessories" className="flex items-center gap-2">
                  Include Accessories
                  {wardrobeItems.some(item => 
                    ["accessories", "jewelry", "bags", "hats", "belts", "scarves"]
                      .includes(item.category.toLowerCase())
                  ) && (
                    <Badge variant="secondary" className="text-xs">
                      {wardrobeItems.filter(item => 
                        ["accessories", "jewelry", "bags", "hats", "belts", "scarves"]
                          .includes(item.category.toLowerCase())
                      ).length} available
                    </Badge>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="colorTheory"
                  checked={colorTheoryMode}
                  onCheckedChange={setColorTheoryMode}
                />
                <Label htmlFor="colorTheory" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Advanced Color Theory
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="weather"
                  checked={weatherConsideration}
                  onCheckedChange={setWeatherConsideration}
                />
                <Label htmlFor="weather" className="flex items-center gap-2">
                  <CloudSun className="h-4 w-4" />
                  Weather-Aware
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Context */}
      {weather && weatherConsideration && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudSun className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Weather-Optimized Styling
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    {weather.description} • {Math.round(weather.temperature)}°C
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getWeatherAdvice?.(weather) || "Weather considered"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-card border rounded-xl p-1">
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2 h-12 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">AI Recommendations</span>
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className="flex items-center gap-2 h-12 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium">Outfit Planning</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading">Advanced AI Recommendations</h2>
            <Button
              onClick={generateAdvancedRecommendations}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate New
            </Button>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span>Generating advanced recommendations with color theory...</span>
              </div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isGenerating && recommendations.length === 0 && !error && (
            <Card className="text-center p-8">
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate Recommendations</h3>
              <p className="text-muted-foreground mb-4">
                Adjust your preferences above and click "Generate New" to get advanced AI recommendations.
              </p>
            </Card>
          )}

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((outfit, index) => (
              <Card key={outfit.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{outfit.description}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(outfit.confidence * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Perfect for {outfit.occasion} • {selectedTimeOfDay}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Outfit Items Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {outfit.items.map((item) => (
                      <div key={item.id} className="relative group/item">
                        <OptimizedImage
                          src={item.photo_url}
                          alt={item.name}
                          className="aspect-square rounded-lg object-cover"
                          lazy={true}
                          width={150}
                          height={150}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors rounded-lg" />
                        <div className="absolute bottom-1 left-1 right-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advanced Insights */}
                  <div className="space-y-2">
                    {outfit.reasoning.slice(0, 3).map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOutfit(outfit);
                          setShowTryOn(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Auto-select this outfit for planning
                        setActiveTab("planning");
                      }}
                      className="text-xs"
                    >
                      Plan This
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Outfit Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Planning Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Plan Your Outfit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add notes about the event, weather expectations, or specific requirements..."
                    value={planningNotes}
                    onChange={(e) => setPlanningNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={planOutfitForDate}
                  disabled={recommendations.length === 0}
                  className="w-full"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Plan Best Recommendation
                </Button>
              </CardContent>
            </Card>

            {/* Planned Outfits List */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Planned Outfits</CardTitle>
              </CardHeader>
              <CardContent>
                {plannedOutfits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No planned outfits yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plannedOutfits
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .slice(0, 5)
                      .map((planned) => (
                        <div
                          key={planned.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {planned.date.toDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {ADVANCED_OCCASIONS[planned.occasion as keyof typeof ADVANCED_OCCASIONS]?.label} • {planned.timeOfDay}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(planned.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          
                          {planned.colorHarmony && (
                            <div className="flex items-center gap-2 text-xs">
                              <Palette className="h-3 w-3 text-purple-500" />
                              <span>{planned.colorHarmony.type} harmony ({Math.round(planned.colorHarmony.confidence * 100)}%)</span>
                            </div>
                          )}
                          
                          <div className="flex gap-1">
                            {planned.items.slice(0, 4).map((item) => (
                              <div key={item.id} className="w-8 h-8 rounded overflow-hidden">
                                <OptimizedImage
                                  src={item.photo_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  width={32}
                                  height={32}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {planned.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              "{planned.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Virtual Try-On Modal */}
      {showTryOn && selectedOutfit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advanced Virtual Try-On</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTryOn(false)}
              >
                ×
              </Button>
            </div>
            <AdvancedVirtualTryOn
              clothingImg={selectedOutfit.items[0]?.photo_url || ""}
              clothingType="auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStyleAssistant;
