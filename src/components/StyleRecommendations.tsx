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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Heart,
  Eye,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  simpleStyleAI,
  OutfitRecommendation,
  WardrobeItem,
  StyleProfile,
} from "@/lib/simpleStyleAI";
import AdvancedVirtualTryOn from "./AdvancedVirtualTryOn";
import { useWeather } from "@/hooks/useWeather";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { OptimizedImage } from "./OptimizedImage";
import { getErrorMessage, logError } from "@/lib/errorUtils";

// Add safety check for the AI module
const safeStyleAI = simpleStyleAI || {
  generateRecommendations: () => {
    console.warn("StyleAI not available, returning empty recommendations");
    return [];
  }
};

// Enhanced color harmony detection with advanced color theory
const isColorHarmonious = (color1: string, color2: string): boolean => {
  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();

  // Neutral colors work with everything
  const neutrals = ["black", "white", "grey", "gray", "beige", "cream", "ivory", "charcoal", "stone"];
  if (neutrals.some(n => c1.includes(n)) || neutrals.some(n => c2.includes(n))) {
    return true;
  }

  // Advanced complementary pairs with variations
  const complementaryPairs = [
    ["red", "green"], ["crimson", "emerald"], ["burgundy", "forest"],
    ["blue", "orange"], ["navy", "coral"], ["royal", "peach"],
    ["yellow", "purple"], ["gold", "violet"], ["mustard", "lavender"],
    ["pink", "sage"], ["rose", "mint"], ["blush", "seafoam"],
    ["teal", "coral"], ["turquoise", "salmon"], ["aqua", "apricot"]
  ];

  // Analogous color families with more variations
  const analogousFamilies = [
    ["red", "orange", "pink", "coral", "salmon", "crimson", "burgundy"],
    ["blue", "teal", "turquoise", "navy", "royal", "cerulean", "sky"],
    ["green", "emerald", "forest", "sage", "mint", "olive", "lime"],
    ["yellow", "gold", "mustard", "amber", "cream", "butter", "lemon"],
    ["purple", "violet", "lavender", "plum", "magenta", "lilac", "mauve"],
    ["brown", "tan", "beige", "camel", "coffee", "chocolate", "rust"]
  ];

  // Monochromatic variations (same hue, different saturation/brightness)
  const monochromaticFamilies = [
    ["light", "pale", "soft", "pastel"], // Light variations
    ["dark", "deep", "rich", "intense"], // Dark variations
    ["bright", "vivid", "bold", "electric"], // Bright variations
    ["muted", "dusty", "faded", "vintage"] // Muted variations
  ];

  // Check complementary harmony
  for (const [comp1, comp2] of complementaryPairs) {
    if ((c1.includes(comp1) && c2.includes(comp2)) || (c1.includes(comp2) && c2.includes(comp1))) {
      return true;
    }
  }

  // Check analogous harmony
  for (const family of analogousFamilies) {
    if (family.some(f => c1.includes(f)) && family.some(f => c2.includes(f))) {
      return true;
    }
  }

  // Check monochromatic harmony (same base color with different tones)
  for (const family of analogousFamilies) {
    const baseColor1 = family.find(f => c1.includes(f));
    const baseColor2 = family.find(f => c2.includes(f));
    if (baseColor1 && baseColor2 && baseColor1 === baseColor2) {
      return true;
    }
  }

  // Check triadic harmony (evenly spaced colors)
  const triadicSets = [
    ["red", "blue", "yellow"],
    ["orange", "green", "purple"],
    ["pink", "teal", "gold"],
    ["coral", "navy", "cream"]
  ];

  for (const set of triadicSets) {
    if (set.some(s => c1.includes(s)) && set.some(s => c2.includes(s))) {
      return true;
    }
  }

  return false;
};

// Get current season for season-aware recommendations
const getCurrentSeason = (): string => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
};

// Enhanced seasonal color palettes
const getSeasonalColors = (season: string): string[] => {
  const seasonalPalettes = {
    spring: ["coral", "peach", "yellow", "lime", "turquoise", "pink", "lavender", "mint"],
    summer: ["sage", "powder blue", "rose", "pearl", "champagne", "blush", "mauve", "seafoam"],
    autumn: ["rust", "burgundy", "forest", "gold", "brown", "orange", "olive", "bronze"],
    winter: ["navy", "black", "white", "crimson", "emerald", "royal purple", "silver", "charcoal"]
  };
  return seasonalPalettes[season as keyof typeof seasonalPalettes] || [];
};

// Calculate color compatibility score (0-1)
const calculateColorCompatibilityScore = (itemColors: string[], userColors: string[]): number => {
  let score = 0;
  let maxScore = 0;

  for (const itemColor of itemColors) {
    for (const userColor of userColors) {
      maxScore += 1;

      // Exact match
      if (itemColor.toLowerCase().includes(userColor.toLowerCase()) ||
          userColor.toLowerCase().includes(itemColor.toLowerCase())) {
        score += 1;
      }
      // Harmonious colors
      else if (isColorHarmonious(itemColor, userColor)) {
        score += 0.8;
      }
      // Same color family
      else if (areInSameColorFamily(itemColor, userColor)) {
        score += 0.6;
      }
    }
  }

  return maxScore > 0 ? score / maxScore : 0;
};

// Check if colors are in the same color family
const areInSameColorFamily = (color1: string, color2: string): boolean => {
  const colorFamilies = [
    ["red", "pink", "coral", "rose", "crimson", "burgundy", "salmon"],
    ["blue", "navy", "royal", "sky", "powder", "cerulean", "turquoise"],
    ["green", "emerald", "forest", "sage", "mint", "lime", "olive"],
    ["yellow", "gold", "mustard", "lemon", "cream", "butter", "amber"],
    ["purple", "violet", "lavender", "plum", "magenta", "lilac", "mauve"],
    ["brown", "tan", "beige", "camel", "coffee", "chocolate", "rust"]
  ];

  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();

  return colorFamilies.some(family =>
    family.some(f => c1.includes(f)) && family.some(f => c2.includes(f))
  );
};

const StyleRecommendations: React.FC = () => {
  // Add defensive checks for hooks
  const authHook = useAuth();
  const profileHook = useProfile();

  // Safely destructure with fallbacks
  const user = authHook?.user || null;
  const profile = profileHook?.profile || null;
  // Add defensive check for weather hook
  const weatherHook = useWeather(profile?.location);
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
    showManualEntry,
    setManualWeatherEntry,
    retryAutomaticWeather,
  } = weatherHook || {};
  const [recommendations, setRecommendations] = useState<
    OutfitRecommendation[]
  >([]);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] =
    useState<OutfitRecommendation | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  // User preferences state
  const [selectedOccasion, setSelectedOccasion] = useState<string>("casual");
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [showPreferences, setShowPreferences] = useState<boolean>(true);

  // Get unique occasions from wardrobe items
  const [availableOccasions, setAvailableOccasions] = useState<string[]>([]);

  // Performance optimization with defensive check
  const performanceHook = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching: true,
    enableMonitoring: true,
  });
  const { executeWithCache, debounce } = performanceHook || {};

  useEffect(() => {
    if (user && profile) {
      loadWardrobeItems();
    } else if (user && !profile) {
      setError("Profile not found. Please complete your profile setup.");
      setLoading(false);
    } else {
      setError("Please sign in to get style recommendations.");
      setLoading(false);
    }
  }, [user, profile]);

  const loadWardrobeItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log("Loading wardrobe items for user:", user.id);

      // Use cached wardrobe items if available
      const cacheKey = `wardrobe_items_${user.id}`;
      const cachedItems = PerformanceCache.get<WardrobeItem[]>(
        cacheKey,
        CACHE_NAMESPACES.WARDROBE_ITEMS,
      );

      if (cachedItems && Array.isArray(cachedItems) && cachedItems.length > 0) {
        try {
          setWardrobeItems(cachedItems);
          extractOccasions(cachedItems);
          setLoading(false);
          return;
        } catch (cacheError) {
          console.warn("Error using cached items:", cacheError);
          // Continue with fresh fetch
        }
      }

      const { data: items, error: fetchError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (fetchError) {
        const errorMessage = getErrorMessage(fetchError);
        logError(fetchError, "Error fetching wardrobe items in StyleRecommendations");
        throw new Error(
          `Failed to load your wardrobe items: ${errorMessage}`,
        );
      }

      console.log("Fetched wardrobe items:", items);

      if (!items || !Array.isArray(items)) {
        console.warn("No wardrobe items found or invalid response:", items);
        setWardrobeItems([]);
        setAvailableOccasions(["casual"]);
        return;
      }

      // Validate and sanitize items
      const mappedItems: WardrobeItem[] = items
        .filter((item) => {
          if (!item || !item.id || !item.name || !item.category) {
            console.warn("Invalid wardrobe item:", item);
            return false;
          }
          return true;
        })
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

      setWardrobeItems(mappedItems);
      extractOccasions(mappedItems);

      // Cache wardrobe items for 10 minutes
      if (mappedItems.length > 0) {
        try {
          PerformanceCache.set(cacheKey, mappedItems, {
            ttl: 10 * 60 * 1000,
            namespace: CACHE_NAMESPACES.WARDROBE_ITEMS,
          });
        } catch (cacheError) {
          console.warn("Error caching wardrobe items:", cacheError);
        }
      }
    } catch (error) {
      console.error("Error loading wardrobe items:", error);
      const errorMessage = getErrorMessage(error);
      logError(error, "Error loading wardrobe items in StyleRecommendations component");
      setError(errorMessage);
      setWardrobeItems([]);
      setAvailableOccasions(["casual"]);
    } finally {
      setLoading(false);
    }
  };

  const extractOccasions = (items: WardrobeItem[]) => {
    const occasions = new Set<string>();
    items.forEach((item) => {
      item.occasion.forEach((occ) => occasions.add(occ));
    });
    setAvailableOccasions(Array.from(occasions).sort());

    // Set default occasion if available
    if (occasions.size > 0 && !occasions.has(selectedOccasion)) {
      setSelectedOccasion(Array.from(occasions)[0]);
    }
  };

  const loadRecommendations = useCallback(async () => {
    if (!user || !profile || wardrobeItems.length === 0) {
      console.info(
        "Cannot generate recommendations: missing user, profile, or wardrobe items",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        "Generating recommendations for occasion:",
        selectedOccasion,
        "with accessories:",
        includeAccessories,
      );

      // Validate inputs
      if (!selectedOccasion || typeof selectedOccasion !== "string") {
        throw new Error("Invalid occasion selected");
      }

      if (!Array.isArray(wardrobeItems) || wardrobeItems.length === 0) {
        throw new Error("No wardrobe items available for recommendations");
      }

      // STEP 1: Filter by OCCASION first (primary filter)
      console.log("Step 1: Filtering by occasion:", selectedOccasion);
      let occasionFilteredItems = wardrobeItems.filter((item) => {
        // Exact occasion match gets priority
        if (item.occasion.includes(selectedOccasion)) {
          return true;
        }
        // Versatile items work for most occasions
        if (item.occasion.includes("versatile")) {
          return true;
        }
        // Casual items can work for some other occasions
        if (selectedOccasion !== "formal" && selectedOccasion !== "business" && item.occasion.includes("casual")) {
          return true;
        }
        return false;
      });

      console.log(`Occasion filter: ${occasionFilteredItems.length} items from ${wardrobeItems.length} total`);

      // STEP 2: Handle accessories based on user preference
      if (!includeAccessories) {
        occasionFilteredItems = occasionFilteredItems.filter(
          (item) =>
            ![
              "accessories",
              "jewelry",
              "bags",
              "hats",
              "belts",
              "scarves",
            ].includes(item.category.toLowerCase()),
        );
      }

      // STEP 3: Advanced color prioritization with scoring and seasonal awareness
      let colorPrioritizedItems = occasionFilteredItems;
      const currentSeason = getCurrentSeason();
      const seasonalColors = getSeasonalColors(currentSeason);

      console.log(`Step 2: Advanced color prioritization for ${currentSeason} season`);

      if (profile.favorite_colors && profile.favorite_colors.length > 0) {
        console.log("Prioritizing color compatibility with favorite colors:", profile.favorite_colors);

        // Calculate comprehensive color scores for each item
        const itemsWithColorScores = occasionFilteredItems.map((item) => {
          let colorScore = 0;

          // Score based on favorite colors compatibility
          const favoriteColorScore = calculateColorCompatibilityScore(item.color, profile.favorite_colors!);
          colorScore += favoriteColorScore * 0.4; // 40% weight

          // Score based on color palette colors (from profile analysis)
          if (profile.color_palette_colors && profile.color_palette_colors.length > 0) {
            const paletteScore = calculateColorCompatibilityScore(item.color, profile.color_palette_colors);
            colorScore += paletteScore * 0.3; // 30% weight
          }

          // Score based on seasonal appropriateness
          const seasonalScore = calculateColorCompatibilityScore(item.color, seasonalColors);
          colorScore += seasonalScore * 0.2; // 20% weight

          // Score based on versatility (neutral colors)
          const neutralColors = ["black", "white", "grey", "gray", "beige", "navy", "brown", "cream", "charcoal"];
          const neutralScore = item.color.some(color =>
            neutralColors.some(neutral => color.toLowerCase().includes(neutral))
          ) ? 1 : 0;
          colorScore += neutralScore * 0.1; // 10% weight

          return { item, colorScore };
        });

        // Sort by color score (highest first) and extract items
        colorPrioritizedItems = itemsWithColorScores
          .sort((a, b) => b.colorScore - a.colorScore)
          .map(({ item }) => item);

        // Log color score distribution for debugging
        const highScoreItems = itemsWithColorScores.filter(({ colorScore }) => colorScore > 0.7).length;
        const mediumScoreItems = itemsWithColorScores.filter(({ colorScore }) => colorScore > 0.4 && colorScore <= 0.7).length;
        const lowScoreItems = itemsWithColorScores.filter(({ colorScore }) => colorScore <= 0.4).length;

        console.log(`Color scores: ${highScoreItems} high (>0.7), ${mediumScoreItems} medium (0.4-0.7), ${lowScoreItems} low (≤0.4)`);
      } else {
        // If no favorite colors, just prioritize seasonal and neutral colors
        const itemsWithSeasonalScores = occasionFilteredItems.map((item) => {
          const seasonalScore = calculateColorCompatibilityScore(item.color, seasonalColors);
          const neutralColors = ["black", "white", "grey", "gray", "beige", "navy", "brown", "cream"];
          const neutralScore = item.color.some(color =>
            neutralColors.some(neutral => color.toLowerCase().includes(neutral))
          ) ? 0.5 : 0;

          return { item, score: seasonalScore + neutralScore };
        });

        colorPrioritizedItems = itemsWithSeasonalScores
          .sort((a, b) => b.score - a.score)
          .map(({ item }) => item);

        console.log("No favorite colors found, prioritizing seasonal and neutral colors");
      }

      let filteredItems = colorPrioritizedItems;

      console.log("Filtered items for recommendations:", filteredItems);

      if (filteredItems.length === 0) {
        console.info("No items found for selected preferences");
        setRecommendations([]);
        setError(
          "No suitable items found for the selected occasion. Try adjusting your preferences or adding more items to your wardrobe.",
        );
        setLoading(false);
        return;
      }

      if (filteredItems.length < 2) {
        console.warn("Limited items available for outfit generation");
        setError(
          "Limited wardrobe items available. Add more items for better recommendations.",
        );
      }

      // Create and validate style profile
      if (!profile.id || !profile.preferred_style) {
        throw new Error(
          "Invalid user profile. Please complete your profile setup.",
        );
      }

      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || "casual",
        favorite_colors: Array.isArray(profile.favorite_colors)
          ? profile.favorite_colors
          : [],
        color_palette_colors: Array.isArray(profile.color_palette_colors)
          ? profile.color_palette_colors
          : [],
        goals: Array.isArray(profile.goals) ? profile.goals : [],
      };

      console.log(
        "Generating recommendations with profile:",
        styleProfile,
        "occasion:",
        selectedOccasion,
      );

      // Use cached execution for recommendations with fallback
      const generateRecommendations = async () =>
        safeStyleAI.generateRecommendations(
          filteredItems,
          styleProfile,
          {
            occasion: selectedOccasion,
            timeOfDay: "day",
            weather: weather || undefined,
            prioritizeColors: true, // Flag to prioritize color matching
          },
          includeAccessories,
        );

      const recs = executeWithCache
        ? await executeWithCache(
            `recommendations_${selectedOccasion}_${includeAccessories}_${user.id}`,
            generateRecommendations,
            5 * 60 * 1000, // 5 minutes cache
          )
        : await generateRecommendations();

      console.log("Generated recommendations:", recs);

      if (!Array.isArray(recs)) {
        throw new Error("Invalid recommendation response format");
      }

      if (recs.length === 0) {
        setError(
          "No outfit recommendations could be generated with your current wardrobe. Try adding more items or adjusting your preferences.",
        );
      }

      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      const errorMessage = getErrorMessage(error);
      logError(error, "Error generating recommendations in StyleRecommendations component");
      setError(errorMessage);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    profile,
    wardrobeItems,
    selectedOccasion,
    includeAccessories,
    weather,
    executeWithCache,
  ]);

  // Debounced recommendation loading with stable reference
  const debouncedLoadRecommendationsRef = useRef<
    ((() => void) & { cancel?: () => void }) | null
  >(null);

  useEffect(() => {
    debouncedLoadRecommendationsRef.current = debounce
      ? debounce(loadRecommendations, 500)
      : loadRecommendations;

    // Cleanup function
    return () => {
      if (
        debouncedLoadRecommendationsRef.current &&
        typeof debouncedLoadRecommendationsRef.current.cancel === "function"
      ) {
        debouncedLoadRecommendationsRef.current.cancel();
      }
    };
  }, [debounce, loadRecommendations]);

  useEffect(() => {
    if (wardrobeItems.length > 0 && debouncedLoadRecommendationsRef.current) {
      try {
        debouncedLoadRecommendationsRef.current();
      } catch (error) {
        console.error("Error calling debounced function:", error);
      }
    }
  }, [wardrobeItems, selectedOccasion, includeAccessories, weather]);

  const handleTryOn = (outfit: OutfitRecommendation) => {
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  const handleLike = async (outfitId: string) => {
    if (!user) return;

    try {
      const outfit = recommendations.find((r) => r.id === outfitId);
      if (!outfit) return;

      const { error } = await supabase.from("outfit_feedback").insert({
        user_id: user.id,
        feedback: "like",
        outfit_item_ids: outfit.items.map((i) => i.id),
      });

      if (error) {
        console.error("Error saving feedback:", error);
      } else {
        console.log("Outfit feedback saved successfully");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  // Early return for safety if hooks are not properly initialized
  if (!authHook || !profileHook || !weatherHook || !performanceHook) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">
              Initializing style assistant...
            </h3>
            <p className="text-muted-foreground">
              Setting up components
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && wardrobeItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">
              Loading your style assistant...
            </h3>
            <p className="text-muted-foreground">
              Analyzing your wardrobe and preferences
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load Recommendations
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadWardrobeItems} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Preferences Panel */}
      {showPreferences && (
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Style Preferences</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Select
                  value={selectedOccasion}
                  onValueChange={setSelectedOccasion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOccasions.map((occasion) => (
                      <SelectItem key={occasion} value={occasion}>
                        {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="accessories"
                  checked={includeAccessories}
                  onCheckedChange={setIncludeAccessories}
                />
                <Label htmlFor="accessories" className="flex items-center gap-2">
                  Include Accessories
                  {wardrobeItems.some(item => ["accessories", "jewelry", "bags", "hats", "belts", "scarves"].includes(item.category.toLowerCase())) && (
                    <Badge variant="secondary" className="text-xs">
                      {wardrobeItems.filter(item => ["accessories", "jewelry", "bags", "hats", "belts", "scarves"].includes(item.category.toLowerCase())).length} available
                    </Badge>
                  )}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Weather Integration */}
      {weather && (
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Weather-Aware Styling</p>
                  <p className="text-xs text-muted-foreground">
                    {weather.description} ��� {Math.round(weather.temperature)}°C
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{getWeatherAdvice?.(weather) || "Weather info"}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accessory Suggestions when disabled */}
      {!includeAccessories && wardrobeItems.some(item => ["accessories", "jewelry", "bags", "hats", "belts", "scarves"].includes(item.category.toLowerCase())) && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Accessory Suggestions Available
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-200">
                  You have {wardrobeItems.filter(item => ["accessories", "jewelry", "bags", "hats", "belts", "scarves"].includes(item.category.toLowerCase())).length} accessories that could complement these outfits. Enable "Include Accessories" to see them in your recommendations.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
                onClick={() => setIncludeAccessories(true)}
              >
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading">AI Style Recommendations</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span>Generating your perfect outfits...</span>
            </div>
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No Recommendations Available
            </h3>
            <p className="text-muted-foreground mb-4">
              We couldn't generate outfit recommendations with your current
              settings. This might be because:
            </p>
            <div className="text-left space-y-2 mb-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  You need more clothing items in your wardrobe (
                  {wardrobeItems.length} items currently)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Try selecting "casual" occasion as it's more flexible
                </span>
              </div>
              {wardrobeItems.some(item => ["accessories", "jewelry", "bags", "hats", "belts", "scarves"].includes(item.category.toLowerCase())) && !includeAccessories && (
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Enable "Include Accessories" - you have accessories that could complete your outfits
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Add items in different categories (tops, bottoms, shoes)
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setShowPreferences(true)}
                variant="outline"
              >
                Adjust Preferences
              </Button>
              <Button onClick={loadRecommendations}>Try Again</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((outfit, index) => (
            <Card
              key={outfit.id}
              className="group hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {outfit.description}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(outfit.confidence * 100)}% match
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect for {outfit.occasion} occasions
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Outfit Items Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {outfit.items.map((item, itemIndex) => (
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

                {/* Outfit Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLike(outfit.id)}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTryOn(outfit)}
                      title="Try this outfit on your photo"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {outfit.reasoning.slice(0, 2).map((reason, reasonIndex) => (
                      <Badge
                        key={reasonIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Virtual Try-On Modal */}
      {showTryOn && selectedOutfit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Virtual Try-On</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTryOn(false)}
              >
                ×
              </Button>
            </div>
            <div className="mb-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload your full body photo to see how this outfit looks on
                  you. The clothing items are already selected from your
                  recommendations.
                </AlertDescription>
              </Alert>
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

// Ensure proper default export for dynamic imports
export { StyleRecommendations };
export default StyleRecommendations;
