import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, Palette, Eye, User } from 'lucide-react';
import { analyzeUserColors, getAccuracyDescription, isColorWellDetected } from '@/lib/colorAnalysisUtils';
import type { AccurateColorAnalysis } from '@/lib/accurateColorPaletteService';

interface ColorAnalysisTestProps {
  onAnalysisComplete?: (analysis: AccurateColorAnalysis) => void;
}

export default function ColorAnalysisTest({ onAnalysisComplete }: ColorAnalysisTestProps) {
  const [analysis, setAnalysis] = useState<AccurateColorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select an image under 10MB');
      return;
    }

    setError(null);
    setSelectedImage(URL.createObjectURL(file));
    setIsAnalyzing(true);

    try {
      console.log('🚀 Starting enhanced color analysis...');
      const result = await analyzeUserColors(file);
      
      console.log('✅ Analysis completed:', {
        skinTone: result.facialFeatures.skinTone.description,
        hairColor: result.facialFeatures.hairColor.description,
        eyeColor: result.facialFeatures.eyeColor.description,
        accuracy: `${result.colorProfile.accuracyMetrics.overallAccuracy}%`
      });
      
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('❌ Color analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('model') || errorMessage.includes('face-api')) {
        setError('Face detection models are loading. The analysis will use fallback color extraction methods. Please try again in a moment.');
      } else {
        setError('Failed to analyze colors. Please try again with a different image.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderColorSwatch = (color: string, label: string) => (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{color}</div>
      </div>
    </div>
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Enhanced Color Analysis Test
          </CardTitle>
          <CardDescription>
            Test the improved color detection for blonde hair, blue eyes, and diverse skin tones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Button variant="outline" className="relative">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Upload a clear photo with good lighting for best results
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing colors with enhanced algorithms...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={selectedImage} 
              alt="Uploaded for analysis" 
              className="max-w-md mx-auto rounded-lg shadow-md"
            />
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Overall Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <Badge variant={isColorWellDetected(analysis.facialFeatures.overallConfidence) ? "default" : "secondary"}>
                        {analysis.colorProfile.accuracyMetrics.overallAccuracy}%
                      </Badge>
                    </div>
                    <Progress 
                      value={analysis.colorProfile.accuracyMetrics.overallAccuracy} 
                      className={`h-2 ${getConfidenceColor(analysis.facialFeatures.overallConfidence)}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getAccuracyDescription(analysis.facialFeatures.overallConfidence)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold">{analysis.colorProfile.accuracyMetrics.skinAccuracy}%</div>
                      <div className="text-xs text-gray-500">Skin</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{analysis.colorProfile.accuracyMetrics.hairAccuracy}%</div>
                      <div className="text-xs text-gray-500">Hair</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{analysis.colorProfile.accuracyMetrics.eyeAccuracy}%</div>
                      <div className="text-xs text-gray-500">Eyes</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Processing Time</span>
                    <div className="font-semibold">{analysis.colorProfile.accuracyMetrics.processingTime}ms</div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Seasonal Profile</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{analysis.colorProfile.seasonalProfile.season}</Badge>
                      <span className="text-sm">({Math.round(analysis.colorProfile.seasonalProfile.confidence * 100)}% confidence)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facial Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Detected Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Skin Tone</h4>
                  {renderColorSwatch(analysis.facialFeatures.skinTone.color, analysis.facialFeatures.skinTone.description)}
                  <div className="text-sm text-gray-600">
                    <div>Lightness: <span className="font-medium">{analysis.facialFeatures.skinTone.lightness}</span></div>
                    <div>Undertone: <span className="font-medium">{analysis.facialFeatures.skinTone.undertone}</span></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Hair Color</h4>
                  {renderColorSwatch(analysis.facialFeatures.hairColor.color, analysis.facialFeatures.hairColor.description)}
                  <div className="text-sm text-gray-600">
                    <div>Category: <span className="font-medium">{analysis.facialFeatures.hairColor.category}</span></div>
                    <div>Confidence: <span className="font-medium">{Math.round(analysis.facialFeatures.hairColor.confidence * 100)}%</span></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Eye Color</h4>
                  {renderColorSwatch(analysis.facialFeatures.eyeColor.color, analysis.facialFeatures.eyeColor.description)}
                  <div className="text-sm text-gray-600">
                    <div>Category: <span className="font-medium">{analysis.facialFeatures.eyeColor.category}</span></div>
                    <div>Confidence: <span className="font-medium">{Math.round(analysis.facialFeatures.eyeColor.confidence * 100)}%</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.colorProfile.dominantColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recommended Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.colorProfile.seasonalProfile.recommendedColors.slice(0, 8).map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Colors to Avoid</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendations.avoidColors.slice(0, 6).map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Information */}
          {analysis.facialFeatures.debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold">Sampled Pixels</h5>
                    <div>Skin: {Math.round(analysis.facialFeatures.debugInfo.sampledPixels.skin)}</div>
                    <div>Hair: {Math.round(analysis.facialFeatures.debugInfo.sampledPixels.hair)}</div>
                    <div>Eyes: {Math.round(analysis.facialFeatures.debugInfo.sampledPixels.eyes)}</div>
                  </div>
                  <div>
                    <h5 className="font-semibold">Detection Regions</h5>
                    <div>Hair regions: {analysis.facialFeatures.debugInfo.regions.hairRegions}</div>
                    <div>Skin regions: {analysis.facialFeatures.debugInfo.regions.skinRegions}</div>
                    <div>Eye regions: {analysis.facialFeatures.debugInfo.regions.eyeRegions}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
