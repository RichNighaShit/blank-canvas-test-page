import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface WardrobeStats {
  totalItems: number;
  categoryBreakdown: Record<string, number>;
  colorDistribution: Record<string, number>;
  styleDistribution: Record<string, number>;
  seasonalCoverage: Record<string, number>;
  occasionCoverage: Record<string, number>;
  mostUsedColors: string[];
  gapsInWardrobe: string[];
}

export const WardrobeAnalytics = () => {
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      analyzeWardrobe();
    }
  }, [user]);

  const analyzeWardrobe = async () => {
    if (!user) return;

    try {
      const { data: items, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!items || items.length === 0) {
        setStats({
          totalItems: 0,
          categoryBreakdown: {},
          colorDistribution: {},
          styleDistribution: {},
          seasonalCoverage: {},
          occasionCoverage: {},
          mostUsedColors: [],
          gapsInWardrobe: ['Add more items to see analytics']
        });
        setLoading(false);
        return;
      }

      // Analyze categories
      const categoryBreakdown = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Analyze colors
      const colorDistribution = items.reduce((acc, item) => {
        if (item.color) {
          item.color.forEach((color: string) => {
            acc[color] = (acc[color] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>);

      // Analyze styles
      const styleDistribution = items.reduce((acc, item) => {
        if (item.style) {
          acc[item.style] = (acc[item.style] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Analyze seasonal coverage
      const seasonalCoverage = items.reduce((acc, item) => {
        if (item.season) {
          item.season.forEach((season: string) => {
            acc[season] = (acc[season] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>);

      // Analyze occasion coverage
      const occasionCoverage = items.reduce((acc, item) => {
        if (item.occasion) {
          item.occasion.forEach((occasion: string) => {
            acc[occasion] = (acc[occasion] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>);

      // Find most used colors
      const mostUsedColors = Object.entries(colorDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color);

      // Identify gaps in wardrobe
      const gapsInWardrobe = identifyWardrobeGaps(categoryBreakdown, occasionCoverage, seasonalCoverage);

      setStats({
        totalItems: items.length,
        categoryBreakdown,
        colorDistribution,
        styleDistribution,
        seasonalCoverage,
        occasionCoverage,
        mostUsedColors,
        gapsInWardrobe
      });
    } catch (error) {
      console.error('Error analyzing wardrobe:', error);
    } finally {
      setLoading(false);
    }
  };

  const identifyWardrobeGaps = (
    categories: Record<string, number>,
    occasions: Record<string, number>,
    seasons: Record<string, number>
  ): string[] => {
    const gaps: string[] = [];
    
    // Essential categories
    const essentialCategories = ['tops', 'bottoms', 'shoes'];
    essentialCategories.forEach(category => {
      if (!categories[category] || categories[category] < 3) {
        gaps.push(`Need more ${category}`);
      }
    });

    // Essential occasions
    const essentialOccasions = ['casual', 'work', 'formal'];
    essentialOccasions.forEach(occasion => {
      if (!occasions[occasion] || occasions[occasion] < 2) {
        gaps.push(`Need more ${occasion} wear`);
      }
    });

    // Seasonal coverage
    const allSeasons = ['spring', 'summer', 'fall', 'winter'];
    allSeasons.forEach(season => {
      if (!seasons[season] || seasons[season] < 3) {
        gaps.push(`Need more ${season} items`);
      }
    });

    return gaps.slice(0, 5); // Limit to top 5 gaps
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing your wardrobe...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in your wardrobe
            </p>
          </CardContent>
        </Card>

        {/* Most Used Color */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Favorite Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats.mostUsedColors[0] || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most frequent color
            </p>
          </CardContent>
        </Card>

        {/* Dominant Style */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dominant Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(stats.styleDistribution)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most common style
            </p>
          </CardContent>
        </Card>

        {/* Wardrobe Score */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wardrobe Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.min(100, Math.round((stats.totalItems / 20) * 100))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completeness score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Distribution of items by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{category}</span>
                  <span>{count} items</span>
                </div>
                <Progress 
                  value={(count / stats.totalItems) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Your most used colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.colorDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([color, count]) => (
                  <div key={color} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ 
                          backgroundColor: getColorHex(color),
                          borderColor: color === 'white' ? '#e5e7eb' : 'transparent'
                        }}
                      />
                      <span className="capitalize">{color}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Coverage */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Seasonal Coverage</CardTitle>
            <CardDescription>Items suitable for each season</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['spring', 'summer', 'fall', 'winter'].map(season => (
              <div key={season} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{season}</span>
                  <span>{stats.seasonalCoverage[season] || 0} items</span>
                </div>
                <Progress 
                  value={((stats.seasonalCoverage[season] || 0) / stats.totalItems) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Wardrobe Gaps */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Wardrobe Gaps</CardTitle>
            <CardDescription>Areas to improve your wardrobe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.gapsInWardrobe.length > 0 ? (
                stats.gapsInWardrobe.map((gap, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">{gap}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your wardrobe looks well-balanced! 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#eab308',
    purple: '#7c3aed',
    pink: '#ec4899',
    orange: '#ea580c',
    gray: '#6b7280',
    brown: '#92400e',
    navy: '#1e3a8a',
    beige: '#f5f5dc',
    cyan: '#06b6d4',
    magenta: '#d946ef'
  };
  
  return colorMap[colorName.toLowerCase()] || '#6b7280';
};