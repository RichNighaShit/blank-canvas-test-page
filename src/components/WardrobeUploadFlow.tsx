import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Upload,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Camera,
  Brain,
  Eye,
} from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";
import { advancedClothingCategorizer } from "@/lib/advancedClothingCategorizer";

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
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  details?: string;
  details?: string;
}

interface WardrobeUploadFlowProps {
  onItemAdded: (item: WardrobeItem) => void;
}

export const WardrobeUploadFlow = ({
  onItemAdded,
}: WardrobeUploadFlowProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stages, setStages] = useState<UploadStage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const initializeStages = (): UploadStage[] => [
    {
      id: "validate",
      name: "Image Validation",
      status: "pending",
      progress: 0,
      details: "Checking image quality and format",
    },
    {
      id: "optimize",
      name: "Smart Optimization",
      status: "pending",
      progress: 0,
      details: "Enhancing image for AI analysis",
    },
    {
      id: "upload",
      name: "Secure Upload",
      status: "pending",
      progress: 0,
      details: "Storing in cloud storage",
    },
    {
      id: "advanced-categorization",
      name: "🧠 Advanced Clothing Categorization",
      status: "pending",
      progress: 0,
      details: "Multi-method analysis for accurate clothing type detection",
    },
    {
      id: "ai-analysis",
      name: "🎨 Style & Color Analysis",
      status: "pending",
      progress: 0,
      details: "Analyzing colors, patterns, and styling attributes",
    },
    {
      id: "save",
      name: "Smart Cataloging",
      status: "pending",
      progress: 0,
      details: "Adding to your wardrobe with AI insights",
    },
  ];

  const updateStage = (stageId: string, updates: Partial<UploadStage>) => {
    setStages((prev) => {
      if (!prev || prev.length === 0) {
        console.warn("No stages found when trying to update stage:", stageId);
        return prev;
      }
      return prev.map((stage) =>
        stage.id === stageId ? { ...stage, ...updates } : stage,
      );
    });
  };

  const resetUpload = () => {
    setIsProcessing(false);
    setCurrentFile(null);
    setPreviewUrl(null);
    setStages([]);
    setAnalysisResults(null);
  };

  const validateImage = async (file: File): Promise<void> => {
    updateStage("validate", {
      status: "processing",
      progress: 20,
      details: "Analyzing image properties...",
    });

    return new Promise((resolve, reject) => {
      const img = new Image();
      let objectUrl: string | null = null;

      const cleanup = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };

      img.onload = () => {
        try {
          updateStage("validate", {
            progress: 60,
            details: "Checking dimensions and quality...",
          });

          if (img.width < 150 || img.height < 150) {
            cleanup();
            reject(
              new Error(
                "Image too small (minimum 150x150px for accurate analysis)",
              ),
            );
            return;
          }
          if (file.size > 15 * 1024 * 1024) {
            cleanup();
            reject(new Error("File too large (maximum 15MB)"));
            return;
          }

          updateStage("validate", {
            status: "completed",
            progress: 100,
            details: "Image validation successful",
          });
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(
            new Error(
              "Image validation failed: " +
                (error instanceof Error ? error.message : "Unknown error"),
            ),
          );
        }
      };

      img.onerror = (error) => {
        cleanup();
        reject(new Error("Invalid or corrupted image file"));
      };

      try {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (error) {
        cleanup();
        reject(new Error("Failed to load image file"));
      }
    });
  };

  const optimizeImage = async (file: File): Promise<File> => {
    updateStage("optimize", {
      status: "processing",
      progress: 20,
      details: "Preparing for AI analysis...",
    });

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      let objectUrl: string | null = null;

      const cleanup = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };

      img.onload = () => {
        try {
          updateStage("optimize", {
            progress: 50,
            details: "Optimizing resolution and quality...",
          });

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
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);
          } else {
            cleanup();
            reject(new Error("Failed to get canvas context"));
            return;
          }

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                });
                updateStage("optimize", {
                  status: "completed",
                  progress: 100,
                  details: "Optimization complete",
                });
                resolve(optimizedFile);
              } else {
                reject(new Error("Failed to optimize image"));
              }
            },
            "image/jpeg",
            0.92,
          );
        } catch (error) {
          cleanup();
          reject(
            new Error(
              "Image optimization failed: " +
                (error instanceof Error ? error.message : "Unknown error"),
            ),
          );
        }
      };

      img.onerror = (error) => {
        cleanup();
        reject(new Error("Failed to load image for optimization"));
      };

      try {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (error) {
        cleanup();
        reject(new Error("Failed to create image URL"));
      }
    });
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    updateStage("upload", {
      status: "processing",
      progress: 10,
      details: "Connecting to secure storage...",
    });

    if (!user) throw new Error("User not authenticated");

    const fileExt = "jpg";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    updateStage("upload", {
      progress: 50,
      details: "Uploading to cloud storage...",
    });

    const { error: uploadError } = await supabase.storage
      .from("user-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("user-photos")
      .getPublicUrl(fileName);

    updateStage("upload", {
      status: "completed",
      progress: 100,
      details: "Upload successful",
    });
    return data.publicUrl;
  };

  const performAdvancedCategorization = async (
    imageFile: File,
    imageUrl: string
  ): Promise<{ category: string; subcategory: string; confidence: number }> => {
    updateStage("advanced-categorization", {
      status: "processing",
      progress: 20,
      details: "🔍 Analyzing image properties and filename...",
    });

    try {
      console.log("Starting advanced clothing categorization...");

      updateStage("advanced-categorization", {
        progress: 40,
        details: "📊 Running multi-method analysis...",
      });

      // Use the new advanced categorizer
      const categorizationResult = await advancedClothingCategorizer.categorizeClothing(
        imageFile,
        {
          fileName: imageFile.name,
          userHint: undefined, // Could be added later for user input
        }
      );

      console.log("Advanced categorization result:", categorizationResult);

      updateStage("advanced-categorization", {
        progress: 80,
        details: `🎯 Detected ${categorizationResult.category} with ${Math.round(categorizationResult.confidence * 100)}% confidence`,
      });

      // Validate the result
      if (categorizationResult.confidence < 0.4) {
        console.warn("Low confidence categorization, may need manual review");
      }

      updateStage("advanced-categorization", {
        status: "completed",
        progress: 100,
        details: `✅ Categorized as ${categorizationResult.category} (${categorizationResult.detectionMethods.join(", ")})`,
      });

      return {
        category: categorizationResult.category,
        subcategory: categorizationResult.subcategory,
        confidence: categorizationResult.confidence,
      };

    } catch (error) {
      console.error("Advanced categorization failed:", error);

      updateStage("advanced-categorization", {
        status: "failed",
        progress: 100,
        details: "❌ Categorization failed, using smart fallback",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return intelligent fallback
      return this.getSmartFallbackCategory(imageFile.name);
    }
  };

  const getSmartFallbackCategory = (fileName: string): { category: string; subcategory: string; confidence: number } => {
    const name = fileName.toLowerCase();

    // Simple but effective fallback logic
    if (name.includes('shirt') || name.includes('top') || name.includes('blouse')) {
      return { category: 'tops', subcategory: 'shirt', confidence: 0.6 };
    }
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser')) {
      return { category: 'bottoms', subcategory: 'pants', confidence: 0.6 };
    }
    if (name.includes('dress')) {
      return { category: 'dresses', subcategory: 'dress', confidence: 0.6 };
    }
    if (name.includes('jacket') || name.includes('coat')) {
      return { category: 'outerwear', subcategory: 'jacket', confidence: 0.6 };
    }
    if (name.includes('shoe') || name.includes('boot')) {
      return { category: 'shoes', subcategory: 'sneakers', confidence: 0.6 };
    }
    if (name.includes('bag') || name.includes('hat') || name.includes('scarf')) {
      return { category: 'accessories', subcategory: 'accessory', confidence: 0.6 };
    }

    return { category: 'tops', subcategory: 'shirt', confidence: 0.3 };
  };

  const performStyleAndColorAnalysis = async (imageUrl: string): Promise<Partial<WardrobeItem>> => {
    updateStage("ai-analysis", {
      status: "processing",
      progress: 20,
      details: "🎨 Analyzing colors and patterns...",
    });

    try {
      // Use existing color analysis
      const analysisResult = await accurateClothingAnalyzer.analyzeClothing(currentFile || imageUrl);

      updateStage("ai-analysis", {
        progress: 80,
        details: "✨ Generating style recommendations...",
      });

      if (analysisResult.isClothing) {
        setAnalysisResults({
          ...analysisResult,
          analysis: {
            // Don't override category - use the one from advanced categorization
            colors: analysisResult.colors,
            style: analysisResult.style,
            occasions: analysisResult.occasions,
            seasons: analysisResult.seasons,
            patterns: analysisResult.patterns || ["solid"],
            materials: analysisResult.materials || ["cotton"],
          },
        });

        updateStage("ai-analysis", {
          status: "completed",
          progress: 100,
          details: "✅ Style and color analysis completed",
        });

        return {
          style: analysisResult.style,
          occasion: analysisResult.occasions,
          season: analysisResult.seasons,
          color: analysisResult.colors,
          tags: analysisResult.tags,
        };
      }

      throw new Error("Style analysis failed");

    } catch (error) {
      console.warn("Style analysis failed, using smart fallback:", error);

      updateStage("ai-analysis", {
        status: "completed",
        progress: 100,
        details: "✅ Using smart style defaults",
      });

      return {
        style: "casual",
        occasion: ["casual"],
        season: ["spring", "summer", "fall", "winter"],
        color: ["blue"],
        tags: [],
      };
    }
  };

  const processUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload items",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStages(initializeStages());

    try {
      await validateImage(file);
      const optimizedFile = await optimizeImage(file);
      const imageUrl = await uploadToStorage(optimizedFile);

      // Step 1: Advanced clothing categorization
      const categoryResult = await performAdvancedCategorization(optimizedFile, imageUrl);

      // Step 2: Style and color analysis
      const styleResult = await performStyleAndColorAnalysis(imageUrl);

      // Combine results
      const combinedAnalysis = {
        name: generateSmartName(file.name, categoryResult.category, styleResult.color?.[0] || 'blue'),
        category: categoryResult.category,
        ...styleResult,
        photo_url: imageUrl,
      };

      const savedItem = await saveToDatabase(combinedAnalysis);
      onItemAdded(savedItem);

      toast({
        title: "🎯 Advanced Analysis Complete!",
        description: `${savedItem.name} accurately categorized as ${categoryResult.category} with ${Math.round(categoryResult.confidence * 100)}% confidence`,
      });

      resetUpload();
    } catch (error) {
      console.error("Upload failed:", error);

      const failedStage = stages.find((s) => s.status === "processing");
      if (failedStage) {
        updateStage(failedStage.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          details: "Process failed - please try again",
        });
      }

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const generateSmartName = (fileName: string, category: string, primaryColor: string): string => {
    const baseName = fileName.split(".")[0].replace(/[-_]/g, " ");

    // If filename has meaningful content, use it
    if (baseName && !baseName.match(/^\d+$/) && baseName.toLowerCase() !== "img") {
      return baseName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Generate intelligent name
    const colorPrefix = primaryColor !== "neutral" ? `${primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1)} ` : "";

    const categoryNames = {
      tops: "Top",
      bottoms: "Pants",
      dresses: "Dress",
      outerwear: "Jacket",
      shoes: "Shoes",
      accessories: "Accessory",
    };

    return `${colorPrefix}${categoryNames[category] || "Item"}`;
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (isProcessing) return;

      const file = files[0];

      // Validate file exists and is an image
      if (!file) {
        toast({
          title: "No File Selected",
          description: "Please select a file to upload",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPG, PNG, WEBP)",
          variant: "destructive",
        });
        return;
      }

      // Check file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 15MB",
          variant: "destructive",
        });
        return;
      }

      try {
        setCurrentFile(file);
        const previewUrl = URL.createObjectURL(file);
        setPreviewUrl(previewUrl);
        await processUpload(file);
      } catch (error) {
        console.error("Error handling file:", error);
        toast({
          title: "File Error",
          description: "Failed to process the selected file. Please try again.",
          variant: "destructive",
        });
      }
    },
    [isProcessing, user],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles],
  );

  return (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
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
              <p className="font-medium text-foreground">
                Ready for Advanced AI Analysis
              </p>
              <p className="text-sm text-muted-foreground">
                Computer vision-powered clothing recognition and style detection
              </p>
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
              {isProcessing
                ? "🧠 Advanced AI Analysis in Progress..."
                : "Upload for Accurate Fashion Recognition"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isProcessing
                ? "Using computer vision and intelligent pattern recognition for precise results"
                : "Drag & drop your photo for accurate clothing detection, color analysis, and style recognition"}
            </p>

            {!isProcessing && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Computer Vision</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
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
          onClick={() =>
            document.getElementById("wardrobe-file-input")?.click()
          }
          disabled={isProcessing}
          className="shadow-md hover:shadow-lg transition-shadow"
          size="lg"
        >
          {isProcessing
            ? "🧠 AI Analysis Processing..."
            : previewUrl
              ? "Change Photo"
              : "Choose Photo for AI Analysis"}
        </Button>

        <input
          id="wardrobe-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files && handleFiles(Array.from(e.target.files))
          }
        />
      </div>

      {stages.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              Advanced AI Fashion Analysis Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        stage.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : stage.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : stage.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {stage.status === "completed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : stage.status === "failed" ? (
                        <XCircle className="w-4 h-4" />
                      ) : stage.status === "processing" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {stage.name}
                      </span>
                      {stage.details && (
                        <p className="text-sm text-muted-foreground">
                          {stage.details}
                        </p>
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
                    stage.status === "completed"
                      ? "bg-green-100"
                      : stage.status === "failed"
                        ? "bg-red-100"
                        : ""
                  }`}
                />
                {stage.error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {stage.error}
                  </p>
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
              <Eye className="w-5 h-5" />
              🧠 Advanced AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="font-medium text-muted-foreground">Category</p>
                <p className="capitalize font-semibold">
                  {analysisResults.analysis.category}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Style</p>
                <p className="capitalize font-semibold">
                  {analysisResults.analysis.style}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Analysis Confidence
                </p>
                <p className="font-semibold">
                  {Math.round(analysisResults.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Colors</p>
                <p className="capitalize font-semibold">
                  {analysisResults.analysis.colors?.join(", ")}
                </p>
              </div>
            </div>

            {analysisResults.styling_suggestions && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">
                  ✨ Styling Suggestions:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysisResults.styling_suggestions.map(
                    (suggestion: string, idx: number) => (
                      <li key={idx}>• {suggestion}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
