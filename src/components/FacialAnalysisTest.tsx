import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { facialColorAnalysisService, FacialColorProfile } from "@/lib/facialColorAnalysis";
import { performanceOptimizedFacialAnalysis } from "@/lib/performanceOptimizedFacialAnalysis";
import { EnhancedColorPalette } from "./EnhancedColorPalette";

export const FacialAnalysisTest: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    colors: string[];
    facialProfile?: FacialColorProfile;
    analysisTime: number;
    method: "standard" | "optimized" | "quick";
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
    }
  };

  const testStandardAnalysis = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      setProgress(20);
      const facialProfile = await facialColorAnalysisService.analyzeFacialColors(selectedFile);
      setProgress(80);
      
      const analysisTime = Date.now() - startTime;
      setResults({
        colors: facialProfile.flatteringColors,
        facialProfile,
        analysisTime,
        method: "standard"
      });
      
      setProgress(100);
      toast({
        title: "✅ Standard Analysis Complete",
        description: `Completed in ${analysisTime}ms with ${Math.round(facialProfile.confidence * 100)}% confidence`
      });
    } catch (error) {
      console.error("Standard analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Standard facial analysis encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const testOptimizedAnalysis = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      const facialProfile = await performanceOptimizedFacialAnalysis.analyzeFacialColorsOptimized(
        selectedFile,
        {
          progressCallback: setProgress,
          enableCaching: true,
          useWebWorker: false, // Disable web worker for this test
          maxImageSize: 600 * 400
        }
      );
      
      const analysisTime = Date.now() - startTime;
      setResults({
        colors: facialProfile.flatteringColors,
        facialProfile,
        analysisTime,
        method: "optimized"
      });
      
      toast({
        title: "⚡ Optimized Analysis Complete",
        description: `Completed in ${analysisTime}ms with ${Math.round(facialProfile.confidence * 100)}% confidence`
      });
    } catch (error) {
      console.error("Optimized analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Optimized facial analysis encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const testQuickRecommendations = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      setProgress(50);
      const colors = await performanceOptimizedFacialAnalysis.getQuickColorRecommendations(
        selectedFile,
        { count: 12 }
      );
      setProgress(90);
      
      const analysisTime = Date.now() - startTime;
      setResults({
        colors,
        analysisTime,
        method: "quick"
      });
      
      setProgress(100);
      toast({
        title: "🚀 Quick Analysis Complete",
        description: `Completed in ${analysisTime}ms with basic color detection`
      });
    } catch (error) {
      console.error("Quick analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Quick color recommendations encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧬 Facial Color Analysis Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select a face photo for testing:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {/* Test Buttons */}
          {selectedFile && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={testStandardAnalysis}
                disabled={isAnalyzing}
                variant="default"
              >
                {isAnalyzing && results?.method === "standard" ? "Analyzing..." : "Test Standard Analysis"}
              </Button>
              
              <Button
                onClick={testOptimizedAnalysis}
                disabled={isAnalyzing}
                variant="secondary"
              >
                {isAnalyzing && results?.method === "optimized" ? "Analyzing..." : "Test Optimized Analysis"}
              </Button>
              
              <Button
                onClick={testQuickRecommendations}
                disabled={isAnalyzing}
                variant="outline"
              >
                {isAnalyzing && results?.method === "quick" ? "Analyzing..." : "Test Quick Recommendations"}
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Cache Stats */}
          <div className="text-sm text-muted-foreground">
            <strong>Cache Stats:</strong> {JSON.stringify(performanceOptimizedFacialAnalysis.getCacheStats())}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Analysis Results
                <Badge variant="secondary">
                  {results.method} - {results.analysisTime}ms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-4">
                {results.colors.map((color, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              {results.facialProfile && (
                <div className="text-sm space-y-1">
                  <p><strong>Skin:</strong> {results.facialProfile.skinTone.lightness} {results.facialProfile.skinTone.undertone}</p>
                  <p><strong>Hair:</strong> {results.facialProfile.hairColor.depth} {results.facialProfile.hairColor.tone}</p>
                  <p><strong>Eyes:</strong> {results.facialProfile.eyeColor.pattern}</p>
                  <p><strong>Season:</strong> {results.facialProfile.colorSeason.season} ({results.facialProfile.colorSeason.subSeason})</p>
                  <p><strong>Confidence:</strong> {Math.round(results.facialProfile.confidence * 100)}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Palette Display */}
          {results.facialProfile && (
            <EnhancedColorPalette
              colors={results.colors}
              facialProfile={results.facialProfile}
            />
          )}
        </div>
      )}
    </div>
  );
};
