import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Heart, Eye, ShoppingBag, Loader2, RefreshCw, Settings, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { simpleStyleAI, OutfitRecommendation, WardrobeItem, StyleProfile } from '@/lib/simpleStyleAI';
import AdvancedVirtualTryOn from './AdvancedVirtualTryOn';
import { useWeather } from '@/hooks/useWeather';
import { usePerformance } from '@/hooks/usePerformance';
import { PerformanceCache, CACHE_NAMESPACES } from '@/lib/performanceCache';
import { OptimizedImage } from './OptimizedImage';
import { FeedbackModal, OutfitFeedback } from './FeedbackModal';
import { logger } from '@/lib/logger';

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
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackOutfitId, setFeedbackOutfitId] = useState<string | null>(null);
  
  // User preferences state
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [includeAccessories, setIncludeAccessories] = useState<boolean>(false);
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
      logger.info('Loading wardrobe items', { userId: user.id }, 'StyleRecommendations');

      // Use cached wardrobe items if available
      const cacheKey = `wardrobe_items_${user.id}`;
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
        logger.logError(fetchError as Error, 'loadWardrobeItems.fetch');
        throw new Error('Failed to load your wardrobe items');
      }

      logger.debug('Fetched wardrobe items', { count: items?.length }, 'StyleRecommendations');

      let mappedItems: WardrobeItem[] = (items || []).map(item => ({
        id: item.id,
        name: item.name,
        photo_url: item.photo_url || '',
        category: item.category,
        color: item.color || [],
        style: item.style || 'casual',
        occasion: item.occasion || ['casual'],
        season: item.season || ['all'],
        tags: item.tags || []
      }));

      setWardrobeItems(mappedItems);
      extractOccasions(mappedItems);

      // Cache wardrobe items for 10 minutes
      PerformanceCache.set(cacheKey, mappedItems, {
        ttl: 10 * 60 * 1000,
        namespace: CACHE_NAMESPACES.WARDROBE_ITEMS
      });

    } catch (error) {
      logger.logError(error as Error, 'loadWardrobeItems');
      setError(error instanceof Error ? error.message : 'Failed to load wardrobe items');
      setWardrobeItems([]);
    } finally {
      setLoading(false);
    }
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
      logger.info('Generating recommendations', { 
        occasion: selectedOccasion, 
        accessories: includeAccessories 
      }, 'StyleRecommendations');

      // Filter items based on user preferences
      let filteredItems = wardrobeItems.filter(item => 
        item.occasion.includes(selectedOccasion) || 
        item.occasion.includes('casual') // Always include casual items as they're versatile
      );

      // Handle accessories based on user preference
      if (!includeAccessories) {
        filteredItems = filteredItems.filter(item => 
          !['accessories', 'jewelry', 'bags', 'hats', 'belts', 'scarves'].includes(item.category.toLowerCase())
        );
      }

      if (filteredItems.length === 0) {
        logger.warn('No items found for selected preferences');
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Create style profile
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || 'casual',
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || []
      };

      // Use cached execution for recommendations
      const recs = await executeWithCache(
        `recommendations_${selectedOccasion}_${includeAccessories}_${user.id}`,
        async () => simpleStyleAI.generateRecommendations(
          filteredItems,
          styleProfile,
          {
            occasion: selectedOccasion,
            timeOfDay: 'day',
            weather: weather || undefined
          },
          includeAccessories
        ),
        5 * 60 * 1000 // 5 minutes cache
      );

      logger.info('Generated recommendations', { count: recs.length }, 'StyleRecommendations');
      setRecommendations(recs);
    } catch (error) {
      logger.logError(error as Error, 'loadRecommendations');
      setError(error instanceof Error ? error.message : 'Failed to generate recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced recommendation loading
  const debouncedLoadRecommendations = debounce(loadRecommendations, 500);

  useEffect(() => {
    if (wardrobeItems.length > 0) {
      debouncedLoadRecommendations();
    }
  }, [wardrobeItems, selectedOccasion, includeAccessories, weather]);

  const handleTryOn = (outfit: OutfitRecommendation) => {
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  const handleFeedback = (outfitId: string) => {
    setFeedbackOutfitId(outfitId);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (feedback: OutfitFeedback) => {
    if (!user) return;

    try {
      logger.info('Submitting outfit feedback', feedback, 'StyleRecommendations');

      const outfit = recommendations.find(r => r.id === feedback.outfitId);
      if (!outfit) return;

      // Save detailed feedback to database
      const { error } = await supabase
        .from('outfit_feedback')
        .insert({
          user_id: user.id,
          feedback: feedback.sentiment,
          outfit_item_ids: outfit.items.map(i => i.id),
          rating: feedback.rating,
          reasons: feedback.reasons,
          comments: feedback.comments,
          would_wear: feedback.wouldWear
        });

      if (error) {
        logger.logError(error as Error, 'handleFeedbackSubmit.database');
      } else {
        logger.info('Outfit feedback saved successfully');
        // TODO: Update local state to reflect feedback
      }
    } catch (error) {
      logger.logError(error as Error, 'handleFeedbackSubmit');
    }
  };

  const handleLike = async (outfitId: string) => {
    if (!user) return;

    try {
      const outfit = recommendations.find(r => r.id === outfitId);
      if (!outfit) return;

      const { error } = await supabase
        .from('outfit_feedback')
        .insert({
          user_id: user.id,
          feedback: 'like',
          outfit_item_ids: outfit.items.map(i => i.id)
        });

      if (error) {
        logger.logError(error as Error, 'handleLike');
      } else {
        logger.info('Quick like feedback saved');
      }
    } catch (error) {
      logger.logError(error as Error, 'handleLike');
    }
  };

  if (loading && wardrobeItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">Loading your style assistant...</h3>
            <p className="text-muted-foreground">Analyzing your wardrobe and preferences</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Recommendations</h3>
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
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger>
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
              <Badge variant="secondary">
                {getWeatherAdvice(weather)}
              </Badge>
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
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
            <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
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
            <Card key={outfit.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{outfit.description}</CardTitle>
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
                      onClick={() => handleFeedback(outfit.id)}
                      title="Detailed feedback"
                    >
                      <MessageSquare className="h-4 w-4" />
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
                      <Badge key={reasonIndex} variant="outline" className="text-xs">
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

      {/* Enhanced Feedback Modal */}
      {feedbackModalOpen && feedbackOutfitId && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          outfitId={feedbackOutfitId}
          onSubmit={handleFeedbackSubmit}
        />
      )}

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
                  Upload your full body photo to see how this outfit looks on you. The clothing items are already selected from your recommendations.
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
