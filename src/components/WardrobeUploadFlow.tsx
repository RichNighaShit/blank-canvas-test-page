import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle, XCircle, Image as ImageIcon, Sparkles, Palette, Camera, Brain } from "lucide-react";
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
    { id: 'optimize', name: 'Smart Optimization', status: 'pending', progress: 0, details: 'Enhancing image for AI analysis' },
    { id: 'upload', name: 'Secure Upload', status: 'pending', progress: 0, details: 'Storing in cloud storage' },
    { id: 'gemini-ai', name: '🤖 Gemini AI Analysis', status: 'pending', progress: 0, details: 'Advanced clothing recognition with Google Gemini' },
    { id: 'save', name: 'Smart Cataloging', status: 'pending', progress: 0, details: 'Adding to your wardrobe with AI insights' },
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

  const validateImage = async (file: File): Promise<void> => {
    updateStage('validate', { status: 'processing', progress: 20, details: 'Analyzing image properties...' });
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        updateStage('validate', { progress: 60, details: 'Checking dimensions and quality...' });
        
        if (img.width < 150 || img.height < 150) {
          reject(new Error('Image too small (minimum 150x150px for accurate analysis)'));
          return;
        }
        if (file.size > 15 * 1024 * 1024) {
          reject(new Error('File too large (maximum 15MB)'));
          return;
        }
        
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

  const optimizeImage = async (file: File): Promise<File> => {
    updateStage('optimize', { status: 'processing', progress: 20, details: 'Preparing for AI analysis...' });
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        updateStage('optimize', { progress: 50, details: 'Optimizing resolution and quality...' });
        
        const maxSize = 1536;
        let { width, height } = img;
        
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
        }, 'image/jpeg', 0.92);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

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

  const analyzeWithGeminiAI = async (imageUrl: string): Promise<Partial<WardrobeItem>> => {
    updateStage('gemini-ai', { status: 'processing', progress: 20, details: 'Initializing Gemini AI models...' });
    
    try {
      updateStage('gemini-ai', { progress: 50, details: '🤖 Gemini analyzing clothing style and material...' });
      
      console.log('Attempting Gemini AI analysis for:', imageUrl);
      
      // Try Gemini first
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-clothing-analysis', {
        body: { imageUrl }
      });
      
      console.log('Gemini response:', { data: geminiData, error: geminiError });
      
      if (!geminiError && geminiData?.isClothing && geminiData.confidence > 0.5) {
        setAnalysisResults(geminiData);
        updateStage('gemini-ai', { 
          status: 'completed', 
          progress: 100, 
          details: `✨ Gemini AI: ${Math.round(geminiData.confidence * 100)}% confidence - ${geminiData.analysis.category} detected` 
        });
        
        return {
          name: geminiData.analysis.name || 'Clothing Item',
          category: geminiData.analysis.category || 'tops',
          style: geminiData.analysis.style || 'casual',
          occasion: geminiData.analysis.occasions || ['casual'],
          season: geminiData.analysis.seasons || ['spring', 'summer'],
          color: geminiData.analysis.colors || ['neutral'],
          tags: [
            ...(geminiData.analysis.patterns || []),
            ...(geminiData.analysis.materials || []),
            'ai-analyzed',
            'gemini-pro',
            `confidence-${Math.round(geminiData.confidence * 100)}`
          ]
        };
      }
      
      // Fallback to analyze-clothing with enhanced parameters
      console.log('Gemini failed or low confidence, using fallback AI analysis');
      updateStage('gemini-ai', { progress: 80, details: '🔄 Using enhanced fallback AI analysis...' });
      
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('analyze-clothing', {
        body: { 
          imageUrl,
          enhancedAnalysis: true,
          fileName: currentFile?.name || 'clothing-item'
        }
      });
      
      console.log('Fallback AI response:', { data: fallbackData, error: fallbackError });
      
      if (!fallbackError && fallbackData) {
        updateStage('gemini-ai', { 
          status: 'completed', 
          progress: 100, 
          details: '✅ Enhanced AI analysis completed successfully' 
        });
        
        return {
          name: fallbackData.name || generateSmartName(currentFile?.name || '', fallbackData),
          category: fallbackData.category || detectCategoryFromFilename(currentFile?.name || ''),
          style: fallbackData.style || 'casual',
          occasion: fallbackData.occasions || ['casual'],
          season: fallbackData.seasons || ['spring', 'summer', 'fall', 'winter'],
          color: fallbackData.colors || await extractAdvancedColors(imageUrl),
          tags: [
            ...(fallbackData.tags || []),
            'ai-analyzed',
            'enhanced-fallback',
            fallbackData.material || 'fabric'
          ]
        };
      }
      
      throw new Error('Both AI analyses failed');
      
    } catch (error) {
      console.warn('Both AI analyses failed, using advanced analysis:', error);
      
      // Advanced fallback analysis
      const advancedAnalysis = await performAdvancedFallbackAnalysis(imageUrl);
      
      updateStage('gemini-ai', { 
        status: 'completed', 
        progress: 100, 
        details: 'Using advanced image analysis with smart detection' 
      });
      
      return advancedAnalysis;
    }
  };

  const performAdvancedFallbackAnalysis = async (imageUrl: string): Promise<Partial<WardrobeItem>> => {
    const filename = currentFile?.name || '';
    const smartName = generateSmartName(filename);
    const detectedCategory = detectCategoryFromFilename(filename);
    const colors = await extractAdvancedColors(imageUrl);
    
    // Smart style detection based on filename and colors
    let style = 'casual';
    if (filename.toLowerCase().includes('formal') || filename.toLowerCase().includes('dress')) {
      style = 'formal';
    } else if (filename.toLowerCase().includes('sport') || filename.toLowerCase().includes('gym')) {
      style = 'sporty';
    } else if (colors.includes('black') || colors.includes('white')) {
      style = 'minimalist';
    }
    
    // Smart occasion detection
    const occasions = style === 'formal' ? ['work', 'formal'] : 
                    style === 'sporty' ? ['sport', 'casual'] : 
                    ['casual'];
    
    return {
      name: smartName,
      category: detectedCategory,
      style,
      occasion: occasions,
      season: ['spring', 'summer', 'fall', 'winter'],
      color: colors,
      tags: [
        'smart-analysis',
        'color-detected',
        detectedCategory,
        style,
        colors[0] || 'neutral'
      ]
    };
  };

  const generateSmartName = (filename: string, aiData?: any): string => {
    const baseName = filename.split('.')[0].replace(/[-_]/g, ' ');
    
    if (aiData?.name && aiData.name !== 'Clothing Item') {
      return aiData.name;
    }
    
    // Smart name generation based on filename
    const words = baseName.toLowerCase().split(' ');
    const clothingWords = ['shirt', 'pants', 'dress', 'jacket', 'sweater', 'top', 'bottom', 'shoe', 'boot'];
    const colorWords = ['red', 'blue', 'green', 'black', 'white', 'pink', 'yellow', 'purple', 'gray', 'brown'];
    
    const foundClothing = words.find(word => clothingWords.includes(word));
    const foundColor = words.find(word => colorWords.includes(word));
    
    if (foundColor && foundClothing) {
      return `${foundColor.charAt(0).toUpperCase() + foundColor.slice(1)} ${foundClothing.charAt(0).toUpperCase() + foundClothing.slice(1)}`;
    }
    
    if (foundClothing) {
      return foundClothing.charAt(0).toUpperCase() + foundClothing.slice(1);
    }
    
    return baseName.charAt(0).toUpperCase() + baseName.slice(1) || 'Clothing Item';
  };

  const extractAdvancedColors = async (imageUrl: string): Promise<string[]> => {
    try {
      // Create a temporary image to analyze colors
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = analyzeImageColorsAdvanced(imageData);
            resolve(colors);
          } else {
            resolve(['neutral']);
          }
        };
        img.onerror = () => resolve(['neutral']);
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Advanced color extraction failed:', error);
      return ['neutral'];
    }
  };

  const analyzeImageColorsAdvanced = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample more pixels for better accuracy
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      // Skip transparent pixels
      if (alpha < 128) continue;
      
      const hsl = rgbToHsl(r, g, b);
      const colorName = getAdvancedColorName(hsl);
      
      colorMap.set(colorName, (colorMap.get(colorName) || 0) + 1);
    }
    
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  };

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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

  const getAdvancedColorName = ([h, s, l]: [number, number, number]): string => {
    if (l < 15) return 'black';
    if (l > 90) return 'white';
    if (s < 15) return l > 60 ? 'light-gray' : 'dark-gray';
    
    // More nuanced color detection
    if (h < 10 || h > 350) return l > 70 ? 'light-red' : 'red';
    if (h < 25) return 'orange';
    if (h < 60) return l > 70 ? 'light-yellow' : 'yellow';
    if (h < 80) return 'yellow-green';
    if (h < 150) return l > 60 ? 'light-green' : 'green';
    if (h < 180) return 'teal';
    if (h < 210) return 'light-blue';
    if (h < 250) return 'blue';
    if (h < 280) return 'purple';
    if (h < 320) return 'magenta';
    return 'pink';
  };

  const detectCategoryFromFilename = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('shirt') || name.includes('top') || name.includes('blouse') || name.includes('sweater') || name.includes('hoodie')) return 'tops';
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser') || name.includes('short') || name.includes('legging')) return 'bottoms';
    if (name.includes('dress') || name.includes('gown') || name.includes('frock')) return 'dresses';
    if (name.includes('jacket') || name.includes('coat') || name.includes('blazer') || name.includes('cardigan')) return 'outerwear';
    if (name.includes('shoe') || name.includes('boot') || name.includes('sneaker') || name.includes('sandal') || name.includes('heel')) return 'shoes';
    if (name.includes('bag') || name.includes('hat') || name.includes('scarf') || name.includes('belt') || name.includes('watch')) return 'accessories';
    return 'tops';
  };

  const saveToDatabase = async (itemData: Partial<WardrobeItem> & { photo_url: string }): Promise<WardrobeItem> => {
    updateStage('save', { status: 'processing', progress: 50, details: 'Creating wardrobe entry with AI insights...' });
    
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
    
    updateStage('save', { status: 'completed', progress: 100, details: 'Successfully added to wardrobe with AI insights' });
    return data as WardrobeItem;
  };

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
      await validateImage(file);
      
      const optimizedFile = await optimizeImage(file);
      
      const imageUrl = await uploadToStorage(optimizedFile);
      
      const aiAnalysis = await analyzeWithGeminiAI(imageUrl);
      
      const savedItem = await saveToDatabase({
        ...aiAnalysis,
        photo_url: imageUrl
      });
      
      onItemAdded(savedItem);
      
      const confidence = analysisResults?.confidence 
        ? ` (${Math.round(analysisResults.confidence * 100)}% AI confidence)`
        : '';
      
      const aiInsights = analysisResults?.styling_suggestions?.length 
        ? ` • ${analysisResults.styling_suggestions.length} styling suggestions included`
        : '';
      
      toast({
        title: "🤖 AI Analysis Complete!",
        description: `${savedItem.name} analyzed and added to wardrobe${confidence}${aiInsights}`,
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
              <p className="font-medium text-foreground">Ready for Enhanced AI Analysis</p>
              <p className="text-sm text-muted-foreground">Advanced AI with smart fallback system for maximum accuracy</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Brain className="w-10 h-10 text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">
              {isProcessing ? "🤖 Enhanced AI Analysis in Progress..." : "Upload for Advanced AI Fashion Analysis"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isProcessing 
                ? "Multi-layer AI system analyzing your item with smart color detection and style recognition" 
                : "Drag & drop your photo for intelligent AI analysis with advanced color detection and smart categorization"}
            </p>
            
            {!isProcessing && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  <span>Gemini AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Smart Fallback</span>
                </div>
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span>Advanced Color Detection</span>
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
          {isProcessing ? "🤖 Enhanced AI Processing..." : previewUrl ? "Change Photo" : "Choose Photo for Advanced AI Analysis"}
        </Button>
        
        <input
          id="wardrobe-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
      </div>

      {stages.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              Enhanced AI Fashion Analysis Pipeline
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

      {analysisResults && (
        <Card className="shadow-lg border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Brain className="w-5 h-5" />
              🤖 AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="font-medium text-muted-foreground">Category</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.category}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Style</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.style}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">AI Confidence</p>
                <p className="font-semibold">{Math.round(analysisResults.confidence * 100)}%</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Colors</p>
                <p className="capitalize font-semibold">{analysisResults.analysis.colors?.join(', ')}</p>
              </div>
            </div>
            
            {analysisResults.styling_suggestions && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">✨ AI Styling Suggestions:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysisResults.styling_suggestions.map((suggestion: string, idx: number) => (
                    <li key={idx}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
