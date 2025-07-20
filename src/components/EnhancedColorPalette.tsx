import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Eye, 
  User, 
  Sparkles, 
  Info,
  Copy,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FacialColorProfile } from "@/lib/facialColorAnalysis";

interface EnhancedColorPaletteProps {
  colors: string[];
  facialProfile?: FacialColorProfile;
  onCopyColor?: (color: string) => void;
  onDownloadPalette?: () => void;
}

export const EnhancedColorPalette: React.FC<EnhancedColorPaletteProps> = ({
  colors,
  facialProfile,
  onCopyColor,
  onDownloadPalette
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      toast({
        title: "Color copied!",
        description: `${color} copied to clipboard`,
      });
      onCopyColor?.(color);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy color to clipboard",
        variant: "destructive",
      });
    }
  };

  const getSeasonBadgeColor = (season: string) => {
    const colorMap = {
      spring: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      summer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      autumn: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      winter: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    return colorMap[season as keyof typeof colorMap] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Main Color Palette */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Your Flattering Colors
              {facialProfile && (
                <Badge className={getSeasonBadgeColor(facialProfile.colorSeason.season)}>
                  {facialProfile.colorSeason.season} {Math.round(facialProfile.confidence * 100)}%
                </Badge>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadPalette}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Color Swatches Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {colors.map((color, index) => (
              <div
                key={index}
                className="group cursor-pointer"
                onClick={() => setSelectedColor(selectedColor === color ? null : color)}
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

      {/* Facial Analysis Details */}
      {facialProfile && (
        <>
          {/* Color Season Analysis */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Your Color Season
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {facialProfile.colorSeason.season.charAt(0).toUpperCase() + facialProfile.colorSeason.season.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {facialProfile.colorSeason.subSeason}
                    </div>
                    <Badge className={getSeasonBadgeColor(facialProfile.colorSeason.season)}>
                      {Math.round(facialProfile.colorSeason.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Your Characteristics</h4>
                  <div className="flex flex-wrap gap-2">
                    {facialProfile.colorSeason.characteristics.map((char, index) => (
                      <Badge key={index} variant="secondary">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facial Features Analysis */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Your Natural Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Skin Tone */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-border" 
                       style={{ backgroundColor: facialProfile.skinTone.dominantTone }}>
                  </div>
                  <h4 className="font-semibold">Skin Tone</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {facialProfile.skinTone.lightness} with {facialProfile.skinTone.undertone} undertones
                  </p>
                  <Badge variant="outline">
                    {Math.round(facialProfile.skinTone.confidence * 100)}% confident
                  </Badge>
                </div>

                {/* Hair Color */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-border" 
                       style={{ backgroundColor: facialProfile.hairColor.dominantColor }}>
                  </div>
                  <h4 className="font-semibold">Hair Color</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {facialProfile.hairColor.depth} {facialProfile.hairColor.tone}
                  </p>
                  <Badge variant="outline">
                    {Math.round(facialProfile.hairColor.confidence * 100)}% confident
                  </Badge>
                </div>

                {/* Eye Color */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-border flex items-center justify-center" 
                       style={{ backgroundColor: facialProfile.eyeColor.dominantColor }}>
                    <Eye className="h-6 w-6 text-white drop-shadow" />
                  </div>
                  <h4 className="font-semibold">Eye Color</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {facialProfile.eyeColor.pattern} pattern
                  </p>
                  <Badge variant="outline">
                    {Math.round(facialProfile.eyeColor.confidence * 100)}% confident
                  </Badge>
                </div>
              </div>

              {/* Color Swatches for Each Feature */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4">Detected Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Skin Colors</p>
                    <div className="flex gap-2">
                      {facialProfile.skinTone.hexColors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleCopyColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Hair Colors</p>
                    <div className="flex gap-2">
                      {facialProfile.hairColor.hexColors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleCopyColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Eye Colors</p>
                    <div className="flex gap-2">
                      {facialProfile.eyeColor.hexColors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleCopyColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Metadata */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-green-600" />
                Analysis Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(facialProfile.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Overall Confidence
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(facialProfile.metadata.faceDetectionAccuracy * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Face Detection
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(facialProfile.metadata.imageQuality * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Image Quality
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {facialProfile.flatteringColors.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recommended Colors
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Analysis completed on {new Date(facialProfile.metadata.analysisTimestamp).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
