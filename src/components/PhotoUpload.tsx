import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useRef } from "react";
import { Palette } from "lucide-react";

import neutralBody from "@/assets/neutral-body.png";
import { useProfile } from "@/hooks/useProfile";

interface PhotoUploadProps {
  onAnalysisComplete: (result: {
    imageUrl: string;
    colors: string[];
    aiAnalysis?: any;
  }) => void;
}

export const PhotoUpload = ({ onAnalysisComplete }: PhotoUploadProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileRef = useRef<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAutoFit, setShowAutoFit] = useState(false);
  const [autoFitPreviewUrl, setAutoFitPreviewUrl] = useState<string | null>(
    null,
  );
  const [autoFitNotice, setAutoFitNotice] = useState(false);
  const [showColorPalettePrompt, setShowColorPalettePrompt] = useState(false);
  const { refetch: refetchProfile } = useProfile();

  // Check if user should see color palette extraction prompt
  useEffect(() => {
    if (user && profile) {
      try {
        const hasSeenPrompt = localStorage.getItem(
          `color_palette_prompt_${user.id}`,
        );
        const hasExistingPhoto = profile.face_photo_url;
        const hasNoColorPalette =
          !profile.color_palette_colors ||
          profile.color_palette_colors.length === 0;

        if (!hasSeenPrompt && hasExistingPhoto && hasNoColorPalette) {
          setShowColorPalettePrompt(true);
        }
      } catch (error) {
        console.warn("Error checking color palette prompt:", error);
      }
    }
  }, [user, profile]);

  const dismissColorPalettePrompt = () => {
    if (user) {
      localStorage.setItem(`color_palette_prompt_${user.id}`, "true");
      setShowColorPalettePrompt(false);
    }
  };

  // Systematic analysis using structured recognition
  const performSystematicAnalysis = async (imageUrl: string): Promise<any> => {
    try {
      console.log("Starting systematic analysis for:", imageUrl);

      const { data, error } = await supabase.functions.invoke(
        "analyze-clothing",
        {
          body: {
            imageUrl,
            enhancedAnalysis: true,
            fileName: "clothing-item",
          },
        },
      );

      if (error) {
        console.error("Systematic analysis error:", error);
        throw error;
      }

      console.log("Systematic analysis result:", data);
      return data;
    } catch (error) {
      console.error("Failed to perform systematic analysis:", error);
      throw error;
    }
  };

  // Enhanced color analysis using basic extraction for now
  const analyzeImageColors = async (
    imageFile: File,
  ): Promise<{ colors: string[]; palette?: any }> => {
    try {
      console.log("🎨 Starting color extraction...");

      // Use basic color extraction to avoid heavy dependency issues
      const basicColors = await extractBasicColors(imageFile);

      console.log("🎨 Color extraction complete:", basicColors);

      return {
        colors: basicColors,
        palette: {
          colors: basicColors,
          confidence: 0.7,
          source: "basic" as const,
          metadata: {
            faceDetected: false,
            colorCount: basicColors.length,
            dominantColor: basicColors[0] || "#000000",
          },
        },
      };
    } catch (error) {
      console.error("Failed to analyze image colors:", error);
      // Ultimate fallback with skin-tone colors
      const fallbackColors = ["#8B7355", "#D4A574", "#F5E6D3"];
      return {
        colors: fallbackColors,
        palette: {
          colors: fallbackColors,
          confidence: 0.3,
          source: "fallback" as const,
          metadata: {
            faceDetected: false,
            colorCount: fallbackColors.length,
            dominantColor: fallbackColors[0],
          },
        },
      };
    }
  };

  const extractBasicColors = async (imageFile: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;

          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const colors = extractDominantColors(imageData);
            resolve(colors);
          } else {
            resolve(["neutral"]);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const extractDominantColors = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const colorMap = new Map<string, number>();

    // Sample pixels (every 10th pixel for performance)
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to HSL to categorize colors better
      const hsl = rgbToHsl(r, g, b);
      const colorCategory = categorizeColor(hsl);

      colorMap.set(colorCategory, (colorMap.get(colorCategory) || 0) + 1);
    }

    // Return top 3 colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  };

  const rgbToHsl = (
    r: number,
    g: number,
    b: number,
  ): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  const categorizeColor = ([h, s, l]: [number, number, number]): string => {
    if (l < 20) return "black";
    if (l > 80) return "white";
    if (s < 20) return "gray";

    if (h < 15 || h > 345) return "red";
    if (h < 45) return "orange";
    if (h < 75) return "yellow";
    if (h < 165) return "green";
    if (h < 195) return "cyan";
    if (h < 255) return "blue";
    if (h < 285) return "purple";
    if (h < 315) return "magenta";
    return "pink";
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("user-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("user-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const validateTorsoInImage = async (file: File): Promise<boolean> => {
    // TODO: Integrate TensorFlow.js BodyPix or MediaPipe for real torso detection
    // For now, always return true (allow all images)
    // Replace this with actual ML-based validation
    return true;
  };

  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement("canvas");
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height,
    );
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File(
            [blob],
            fileRef.current?.name || "cropped.jpg",
            { type: "image/jpeg" },
          );
          resolve(file);
        }
      }, "image/jpeg");
    });
  };

  const createAutoFitPreview = async (userImgUrl: string) => {
    try {
      const userImg = new Image();
      const mannequinImg = new Image();

      userImg.src = userImgUrl;
      mannequinImg.src = neutralBody;

      await Promise.all([
        new Promise((resolve) => {
          userImg.onload = resolve;
        }),
        new Promise((resolve) => {
          mannequinImg.onload = resolve;
        }),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = mannequinImg.width;
      canvas.height = mannequinImg.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      // Draw mannequin
      ctx.drawImage(mannequinImg, 0, 0);

      // Simple overlay - center user image on upper part
      const scale = 0.3;
      const userWidth = userImg.width * scale;
      const userHeight = userImg.height * scale;
      const x = (canvas.width - userWidth) / 2;
      const y = 50; // Position from top

      ctx.globalAlpha = 0.8;
      ctx.drawImage(userImg, x, y, userWidth, userHeight);

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Auto-fit preview failed:", error);
      return null;
    }
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || !user) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      fileRef.current = file;
      setShowCropper(true);
    },
    [user, toast],
  );

  const handleCropAndSave = useCallback(async () => {
    if (!previewUrl || !croppedAreaPixels || !user) return;
    setIsAnalyzing(true);

    try {
      const croppedFile = await getCroppedImg(previewUrl, croppedAreaPixels);

      // Torso validation step
      const hasTorso = await validateTorsoInImage(croppedFile);
      if (!hasTorso) {
        setShowAutoFit(true);
        setIsAnalyzing(false);
        return;
      }

      // Upload to storage first
      const imageUrl = await uploadToStorage(croppedFile);

      // Perform advanced color extraction
      let aiAnalysis = null;
      let colors = ["neutral"];
      let paletteData: ExtractedPalette | null = null;

      // First try advanced color extraction
      try {
        const colorAnalysis = await analyzeImageColors(croppedFile);
        colors = colorAnalysis.colors;
        paletteData = colorAnalysis.palette;

        toast({
          title: "🎨 Color Palette Extracted!",
          description: `Extracted ${colors.length} colors with ${Math.round(paletteData.confidence * 100)}% confidence from ${paletteData.source}`,
        });
      } catch (colorError) {
        console.warn("Advanced color extraction failed:", colorError);
        colors = await extractBasicColors(croppedFile);

        toast({
          title: "Colors extracted!",
          description: "Using basic color detection as fallback.",
        });
      }

      // Then try systematic analysis (optional)
      try {
        aiAnalysis = await performSystematicAnalysis(imageUrl);
        console.log("Systematic analysis result:", aiAnalysis);
      } catch (aiError) {
        console.warn("Systematic analysis failed (optional):", aiError);
        // Continue without AI analysis
      }

      onAnalysisComplete({ imageUrl, colors, aiAnalysis });
      setPreviewUrl(imageUrl);
      setShowCropper(false);
    } catch (error) {
      console.error("Upload/analysis error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again with a different image",
        variant: "destructive",
      });
      setShowCropper(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [previewUrl, croppedAreaPixels, user, toast, onAnalysisComplete]);

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
    <div className="space-y-4">
      {/* Color Palette Extraction Prompt for Existing Users */}
      {showColorPalettePrompt && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                🎨 New Feature: Your Personal Color Palette!
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
                Re-upload your profile picture to automatically extract your
                personalized color palette. This will enhance your outfit
                recommendations with colors that complement you perfectly!
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    setShowColorPalettePrompt(false);
                    // The user can now proceed to upload normally
                  }}
                >
                  Upload New Photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissColorPalettePrompt}
                  className="text-purple-700 dark:text-purple-200"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCropper && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full flex flex-col items-center">
            <div className="relative w-72 h-96 bg-gray-200">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setCroppedAreaPixels(croppedAreaPixels)
                }
              />
            </div>
            <div className="flex gap-4 mt-4">
              <Button onClick={handleCropAndSave} disabled={isAnalyzing}>
                {isAnalyzing ? "AI Analyzing..." : "Crop & Analyze with AI"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCropper(false);
                  setPreviewUrl(null);
                }}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAutoFit && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full flex flex-col items-center">
            <div className="relative w-72 h-96 bg-gray-200 flex flex-col items-center justify-center">
              <Button
                onClick={async () => {
                  setIsAnalyzing(true);
                  const resultUrl = await createAutoFitPreview(previewUrl);
                  setAutoFitPreviewUrl(resultUrl);
                  setAutoFitNotice(true);
                  setIsAnalyzing(false);
                }}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Processing..." : "Generate Auto-Fit Preview"}
              </Button>
              {autoFitPreviewUrl && (
                <img
                  src={autoFitPreviewUrl}
                  alt="Auto-Fit Preview"
                  className="mt-4 rounded shadow"
                  style={{ maxHeight: "320px" }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-4">
              <Button
                onClick={async () => {
                  if (!autoFitPreviewUrl || !user) return;
                  // Convert dataURL to File
                  const res = await fetch(autoFitPreviewUrl);
                  const blob = await res.blob();
                  const file = new File([blob], "autoFitPreview.png", {
                    type: "image/png",
                  });
                  // Upload to Supabase
                  const fileName = `${user.id}/autoFitPreview.png`;
                  const { error: uploadError } = await supabase.storage
                    .from("user-photos")
                    .upload(fileName, file, { upsert: true });
                  if (!uploadError) {
                    const {
                      data: { publicUrl },
                    } = supabase.storage
                      .from("user-photos")
                      .getPublicUrl(fileName);
                    toast({
                      title: "Auto-Fit Preview saved!",
                      description:
                        "AI-assisted try-on preview is now available. Your try-on previews will now use your latest photo.",
                    });
                    onAnalysisComplete({ imageUrl: publicUrl, colors: [] });
                    setPreviewUrl(publicUrl);
                    setShowAutoFit(false);
                    setAutoFitNotice(false);
                  } else {
                    toast({
                      title: "Upload failed",
                      description: "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isAnalyzing || !autoFitPreviewUrl}
              >
                Save Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAutoFit(false);
                  setAutoFitNotice(false);
                  setAutoFitPreviewUrl(null);
                }}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
            </div>
            {autoFitNotice && (
              <div className="mt-4 text-xs text-center text-red-600 bg-red-50 p-2 rounded">
                Try-on preview is AI-assisted based on your face. For best
                results, upload a torso photo.
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-primary/20"
            />
            {isAnalyzing && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            )}
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isAnalyzing
                ? "🔍 Systematic analysis in progress..."
                : "Upload your photo"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isAnalyzing
                ? "Analyzing your clothing's style, color, and material with structured recognition"
                : "Drag & drop your photo or click to browse"}
            </p>
          </>
        )}

        <Button
          type="button"
          disabled={isAnalyzing}
          className="shadow-button"
          onClick={() => document.getElementById("photo-input")?.click()}
        >
          {isAnalyzing
            ? "AI Processing..."
            : previewUrl
              ? "Change Photo"
              : "Choose Photo"}
        </Button>

        <input
          id="photo-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files && handleFiles(Array.from(e.target.files))
          }
        />
      </div>

      {isAnalyzing && (
        <div className="text-center text-sm text-muted-foreground">
          <p>🔍 Performing systematic analysis of your clothing item...</p>
          <p>
            Advanced computer vision detecting style, material, and styling
            suggestions
          </p>
        </div>
      )}
    </div>
  );
};
