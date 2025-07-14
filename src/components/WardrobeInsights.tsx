import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface WardrobeInsight {
  type: 'suggestion' | 'trend' | 'gap' | 'optimization';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

export const WardrobeInsights = () => {
  const [insights, setInsights] = useState<WardrobeInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      generateInsights();
    }
  }, [user, profile]);

  const generateInsights = async () => {
    if (!user) return;

    try {
      const { data: items, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const generatedInsights: WardrobeInsight[] = [];

      if (!items || items.length === 0) {
        generatedInsights.push({
          type: 'gap',
          title: 'Start Building Your Wardrobe',
          description: 'Upload photos of your clothes to get personalized insights and recommendations.',
          action: 'Add Items',
          priority: 'high'
        });
      } else {
        // Analyze wardrobe composition
        const categoryCount = items.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const styleCount = items.reduce((acc, item) => {
          if (item.style) {
            acc[item.style] = (acc[item.style] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const colorCount = items.reduce((acc, item) => {
          if (item.color) {
            item.color.forEach((color: string) => {
              acc[color] = (acc[color] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        // Generate category-based insights
        const essentialCategories = ['tops', 'bottoms', 'shoes'];
        essentialCategories.forEach(category => {
          const count = categoryCount[category] || 0;
          if (count < 3) {
            generatedInsights.push({
              type: 'gap',
              title: `Need More ${category.charAt(0).toUpperCase() + category.slice(1)}`,
              description: `You only have ${count} ${category}. Consider adding 2-3 more versatile pieces.`,
              action: `Shop ${category}`,
              priority: count === 0 ? 'high' : 'medium',
              category
            });
          }
        });

        // Style consistency insights
        const dominantStyle = Object.entries(styleCount)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (dominantStyle && profile?.preferred_style !== dominantStyle[0]) {
          generatedInsights.push({
            type: 'trend',
            title: 'Style Evolution Detected',
            description: `Your wardrobe shows a preference for ${dominantStyle[0]} style, but your profile says ${profile?.preferred_style}. Consider updating your style preference.`,
            action: 'Update Profile',
            priority: 'low'
          });
        }

        // Color palette insights
        const dominantColors = Object.entries(colorCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);

        if (dominantColors.length > 0) {
          const [topColor] = dominantColors[0];
          if (colorCount[topColor] > items.length * 0.4) {
            generatedInsights.push({
              type: 'optimization',
              title: 'Color Variety Opportunity',
              description: `${Math.round((colorCount[topColor] / items.length) * 100)}% of your wardrobe is ${topColor}. Adding complementary colors could create more outfit combinations.`,
              action: 'Explore Colors',
              priority: 'medium'
            });
          }
        }

        // Seasonal coverage insights
        const seasonCount = items.reduce((acc, item) => {
          if (item.season) {
            item.season.forEach((season: string) => {
              acc[season] = (acc[season] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        const currentMonth = new Date().getMonth();
        const currentSeason = getCurrentSeason(currentMonth);
        const currentSeasonItems = seasonCount[currentSeason] || 0;

        if (currentSeasonItems < 5) {
          generatedInsights.push({
            type: 'suggestion',
            title: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Wardrobe Gap`,
            description: `You have only ${currentSeasonItems} items suitable for ${currentSeason}. Consider adding season-appropriate pieces.`,
            action: `Shop ${currentSeason}`,
            priority: 'medium'
          });
        }

        // Occasion coverage insights
        const occasionCount = items.reduce((acc, item) => {
          if (item.occasion) {
            item.occasion.forEach((occasion: string) => {
              acc[occasion] = (acc[occasion] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        if ((occasionCount.formal || 0) < 2) {
          generatedInsights.push({
            type: 'gap',
            title: 'Formal Wear Gap',
            description: 'You have limited formal wear options. Consider adding a few formal pieces for special occasions.',
            action: 'Shop Formal',
            priority: 'medium'
          });
        }

        if ((occasionCount.work || 0) < 3) {
          generatedInsights.push({
            type: 'gap',
            title: 'Work Wardrobe Needs Attention',
            description: 'Your professional wardrobe could use more options. Aim for 5-7 work-appropriate outfits.',
            action: 'Shop Professional',
            priority: 'medium'
          });
        }

        // Versatility insights
        const versatileItems = items.filter(item => 
          item.occasion && item.occasion.length >= 3
        );

        if (versatileItems.length < items.length * 0.3) {
          generatedInsights.push({
            type: 'optimization',
            title: 'Increase Wardrobe Versatility',
            description: 'Many of your items work for only one occasion. Look for pieces that can be dressed up or down.',
            action: 'Find Versatile Pieces',
            priority: 'low'
          });
        }

        // Positive insights
        if (items.length >= 20) {
          generatedInsights.push({
            type: 'trend',
            title: 'Well-Stocked Wardrobe!',
            description: `You have ${items.length} items in your wardrobe. That's a great foundation for creating diverse outfits.`,
            priority: 'low'
          });
        }

        if (Object.keys(categoryCount).length >= 5) {
          generatedInsights.push({
            type: 'trend',
            title: 'Great Category Diversity',
            description: 'Your wardrobe covers multiple clothing categories, giving you flexibility in outfit creation.',
            priority: 'low'
          });
        }
      }

      // Sort insights by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      generatedInsights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setInsights(generatedInsights.slice(0, 8)); // Limit to 8 insights
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSeason = (month: number): string => {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return '💡';
      case 'trend': return '📈';
      case 'gap': return '🎯';
      case 'optimization': return '⚡';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const handleActionClick = (insight: WardrobeInsight) => {
    if (!insight.action) return;

    switch (insight.action) {
      case 'Add Items':
        navigate('/wardrobe');
        break;
      case 'Update Profile':
        navigate('/profile-setup');
        break;
      case 'Explore Colors':
        // Open Google search for color palette inspiration
        window.open('https://www.google.com/search?tbm=isch&q=clothing+color+palette+inspiration', '_blank');
        break;
      case 'Find Versatile Pieces':
        // Open search for versatile clothing pieces
        window.open('https://www.google.com/search?tbm=shop&q=versatile+clothing+pieces+capsule+wardrobe', '_blank');
        break;
      default:
        // Handle shop actions (Shop tops, Shop formal, etc.)
        if (insight.action.startsWith('Shop ')) {
          const searchTerm = insight.action.replace('Shop ', '');
          let searchQuery = '';
          
          // Handle specific search terms
          switch (searchTerm.toLowerCase()) {
            case 'formal':
              searchQuery = 'formal wear business attire';
              break;
            case 'professional':
              searchQuery = 'professional work clothing business casual';
              break;
            case 'spring':
            case 'summer':
            case 'fall':
            case 'winter':
              searchQuery = `${searchTerm} clothing seasonal wear`;
              break;
            default:
              searchQuery = `${searchTerm} clothing fashion`;
          }
          
          window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`, '_blank');
        }
        break;
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Wardrobe Insights</h2>
        <p className="text-muted-foreground">
          AI-powered recommendations to optimize your wardrobe
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getInsightIcon(insight.type)}</span>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <Badge variant={getPriorityColor(insight.priority) as any} className="text-xs">
                  {insight.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4 text-sm leading-relaxed">
                {insight.description}
              </CardDescription>
              {insight.action && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleActionClick(insight)}
                >
                  {insight.action}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {insights.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No insights available</h3>
            <p className="text-muted-foreground">
              Add more items to your wardrobe to get personalized insights and recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};