import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Heart, Eye, ShoppingBag, Loader2, RefreshCw, Settings, AlertCircle, Star, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { advancedStyleAI, OutfitRecommendation, WardrobeItem, StyleProfile } from '@/lib/advancedStyleAI';
import AdvancedVirtualTryOn from './AdvancedVirtualTryOn';
import { useWeather } from '@/hooks/useWeather';
import { usePerformance } from '@/hooks/usePerformance';
import { PerformanceCache, CACHE_NAMESPACES } from '@/lib/performanceCache';
import { OptimizedImage } from './OptimizedImage';

export const StyleRecommendations = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather, loading: weatherLoading, fetchWeather, getWeatherAdvice, getWeatherStatus } = useWeather();
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitRecommendation | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  
  // User preferences state
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(true);
  const [showPreferences, setShowPreferences] = useState<boolean>(true);

  // Get unique occasions from wardrobe items
  const [availableOccasions, setAvailableOccasions] = useState<string[]>([]);

  // Performance optimization
  const { executeWithCache, debounce } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.RECOMMENDATIONS,
    enableCaching: true,
    enableMonitoring: true
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
      setError('Profile not found. Please complete your profile setup.');
      setLoading(false);
    } else {
      setError('Please sign in to get style recommendations.');
      setLoading(false);
    }
  }, [user, profile]);

  const loadWardrobeItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading wardrobe items for advanced AI analysis...');

      // Use cached wardrobe items if available
      const cacheKey = `advanced_wardrobe_items_${user.id}`;
      const cachedItems = PerformanceCache.get<WardrobeItem[]>(cacheKey, CACHE_NAMESPACES.WARDROBE_ITEMS);
      
      if (cachedItems) {
        setWardrobeItems(cachedItems);
        extractOccasions(cachedItems);
        setLoading(false);
        return;
      }

      const { data: items, error: fetchError } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching wardrobe items:', fetchError);
        throw new Error('Failed to load your wardrobe items');
      }

      console.log('Fetched wardrobe items for advanced analysis:', items?.length);

      let mappedItems: WardrobeItem[] = (items || []).map(item => ({
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
        formality_level: item.formality_level || this.inferFormalityLevel(item)
      }));

      setWardrobeItems(mappedItems);
      extractOccasions(mappedItems);

      // Cache wardrobe items for 15 minutes (longer for advanced analysis)
      PerformanceCache.set(cacheKey, mappedItems, {
        ttl: 15 * 60 * 1000,
        namespace: CACHE_NAMESPACES.WARDROBE_ITEMS
      });

    } catch (error) {
      console.error('Error loading wardrobe items:', error);
      setError(error instanceof Error ? error.message : 'Failed to load wardrobe items');
      setWardrobeItems([]);
    } finally {
      setLoading(false);
    }
  };

  const inferFormalityLevel = (item: any): number => {
    // Infer formality level from item characteristics
    const name = item.name.toLowerCase();
    const category = item.category.toLowerCase();
    const style = item.style?.toLowerCase() || '';
    
    if (name.includes('formal') || name.includes('evening') || category.includes('suit')) return 9;
    if (name.includes('business') || name.includes('blazer') || style.includes('business')) return 7;
    if (name.includes('smart') || name.includes('dress shirt')) return 6;
    if (name.includes('casual') || name.includes('t-shirt') || name.includes('jeans')) return 3;
    if (name.includes('athletic') || name.includes('gym') || name.includes('sport')) return 2;
    
    return 5; // Default middle formality
  };

  const extractOccasions = (items: WardrobeItem[]) => {
    const occasions = new Set<string>();
    items.forEach(item => {
      item.occasion.forEach(occ => occasions.add(occ));
    });
    setAvailableOccasions(Array.from(occasions).sort());

    // Set default occasion if available
    if (occasions.size > 0 && !occasions.has(selectedOccasion)) {
      setSelectedOccasion(Array.from(occasions)[0]);
    }
  };

  const loadRecommendations = async () => {
    if (!user || !profile || wardrobeItems.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Generating advanced AI recommendations for:', {
        occasion: selectedOccasion,
        accessories: includeAccessories,
        weather: weather?.temperature
      });

      // Create enhanced style profile
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || 'casual',
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || [],
        body_type: profile.body_type,
        style_preferences: {
          formality: this.inferFormalityPreference(profile.preferred_style),
          boldness: profile.goals?.includes('bold') ? 8 : 5,
          minimalism: profile.goals?.includes('minimalist') ? 8 : 5
        }
      };

      console.log('Using enhanced style profile:', styleProfile);

      // Use cached execution for advanced recommendations
      const recs = await executeWithCache(
        `advanced_recommendations_${selectedOccasion}_${includeAccessories}_${user.id}_${weather?.temperature || 'unknown'}`,
        async () => advancedStyleAI.generateRecommendations(
          wardrobeItems,
          styleProfile,
          {
            occasion: selectedOccasion,
            timeOfDay: 'day',
            weather: weather || undefined
          },
          includeAccessories
        ),
        10 * 60 * 1000 // 10 minutes cache for advanced analysis
      );

      console.log('Generated advanced recommendations:', recs.length);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading advanced recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate advanced recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
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

  // Debounced recommendation loading
  const debouncedLoadRecommendations = debounce(loadRecommendations, 800);

  useEffect(() => {
    if (wardrobeItems.length > 0) {
      debouncedLoadRecommendations();
    }
  }, [wardrobeItems, selectedOccasion, includeAccessories, weather]);

  const handleTryOn = (outfit: OutfitRecommendation) => {
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  const handleLike = async (outfitId: string) => {
    if (!user) return;

    try {
      const outfit = recommendations.find(r => r.id === outfitId);
      if (!outfit) return;

      // Record feedback in advanced AI
      advancedStyleAI.recordUserFeedback(user.id, outfitId, 5); // 5 = like

      const { error } = await supabase
        .from('outfit_feedback')
        .insert({
          user_id: user.id,
          feedback: 'like',
          outfit_item_ids: outfit.items.map(i => i.id)
        });

      if (error) {
        console.error('Error saving feedback:', error);
      } else {
        console.log('Advanced outfit feedback saved successfully');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  if (loading && wardrobeItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">Advanced AI analyzing your style...</h3>
            <p className="text-muted-foreground">Processing color theory, style coherence, and weather optimization</p>
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
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to Load Advanced Recommendations</h3>
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
      {/* Enhanced Preferences Panel */}
      {showPreferences && (
        <Card className="card-premium border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Advanced Style Preferences</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered outfit generation settings</p>
                </div>
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
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="occasion" className="text-sm font-semibold">Occasion Context</Label>
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOccasions.map(occasion => (
                      <SelectItem key={occasion} value={occasion}>
                        {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3">
                <Switch
                  id="accessories"
                  checked={includeAccessories}
                  onCheckedChange={setIncludeAccessories}
                />
                <Label htmlFor="accessories" className="text-sm font-semibold">Smart Accessory Matching</Label>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Advanced Features Active</span>
              </div>
              <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Color theory & harmony analysis</li>
                <li>• Style coherence optimization</li>
                <li>• Weather-adaptive recommendations</li>
                <li>• Trend relevance scoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Weather Integration */}
      <Card className="card-premium border border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Advanced Weather Integration</p>
                {weather ? (
                  <p className="text-sm text-muted-foreground">
                    {weather.description} • {Math.round(weather.temperature)}°C • Optimizing layering strategy
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {getWeatherStatus()} • Style recommendations adapting to conditions
                  </p>
                )}
              </div>
            </div>
            {weather ? (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                {getWeatherAdvice(weather)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Weather analysis pending
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Recommendations Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading bg-gradient-to-r from-purple-900 dark:from-purple-400 to-pink-700 dark:to-pink-400 bg-clip-text text-transparent">
              Advanced AI Style Recommendations
            </h2>
            <p className="text-muted-foreground mt-1">Powered by color theory, style intelligence & weather optimization</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <div className="text-center">
                <p className="font-semibold">Advanced AI Processing...</p>
                <p className="text-sm text-muted-foreground">Analyzing color harmony, style coherence & weather factors</p>
              </div>
            </div>
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <Card className="text-center p-12 border-2 border-dashed border-muted">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 to-pink-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Advanced Recommendations Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The advanced AI needs more wardrobe items or different preferences to generate sophisticated outfit combinations.
            </p>
            <Button onClick={() => setShowPreferences(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Adjust Advanced Settings
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((outfit, index) => (
            <Card key={outfit.id} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-purple-200 dark:hover:border-purple-800 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{outfit.description}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Advanced AI • {outfit.occasion}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      {Math.round(outfit.confidence * 100)}% match
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{(outfit.style_score * 5).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                {/* Enhanced Outfit Items Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {outfit.items.map((item, itemIndex) => (
                    <div key={item.id} className="relative group/item">
                      <OptimizedImage
                        src={item.photo_url}
                        alt={item.name}
                        className="aspect-square rounded-xl object-cover ring-2 ring-purple-100 dark:ring-purple-900 group-hover/item:ring-purple-300 dark:group-hover/item:ring-purple-700 transition-all"
                        lazy={true}
                        width={150}
                        height={150}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/80 dark:bg-black/80">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advanced Scoring Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{Math.round(outfit.color_harmony_score * 100)}</div>
                    <div className="text-xs text-muted-foreground">Color</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{Math.round(outfit.weather_appropriateness * 100)}</div>
                    <div className="text-xs text-muted-foreground">Weather</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-600">{Math.round(outfit.trend_relevance * 100)}</div>
                    <div className="text-xs text-muted-foreground">Trend</div>
                  </div>
                </div>

                {/* Enhanced Reasoning */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                    AI Analysis
                  </h4>
                  {outfit.reasoning.slice(0, 2).map((reason, reasonIndex) => (
                    <div key={reasonIndex} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-purple-100 dark:border-purple-900">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLike(outfit.id)}
                      className="hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTryOn(outfit)}
                      title="Virtual try-on with advanced fitting"
                      className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200 border-0">
                    #{index + 1} Advanced Pick
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Virtual Try-On Modal */}
      {showTryOn && selectedOutfit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-heading bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent">
                  Advanced Virtual Try-On
                </h3>
                <p className="text-muted-foreground">AI-powered outfit visualization</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTryOn(false)}
                className="rounded-full"
              >
                ×
              </Button>
            </div>
            <div className="mb-6">
              <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Upload your full body photo to see how this advanced AI-curated outfit looks on you. 
                  The outfit components have been optimized for color harmony and style coherence.
                </AlertDescription>
              </Alert>
            </div>
            <AdvancedVirtualTryOn
              clothingImg={selectedOutfit.items[0]?.photo_url || ''}
              clothingType="auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
