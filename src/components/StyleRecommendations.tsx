import React, { useState, useEffect } from "react";
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

export const StyleRecommendations = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    weather,
    loading: weatherLoading,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
  } = useWeather();
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
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(true);

  // Get unique occasions from wardrobe items
  const [availableOccasions, setAvailableOccasions] = useState<string[]>([]);

  // Performance optimization
  const { executeWithCache, debounce } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching: true,
    enableMonitoring: true,
  });

  useEffect(() => {
    if (user && profile) {
      loadWardrobeItems();
      // Fetch weather for user's location if available
      if (profile.location) {
        fetchWeather(profile.location);
      } else {
        fetchWeather(); // Use default location
      }
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
        console.error("Error fetching wardrobe items:", fetchError);
        throw new Error(
          `Failed to load your wardrobe items: ${fetchError.message}`,
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load wardrobe items";
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

  const loadRecommendations = async () => {
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

      // Filter items based on user preferences
      let filteredItems = wardrobeItems.filter(
        (item) =>
          item.occasion.includes(selectedOccasion) ||
          item.occasion.includes("casual"), // Always include casual items as they're versatile
      );

      // Handle accessories based on user preference
      if (!includeAccessories) {
        filteredItems = filteredItems.filter(
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
        goals: Array.isArray(profile.goals) ? profile.goals : [],
      };

      console.log(
        "Generating recommendations with profile:",
        styleProfile,
        "occasion:",
        selectedOccasion,
      );

      // Use cached execution for recommendations
      const recs = await executeWithCache(
        `recommendations_${selectedOccasion}_${includeAccessories}_${user.id}`,
        async () =>
          simpleStyleAI.generateRecommendations(
            filteredItems,
            styleProfile,
            {
              occasion: selectedOccasion,
              timeOfDay: "day",
              weather: weather || undefined,
            },
            includeAccessories,
          ),
        5 * 60 * 1000, // 5 minutes cache
      );

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
      let errorMessage = "Failed to generate recommendations";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setError(errorMessage);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced recommendation loading
  const debouncedLoadRecommendations = useMemo(() => {
    return debounce(loadRecommendations, 500);
  }, [debounce, loadRecommendations]);

  useEffect(() => {
    if (wardrobeItems.length > 0) {
      debouncedLoadRecommendations();
    }
  }, [
    wardrobeItems,
    selectedOccasion,
    includeAccessories,
    weather,
    debouncedLoadRecommendations,
  ]);

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
                <Label htmlFor="accessories">Include Accessories</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Integration */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Weather-Aware Styling</p>
                {weather ? (
                  <p className="text-xs text-muted-foreground">
                    {weather.description} • {Math.round(weather.temperature)}°C
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {getWeatherStatus()}
                  </p>
                )}
              </div>
            </div>
            {weather ? (
              <Badge variant="secondary">{getWeatherAdvice(weather)}</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Weather unavailable
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

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
              Try adjusting your preferences or add more items to your wardrobe.
            </p>
            <Button onClick={() => setShowPreferences(true)}>
              Adjust Preferences
            </Button>
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
