
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Plus, Check, Loader2 } from 'lucide-react';

interface CuratedItem {
  id: string;
  name: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  price_range: string;
  description: string;
  image_url?: string;
  popularity_score: number;
}

interface WardrobeItem {
  id: string;
  category: string;
  style: string;
  color: string[];
}

export const SmartWardrobeBootstrap: React.FC = () => {
  const [userItems, setUserItems] = useState<WardrobeItem[]>([]);
  const [suggestions, setSuggestions] = useState<CuratedItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserWardrobeAndSuggestions();
    }
  }, [user]);

  const loadUserWardrobeAndSuggestions = async () => {
    if (!user) return;

    try {
      // Get user's current wardrobe
      const { data: wardrobe, error: wardrobeError } = await supabase
        .from('wardrobe_items')
        .select('id, category, style, color')
        .eq('user_id', user.id);

      if (wardrobeError) throw wardrobeError;

      setUserItems(wardrobe || []);

      // Get curated suggestions
      const { data: curated, error: curatedError } = await supabase
        .from('curated_wardrobe_items')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(20);

      if (curatedError) throw curatedError;

      // Filter suggestions based on what user doesn't have
      const userCategories = new Set(wardrobe?.map(item => item.category) || []);
      const userStyles = new Set(wardrobe?.map(item => item.style) || []);
      
      const smartSuggestions = (curated || []).filter(item => {
        // Prioritize items in categories user doesn't have much of
        const categoryCount = wardrobe?.filter(w => w.category === item.category).length || 0;
        return categoryCount < 3; // Suggest if user has less than 3 items in this category
      });

      setSuggestions(smartSuggestions);
    } catch (error) {
      console.error('Error loading wardrobe data:', error);
      toast({
        title: "Error",
        description: "Failed to load wardrobe suggestions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWardrobe = async (item: CuratedItem) => {
    if (!user) return;

    setAdding(prev => new Set(prev).add(item.id));
    
    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          name: item.name,
          category: item.category,
          style: item.style,
          color: item.color,
          occasion: item.occasion,
          season: item.season,
          photo_url: item.image_url || 'https://via.placeholder.com/300x400?text=No+Image'
        });

      if (error) throw error;

      setAddedItems(prev => new Set(prev).add(item.id));
      toast({
        title: "Added to Wardrobe!",
        description: `${item.name} has been added to your wardrobe.`
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wardrobe.",
        variant: "destructive"
      });
    } finally {
      setAdding(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyzing your wardrobe...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>Smart Wardrobe Bootstrap</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Based on your current wardrobe, here are some essential pieces we recommend adding:
          </p>
        </CardHeader>
      </Card>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your wardrobe looks great!</h3>
            <p className="text-muted-foreground">
              You have good coverage across different categories. Keep adding items that match your style!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-2xl mb-2">👕</div>
                    <div className="text-xs">{item.category}</div>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">{item.style}</Badge>
                  <Badge variant="outline">{item.price_range}</Badge>
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => addToWardrobe(item)}
                  disabled={addedItems.has(item.id) || adding.has(item.id)}
                >
                  {adding.has(item.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : addedItems.has(item.id) ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {addedItems.has(item.id) ? 'Added' : adding.has(item.id) ? 'Adding...' : 'Add to Wardrobe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
