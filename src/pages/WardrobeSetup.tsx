import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { pipeline } from "@huggingface/transformers";

interface ClothingItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  texture?: string;
  purchase_date?: string;
  price?: number;
  tags: string[];
}

const WardrobeSetup = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const categories = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"];
  const occasions = ["casual", "work", "formal", "party", "sport", "travel", "date"];
  const seasons = ["spring", "summer", "fall", "winter"];
  const styles = ["casual", "formal", "sporty", "elegant", "bohemian", "minimalist", "streetwear", "vintage"];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const analyzeImage = async (file: File): Promise<Partial<ClothingItem>> => {
    try {
      const fileName = file.name.toLowerCase();
      let category = "tops";
      let style = "casual";
      let colors = await extractImageColors(file);
      let occasions = ["casual"];
      let season = ["spring", "summer", "fall", "winter"];
      let texture = "cotton";

      // Enhanced categorization
      if (fileName.includes('shirt') || fileName.includes('top') || fileName.includes('blouse') || fileName.includes('sweater')) {
        category = "tops";
      } else if (fileName.includes('pant') || fileName.includes('jean') || fileName.includes('trouser') || fileName.includes('short')) {
        category = "bottoms";
      } else if (fileName.includes('dress') || fileName.includes('gown')) {
        category = "dresses";
        occasions = ["formal", "party"];
      } else if (fileName.includes('jacket') || fileName.includes('coat') || fileName.includes('blazer')) {
        category = "outerwear";
        season = ["fall", "winter"];
      } else if (fileName.includes('shoe') || fileName.includes('sneaker') || fileName.includes('boot') || fileName.includes('sandal')) {
        category = "shoes";
      } else if (fileName.includes('bag') || fileName.includes('hat') || fileName.includes('scarf') || fileName.includes('belt')) {
        category = "accessories";
      }

      // Style analysis
      if (fileName.includes('formal') || fileName.includes('suit') || fileName.includes('business')) {
        style = "formal";
        occasions = ["work", "formal"];
      } else if (fileName.includes('sport') || fileName.includes('gym') || fileName.includes('athletic')) {
        style = "sporty";
        occasions = ["sport", "casual"];
      } else if (fileName.includes('party') || fileName.includes('evening') || fileName.includes('cocktail')) {
        style = "elegant";
        occasions = ["party", "formal"];
      }

      return {
        category,
        style,
        color: colors,
        occasion: occasions,
        season,
        texture,
        tags: [style, category, ...colors.slice(0, 2)]
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      return {
        category: 'tops',
        style: 'casual',
        color: ['neutral'],
        occasion: ['casual'],
        season: ['spring', 'summer', 'fall', 'winter'],
        tags: ['casual']
      };
    }
  };

  const extractImageColors = async (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = analyzeImageColors(imageData);
            resolve(colors);
          } else {
            resolve(['neutral']);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageColors = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const colorCounts = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const colorName = getColorName(r, g, b);
      colorCounts.set(colorName, (colorCounts.get(colorName) || 0) + 1);
    }
    
    return Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  };

  const getColorName = (r: number, g: number, b: number): string => {
    const hsl = rgbToHsl(r, g, b);
    const [h, s, l] = hsl;
    
    if (l < 20) return 'black';
    if (l > 85) return 'white';
    if (s < 20) return 'gray';
    
    if (h < 15 || h > 345) return 'red';
    if (h < 45) return 'orange';
    if (h < 75) return 'yellow';
    if (h < 165) return 'green';
    if (h < 195) return 'cyan';
    if (h < 255) return 'blue';
    if (h < 285) return 'purple';
    if (h < 315) return 'magenta';
    return 'pink';
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setIsAnalyzing(true);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const analysisResult = await analyzeImage(file);
            const photo_url = e.target?.result as string;
            
            const newItem: ClothingItem = {
              id: Date.now() + Math.random().toString(),
              name: file.name.split('.')[0].replace(/[-_]/g, ' '),
              photo_url,
              category: analysisResult.category || 'tops',
              color: analysisResult.color || [],
              style: analysisResult.style || 'casual',
              occasion: analysisResult.occasion || ['casual'],
              season: analysisResult.season || ['spring', 'summer', 'fall', 'winter'],
              texture: analysisResult.texture,
              tags: analysisResult.tags || []
            };
            
            setItems(prev => [...prev, newItem]);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to analyze image. Please try again.",
            variant: "destructive"
          });
        }
      }
    }
    
    setIsAnalyzing(false);
    toast({
      title: "Items Added!",
      description: `${files.length} items have been analyzed and added to your wardrobe.`,
    });
  };

  const saveToDatabase = async () => {
    if (!user || items.length === 0) return;

    try {
      const itemsToSave = items.map(item => ({
        user_id: user.id,
        name: item.name,
        photo_url: item.photo_url,
        category: item.category,
        color: item.color,
        style: item.style,
        occasion: item.occasion,
        season: item.season,
        tags: item.tags
      }));

      const { error } = await supabase
        .from('wardrobe_items')
        .insert(itemsToSave);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save wardrobe items",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Wardrobe Saved!",
          description: "Your wardrobe has been saved successfully."
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save wardrobe",
        variant: "destructive"
      });
    }
  };

  const updateItem = (id: string, updates: Partial<ClothingItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Let's Build Your Wardrobe</h1>
          <p className="text-xl text-muted-foreground">
            Upload photos of your clothes and let our AI organize them for you
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 shadow-elegant">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isAnalyzing ? "AI is analyzing your clothes..." : "Upload Your Wardrobe"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isAnalyzing ? "Please wait while we categorize and tag your items" : "Drag & drop photos or click to browse (supports batch upload)"}
              </p>
              <Button 
                disabled={isAnalyzing}
                className="shadow-button"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {isAnalyzing ? "Processing..." : "Choose Files"}
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {items.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Wardrobe ({items.length} items)</h2>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setItems([])}>
                  Clear All
                </Button>
                <Button className="shadow-button" onClick={saveToDatabase}>
                  Save & Continue
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {items.map((item) => (
                <Dialog key={item.id}>
                  <DialogTrigger asChild>
                    <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-105 shadow-card">
                      <div className="aspect-square relative overflow-hidden rounded-t-lg">
                        <img 
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.style}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.color.slice(0, 2).map(color => (
                            <Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Item Details</DialogTitle>
                      <DialogDescription>
                        Customize the AI-generated tags and add additional information
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <img 
                          src={item.photo_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input 
                            id="name"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={item.category} onValueChange={(value) => updateItem(item.id, { category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="style">Style</Label>
                          <Select value={item.style} onValueChange={(value) => updateItem(item.id, { style: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {styles.map(style => (
                                <SelectItem key={style} value={style}>
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Occasions</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {occasions.map(occasion => (
                              <Badge
                                key={occasion}
                                variant={item.occasion.includes(occasion) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const newOccasions = item.occasion.includes(occasion)
                                    ? item.occasion.filter(o => o !== occasion)
                                    : [...item.occasion, occasion];
                                  updateItem(item.id, { occasion: newOccasions });
                                }}
                              >
                                {occasion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              // Close dialog without auto-saving
                              const dialogClose = document.querySelector('[data-radix-dialog-close]') as HTMLButtonElement;
                              if (dialogClose) dialogClose.click();
                            }}
                            className="flex-1"
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteItem(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </>
        )}

        {items.length === 0 && !isAnalyzing && (
          <Card className="text-center py-12 shadow-card">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to upload your wardrobe?</h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading photos of your clothes. Our AI will automatically categorize and tag them for you.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Skip for now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WardrobeSetup;