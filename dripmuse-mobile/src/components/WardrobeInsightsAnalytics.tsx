
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lightbulb, 
  ShoppingCart, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  Target,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface WardrobeInsight {
  id: string;
  type: 'gap' | 'recommendation' | 'optimization' | 'trend';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category?: string;
}

interface WardrobeData {
  totalItems: number;
  categories: Record<string, number>;
  colors: Record<string, number>;
  seasons: Record<string, number>;
  occasions: Record<string, number>;
  recentItems: number;
}

export const WardrobeInsightsAnalytics = () => {
  const [insights, setInsights] = useState<WardrobeInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      generateInsights();
    }
  }, [user]);

  const generateInsights = async () => {
    setLoading(true);
    
    try {
      // Fetch user's wardrobe data
      const { data: items, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!items || items.length === 0) {
        setInsights([{
          id: '1',
          type: 'gap',
          title: 'Build Your Foundation Wardrobe',
          description: 'Start by adding basic wardrobe essentials like tops, bottoms, and shoes to get personalized insights.',
          priority: 'high',
          actionable: true
        }]);
        setLoading(false);
        return;
      }

      // Analyze wardrobe data
      const data: WardrobeData = {
        totalItems: items.length,
        categories: items.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        colors: items.reduce((acc, item) => {
          if (item.color) {
            item.color.forEach((color: string) => {
              acc[color] = (acc[color] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>),
        seasons: items.reduce((acc, item) => {
          if (item.season) {
            item.season.forEach((season: string) => {
              acc[season] = (acc[season] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>),
        occasions: items.reduce((acc, item) => {
          if (item.occasion) {
            item.occasion.forEach((occasion: string) => {
              acc[occasion] = (acc[occasion] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>),
        recentItems: items.filter(item => {
          const created = new Date(item.created_at || '');
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length
      };
      
      // Generate insights based on actual data
      const generatedInsights = analyzeWardrobeData(data);
      setInsights(generatedInsights);

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Failed to generate insights",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeWardrobeData = (data: WardrobeData): WardrobeInsight[] => {
    const insights: WardrobeInsight[] = [];

    // Category gap analysis
    const essentialCategories = ['tops', 'bottoms', 'shoes', 'outerwear'];
    essentialCategories.forEach(category => {
      const count = data.categories[category] || 0;
      if (count < 3) {
        insights.push({
          id: `gap-${category}`,
          type: 'gap',
          title: `Need More ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          description: `You only have ${count} ${category}. Consider adding 2-3 more versatile pieces to complete your wardrobe foundation.`,
          priority: count === 0 ? 'high' : 'medium',
          actionable: true,
          category
        });
      }
    });

    // Seasonal coverage analysis
    const currentSeason = getCurrentSeason();
    const currentSeasonItems = data.seasons[currentSeason] || 0;
    if (currentSeasonItems < 5) {
      insights.push({
        id: 'seasonal-gap',
        type: 'gap',
        title: `Limited ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Collection`,
        description: `You have only ${currentSeasonItems} items for ${currentSeason}. Add more seasonal pieces for better outfit variety.`,
        priority: 'medium',
        actionable: true
      });
    }

    // Color palette analysis
    const colorCount = Object.keys(data.colors).length;
    const dominantColor = Object.entries(data.colors).sort(([,a], [,b]) => b - a)[0];
    
    if (colorCount < 5) {
      insights.push({
        id: 'color-variety',
        type: 'recommendation',
        title: 'Expand Your Color Palette',
        description: `Your wardrobe has ${colorCount} main colors. Adding 2-3 complementary colors would increase your outfit possibilities.`,
        priority: 'low',
        actionable: true
      });
    }

    if (dominantColor && dominantColor[1] > data.totalItems * 0.4) {
      insights.push({
        id: 'color-balance',
        type: 'optimization',
        title: 'Balance Your Color Distribution',
        description: `${dominantColor[1]} items are ${dominantColor[0]}. Consider adding variety with complementary colors for more styling options.`,
        priority: 'low',
        actionable: true
      });
    }

    // Occasion coverage analysis
    const workItems = data.occasions['work'] || data.occasions['professional'] || 0;
    const casualItems = data.occasions['casual'] || 0;
    const formalItems = data.occasions['formal'] || data.occasions['special'] || 0;

    if (workItems < 3) {
      insights.push({
        id: 'work-wardrobe',
        type: 'gap',
        title: 'Build Your Professional Wardrobe',
        description: 'Add more work-appropriate pieces to ensure you\'re always ready for professional occasions.',
        priority: 'high',
        actionable: true
      });
    }

    if (formalItems === 0) {
      insights.push({
        id: 'formal-gap',
        type: 'gap',
        title: 'Need Formal Event Options',
        description: 'Consider adding at least one formal outfit for special occasions and events.',
        priority: 'medium',
        actionable: true
      });
    }

    // Growth insights
    if (data.recentItems > 0) {
      insights.push({
        id: 'wardrobe-growth',
        type: 'trend',
        title: 'Wardrobe Growing Steadily',
        description: `You've added ${data.recentItems} new items this month. Great job building your collection!`,
        priority: 'low',
        actionable: false
      });
    }

    // Versatility recommendation
    if (data.totalItems > 20) {
      insights.push({
        id: 'versatility',
        type: 'optimization',
        title: 'Focus on Versatile Pieces',
        description: 'With your growing wardrobe, prioritize versatile items that work for multiple occasions and seasons.',
        priority: 'medium',
        actionable: true
      });
    }

    return insights.slice(0, 8); // Limit to top 8 insights
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'gap': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      case 'optimization': return Target;
      case 'trend': return TrendingUp;
      default: return Sparkles;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Insights</h2>
          <p className="text-muted-foreground">
            Personalized recommendations based on your wardrobe analysis
          </p>
        </div>
        <Button onClick={generateInsights} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`mt-1 ${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{insight.description}</p>
                {insight.actionable && (
                  <Button variant="outline" size="sm" className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {insights.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Perfect Wardrobe Balance!</h3>
            <p className="text-muted-foreground">
              Your wardrobe looks well-organized. Keep adding items to get more personalized insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
