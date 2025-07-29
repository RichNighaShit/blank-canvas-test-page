
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Camera, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { ClothingAnalysisService } from '@/lib/clothingAnalysisService';

interface ClothingItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  tags: string[];
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface WardrobeUploadFlowProps {
  onItemAdded: (item: ClothingItem) => void;
}

interface AnalysisResult {
  category: string;
  subcategory: string;
  confidence: number;
  colors: string[];
  style: string;
  patterns: string[];
  materials: string[];
  occasions: string[];
  seasons: string[];
  reasoning: string;
}

export const WardrobeUploadFlow: React.FC<WardrobeUploadFlowProps> = ({ onItemAdded }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [editingItems, setEditingItems] = useState<Array<Partial<ClothingItem>>>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Filter for valid image files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    
    // Quick category detection for immediate feedback
    if (validFiles.length > 0) {
      performQuickAnalysis(validFiles);
    }
  }, [toast]);

  const performQuickAnalysis = async (files: File[]) => {
    setAnalyzing(true);
    const quickResults: AnalysisResult[] = [];

    for (const file of files) {
      try {
        const quickCategory = await ClothingAnalysisService.quickCategoryDetection(file.name);
        
        quickResults.push({
          category: quickCategory.category,
          subcategory: file.name.replace(/\.[^/.]+$/, ''),
          confidence: quickCategory.confidence,
          colors: ['blue'], // Placeholder
          style: 'casual',
          patterns: ['solid'],
          materials: ['cotton'],
          occasions: ['casual'],
          seasons: ['spring', 'summer', 'fall'],
          reasoning: 'Quick filename analysis'
        });
      } catch (error) {
        console.error('Quick analysis failed for', file.name, error);
      }
    }

    setAnalysisResults(quickResults);
    setEditingItems(quickResults.map(result => ({
      name: result.subcategory,
      category: result.category,
      color: result.colors,
      style: result.style,
      occasion: result.occasions,
      season: result.seasons,
      tags: [...result.patterns, ...result.materials]
    })));
    setAnalyzing(false);
  };

  const performFullAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setAnalyzing(true);
    const fullResults: AnalysisResult[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress((i / selectedFiles.length) * 50); // First 50% for analysis

      try {
        console.log(`🔍 Analyzing ${file.name}...`);
        const result = await ClothingAnalysisService.analyzeClothingItem(file, {
          fileName: file.name
        });

        fullResults.push(result);
        
        toast({
          title: "Analysis Complete",
          description: `${file.name} analyzed as ${result.category} with ${Math.round(result.confidence * 100)}% confidence`,
        });
      } catch (error) {
        console.error('Full analysis failed for', file.name, error);
        toast({
          title: "Analysis Failed",
          description: `Could not analyze ${file.name}. Using fallback.`,
          variant: "destructive",
        });
      }
    }

    setAnalysisResults(fullResults);
    setEditingItems(fullResults.map(result => ({
      name: result.subcategory || result.category,
      category: result.category,
      color: result.colors,
      style: result.style,
      occasion: result.occasions,
      season: result.seasons,
      tags: [...(result.patterns || []), ...(result.materials || [])]
    })));
    
    setUploadProgress(50);
    setAnalyzing(false);
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0 || editingItems.length === 0) return;

    setUploading(true);
    const uploadedItems: ClothingItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const itemData = editingItems[i];
      
      setUploadProgress(50 + ((i / selectedFiles.length) * 50)); // Second 50% for upload

      try {
        // Upload image to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(fileName);

        // Save to database
        const itemToSave = {
          user_id: user.id,
          name: itemData.name || `${itemData.category} item`,
          photo_url: urlData.publicUrl,
          category: itemData.category || 'tops',
          color: itemData.color || ['blue'],
          style: itemData.style || 'casual',
          occasion: itemData.occasion || ['casual'],
          season: itemData.season || ['spring', 'summer', 'fall'],
          tags: itemData.tags || []
        };

        const { data: savedItem, error: saveError } = await supabase
          .from('wardrobe_items')
          .insert(itemToSave)
          .select()
          .single();

        if (saveError) throw saveError;

        uploadedItems.push(savedItem);
        
        toast({
          title: "Item Added",
          description: `${itemData.name} added to your wardrobe successfully!`,
        });

      } catch (error) {
        console.error('Upload failed for', file.name, error);
        toast({
          title: "Upload Failed",
          description: `Could not upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }

    // Notify parent component of new items
    uploadedItems.forEach(item => onItemAdded(item));

    // Reset form
    setSelectedFiles([]);
    setAnalysisResults([]);
    setEditingItems([]);
    setUploadProgress(0);
    setUploading(false);

    toast({
      title: "Upload Complete",
      description: `Successfully added ${uploadedItems.length} items to your wardrobe!`,
    });
  };

  const updateEditingItem = (index: number, field: string, value: any) => {
    setEditingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Add Items to Wardrobe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload clothing photos
              </p>
              <p className="text-sm text-gray-500">
                Select multiple images (JPG, PNG up to 10MB each)
              </p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{file.name}</Badge>
                  {analysisResults[index] && (
                    <Badge variant="secondary">
                      {analysisResults[index].category} ({Math.round(analysisResults[index].confidence * 100)}%)
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Section */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={performFullAnalysis}
                disabled={analyzing}
                variant="outline"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>

            {(analyzing || uploadProgress > 0) && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {analyzing ? 'Analyzing clothing items...' : 'Uploading items...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Editing Section */}
        {editingItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Edit Items</h3>
            {editingItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Item Name</Label>
                    <Input
                      id={`name-${index}`}
                      value={item.name || ''}
                      onChange={(e) => updateEditingItem(index, 'name', e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <select
                      id={`category-${index}`}
                      value={item.category || ''}
                      onChange={(e) => updateEditingItem(index, 'category', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="tops">Tops</option>
                      <option value="bottoms">Bottoms</option>
                      <option value="dresses">Dresses</option>
                      <option value="outerwear">Outerwear</option>
                      <option value="shoes">Shoes</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Colors</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(item.color || []).map((color, colorIndex) => (
                        <Badge key={colorIndex} variant="secondary">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {editingItems.length > 0 && (
          <Button 
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading {selectedFiles.length} items...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add {selectedFiles.length} Items to Wardrobe
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
