import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, invalidateProfileCache } from "@/hooks/useProfile";
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
  AlertTriangle,
} from "lucide-react";
import { ColorPaletteSetup } from "@/components/ColorPaletteSetup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PREDEFINED_COLOR_PALETTES, getPaletteById } from "@/data/predefinedColorPalettes";
import { colorSeasonAnalysisService, type ColorSeasonAnalysis } from "@/lib/colorSeasonAnalysis";

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 flex items-center justify-center">
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

  // Always recalculate color analysis based on current palette to ensure consistency
  const colorAnalysis: ColorSeasonAnalysis | null = selectedPalette
    ? colorSeasonAnalysisService.analyzeColorSeason(selectedPalette)
    : null;
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
      // Force a hard refresh by invalidating cache first
      if (user?.id) {
        invalidateProfileCache(user.id);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
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
                          onComplete={async () => {
                            setShowPaletteSelection(false);
                            // Force cache invalidation and refresh
                            if (user?.id) {
                              invalidateProfileCache(user.id);
                            }
                            // Wait a moment for state to settle
                            await new Promise(resolve => setTimeout(resolve, 100));
                            await refetch();
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

            {/* Enhanced Color Season Analysis Section */}
            {hasFullAnalysis && (
              <>
                {/* Main Season Analysis Card */}
                <Card className="card-premium bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 border-primary/20 shadow-lg">
                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                        Your Professional Color Analysis
                      </CardTitle>
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Based on your palette: <strong className="text-purple-700">{selectedPalette.name}</strong>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Enhanced Color Season Badge */}
                      <div className="text-center bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
                        <div className="mb-4">
                          <Badge className="text-xl px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">
                            {colorAnalysis.season.charAt(0).toUpperCase() + colorAnalysis.season.slice(1)} - {colorAnalysis.subSeason}
                          </Badge>
                        </div>
                        <p className="text-foreground/80 text-base leading-relaxed max-w-2xl mx-auto">
                          {colorAnalysis.description}
                        </p>
                      </div>

                      {/* Enhanced Natural Features Showcase */}
                      <div className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
                        <h4 className="text-lg font-semibold text-center mb-6 text-foreground">Your Natural Color Harmony</h4>
                        <div className="flex gap-8 justify-center items-center">
                          <div className="text-center">
                            <div className="relative">
                              <div
                                className="w-20 h-20 rounded-full border-4 border-white shadow-xl mx-auto mb-3 relative overflow-hidden"
                                style={{ backgroundColor: selectedPalette.skinTone.color }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
                              </div>
                              <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{selectedPalette.skinTone.undertone}</div>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-2">{selectedPalette.skinTone.name}</p>
                            <p className="text-xs text-muted-foreground">Skin Tone</p>
                          </div>
                          <div className="text-center">
                            <div className="relative">
                              <div
                                className="w-20 h-20 rounded-full border-4 border-white shadow-xl mx-auto mb-3 relative overflow-hidden"
                                style={{ backgroundColor: selectedPalette.hairColor.color }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
                              </div>
                              <div className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">{selectedPalette.hairColor.category}</div>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-2">{selectedPalette.hairColor.name}</p>
                            <p className="text-xs text-muted-foreground">Hair Color</p>
                          </div>
                          <div className="text-center">
                            <div className="relative">
                              <div
                                className="w-20 h-20 rounded-full border-4 border-white shadow-xl mx-auto mb-3 relative overflow-hidden"
                                style={{ backgroundColor: selectedPalette.eyeColor.color }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
                              </div>
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-full">{selectedPalette.eyeColor.category}</div>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-2">{selectedPalette.eyeColor.name}</p>
                            <p className="text-xs text-muted-foreground">Eye Color</p>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Characteristics Grid */}
                      <div className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
                        <h4 className="text-lg font-semibold text-center mb-6 text-foreground">Your Color Characteristics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border border-primary/30">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">C</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">Contrast</p>
                            <p className="capitalize text-primary font-medium text-lg">{colorAnalysis.characteristics.contrast}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {colorAnalysis.characteristics.contrast === 'high' ? 'Bold differences' :
                               colorAnalysis.characteristics.contrast === 'medium' ? 'Balanced blend' : 'Subtle harmony'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-xl border border-secondary/30">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">W</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">Warmth</p>
                            <p className="capitalize text-secondary font-medium text-lg">{colorAnalysis.characteristics.warmth}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {colorAnalysis.characteristics.warmth === 'warm' ? 'Golden undertones' :
                               colorAnalysis.characteristics.warmth === 'cool' ? 'Blue undertones' : 'Balanced tones'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-blue-100 dark:to-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">CL</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">Clarity</p>
                            <p className="capitalize text-blue-700 dark:text-blue-300 font-medium text-lg">{colorAnalysis.characteristics.clarity}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {colorAnalysis.characteristics.clarity === 'clear' ? 'Bright & vibrant' :
                               colorAnalysis.characteristics.clarity === 'soft' ? 'Gentle & blended' : 'Dusty & muted'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-indigo-100 dark:to-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">D</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">Depth</p>
                            <p className="capitalize text-indigo-700 dark:text-indigo-300 font-medium text-lg">{colorAnalysis.characteristics.depth}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {colorAnalysis.characteristics.depth === 'light' ? 'Delicate tones' :
                               colorAnalysis.characteristics.depth === 'medium' ? 'Balanced depth' : 'Rich & intense'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Ideal Colors Section */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Palette className="h-6 w-6 text-blue-600" />
                      Your Perfect Color Palette
                    </CardTitle>
                    <p className="text-muted-foreground">Colors that enhance your natural beauty and make you glow</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {colorAnalysis.idealColors.map((category, index) => (
                        <div key={index} className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-5 border border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                            <h3 className="font-semibold text-foreground">{category.category}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{category.description}</p>
                          <div className="grid grid-cols-6 gap-2">
                            {category.colors.map((color, colorIndex) => (
                              <div key={colorIndex} className="group relative">
                                <div
                                  className="w-full h-12 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg"
                                  style={{ backgroundColor: color }}
                                  title={`Click to copy ${color}`}
                                  onClick={() => handleCopyColor(color)}
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Copy className="w-2 h-2 text-gray-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Colors to Avoid Section */}
                {colorAnalysis.avoidColors && colorAnalysis.avoidColors.length > 0 && (
                  <Card className="card-premium border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 dark:from-red-950/30 to-orange-50 dark:to-orange-950/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl text-red-700">
                        <AlertTriangle className="h-6 w-6" />
                        Colors to Avoid
                      </CardTitle>
                      <p className="text-red-600 dark:text-red-400">These colors may wash you out or clash with your natural coloring</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {colorAnalysis.avoidColors.map((category, index) => (
                          <div key={index} className="bg-card/70 rounded-lg p-4 border border-red-100 dark:border-red-900/50">
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">{category.category}</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">{category.reason}</p>
                            <div className="flex flex-wrap gap-2">
                              {category.colors.map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="w-8 h-8 rounded border-2 border-red-200 opacity-75"
                                  style={{ backgroundColor: color }}
                                  title={`Avoid: ${color}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Professional Style Tips */}
                <Card className="card-premium bg-gradient-to-br from-green-50 dark:from-green-950/30 to-emerald-50 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                      <Sparkles className="h-6 w-6 text-green-600" />
                      Professional Styling Advice
                    </CardTitle>
                    <p className="text-green-700 dark:text-green-300">Expert tips to maximize your color harmony</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {colorAnalysis.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-card/70 rounded-lg border border-green-100 dark:border-green-900/50">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <p className="text-foreground/80 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Clothing & Makeup Recommendations */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Clothing Recommendations */}
                  <Card className="card-premium">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Heart className="h-6 w-6 text-pink-600" />
                        Wardrobe Colors
                      </CardTitle>
                      <p className="text-muted-foreground">Your perfect clothing color palette</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          Foundation Neutrals
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">Your wardrobe building blocks - use for 60% of your outfits</p>
                        <div className="grid grid-cols-8 gap-2">
                          {colorAnalysis.clothingRecommendations.neutrals.map((color, index) => (
                            <div key={index} className="group relative">
                              <div
                                className="w-full h-10 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Copy className="w-2 h-2 text-gray-600" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          Statement Accents
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">Bold colors that make you shine - use for 30% of your outfits</p>
                        <div className="grid grid-cols-8 gap-2">
                          {colorAnalysis.clothingRecommendations.accents.map((color, index) => (
                            <div key={index} className="group relative">
                              <div
                                className="w-full h-10 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Copy className="w-2 h-2 text-gray-600" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          Metallic Finishes
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">Jewelry and accessories that complement your coloring</p>
                        <div className="flex gap-3">
                          {colorAnalysis.clothingRecommendations.metallics === 'gold' && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-4 py-2">
                              🥇 Gold Tones
                            </Badge>
                          )}
                          {colorAnalysis.clothingRecommendations.metallics === 'silver' && (
                            <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800 px-4 py-2">
                              🥈 Silver Tones
                            </Badge>
                          )}
                          {colorAnalysis.clothingRecommendations.metallics === 'both' && (
                            <>
                              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-3 py-2">
                                🥇 Gold
                              </Badge>
                              <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800 px-3 py-2">
                                🥈 Silver
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Professional Wardrobe Formula */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          Wardrobe Formula
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">Professional color distribution for a balanced wardrobe</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-white/70 rounded-lg">
                            <div className="text-2xl font-bold text-indigo-600">{colorAnalysis.clothingRecommendations.wardrobeFormula.neutrals}%</div>
                            <div className="text-xs text-gray-600">Neutrals</div>
                          </div>
                          <div className="text-center p-3 bg-white/70 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{colorAnalysis.clothingRecommendations.wardrobeFormula.accents}%</div>
                            <div className="text-xs text-gray-600">Accents</div>
                          </div>
                          <div className="text-center p-3 bg-white/70 rounded-lg">
                            <div className="text-2xl font-bold text-pink-600">{colorAnalysis.clothingRecommendations.wardrobeFormula.statement}%</div>
                            <div className="text-xs text-gray-600">Statement</div>
                          </div>
                        </div>
                      </div>

                      {/* Style Personality */}
                      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                          Your Style Personality
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{colorAnalysis.clothingRecommendations.stylePersonality}</p>
                      </div>

                      {/* Best Fabrics */}
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                          Recommended Fabrics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {colorAnalysis.clothingRecommendations.bestFabrics.map((fabric, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {fabric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Makeup Recommendations */}
                  {colorAnalysis.makeupRecommendations && (
                    <Card className="card-premium">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Sparkles className="h-6 w-6 text-rose-600" />
                          Makeup Colors
                        </CardTitle>
                        <p className="text-muted-foreground">Cosmetic shades that enhance your features</p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Foundation */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Foundation Match</h4>
                          <p className="text-sm text-gray-600 mb-3">Your ideal foundation tone</p>
                          <div
                            className="w-full h-8 rounded-lg border-2 border-white shadow-md"
                            style={{ backgroundColor: colorAnalysis.makeupRecommendations.foundation }}
                          />
                          <p className="text-xs text-gray-500 mt-2">{colorAnalysis.makeupRecommendations.foundation}</p>
                        </div>

                        {/* Lip Colors */}
                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Lip Colors</h4>
                          <p className="text-sm text-gray-600 mb-3">Flattering lip shades</p>
                          <div className="grid grid-cols-4 gap-2">
                            {colorAnalysis.makeupRecommendations.lipColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-full h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Eye Colors */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Eye Colors</h4>
                          <p className="text-sm text-gray-600 mb-3">Eyeshadow and liner shades</p>
                          <div className="grid grid-cols-4 gap-2">
                            {colorAnalysis.makeupRecommendations.eyeColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-full h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Blush Colors */}
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Blush Colors</h4>
                          <p className="text-sm text-gray-600 mb-3">Cheek colors that add natural glow</p>
                          <div className="grid grid-cols-4 gap-2">
                            {colorAnalysis.makeupRecommendations.blushColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-full h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Eyebrow Color */}
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Eyebrow Color</h4>
                          <p className="text-sm text-gray-600 mb-3">Perfect brow shade to frame your eyes</p>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-16 h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: colorAnalysis.makeupRecommendations.eyebrowColor }}
                              title={`Copy ${colorAnalysis.makeupRecommendations.eyebrowColor}`}
                              onClick={() => handleCopyColor(colorAnalysis.makeupRecommendations.eyebrowColor)}
                            />
                            <span className="text-xs text-gray-500 font-mono">{colorAnalysis.makeupRecommendations.eyebrowColor}</span>
                          </div>
                        </div>

                        {/* Mascara & Eye Basics */}
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Eye Basics</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Mascara</p>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border-2 border-white shadow-md"
                                  style={{ backgroundColor: colorAnalysis.makeupRecommendations.mascara }}
                                />
                                <span className="text-xs text-gray-500 font-mono">{colorAnalysis.makeupRecommendations.mascara}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Highlighter</p>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                  style={{ backgroundColor: colorAnalysis.makeupRecommendations.highlighter }}
                                  onClick={() => handleCopyColor(colorAnalysis.makeupRecommendations.highlighter)}
                                />
                                <span className="text-xs text-gray-500 font-mono">{colorAnalysis.makeupRecommendations.highlighter}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nail Colors */}
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4">
                          <h4 className="font-semibold mb-2 text-gray-800">Nail Colors</h4>
                          <p className="text-sm text-gray-600 mb-3">Flattering nail polish shades</p>
                          <div className="grid grid-cols-4 gap-2">
                            {colorAnalysis.makeupRecommendations.nailColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-full h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                style={{ backgroundColor: color }}
                                title={`Copy ${color}`}
                                onClick={() => handleCopyColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Professional Color Analysis Insights */}
                <Card className="card-premium bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                      <Info className="h-6 w-6 text-blue-600" />
                      Professional Color Analysis Insights
                    </CardTitle>
                    <p className="text-blue-700">Expert-level analysis of your unique color harmony</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Color Harmony Analysis */}
                    <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Your Color Harmony
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{colorAnalysis.professionalInsights.colorHarmony}</p>
                    </div>

                    {/* Personal Branding */}
                    <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        Personal Branding
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{colorAnalysis.professionalInsights.personalBranding}</p>
                    </div>

                    {/* Photography Tips */}
                    <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-green-600" />
                        Photography Guidelines
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{colorAnalysis.professionalInsights.photographyTips}</p>
                    </div>

                    {/* Shopping Strategy */}
                    <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Smart Shopping Strategy
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{colorAnalysis.professionalInsights.shoppingStrategy}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Feature Analysis */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Sparkles className="h-6 w-6 text-amber-600" />
                      Detailed Feature Analysis
                    </CardTitle>
                    <p className="text-muted-foreground">Professional breakdown of your natural coloring</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-amber-800 mb-2">Skin Tone Analysis</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{colorAnalysis.detailedAnalysis.skinToneAnalysis}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-amber-800 mb-2">Hair Color Analysis</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{colorAnalysis.detailedAnalysis.hairColorAnalysis}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">Eye Color Analysis</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{colorAnalysis.detailedAnalysis.eyeColorAnalysis}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2">Overall Harmony</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{colorAnalysis.detailedAnalysis.overallHarmony}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Combinations */}
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Palette className="h-6 w-6 text-pink-600" />
                      Professional Color Combinations
                    </CardTitle>
                    <p className="text-muted-foreground">Expertly curated color combinations for different occasions</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {colorAnalysis.colorCombinations.map((combo, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">{combo.name}</h4>
                              <Badge variant="secondary" className="text-xs mt-1">{combo.occasion}</Badge>
                            </div>
                            <div className="flex gap-2">
                              {combo.colors.map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="w-8 h-8 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                  style={{ backgroundColor: color }}
                                  title={`Copy ${color}`}
                                  onClick={() => handleCopyColor(color)}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{combo.description}</p>
                        </div>
                      ))}
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
                    onComplete={async () => {
                      setShowPaletteSelection(false);
                      // Force cache invalidation and refresh
                      if (user?.id) {
                        invalidateProfileCache(user.id);
                      }
                      // Wait a moment for state to settle
                      await new Promise(resolve => setTimeout(resolve, 100));
                      await refetch();
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
