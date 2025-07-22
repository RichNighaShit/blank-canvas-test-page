import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle, Palette } from 'lucide-react';
import { PREDEFINED_COLOR_PALETTES, getAllCategories, getPalettesByCategory, type ColorPalette } from '@/data/predefinedColorPalettes';

interface PaletteSelectionProps {
  selectedPaletteId?: string;
  onPaletteSelect: (palette: ColorPalette) => void;
  onContinue: () => void;
  showContinueButton?: boolean;
  saving?: boolean;
  saveProgress?: { step: string; progress: number };
}

export const PaletteSelection: React.FC<PaletteSelectionProps> = ({
  selectedPaletteId,
  onPaletteSelect,
  onContinue,
  showContinueButton = true
}) => {
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [activeCategory, setActiveCategory] = useState('very-fair');

  const categories = getAllCategories();

  useEffect(() => {
    if (selectedPaletteId) {
      const palette = PREDEFINED_COLOR_PALETTES.find(p => p.id === selectedPaletteId);
      if (palette) {
        setSelectedPalette(palette);
        setActiveCategory(palette.category);
      }
    }
  }, [selectedPaletteId]);

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    onPaletteSelect(palette);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'very-fair': 'Very Fair',
      'fair': 'Fair',
      'light': 'Light',
      'medium': 'Medium',
      'olive': 'Olive',
      'tan': 'Tan',
      'dark': 'Dark',
      'deep': 'Deep'
    };
    return labels[category] || category;
  };

  const PaletteCard: React.FC<{ palette: ColorPalette; isSelected: boolean }> = ({ palette, isSelected }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={() => handlePaletteSelect(palette)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{palette.name}</CardTitle>
          {isSelected && <CheckCircle className="h-5 w-5 text-blue-500" />}
        </div>
        <CardDescription className="text-xs">{palette.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Color Preview */}
          <div className="flex gap-2">
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-200" 
              style={{ backgroundColor: palette.skinTone.color }}
              title={`Skin: ${palette.skinTone.name}`}
            />
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-200" 
              style={{ backgroundColor: palette.hairColor.color }}
              title={`Hair: ${palette.hairColor.name}`}
            />
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-200" 
              style={{ backgroundColor: palette.eyeColor.color }}
              title={`Eyes: ${palette.eyeColor.name}`}
            />
          </div>

          {/* Feature Details */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Skin:</span>
              <span className="font-medium">{palette.skinTone.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hair:</span>
              <span className="font-medium">{palette.hairColor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Eyes:</span>
              <span className="font-medium">{palette.eyeColor.name}</span>
            </div>
          </div>

          {/* Color Season Badge */}
          <Badge variant="secondary" className="text-xs">
            {palette.colorSeason.charAt(0).toUpperCase() + palette.colorSeason.slice(1)} Season
          </Badge>

          {/* Complementary Colors Preview */}
          <div className="flex gap-1">
            {palette.complementaryColors.slice(0, 6).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Palette className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Choose Your Color Palette</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the palette that best matches your natural coloring for the most accurate style recommendations. 
          You can change this anytime in your profile settings.
        </p>
      </div>

      {/* Instructions Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How to choose:</strong> Look in a mirror under natural light and select the palette that most closely matches 
          your skin tone, hair color, and eye color. When in doubt, choose the closest match - you can always change it later!
        </AlertDescription>
      </Alert>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {getCategoryLabel(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getPalettesByCategory(category).map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  isSelected={selectedPalette?.id === palette.id}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected Palette Summary */}
      {selectedPalette && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Selected: {selectedPalette.name}
            </CardTitle>
            <CardDescription>
              {selectedPalette.description} • {selectedPalette.colorSeason.charAt(0).toUpperCase() + selectedPalette.colorSeason.slice(1)} Season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm mx-auto mb-1" 
                    style={{ backgroundColor: selectedPalette.skinTone.color }}
                  />
                  <p className="text-xs font-medium">{selectedPalette.skinTone.name}</p>
                  <p className="text-xs text-gray-500">Skin</p>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm mx-auto mb-1" 
                    style={{ backgroundColor: selectedPalette.hairColor.color }}
                  />
                  <p className="text-xs font-medium">{selectedPalette.hairColor.name}</p>
                  <p className="text-xs text-gray-500">Hair</p>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm mx-auto mb-1" 
                    style={{ backgroundColor: selectedPalette.eyeColor.color }}
                  />
                  <p className="text-xs font-medium">{selectedPalette.eyeColor.name}</p>
                  <p className="text-xs text-gray-500">Eyes</p>
                </div>
              </div>
              
              {showContinueButton && (
                <Button onClick={onContinue} size="lg">
                  Continue with This Palette
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Instructions */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Can't find an exact match? Choose the closest option. You can always update your palette later in Settings.
        </p>
      </div>
    </div>
  );
};

export default PaletteSelection;
