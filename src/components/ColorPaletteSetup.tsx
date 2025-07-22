import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Palette, Sparkles, Info } from 'lucide-react';
import { PaletteSelection } from './PaletteSelection';
import { PREDEFINED_COLOR_PALETTES, type ColorPalette } from '@/data/predefinedColorPalettes';
import { colorSeasonAnalysisService, type ColorSeasonAnalysis } from '@/lib/colorSeasonAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, invalidateProfileCache } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ColorPaletteSetupProps {
  onComplete?: (palette: ColorPalette, analysis: ColorSeasonAnalysis) => void;
  showTitle?: boolean;
  embedded?: boolean;
}

export const ColorPaletteSetup: React.FC<ColorPaletteSetupProps> = ({
  onComplete,
  showTitle = true,
  embedded = false
}) => {
  const [step, setStep] = useState<'selection' | 'analysis'>('selection');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [colorAnalysis, setColorAnalysis] = useState<ColorSeasonAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();

  // Load existing palette if user has one
  useEffect(() => {
    if (profile?.selected_palette_id) {
      const existingPalette = PREDEFINED_COLOR_PALETTES.find(p => p.id === profile.selected_palette_id);
      if (existingPalette) {
        setSelectedPalette(existingPalette);
        if (profile.color_season_analysis) {
          setColorAnalysis(profile.color_season_analysis);
          setStep('analysis');
        }
      }
    }
  }, [profile]);

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPalette(palette);
  };

  const handleContinueToAnalysis = () => {
    if (!selectedPalette) return;

    // Generate color season analysis
    const analysis = colorSeasonAnalysisService.analyzeColorSeason(selectedPalette);
    setColorAnalysis(analysis);

    // If embedded (like in dialog), skip analysis display and save directly
    if (embedded) {
      handleSaveProfile();
      return;
    }

    setStep('analysis');
  };

  const handleSaveProfile = async () => {
    if (!selectedPalette || !user) return;

    // Generate analysis if not already done
    let analysisToSave = colorAnalysis;
    if (!analysisToSave) {
      analysisToSave = colorSeasonAnalysisService.analyzeColorSeason(selectedPalette);
      setColorAnalysis(analysisToSave);
    }

    setSaving(true);
    try {
      // Save the selected palette and analysis to the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({
          selected_palette_id: selectedPalette.id,
          color_palette_colors: selectedPalette.complementaryColors,
          color_season_analysis: colorAnalysis
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving palette:', error);
        console.error('Error saving palette:', error);
        toast({
          title: "Error",
          description: "Failed to save your color palette. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Invalidate cache and refetch profile
      invalidateProfileCache(user.id);
      await refetch();

      toast({
        title: "Success!",
        description: "Your color palette has been saved successfully.",
      });

      // Call completion callback if provided
      if (onComplete) {
        onComplete(selectedPalette, colorAnalysis);
      }

    } catch (error: any) {
      console.error('Error saving palette:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const ColorSeasonResults: React.FC<{ analysis: ColorSeasonAnalysis; palette: ColorPalette }> = ({ 
    analysis, 
    palette 
  }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h3 className="text-2xl font-bold">Your Professional Color Analysis</h3>
        </div>
        <p className="text-gray-600">
          Based on your selected palette, here's your personalized color season analysis
        </p>
      </div>

      {/* Color Season Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {analysis.season.charAt(0).toUpperCase() + analysis.season.slice(1)} - {analysis.subSeason}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base">
            {analysis.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Contrast</p>
              <p className="capitalize">{analysis.characteristics.contrast}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Warmth</p>
              <p className="capitalize">{analysis.characteristics.warmth}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Clarity</p>
              <p className="capitalize">{analysis.characteristics.clarity}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Depth</p>
              <p className="capitalize">{analysis.characteristics.depth}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Your Personal Color Palette</CardTitle>
          <CardDescription>The colors that complement your natural coloring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Feature Colors */}
            <div>
              <h4 className="font-medium mb-2">Your Natural Features</h4>
              <div className="flex gap-4">
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2" 
                    style={{ backgroundColor: palette.skinTone.color }}
                  />
                  <p className="text-sm font-medium">{palette.skinTone.name}</p>
                  <p className="text-xs text-gray-500">Skin</p>
                </div>
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2" 
                    style={{ backgroundColor: palette.hairColor.color }}
                  />
                  <p className="text-sm font-medium">{palette.hairColor.name}</p>
                  <p className="text-xs text-gray-500">Hair</p>
                </div>
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2" 
                    style={{ backgroundColor: palette.eyeColor.color }}
                  />
                  <p className="text-sm font-medium">{palette.eyeColor.name}</p>
                  <p className="text-xs text-gray-500">Eyes</p>
                </div>
              </div>
            </div>

            {/* Complementary Colors */}
            <div>
              <h4 className="font-medium mb-2">Your Best Colors</h4>
              <div className="flex flex-wrap gap-2">
                {palette.complementaryColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ideal Colors Categories */}
      <div className="grid md:grid-cols-2 gap-4">
        {analysis.idealColors.map((category, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category.category}</CardTitle>
              <CardDescription className="text-sm">{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.colors.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    className="w-8 h-8 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Style Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Style Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => setStep('selection')}
        >
          Choose Different Palette
        </Button>
        <Button 
          onClick={handleSaveProfile}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Saving...' : 'Save My Color Profile'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (step === 'analysis' && selectedPalette && colorAnalysis) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ColorSeasonResults analysis={colorAnalysis} palette={selectedPalette} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Palette className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Set Up Your Color Profile</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the palette that best matches your natural coloring to receive personalized 
            style recommendations based on professional color analysis.
          </p>
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Why we changed:</strong> We've replaced photo analysis with manual palette selection 
          for much more accurate results. Professional color consultants rely on this method for precision.
        </AlertDescription>
      </Alert>

      <PaletteSelection
        selectedPaletteId={selectedPalette?.id}
        onPaletteSelect={handlePaletteSelect}
        onContinue={handleContinueToAnalysis}
        showContinueButton={!!selectedPalette}
      />
    </div>
  );
};

export default ColorPaletteSetup;
