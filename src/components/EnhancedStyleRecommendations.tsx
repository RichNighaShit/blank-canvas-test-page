import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Heart,
  Eye,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Settings,
  AlertCircle,
  Star,
  TrendingUp,
  Palette,
  Zap,
  Crown,
  Filter,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Share2,
  Save,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { supabase } from "@/integrations/supabase/client";
import { WardrobeItem, WeatherData } from "@/lib/simpleStyleAI";
import {
  enhancedStyleAI,
  EnhancedStyleProfile,
  EnhancedOutfitRecommendation,
  StyleContext,
} from "@/lib/enhancedStyleAI";
import { OptimizedImage } from "./OptimizedImage";
import AdvancedVirtualTryOn from "./AdvancedVirtualTryOn";

export const EnhancedStyleRecommendations = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather, loading: weatherLoading, fetchWeather } = useWeather();
  const { handleError, logUserAction } = useErrorHandler();

  // State management
  const [recommendations, setRecommendations] = useState<
    EnhancedOutfitRecommendation[]
  >([]);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] =
    useState<EnhancedOutfitRecommendation | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [savedOutfits, setSavedOutfits] = useState<Set<string>>(new Set());

  // Filter and preference states
  const [selectedOccasion, setSelectedOccasion] = useState<string>("casual");
  const [selectedMood, setSelectedMood] = useState<string>("confident");
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState<boolean>(false);
  const [minConfidence, setMinConfidence] = useState<number>(0.6);
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("recommendations");

  // Data derived from wardrobe
  const availableOccasions = useMemo(() => {
    const occasions = wardrobeItems.flatMap((item) => item.occasion);
    return [...new Set(occasions)].sort();
  }, [wardrobeItems]);

  const availableStyles = useMemo(() => {
    const styles = wardrobeItems.map((item) => item.style).filter(Boolean);
    return [...new Set(styles)].sort();
  }, [wardrobeItems]);

  // Load wardrobe items
  const loadWardrobeItems = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const items: WardrobeItem[] =
        data?.map((item) => ({
          id: item.id,
          name: item.name,
          photo_url: item.photo_url,
          category: item.category,
          color: Array.isArray(item.color)
            ? item.color
            : [item.color].filter(Boolean),
          style: item.style || "casual",
          occasion: Array.isArray(item.occasion)
            ? item.occasion
            : [item.occasion].filter(Boolean),
          season: Array.isArray(item.season)
            ? item.season
            : [item.season].filter(Boolean),
          tags: Array.isArray(item.tags) ? item.tags : [],
        })) || [];

      setWardrobeItems(items);
    } catch (error) {
      handleError(error, "Failed to load wardrobe items", {
        context: {
          component: "EnhancedStyleRecommendations",
          action: "loadWardrobeItems",
        },
      });
    }
  }, [user, handleError]);

  // Generate recommendations with enhanced AI
  const generateRecommendations = useCallback(async () => {
    if (!user || !profile || wardrobeItems.length === 0) return;

    setLoading(true);
    logUserAction("generate_enhanced_recommendations", {
      occasion: selectedOccasion,
      mood: selectedMood,
      accessoriesIncluded: includeAccessories,
    });

    try {
      const enhancedProfile: EnhancedStyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || "casual",
        favorite_colors: profile.favorite_colors,
        goals: profile.goals,
        // Enhanced fields with sensible defaults since they don't exist in DB
        lifestyle: "balanced",
        body_type: undefined,
        budget_range: "medium",
        age_range: undefined,
        profession: undefined,
      };

      const context: StyleContext = {
        occasion: selectedOccasion,
        mood: selectedMood,
        weather: weather || undefined,
        season: getCurrentSeason(),
        timeOfDay: getTimeOfDay(),
      };

      const newRecommendations =
        enhancedStyleAI.generateEnhancedRecommendations(
          wardrobeItems,
          enhancedProfile,
          context,
          includeAccessories,
          8,
        );

      // Filter by minimum confidence
      const filteredRecommendations = newRecommendations.filter(
        (rec) => rec.confidence >= minConfidence,
      );

      setRecommendations(filteredRecommendations);
    } catch (error) {
      handleError(error, "Failed to generate style recommendations", {
        context: {
          component: "EnhancedStyleRecommendations",
          action: "generateRecommendations",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [
    user,
    profile,
    wardrobeItems,
    selectedOccasion,
    selectedMood,
    includeAccessories,
    minConfidence,
    weather,
    handleError,
    logUserAction,
  ]);

  // Toggle card expansion
  const toggleCardExpansion = (outfitId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(outfitId)) {
      newExpanded.delete(outfitId);
    } else {
      newExpanded.add(outfitId);
    }
    setExpandedCards(newExpanded);
  };

  // Save/unsave outfit
  const toggleSaveOutfit = async (outfitId: string) => {
    const newSaved = new Set(savedOutfits);
    if (newSaved.has(outfitId)) {
      newSaved.delete(outfitId);
      logUserAction("unsave_outfit", { outfitId });
    } else {
      newSaved.add(outfitId);
      logUserAction("save_outfit", { outfitId });
    }
    setSavedOutfits(newSaved);
  };

  // Initialize component
  useEffect(() => {
    if (user && profile) {
      loadWardrobeItems();
      if (profile.location && !weather) {
        fetchWeather(profile.location);
      }
    }
  }, [user, profile, loadWardrobeItems, fetchWeather, weather]);

  // Generate recommendations when dependencies change
  useEffect(() => {
    if (wardrobeItems.length > 0) {
      generateRecommendations();
    }
  }, [
    wardrobeItems,
    selectedOccasion,
    selectedMood,
    includeAccessories,
    minConfidence,
  ]);

  // Helper functions
  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <Star className="w-4 h-4 text-yellow-500" />;
    if (score >= 0.6) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <Zap className="w-4 h-4 text-purple-500" />;
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to get personalized style recommendations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading flex items-center gap-2">
            <Crown className="w-8 h-8 text-purple-500" />
            Enhanced Style Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered outfit suggestions tailored to your style, weather, and
            occasion
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Recommendations
        </Button>
      </div>

      {/* Weather Info */}
      {weather && (
        <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {Math.round(weather.temperature)}°
                  </span>
                </div>
                <div>
                  <p className="font-medium">{weather.condition}</p>
                  <p className="text-sm text-muted-foreground">
                    {weather.location} • Humidity: {weather.humidity}%
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white">
                Weather-Optimized
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferences
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
              {showAdvancedFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select
                value={selectedOccasion}
                onValueChange={setSelectedOccasion}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Mood</Label>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="adventurous">Adventurous</SelectItem>
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

          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label>
                  Minimum Confidence Score: {Math.round(minConfidence * 100)}%
                </Label>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[3/4] bg-muted animate-pulse" />
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Recommendations Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your preferences or adding more items to your
                wardrobe.
              </p>
              <Button onClick={generateRecommendations}>Try Again</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <Card
                  key={recommendation.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Outfit Images */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-1 p-2 h-full">
                      {recommendation.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={item.id}
                          className="relative rounded-md overflow-hidden"
                        >
                          <OptimizedImage
                            src={item.photo_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {idx === 3 && recommendation.items.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-medium">
                                +{recommendation.items.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                        onClick={() => toggleSaveOutfit(recommendation.id)}
                      >
                        <Heart
                          className={`w-4 h-4 ${savedOutfits.has(recommendation.id) ? "fill-red-500 text-red-500" : ""}`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                        onClick={() => {
                          setSelectedOutfit(recommendation);
                          setShowTryOn(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Confidence Badge */}
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        className={`${getConfidenceColor(recommendation.confidence)} text-white`}
                      >
                        {Math.round(recommendation.confidence * 100)}% Match
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2">
                          {recommendation.description}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.style} • {recommendation.occasion}
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {getScoreIcon(recommendation.style_score)}
                          <span>
                            Style:{" "}
                            {Math.round(recommendation.style_score * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Palette className="w-3 h-3 text-purple-500" />
                          <span>
                            Color:{" "}
                            {Math.round(
                              recommendation.color_harmony_score * 100,
                            )}
                            %
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {recommendation.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Expandable Content */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardExpansion(recommendation.id)}
                        className="w-full justify-between"
                      >
                        <span>Details</span>
                        {expandedCards.has(recommendation.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {expandedCards.has(recommendation.id) && (
                        <div className="space-y-3 pt-2 border-t">
                          {/* Reasoning */}
                          {recommendation.reasoning.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">
                                Why this works:
                              </h4>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {recommendation.reasoning.map((reason, idx) => (
                                  <li key={idx}>• {reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Styling Tips */}
                          {recommendation.styling_tips.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" />
                                Styling Tips:
                              </h4>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {recommendation.styling_tips.map((tip, idx) => (
                                  <li key={idx}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOutfit(recommendation);
                                setShowTryOn(true);
                              }}
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Try On
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {recommendations.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Recommendations Generated
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {recommendations.length > 0
                    ? Math.round(
                        (recommendations.reduce(
                          (acc, rec) => acc + rec.confidence,
                          0,
                        ) /
                          recommendations.length) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Confidence
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{savedOutfits.size}</div>
                <div className="text-sm text-muted-foreground">
                  Saved Outfits
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Virtual Try-On Modal */}
      {showTryOn && selectedOutfit && (
        <AdvancedVirtualTryOn
          onClose={() => {
            setShowTryOn(false);
            setSelectedOutfit(null);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedStyleRecommendations;
