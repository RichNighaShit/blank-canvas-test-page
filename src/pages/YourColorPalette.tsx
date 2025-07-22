import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Copy,
  Download,
  RefreshCw,
  Camera,
  ArrowLeft,
  Info,
  Sparkles,
  Heart,
  Edit,
  Star,
} from "lucide-react";
import { ColorPaletteSetup } from "@/components/ColorPaletteSetup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PREDEFINED_COLOR_PALETTES, getPaletteById } from "@/data/predefinedColorPalettes";
import type { ColorSeasonAnalysis } from "@/lib/colorSeasonAnalysis";

const YourColorPalette = () => {
  // Cache busting effect
  useEffect(() => {
    // Force component remount if cache issues persist
    const cacheVersion = new Date().getTime();
    console.log('YourColorPalette loaded at:', cacheVersion);
  }, []);
  const [showPaletteSelection, setShowPaletteSelection] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Palette className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">
            Loading your color palette...
          </p>
        </div>
      </div>
    );
  }

  // Get selected palette and analysis first
  const selectedPalette = profile?.selected_palette_id ? getPaletteById(profile.selected_palette_id) : null;
  const colorAnalysis: ColorSeasonAnalysis | null = profile?.color_season_analysis || null;
  const hasFullAnalysis = selectedPalette && colorAnalysis;

  // Use selected palette colors if available, otherwise fall back to extracted colors
  const rawColors = Array.isArray(profile?.color_palette_colors) ? profile.color_palette_colors : [];
  const extractedColors = rawColors.filter(color =>
    color && typeof color === 'string' && color.match(/^#[0-9A-Fa-f]{6}$/)
  );

  // Prefer selected palette colors over extracted colors
  const colors = selectedPalette ? [
    selectedPalette.skinTone.color,
    selectedPalette.hairColor.color,
    selectedPalette.eyeColor.color
  ] : extractedColors;

  const hasColors = colors.length > 0;

    const handleCopyColor = async (color: string) => {
    try {
      if (!color || typeof color !== 'string') {
        throw new Error('Invalid color value');
      }
      await navigator.clipboard.writeText(color);
      toast({
        title: "Color copied!",
        description: `${color} copied to clipboard`,
      });
    } catch (error) {
      console.error('Copy color error:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy color to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPalette = () => {
    if (!hasColors) return;

    const paletteData = {
      colors,
      profile: profile?.display_name || "Your",
      extractedAt: new Date().toISOString(),
      colorCount: colors.length,
    };

    const blob = new Blob([JSON.stringify(paletteData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile?.display_name || "your"}-color-palette.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Palette downloaded!",
      description: "Your color palette has been saved as JSON",
    });
  };

  const handleRefreshPalette = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Palette refreshed!",
        description: "Your color palette has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh your palette",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };



    const getBasicColorAnalysis = () => {
    if (!hasColors || colors.length === 0) return null;

    let totalBrightness = 0;
    let totalSaturation = 0;
    let validColors = 0;

    colors.forEach((color) => {
      // Validate color input more thoroughly
      if (!color || typeof color !== "string" || !color.startsWith("#")) return;

      try {
        // Simple brightness calculation
        const hex = color.replace("#", "");
        if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) return;

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b) || r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return;

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        totalBrightness += brightness;

        // Simple saturation calculation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : ((max - min) / max) * 100;
        totalSaturation += saturation;

        validColors++;
      } catch (error) {
        console.warn("Error processing color:", color, error);
      }
    });

    if (validColors === 0) return null;

    const avgBrightness = Math.round(totalBrightness / validColors);
    const avgSaturation = Math.round(totalSaturation / validColors);

    return {
      avgBrightness,
      avgSaturation,
      colorCount: colors.length,
    };
  };

  const colorStats = getBasicColorAnalysis();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-heading bg-gradient-to-r from-purple-900 dark:from-purple-400 to-pink-700 dark:to-pink-400 bg-clip-text text-transparent mb-3">
              Your Color Palette
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedPalette ?
                `Your chosen color palette: ${selectedPalette.name}` :
                "Your actual skin tone, hair color, and eye color detected from your photo"
              }
            </p>
          </div>
        </div>

        {hasColors ? (
          <>
            {/* Main Color Display */}
            <Card className="card-premium mb-8">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                      <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Your Facial Feature Colors
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Dialog open={showPaletteSelection} onOpenChange={setShowPaletteSelection}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Change Palette
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Update Your Color Palette</DialogTitle>
                        </DialogHeader>
                        <ColorPaletteSetup
                          onComplete={() => {
                            setShowPaletteSelection(false);
                            window.location.reload(); // Refresh to show new palette
                          }}
                          showTitle={false}
                          embedded={true}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPalette}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPalette}
                      disabled={isRefreshing}
                      className="text-xs"
                    >
                      <RefreshCw
                        className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                                                                {/* Facial Feature Color Display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  {colors.slice(0, 3).map((color, index) => {
                    // Validate color is a string and looks like a hex color
                    if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
                      return null; // Skip invalid colors
                    }

                    // Use palette names if available, otherwise use generic labels
                    const defaultLabels = ["Skin Tone", "Hair Color", "Eye Color"];
                    const paletteLabels = selectedPalette ? [
                      selectedPalette.skinTone.name,
                      selectedPalette.hairColor.name,
                      selectedPalette.eyeColor.name
                    ] : defaultLabels;

                    const icons = ["👤", "💇", "👁️"];
                    const label = paletteLabels[index] || defaultLabels[index] || `Color ${index + 1}`;
                    const icon = icons[index] || "🎨";

                    return (
                      <div
                        key={index}
                        className="group cursor-pointer text-center"
                        onClick={() =>
                          setSelectedColor(selectedColor === color ? null : color)
                        }
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <div
                          className="w-24 h-24 mx-auto rounded-lg border-2 border-border transition-all duration-200 group-hover:scale-105 group-hover:border-primary shadow-md"
                          style={{ backgroundColor: color }}
                          role="button"
                          aria-label={`${label}: ${color}`}
                        />
                        <div className="mt-3">
                          <div className="font-semibold text-sm">{label}</div>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                            {color}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Color Details */}
                {selectedColor && (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-lg border"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">Color Sample</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Hex: {selectedColor}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyColor(selectedColor)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Basic Color Statistics */}
            {colorStats && (
              <Card className="card-premium mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Palette Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {colorStats.avgBrightness}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Brightness
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">
                        {colorStats.avgSaturation}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Saturation
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {colorStats.colorCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Colors
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Use Section */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  How to Use Your Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Outfit Recommendations</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPalette ?
                        "These are your chosen palette colors that match your natural coloring. Use these as reference for choosing clothing and makeup that complements your features." :
                        "These are your actual detected facial feature colors: skin tone, hair color, and eye color. Use these as reference for choosing clothing and makeup that complements your natural coloring."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Copy className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Shopping Reference</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy hex codes to match colors when shopping online or
                      show this palette to stylists and shopping assistants.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Digital Usage</h4>
                    <p className="text-sm text-muted-foreground">
                      Download your palette data for use in design software,
                      personal branding, or sharing with designers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Season Analysis Section */}
            {hasFullAnalysis && (
              <>
                <Card className="card-premium bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-600" />
                      Your Professional Color Analysis
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Based on your selected palette: <strong>{selectedPalette.name}</strong>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Color Season Badge */}
                      <div className="text-center">
                        <Badge variant="secondary" className="text-lg px-4 py-2 bg-purple-100 text-purple-800">
                          {colorAnalysis.season.charAt(0).toUpperCase() + colorAnalysis.season.slice(1)} - {colorAnalysis.subSeason}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          {colorAnalysis.description}
                        </p>
                      </div>

                      {/* Characteristics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="font-medium text-gray-700">Contrast</p>
                          <p className="capitalize text-purple-600">{colorAnalysis.characteristics.contrast}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="font-medium text-gray-700">Warmth</p>
                          <p className="capitalize text-purple-600">{colorAnalysis.characteristics.warmth}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="font-medium text-gray-700">Clarity</p>
                          <p className="capitalize text-purple-600">{colorAnalysis.characteristics.clarity}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="font-medium text-gray-700">Depth</p>
                          <p className="capitalize text-purple-600">{colorAnalysis.characteristics.depth}</p>
                        </div>
                      </div>

                      {/* Your Natural Features */}
                      <div>
                        <h4 className="font-medium mb-3">Your Natural Features</h4>
                        <div className="flex gap-6 justify-center">
                          <div className="text-center">
                            <div
                              className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2"
                              style={{ backgroundColor: selectedPalette.skinTone.color }}
                            />
                            <p className="text-sm font-medium">{selectedPalette.skinTone.name}</p>
                            <p className="text-xs text-gray-500">Skin</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2"
                              style={{ backgroundColor: selectedPalette.hairColor.color }}
                            />
                            <p className="text-sm font-medium">{selectedPalette.hairColor.name}</p>
                            <p className="text-xs text-gray-500">Hair</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-16 h-16 rounded-full border-4 border-white shadow-lg mx-auto mb-2"
                              style={{ backgroundColor: selectedPalette.eyeColor.color }}
                            />
                            <p className="text-sm font-medium">{selectedPalette.eyeColor.name}</p>
                            <p className="text-xs text-gray-500">Eyes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ideal Colors Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {colorAnalysis.idealColors.map((category, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {category.colors.map((color, colorIndex) => (
                            <div
                              key={colorIndex}
                              className="w-8 h-8 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                              onClick={() => handleCopyColor(color)}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Professional Style Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Professional Style Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {colorAnalysis.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Clothing Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Clothing Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Best Neutral Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {colorAnalysis.clothingRecommendations.neutrals.map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                              onClick={() => handleCopyColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Best Accent Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {colorAnalysis.clothingRecommendations.accents.map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                              onClick={() => handleCopyColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Best Metals</h4>
                        <Badge variant="outline">
                          {colorAnalysis.clothingRecommendations.metallics === 'gold' ? '🥇 Gold' :
                           colorAnalysis.clothingRecommendations.metallics === 'silver' ? '🥈 Silver' :
                           '🥇🥈 Both Gold & Silver'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          /* No Colors State */
          <Card className="card-premium text-center">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Palette className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Choose Your Color Palette
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Select the color palette that best matches your natural coloring to get personalized style recommendations.
              </p>
              <Dialog open={showPaletteSelection} onOpenChange={setShowPaletteSelection}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Palette className="h-4 w-4 mr-2" />
                    Choose Color Palette
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Choose Your Color Palette</DialogTitle>
                  </DialogHeader>
                  <ColorPaletteSetup
                    onComplete={() => {
                      setShowPaletteSelection(false);
                      window.location.reload(); // Refresh to show new palette
                    }}
                    showTitle={false}
                    embedded={true}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default YourColorPalette;
