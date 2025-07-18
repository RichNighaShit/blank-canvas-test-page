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

  const getBasicColorAnalysis = () => {
    if (!hasColors || colors.length === 0) return null;

    let totalBrightness = 0;
    let totalSaturation = 0;
    let validColors = 0;

    colors.forEach((color) => {
      if (!color || typeof color !== "string") return;

      try {
        // Simple brightness calculation
        const hex = color.replace("#", "");
        if (hex.length !== 6) return;

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) return;

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
