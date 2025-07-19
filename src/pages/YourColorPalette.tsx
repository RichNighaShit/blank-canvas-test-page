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
  Eye,
  RefreshCw,
  Camera,
  ArrowLeft,
  Info,
  Sparkles,
  Heart,
} from "lucide-react";

const YourColorPalette = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isRegeneratingColors, setIsRegeneratingColors] = useState(false);

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

  const colors = profile?.color_palette_colors || [];
  const hasColors = colors.length > 0;

  const handleCopyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      toast({
        title: "Color copied!",
        description: `${color} copied to clipboard`,
      });
    } catch (error) {
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

  const handleRegenerateColors = async () => {
    if (!profile?.face_photo_url) {
      toast({
        title: "No photo available",
        description: "Please upload a profile picture first",
        variant: "destructive",
      });
      return;
    }

    setIsRegeneratingColors(true);
    try {
      // For now, just show a message - we'll implement the actual regeneration later
      toast({
        title: "Feature coming soon!",
        description: "Color regeneration will be available soon",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Unable to extract new colors from your photo",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingColors(false);
    }
  };

  const getColorName = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return "Unknown";

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const [h, s, l] = hsl;

    // More sophisticated color naming
    if (l < 15) return "Very Dark";
    if (l > 90) return "Very Light";
    if (s < 10) return "Gray";

    const hue = Math.round(h);
    if (hue < 15 || hue > 345) return "Red";
    if (hue < 45) return "Orange";
    if (hue < 75) return "Yellow";
    if (hue < 105) return "Yellow-Green";
    if (hue < 135) return "Green";
    if (hue < 165) return "Blue-Green";
    if (hue < 195) return "Cyan";
    if (hue < 225) return "Blue";
    if (hue < 255) return "Blue-Purple";
    if (hue < 285) return "Purple";
    if (hue < 315) return "Magenta";
    return "Pink";
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHsl = (
    r: number,
    g: number,
    b: number,
  ): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };

  const getComprehensiveColorAnalysis = () => {
    if (!hasColors) return null;

    const colorData = colors
      .map((color) => {
        const rgb = hexToRgb(color);
        if (!rgb) return null;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const [h, s, l] = hsl;

        return {
          hex: color,
          rgb,
          hsl,
          name: getColorName(color),
        };
      })
      .filter(Boolean);

    if (colorData.length === 0) return null;

    // Calculate averages with proper HSL values
    const avgBrightness =
      colorData.reduce((sum, c) => sum + c.hsl[2], 0) / colorData.length;
    const avgSaturation =
      colorData.reduce((sum, c) => sum + c.hsl[1], 0) / colorData.length;
    const avgHue =
      colorData.reduce((sum, c) => sum + c.hsl[0], 0) / colorData.length;

    // Determine color temperature
    const warmColors = colorData.filter((c) => {
      const h = c.hsl[0];
      return (h >= 0 && h <= 60) || (h >= 300 && h <= 360);
    });
    const coolColors = colorData.filter((c) => {
      const h = c.hsl[0];
      return h >= 180 && h <= 300;
    });

    const temperature =
      warmColors.length > coolColors.length
        ? "Warm"
        : coolColors.length > warmColors.length
          ? "Cool"
          : "Neutral";

    // Determine undertones
    let undertone = "Neutral";
    if (avgHue >= 0 && avgHue <= 30) undertone = "Golden";
    else if (avgHue >= 30 && avgHue <= 60) undertone = "Peachy";
    else if (avgHue >= 180 && avgHue <= 240) undertone = "Cool Blue";
    else if (avgHue >= 240 && avgHue <= 300) undertone = "Cool Purple";
    else if (avgHue >= 300 && avgHue <= 360) undertone = "Rosy";

    // Determine season
    let season = "Universal";
    if (temperature === "Warm" && avgBrightness > 60) season = "Spring";
    else if (temperature === "Warm" && avgBrightness <= 60) season = "Autumn";
    else if (temperature === "Cool" && avgBrightness > 60) season = "Summer";
    else if (temperature === "Cool" && avgBrightness <= 60) season = "Winter";

    // Calculate contrast level
    const maxL = Math.max(...colorData.map((c) => c.hsl[2]));
    const minL = Math.min(...colorData.map((c) => c.hsl[2]));
    const contrastLevel = maxL - minL;

    // Determine palette personality
    let personality = "Balanced";
    if (avgSaturation > 70) personality = "Vibrant & Bold";
    else if (avgSaturation < 30) personality = "Soft & Muted";
    else if (contrastLevel > 50) personality = "High Contrast";
    else if (contrastLevel < 20) personality = "Monochromatic";

    return {
      avgBrightness: Math.round(avgBrightness),
      avgSaturation: Math.round(avgSaturation),
      avgHue: Math.round(avgHue),
      temperature,
      undertone,
      season,
      personality,
      contrastLevel: Math.round(contrastLevel),
      colorData,
      colorDiversity: colorData.length,
      dominantColorFamily: getColorName(colors[0]), // Most prominent color
    };
  };

  const colorAnalysis = getComprehensiveColorAnalysis();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
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
            <h1 className="text-3xl md:text-4xl font-heading bg-gradient-to-r from-purple-900 dark:from-purple-400 to-pink-700 dark:to-pink-400 bg-clip-text text-transparent">
              Your Color Palette
            </h1>
            <p className="text-muted-foreground mt-2">
              Colors extracted from your profile picture
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
                    Your Colors
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
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
                      onClick={handleRegenerateColors}
                      disabled={isRegeneratingColors}
                      className="text-xs"
                    >
                      <RefreshCw
                        className={`h-3 w-3 mr-1 ${isRegeneratingColors ? "animate-spin" : ""}`}
                      />
                      {isRegeneratingColors ? "Extracting..." : "Regenerate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Color Swatches Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer"
                      onClick={() =>
                        setSelectedColor(selectedColor === color ? null : color)
                      }
                    >
                      <div
                        className="w-full aspect-square rounded-lg border-2 border-border transition-all duration-200 group-hover:scale-105 group-hover:border-primary shadow-md"
                        style={{ backgroundColor: color }}
                        role="button"
                        aria-label={`Color ${color}`}
                      />
                      <div className="mt-2 text-center">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                          {color}
                        </code>
                      </div>
                    </div>
                  ))}
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
                          <h3 className="font-semibold">
                            {getColorName(selectedColor)}
                          </h3>
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

            {/* Color Statistics */}
            {colorAnalysis && (
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
                        {colorAnalysis.avgBrightness}%
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
                        {colorStats.colorDiversity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Color Diversity
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
                      These colors are automatically used to enhance your outfit
                      recommendations, ensuring suggestions complement your
                      natural coloring.
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
          </>
        ) : (
          /* No Colors State */
          <Card className="card-premium text-center">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                No Color Palette Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload a profile picture to automatically extract your
                personalized color palette. These colors will enhance your
                outfit recommendations.
              </p>
              <Button
                onClick={() => navigate("/edit-profile")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload Profile Picture
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default YourColorPalette;
