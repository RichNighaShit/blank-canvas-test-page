
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Clock, ExternalLink, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface OccasionOutfit {
  id: string;
  occasion: string;
  style_personality: string;
  season: string[];
  outfit_name: string;
  outfit_description: string | null;
  required_items: any[];
  optional_items: any[];
  styling_tips: string[] | null;
  total_price_range: string | null;
  image_url?: string;
}

const OCCASIONS = [
  { value: 'job_interview', label: 'Job Interview', icon: '💼' },
  { value: 'first_date', label: 'First Date', icon: '💕' },
  { value: 'wedding_guest', label: 'Wedding Guest', icon: '💒' },
  { value: 'business_meeting', label: 'Business Meeting', icon: '📊' },
  { value: 'casual_hangout', label: 'Casual Hangout', icon: '☕' },
  { value: 'dinner_party', label: 'Dinner Party', icon: '🍽️' },
  { value: 'graduation', label: 'Graduation', icon: '🎓' },
  { value: 'birthday_party', label: 'Birthday Party', icon: '🎉' }
];

export const OccasionQuickStart: React.FC = () => {
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [outfitSuggestions, setOutfitSuggestions] = useState<OccasionOutfit[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const loadOutfitSuggestions = async (occasion: string) => {
    if (!occasion) return;

    setLoading(true);
    try {
      let query = supabase
        .from('occasion_outfits')
        .select('*')
        .eq('occasion', occasion);

      // If user has style preferences, prioritize those
      if (profile?.preferred_style) {
        query = query.eq('style_personality', profile.preferred_style);
        
        const { data: matchingStyles, error: styleError } = await query;
        
        if (styleError) throw styleError;
        
        if (matchingStyles && matchingStyles.length > 0) {
          setOutfitSuggestions(matchingStyles.map(transformOutfitData));
        } else {
          // Fallback to all outfits for this occasion
          const { data: allOutfits, error: allError } = await supabase
            .from('occasion_outfits')
            .select('*')
            .eq('occasion', occasion)
            .order('popularity_score', { ascending: false });
            
          if (allError) throw allError;
          setOutfitSuggestions((allOutfits || []).map(transformOutfitData));
        }
      } else {
        const { data, error } = await query.order('popularity_score', { ascending: false });
        if (error) throw error;
        setOutfitSuggestions((data || []).map(transformOutfitData));
      }
    } catch (error) {
      console.error('Error loading outfit suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load outfit suggestions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const transformOutfitData = (outfit: Tables<'occasion_outfits'>): OccasionOutfit => {
    return {
      id: outfit.id,
      occasion: outfit.occasion,
      style_personality: outfit.style_personality,
      season: outfit.season,
      outfit_name: outfit.outfit_name,
      outfit_description: outfit.outfit_description,
      required_items: Array.isArray(outfit.required_items) ? outfit.required_items : [],
      optional_items: Array.isArray(outfit.optional_items) ? outfit.optional_items : [],
      styling_tips: outfit.styling_tips,
      total_price_range: outfit.total_price_range,
      image_url: outfit.image_url || undefined,
    };
  };

  const handleOccasionSelect = (occasion: string) => {
    setSelectedOccasion(occasion);
    loadOutfitSuggestions(occasion);
  };

  const openShoppingLink = (outfit: OccasionOutfit) => {
    // Create a search query based on required items
    const searchTerms = outfit.required_items.map(item => 
      `${item.style || ''} ${item.category} ${item.color?.join(' ') || ''}`
    ).join(' ');
    
    const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchTerms + ' ' + outfit.total_price_range)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <CardTitle>Occasion Quick Start</CardTitle>
          </div>
          <p className="text-muted-foreground">
            What's your next event? Get instant outfit suggestions you can shop for.
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedOccasion} onValueChange={handleOccasionSelect}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OCCASIONS.map((occasion) => (
                <div key={occasion.value}>
                  <RadioGroupItem 
                    value={occasion.value} 
                    id={occasion.value}
                    className="peer sr-only"
                  />
                  <Label 
                    htmlFor={occasion.value}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <div className="text-2xl mb-2">{occasion.icon}</div>
                    <div className="text-sm text-center">{occasion.label}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Finding perfect outfits for you...</p>
          </CardContent>
        </Card>
      )}

      {!loading && outfitSuggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outfitSuggestions.map((outfit) => (
            <Card key={outfit.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{outfit.outfit_name}</span>
                  <Badge variant="outline">{outfit.total_price_range}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {outfit.outfit_description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">You'll need:</h4>
                  <div className="space-y-2">
                    {outfit.required_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="capitalize">
                          {item.style} {item.category} in {item.color?.join(' or ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {outfit.styling_tips && outfit.styling_tips.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Styling Tips:</h4>
                    <ul className="space-y-1">
                      {outfit.styling_tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => openShoppingLink(outfit)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Shop This Look
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && selectedOccasion && outfitSuggestions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No outfits found</h3>
            <p className="text-muted-foreground">
              We don't have outfit suggestions for this occasion yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
