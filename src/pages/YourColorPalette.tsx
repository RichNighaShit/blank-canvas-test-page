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
  Crown,
  Star,
  Zap,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  Users,
  CheckCircle,
  ArrowRight,
  Gem,
  Sun,
  Moon,
  Leaf,
  Snowflake,
  BarChart3,
} from "lucide-react";
import { AdvancedColorTheory } from "@/lib/advancedColorTheory";

const YourColorPalette = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isRegeneratingColors, setIsRegeneratingColors] = useState(false);
  const [colorAnalysis, setColorAnalysis] = useState<any>(null);
  const [seasonalProfile, setSeasonalProfile] = useState<any>(null);

  const advancedColorTheory = new AdvancedColorTheory();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile?.color_palette_colors?.length > 0) {
      analyzeColors();
    }
  }, [profile?.color_palette_colors]);

  const analyzeColors = () => {
    if (!profile?.color_palette_colors) return;

    const colors = profile.color_palette_colors;
    
    // Advanced color analysis
    const analysis = {
      dominantColor: colors[0] || "#000000",
      colorFamily: advancedColorTheory.analyzeColor(colors[0] || "#000000").colorFamily,
      temperature: advancedColorTheory.analyzeColor(colors[0] || "#000000").temperature,
      intensity: advancedColorTheory.analyzeColor(colors[0] || "#000000").intensity,
      saturation: advancedColorTheory.analyzeColor(colors[0] || "#000000").saturation,
      harmonyAnalysis: advancedColorTheory.findBestHarmony(colors),
      seasonalMatch: getSeasonalMatch(colors),
      styleRecommendations: generateStyleRecommendations(colors),
      colorPsychology: getColorPsychology(colors[0] || "#000000"),
    };

    setColorAnalysis(analysis);
    setSeasonalProfile(advancedColorTheory.getCurrentSeasonalPalette());
  };

  const getSeasonalMatch = (colors: string[]) => {
    const seasonalPalettes = {
      spring: ["coral", "peach", "yellow", "lime", "turquoise", "pink", "gold"],
      summer: ["lavender", "rose", "sage", "powder blue", "mint", "pearl"],
      autumn: ["rust", "burgundy", "forest", "gold", "brown", "orange"],
      winter: ["navy", "crimson", "emerald", "silver", "white", "black"],
    };

    let bestMatch = "spring";
    let highestScore = 0;

    Object.entries(seasonalPalettes).forEach(([season, palette]) => {
      const score = colors.filter(color => 
        palette.some(paletteColor => 
          color.toLowerCase().includes(paletteColor.toLowerCase())
        )
      ).length;
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = season;
      }
    });

    return { season: bestMatch, confidence: highestScore / colors.length };
  };

  const generateStyleRecommendations = (colors: string[]) => {
    const recommendations = [];
    
    if (colors.some(color => ["black", "navy", "charcoal"].includes(color.toLowerCase()))) {
      recommendations.push("Classic & Sophisticated");
    }
    
    if (colors.some(color => ["coral", "pink", "yellow"].includes(color.toLowerCase()))) {
      recommendations.push("Bold & Expressive");
    }
    
    if (colors.some(color => ["sage", "mint", "lavender"].includes(color.toLowerCase()))) {
      recommendations.push("Elegant & Refined");
    }
    
    if (colors.some(color => ["rust", "burgundy", "olive"].includes(color.toLowerCase()))) {
      recommendations.push("Warm & Earthy");
    }

    return recommendations.length > 0 ? recommendations : ["Versatile & Timeless"];
  };

  const getColorPsychology = (dominantColor: string) => {
    const psychology = {
      black: "Power, sophistication, and timeless elegance",
      white: "Purity, clarity, and fresh simplicity",
      red: "Energy, confidence, and passionate expression",
      blue: "Trust, stability, and calm professionalism",
      green: "Growth, harmony, and natural balance",
      yellow: "Optimism, creativity, and cheerful energy",
      purple: "Luxury, creativity, and spiritual depth",
      pink: "Compassion, romance, and gentle strength",
      orange: "Adventure, enthusiasm, and warm energy",
      brown: "Reliability, comfort, and grounded wisdom",
    };

    const colorName = dominantColor.toLowerCase();
    for (const [color, meaning] of Object.entries(psychology)) {
      if (colorName.includes(color)) {
        return meaning;
      }
    }

    return "Versatile and adaptable to any style";
  };

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
      analysis: colorAnalysis,
      seasonalProfile,
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
      description: "Your comprehensive color palette has been saved",
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
        description: "Advanced color regeneration will be available soon",
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
        const hex = color.replace("#", "");
        if (hex.length !== 6) return;

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) return;

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        totalBrightness += brightness;

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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Premium Header Section */}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-heading bg-gradient-to-r from-purple-900 dark:from-purple-400 via-pink-700 dark:via-pink-400 to-purple-600 dark:to-purple-300 bg-clip-text text-transparent mb-2">
                  Your Personal Color Palette
                </h1>
                <p className="text-xl text-muted-foreground">
                  AI-Powered Color Analysis & Style Recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {hasColors ? (
          <>
            {/* Executive Summary */}
            <Card className="card-premium mb-8 border-0 shadow-elegant bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-heading bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                        Executive Color Profile
                      </CardTitle>
                      <p className="text-muted-foreground">
                        Professional analysis of your unique color signature
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPalette}
                      className="text-xs bg-white/80 backdrop-blur-sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateColors}
                      disabled={isRegeneratingColors}
                      className="text-xs bg-white/80 backdrop-blur-sm"
                    >
                      <RefreshCw
                        className={`h-3 w-3 mr-1 ${isRegeneratingColors ? "animate-spin" : ""}`}
                      />
                      {isRegeneratingColors ? "Analyzing..." : "Reanalyze"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Color Swatches Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer"
                      onClick={() =>
                        setSelectedColor(selectedColor === color ? null : color)
                      }
                    >
                      <div
                        className="w-full aspect-square rounded-xl border-2 border-border transition-all duration-300 group-hover:scale-110 group-hover:border-primary shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: color }}
                        role="button"
                        aria-label={`Color ${color}`}
                      />
                      <div className="mt-3 text-center">
                        <code className="text-xs font-mono bg-muted/80 backdrop-blur-sm px-2 py-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
                          {color}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Color Details */}
                {selectedColor && (
                  <Card className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 border-dashed border-purple-200 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div
                          className="w-20 h-20 rounded-xl border-2 border-purple-200 shadow-lg"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">Color Analysis</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Hex: {selectedColor}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyColor(selectedColor)}
                              className="bg-white/80 backdrop-blur-sm"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/80 backdrop-blur-sm"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Advanced Color Analysis */}
            {colorAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Color Psychology & Style */}
                <Card className="card-premium border-0 shadow-elegant bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-heading bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                          Color Psychology & Style
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Understanding your color personality
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 rounded-lg backdrop-blur-sm">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Color Personality
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {colorAnalysis.colorPsychology}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-lg backdrop-blur-sm">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        Style Recommendations
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {colorAnalysis.styleRecommendations.map((style: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-white/80 backdrop-blur-sm">
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-lg backdrop-blur-sm">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Color Characteristics
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Temperature:</span>
                          <span className="ml-2 capitalize font-medium">{colorAnalysis.temperature}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Intensity:</span>
                          <span className="ml-2 capitalize font-medium">{colorAnalysis.intensity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saturation:</span>
                          <span className="ml-2 capitalize font-medium">{colorAnalysis.saturation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Family:</span>
                          <span className="ml-2 capitalize font-medium">{colorAnalysis.colorFamily}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seasonal Color Harmony */}
                <Card className="card-premium border-0 shadow-elegant bg-gradient-to-br from-white/90 to-orange-50/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-heading bg-gradient-to-r from-orange-700 to-yellow-600 bg-clip-text text-transparent">
                          Seasonal Color Harmony
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Your colors across the seasons
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-orange-50/80 to-yellow-50/80 rounded-lg backdrop-blur-sm">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sun className="h-4 w-4 text-orange-500" />
                        Best Seasonal Match
                      </h4>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm capitalize">
                          {colorAnalysis.seasonalMatch.season}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(colorAnalysis.seasonalMatch.confidence * 100)}% match
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-lg backdrop-blur-sm">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Color Harmony Analysis
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Harmony Type:</span>
                          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm capitalize">
                            {colorAnalysis.harmonyAnalysis.harmonyType}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <span className="text-sm font-medium">
                            {Math.round(colorAnalysis.harmonyAnalysis.confidence * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Harmonious:</span>
                          <div className="flex items-center gap-1">
                            {colorAnalysis.harmonyAnalysis.isHarmonious ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-red-500" />
                            )}
                            <span className="text-sm font-medium">
                              {colorAnalysis.harmonyAnalysis.isHarmonious ? "Yes" : "Needs Balance"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {seasonalProfile && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-lg backdrop-blur-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Snowflake className="h-4 w-4 text-emerald-500" />
                          Current Season Palette
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {seasonalProfile.palette.slice(0, 6).map((color: string, index: number) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Professional Color Statistics */}
            {colorStats && (
              <Card className="card-premium mb-8 border-0 shadow-elegant bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-heading bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                        Professional Color Metrics
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Advanced analysis of your color composition
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {colorStats.avgBrightness}%
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Average Brightness
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {colorStats.avgBrightness > 70 ? "Light & Bright" : 
                         colorStats.avgBrightness > 40 ? "Balanced" : "Deep & Rich"}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {colorStats.avgSaturation}%
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Average Saturation
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {colorStats.avgSaturation > 60 ? "Vibrant & Bold" : 
                         colorStats.avgSaturation > 30 ? "Moderate" : "Muted & Subtle"}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {colorStats.colorCount}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Color Diversity
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {colorStats.colorCount > 5 ? "Rich Variety" : 
                         colorStats.colorCount > 3 ? "Good Range" : "Focused Palette"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Style Application Guide */}
            <Card className="card-premium border-0 shadow-elegant bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                      Professional Style Application
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      How to use your colors for maximum impact
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Outfit Recommendations</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        These colors are automatically integrated into your AI-powered outfit recommendations, 
                        ensuring every suggestion complements your natural coloring and personal style preferences.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Copy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Shopping Reference</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Use these hex codes when shopping online or show this professional palette to 
                        stylists and personal shoppers for perfectly matched clothing and accessories.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Digital Applications</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Export your comprehensive color data for use in design software, 
                        personal branding projects, or sharing with professional designers.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Professional Networking</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Share your color profile with fashion consultants, makeup artists, 
                        and stylists for cohesive personal branding and style development.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Premium No Colors State */
          <Card className="card-premium text-center border-0 shadow-elegant bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm">
            <CardContent className="p-16">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Camera className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-heading mb-4 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                Discover Your Color Signature
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Upload a profile picture to unlock your personalized color palette with 
                advanced AI analysis and professional style recommendations.
              </p>
              <Button
                onClick={() => navigate("/edit-profile")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                size="lg"
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
