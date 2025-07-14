
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle, XCircle, Image as ImageIcon, Sparkles, Palette, Camera } from "lucide-react";
import { OptimizedImage } from './OptimizedImage';

interface WardrobeItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  tags: string[];
  user_id: string;
}

interface UploadStage {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  details?: string;
}

interface WardrobeUploadFlowProps {
  onItemAdded: (item: WardrobeItem) => void;
}

export const WardrobeUploadFlow = ({ onItemAdded }: WardrobeUploadFlowProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stages, setStages] = useState<UploadStage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const initializeStages = (): UploadStage[] => [
    { id: 'validate', name: 'Image Validation', status: 'pending', progress: 0, details: 'Checking image quality and format' },
    { id: 'optimize', name: 'Smart Optimization', status: 'pending', progress: 0, details: 'Enhancing image for analysis' },
    { id: 'upload', name: 'Secure Upload', status: 'pending', progress: 0, details: 'Storing in cloud storage' },
    { id: 'analyze', name: 'AI Fashion Analysis', status: 'pending', progress: 0, details: 'Advanced clothing recognition' },
    { id: 'colors', name: 'Color Intelligence', status: 'pending', progress: 0, details: 'Extracting dominant colors' },
    { id: 'save', name: 'Smart Cataloging', status: 'pending', progress: 0, details: 'Adding to your wardrobe' },
  ];

  const updateStage = (stageId: string, updates: Partial<UploadStage>) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  const resetUpload = () => {
    setIsProcessing(false);
    setCurrentFile(null);
    setPreviewUrl(null);
    setStages([]);
    setAnalysisResults(null);
  };

  // Enhanced image validation
  const validateImage = async (file: File): Promise<void> => {
    updateStage('validate', { status: 'processing', progress: 20, details: 'Analyzing image properties...' });
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        updateStage('validate', { progress: 60, details: 'Checking dimensions and quality...' });
        
        // More sophisticated validation
        if (img.width < 150 || img.height < 150) {
          reject(new Error('Image too small (minimum 150x150px for accurate analysis)'));
          return;
        }
        if (file.size > 15 * 1024 * 1024) {
          reject(new Error('File too large (maximum 15MB)'));
          return;
        }
        
        // Check aspect ratio for reasonable clothing photos
        const aspectRatio = img.width / img.height;
        if (aspectRatio > 5 || aspectRatio < 0.2) {
          console.warn('Unusual aspect ratio detected - may affect analysis quality');
        }
        
        updateStage('validate', { status: 'completed', progress: 100, details: 'Image validation successful' });
        resolve();
      };
      img.onerror = () => reject(new Error('Invalid or corrupted image file'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Smart image optimization
  const optimizeImage = async (file: File): Promise<File> => {
    updateStage('optimize', { status: 'processing', progress: 20, details: 'Preparing for AI analysis...' });
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        updateStage('optimize', { progress: 50, details: 'Optimizing resolution and quality...' });
        
        // Smart resizing - maintain quality for fashion analysis
        const maxSize = 1536; // Higher resolution for better AI analysis
        let { width, height } = img;
        
        // Only resize if necessary
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Enhanced rendering for better analysis
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            updateStage('optimize', { status: 'completed', progress: 100, details: 'Optimization complete' });
            resolve(optimizedFile);
          }
        }, 'image/jpeg', 0.92); // Higher quality for better analysis
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Secure upload with progress tracking
  const uploadToStorage = async (file: File): Promise<string> => {
    updateStage('upload', { status: 'processing', progress: 10, details: 'Connecting to secure storage...' });
    
    if (!user) throw new Error('User not authenticated');
    
    const fileExt = 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    updateStage('upload', { progress: 50, details: 'Uploading to cloud storage...' });
    
    const { error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);
    
    updateStage('upload', { status: 'completed', progress: 100, details: 'Upload successful' });
    return data.publicUrl;
  };

  // Advanced AI analysis with detailed feedback
  const analyzeWithAI = async (imageUrl: string): Promise<Partial<WardrobeItem>> => {
    updateStage('analyze', { status: 'processing', progress: 20, details: 'Initializing AI fashion models...' });
    
    try {
      updateStage('analyze', { progress: 50, details: 'Analyzing clothing type and style...' });
      
      const { data, error } = await supabase.functions.invoke('analyze-clothing', {
        body: { imageUrl }
      });
      
      if (error) throw error;
      
      updateStage('analyze', { progress: 80, details: 'Processing AI insights...' });
      
      if (data?.isClothing) {
        setAnalysisResults(data);
        updateStage('analyze', { 
          status: 'completed', 
          progress: 100, 
          details: `${Math.round(data.confidence * 100)}% confidence - ${data.analysis.category} detected` 
        });
        
        return {
          name: data.analysis.name || 'Clothing Item',
          category: data.analysis.category || 'tops',
          style: data.analysis.style || 'casual',
          occasion: data.analysis.occasions || ['casual'],
          season: data.analysis.seasons || ['spring', 'summer'],
          tags: [...(data.analysis.tags || []), 'ai-analyzed']
        };
      } else {
        throw new Error('Item not recognized as clothing');
      }
    } catch (error) {
      console.warn('AI analysis encountered issues:', error);
      updateStage('analyze', { 
        status: 'completed', 
        progress: 100, 
        details: 'Using smart fallback analysis' 
      });
      
      // Enhanced fallback with filename intelligence
      const filename = currentFile?.name || '';
      return {
        name: generateFallbackName(filename),
        category: detectCategoryFromFilename(filename),
        style: 'casual',
        occasion: ['casual'],
        season: ['spring', 'summer', 'fall', 'winter'],
        tags: ['needs-review']
      };
    }
  };

  // Advanced color extraction with background filtering
  const extractColors = async (file: File): Promise<string[]> => {
    updateStage('colors', { status: 'processing', progress: 30, details: 'Analyzing color palette...' });
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        updateStage('colors', { progress: 60, details: 'Extracting dominant colors...' });
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve(['neutral']);
          return;
        }
        
        const colors = analyzeAdvancedColors(imageData);
        updateStage('colors', { 
          status: 'completed', 
          progress: 100, 
          details: `Found ${colors.length} dominant colors` 
        });
        resolve(colors);
      };
      
      img.onerror = () => {
        updateStage('colors', { status: 'completed', progress: 100, details: 'Using neutral color fallback' });
        resolve(['neutral']);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Enhanced color analysis
  const analyzeAdvancedColors = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const width = Math.sqrt(data.length / 4);
    const height = width;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const colorCounts = new Map<string, number>();
    let sampleCount = 0;
    
    // Center-weighted sampling to avoid background
    for (let i = 0; i < data.length; i += 16) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      // Weight pixels closer to center
      const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const weight = 1 - (distanceFromCenter / maxDistance);
      
      if (weight > 0.2) { // Focus on central area
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        
        // Skip background colors
        if (alpha > 200) {
          const [h, s, l] = rgbToHsl(r, g, b);
          
          // Filter out likely background colors
          if (l > 5 && l < 95 && (s > 10 || l < 80)) {
            const colorName = categorizeAdvancedColor(r, g, b);
            const weightedCount = Math.ceil(weight * 10);
            colorCounts.set(colorName, (colorCounts.get(colorName) || 0) + weightedCount);
            sampleCount += weightedCount;
          }
        }
      }
    }
    
    // Return top colors by frequency
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .filter(([_, count]) => count > sampleCount * 0.05) // At least 5% presence
      .map(([color, _]) => color);
    
    return sortedColors.length > 0 ? sortedColors : ['neutral'];
  };

  const categorizeAdvancedColor = (r: number, g: number, b: number): string => {
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Enhanced color categorization
    if (l < 12) return 'black';
    if (l > 88 && s < 8) return 'white';
    if (s < 12) {
      if (l < 25) return 'charcoal';
      if (l < 40) return 'dark-gray';
      if (l < 70) return 'gray';
      return 'light-gray';
    }
    
    // More precise color ranges
    if (h >= 350 || h < 10) return s > 60 ? 'red' : 'pink';
    if (h < 25) return l > 65 ? 'peach' : 'orange';
    if (h < 45) return s > 50 ? 'orange' : 'tan';
    if (h < 65) return s > 40 ? 'yellow' : 'cream';
    if (h < 85) return 'lime';
    if (h < 140) return s > 30 ? 'green' : 'sage';
    if (h < 170) return 'teal';
    if (h < 200) return 'cyan';
    if (h < 235) return s > 40 ? 'blue' : 'steel';
    if (h < 260) return 'navy';
    if (h < 285) return 'purple';
    if (h < 310) return 'magenta';
    if (h < 330) return 'pink';
    return 'rose';
  };

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };

  // Smart database save
  const saveToDatabase = async (itemData: Partial<WardrobeItem> & { photo_url: string }): Promise<WardrobeItem> => {
    updateStage('save', { status: 'processing', progress: 50, details: 'Creating wardrobe entry...' });
    
    if (!user) throw new Error('User not authenticated');
    
    const newItem = {
      name: itemData.name || 'Clothing Item',
      category: itemData.category || 'tops',
      style: itemData.style || 'casual',
      photo_url: itemData.photo_url,
      color: itemData.color || ['neutral'],
      occasion: itemData.occasion || ['casual'],
      season: itemData.season || ['spring', 'summer', 'fall', 'winter'],
      tags: itemData.tags || ['new'],
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert(newItem)
      .select()
      .single();
    
    if (error) throw error;
    
    updateStage('save', { status: 'completed', progress: 100, details: 'Successfully added to wardrobe' });
    return data as WardrobeItem;
  };

  // Helper functions
  const generateFallbackName = (filename: string): string => {
    const name = filename.split('.')[0].replace(/[-_]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1) || 'Clothing Item';
  };

  const detectCategoryFromFilename = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('shirt') || name.includes('top') || name.includes('blouse')) return 'tops';
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser')) return 'bottoms';
    if (name.includes('dress')) return 'dresses';
    if (name.includes('jacket') || name.includes('coat')) return 'outerwear';
    if (name.includes('shoe') || name.includes('boot')) return 'shoes';
    if (name.includes('bag') || name.includes('hat') || name.includes('scarf')) return 'accessories';
    return 'tops';
  };

  // Main processing pipeline
  const processUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload items",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setStages(initializeStages());
    
    try {
      // Stage 1: Validate
      await validateImage(file);
      
      // Stage 2: Optimize
      const optimizedFile = await optimizeImage(file);
      
      // Stage 3: Upload
      const imageUrl = await uploadToStorage(optimizedFile);
      
      // Stage 4 & 5: Parallel AI analysis and color extraction
      const [aiAnalysis, colors] = await Promise.all([
        analyzeWithAI(imageUrl),
        extractColors(optimizedFile)
      ]);
      
      // Stage 6: Save to database
      const savedItem = await saveToDatabase({
        ...aiAnalysis,
        photo_url: imageUrl,
        color: colors
      });
      
      // Success notification with analysis results
      onItemAdded(savedItem);
      
      const confidence = analysisResults?.confidence 
        ? ` (${Math.round(analysisResults.confidence * 100)}% AI confidence)`
        : '';
      
      toast({
        title: "🎉 Item Added Successfully!",
        description: `${savedItem.name} has been analyzed and added to your wardrobe${confidence}`,
      });
      
      resetUpload();
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      const failedStage = stages.find(s => s.status === 'processing');
      if (failedStage) {
        updateStage(failedStage.id, { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error',
          details: 'Process failed - please try again'
        });
      }
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  // File handling
  const handleFiles = useCallback(async (files: File[]) => {
    if (isProcessing) return;
    
    const file = files[0];
    if (!file?.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, WEBP)",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    await processUpload(file);
  }, [isProcessing, user]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg' 
            : 'border-border hover:border-primary/50 hover:bg-primary/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previewUrl && !isProcessing ? (
          <div className="space-y-4">
            <OptimizedImage 
              src={previewUrl} 
              alt="Preview" 
              className="w-40 h-40 object-cover rounded-xl mx-auto border-2 border-primary/20 shadow-md"
              width={160}
              height={160}
            />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Ready for AI Analysis</p>
              <p className="text-sm text-muted-foreground">Advanced fashion recognition will identify category, style, and colors</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Camera className="w-10 h-10 text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">
              {isProcessing ? "AI Fashion Analysis in Progress..." : "Upload Your Fashion Item"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isProcessing 
                ? "Our advanced AI is analyzing your item's style, colors, and characteristics" 
                : "Drag & drop your photo or click to browse. Our AI will automatically categorize and tag your item."}
            </p>
            
            {!isProcessing && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Recognition</span>
                </div>
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span>Color Analysis</span>
                </div>
              </div>
            )}
          </>
        )}
        
        <Button 
          onClick={() => document.getElementById('wardrobe-file-input')?.click()}
          disabled={isProcessing}
          className="shadow-md hover:shadow-lg transition-shadow"
          size="lg"
        >
          {isProcessing ? "Processing..." : previewUrl ? "Change Photo" : "Choose Photo"}
        </Button>
        
        <input
          id="wardrobe-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
      </div>

      {/* Enhanced Processing Stages */}
      {stages.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              AI Fashion Analysis Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stage.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : stage.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : stage.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {stage.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : stage.status === 'failed' ? (
                        <XCircle className="w-4 h-4" />
                      ) : stage.status === 'processing' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{stage.name}</span>
                      {stage.details && (
                        <p className="text-sm text-muted-foreground">{stage.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-muted-foreground">
                      {stage.progress}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={stage.progress} 
                  className={`h-2 ${
                    stage.status === 'completed' ? 'bg-green-100' :
                    stage.status === 'failed' ? 'bg-red-100' : ''
                  }`} 
                />
                {stage.error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{stage.error}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results Preview */}
      {analysisResults && (
        <Card className="shadow-lg border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Category</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.category}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Style</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.style}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Confidence</p>
                <p className="font-semibold">{Math.round(analysisResults.confidence * 100)}%</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Colors</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.colors?.join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
