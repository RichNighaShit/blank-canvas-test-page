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
import { accurateFacialFeatureAnalysis, FacialFeatureColors } from "@/lib/accurateFacialFeatureAnalysis";

// Updated interface for facial color analysis
interface ColorAnalysisResult {
  colors: string[];
  confidence: number;
  source: "facial-analysis" | "fallback";
  facialFeatures?: FacialFeatureColors;
  metadata: {
    faceDetected: boolean;
    colorCount: number;
    dominantColor: string;
    analysisType: "facial-features" | "fallback";
  };
}

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
    const { profile, refetch: refetchProfile } = useProfile();

  // Cleanup effect for preview URLs
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (autoFitPreviewUrl && autoFitPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(autoFitPreviewUrl);
      }
    };
  }, [previewUrl, autoFitPreviewUrl]);

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
    try {
      if (user && user.id) {
        localStorage.setItem(`color_palette_prompt_${user.id}`, "true");
        setShowColorPalettePrompt(false);
      }
    } catch (error) {
      console.warn("Error dismissing color palette prompt:", error);
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

    // Facial color analysis using the new service
  const analyzeFacialColors = async (
    imageFile: File,
  ): Promise<{ colors: string[]; palette?: ColorAnalysisResult }> => {
    try {
      console.log("🎨 Starting facial color analysis...");

                        // Use the accurate facial feature analysis service
      const facialFeatures = await accurateFacialFeatureAnalysis.detectFacialFeatureColors(imageFile);

      console.log("🎨 Facial feature analysis complete:", facialFeatures);

            // Use the actual detected feature colors (skin, hair, eyes)
      const colors = [
        facialFeatures.skinTone.color,
        facialFeatures.hairColor.color,
        facialFeatures.eyeColor.color
      ];

      return {
        colors,
        palette: {
          colors,
          confidence: facialFeatures.overallConfidence,
          source: facialFeatures.detectedFeatures ? "facial-analysis" : "fallback",
          facialFeatures,
          metadata: {
            faceDetected: facialFeatures.detectedFeatures,
            colorCount: colors.length,
            dominantColor: facialFeatures.skinTone.color,
            analysisType: facialFeatures.detectedFeatures ? "facial-features" : "fallback",
          },
        },
      };
    } catch (error) {
      console.error("Failed to analyze facial colors:", error);

      // Try enhanced extraction as fallback
      try {
        console.log("🔄 Falling back to enhanced color extraction...");
        const enhancedColors = await extractEnhancedColors(imageFile);

        return {
          colors: enhancedColors,
          palette: {
            colors: enhancedColors,
            confidence: 0.6,
            source: "fallback" as const,
            metadata: {
              faceDetected: false,
              colorCount: enhancedColors.length,
              dominantColor: enhancedColors[0] || "#000000",
              analysisType: "fallback" as const,
            },
          },
        };
      } catch (fallbackError) {
        console.error("Fallback color extraction failed:", fallbackError);

        // Ultimate fallback with curated flattering colors
        const fallbackColors = [
          "#8B7355", "#D4A574", "#F5E6D3", "#A0522D",
          "#CD853F", "#DEB887", "#E6E6FA", "#B0E0E6",
          "#98FB98", "#FFB6C1", "#DDA0DD", "#F5DEB3"
        ];

        return {
          colors: fallbackColors,
          palette: {
            colors: fallbackColors,
            confidence: 0.4,
            source: "fallback" as const,
            metadata: {
              faceDetected: false,
              colorCount: fallbackColors.length,
              dominantColor: fallbackColors[0],
              analysisType: "fallback" as const,
            },
          },
        };
      }
    }
  };

  const extractEnhancedColors = async (imageFile: File): Promise<string[]> => {
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
            const colors = extractAdvancedColors(imageData);
            resolve(colors);
          } else {
            resolve(["#8B7355", "#D4A574", "#F5E6D3"]); // Enhanced fallback
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const extractAdvancedColors = (imageData: ImageData): string[] => {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    const labColorMap = new Map<string, { count: number; lab: { l: number; a: number; b: number } }>();

    // Sample pixels with better distribution
    const step = Math.max(1, Math.floor(data.length / 10000)); // Sample 10k pixels max
    
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skip transparent or very dark/light pixels
      if (isValidColor(r, g, b)) {
        const hex = rgbToHex(r, g, b);
        const lab = rgbToLab(r, g, b);
        
        // Group similar colors in CIELAB space
        const labKey = `${Math.round(lab.l / 10)}_${Math.round(lab.a / 10)}_${Math.round(lab.b / 10)}`;
        
        if (labColorMap.has(labKey)) {
          labColorMap.get(labKey)!.count++;
        } else {
          labColorMap.set(labKey, { count: 1, lab });
        }
        
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }

    // Convert LAB groups back to hex and sort by frequency
    const sortedColors = Array.from(labColorMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8) // Get top 8 colors
      .map(([_, data]) => {
        const rgb = labToRgb(data.lab.l, data.lab.a, data.lab.b);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
      });

    // Ensure minimum color diversity
    const diverseColors = ensureColorDiversity(sortedColors);
    
    return diverseColors.slice(0, 6); // Return top 6 colors
  };

  const isValidColor = (r: number, g: number, b: number): boolean => {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 15 && brightness < 240; // Avoid very dark/light colors
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  const rgbToLab = (r: number, g: number, b: number): { l: number; a: number; b: number } => {
    // Convert RGB to XYZ
    const xyz = rgbToXyz(r, g, b);
    
    // Convert XYZ to CIELAB
    const xn = 0.95047, yn = 1.00000, zn = 1.08883; // D65 illuminant
    
    const xr = xyzToLab(xyz.x / xn);
    const yr = xyzToLab(xyz.y / yn);
    const zr = xyzToLab(xyz.z / zn);
    
    const l = 116 * yr - 16;
    const a = 500 * (xr - yr);
    const bValue = 200 * (yr - zr);
    
    return { l, a, b: bValue };
  };

  const labToRgb = (l: number, a: number, b: number): { r: number; g: number; b: number } => {
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;
    
    const yr = (l + 16) / 116;
    const xr = a / 500 + yr;
    const zr = yr - b / 200;
    
    const x = xn * labToXyz(xr);
    const y = yn * labToXyz(yr);
    const z = zn * labToXyz(zr);
    
    return xyzToRgb(x, y, z);
  };

  const rgbToXyz = (r: number, g: number, b: number): { x: number; y: number; z: number } => {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    return { x, y, z };
  };

  const xyzToRgb = (x: number, y: number, z: number): { r: number; g: number; b: number } => {
    const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const b = x * 0.0557 + y * -0.2040 + z * 1.0570;
    
    const rNorm = Math.max(0, Math.min(1, r));
    const gNorm = Math.max(0, Math.min(1, g));
    const bNorm = Math.max(0, Math.min(1, b));
    
    const rFinal = rNorm > 0.0031308 ? 1.055 * Math.pow(rNorm, 1/2.4) - 0.055 : 12.92 * rNorm;
    const gFinal = gNorm > 0.0031308 ? 1.055 * Math.pow(gNorm, 1/2.4) - 0.055 : 12.92 * gNorm;
    const bFinal = bNorm > 0.0031308 ? 1.055 * Math.pow(bNorm, 1/2.4) - 0.055 : 12.92 * bNorm;
    
    return {
      r: Math.round(rFinal * 255),
      g: Math.round(gFinal * 255),
      b: Math.round(bFinal * 255)
    };
  };

  const xyzToLab = (t: number): number => {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);
  };

  const labToXyz = (t: number): number => {
    return t > 0.206893 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;
  };

  const ensureColorDiversity = (colors: string[]): string[] => {
    const diverse: string[] = [];
    const minDistance = 20; // Minimum perceptual distance
    
    for (const color of colors) {
      const rgb = hexToRgb(color);
      const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
      
      // Check if this color is sufficiently different from already selected colors
      const isDiverse = diverse.every(existingColor => {
        const existingRgb = hexToRgb(existingColor);
        const existingLab = rgbToLab(existingRgb.r, existingRgb.g, existingRgb.b);
        
        const distance = Math.sqrt(
          Math.pow(lab.l - existingLab.l, 2) +
          Math.pow(lab.a - existingLab.a, 2) +
          Math.pow(lab.b - existingLab.b, 2)
        );
        
        return distance >= minDistance;
      });
      
      if (isDiverse) {
        diverse.push(color);
      }
    }
    
    // If we don't have enough diverse colors, add some from the original list
    while (diverse.length < 6 && diverse.length < colors.length) {
      const remaining = colors.filter(c => !diverse.includes(c));
      if (remaining.length > 0) {
        diverse.push(remaining[0]);
      } else {
        break;
      }
    }
    
    return diverse;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
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

      // Clean up previous preview URL to prevent memory leaks
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      // Reset all state when changing photo
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowAutoFit(false);
      setAutoFitPreviewUrl(null);
      setAutoFitNotice(false);

      // Set new preview URL and file
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      fileRef.current = file;
      setShowCropper(true);
    },
    [user, toast, previewUrl],
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

            // Perform facial color analysis
      let aiAnalysis = null;
      let colors = ["#8B7355"]; // Default fallback color
      let paletteData: ColorAnalysisResult | null = null;

      // Analyze facial colors and generate flattering recommendations
      try {
        const colorAnalysis = await analyzeFacialColors(croppedFile);
        colors = colorAnalysis.colors;
        paletteData = colorAnalysis.palette;

        const analysisType = paletteData?.metadata.analysisType === "facial-features"
          ? "your facial features"
          : "enhanced detection";

        toast({
          title: "🎨 Your Color Palette Ready!",
          description: `Analyzed ${analysisType} and found ${colors.length} flattering colors with ${Math.round((paletteData?.confidence || 0) * 100)}% confidence`,
        });

                        // Log facial analysis details if available
        if (paletteData?.facialFeatures) {
          const features = paletteData.facialFeatures;
          console.log(`✅ Facial Feature Detection Results:\n` +
            `   Skin: ${features.skinTone.color} (${features.skinTone.lightness} ${features.skinTone.undertone})\n` +
            `   Hair: ${features.hairColor.color} (${features.hairColor.description})\n` +
            `   Eyes: ${features.eyeColor.color} (${features.eyeColor.description})\n` +
            `   Overall Confidence: ${Math.round(features.overallConfidence * 100)}%`);
        }
      } catch (colorError) {
        console.warn("Facial color analysis failed:", colorError);

        toast({
          title: "Color analysis completed",
          description: "Using fallback color detection method.",
          variant: "default",
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

      // Update the profile immediately with extracted colors
      try {
        if (user && colors.length > 0) {
                    console.log("🎨 Saving extracted colors to profile:", colors);
          console.log("👤 User ID:", user.id);
                                        // Prepare update data (only fields that exist in database schema)
          const updateData = {
            face_photo_url: imageUrl,
            color_palette_colors: colors,
          };
          console.log("📝 Update data:", updateData);

          const { error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("user_id", user.id);

                    if (updateError) {
            console.error("Failed to save colors to profile:", updateError.message || updateError);
            toast({
              title: "Color save warning",
              description:
                `Failed to save colors: ${updateError.message || 'Unknown database error'}`,
              variant: "destructive",
            });
          } else {
            console.log("✅ Colors successfully saved to profile!");
            // Force profile refetch to show updated colors immediately
            await refetchProfile();
            toast({
              title: "🎨 Colors saved!",
              description:
                "Your color palette has been updated in your profile.",
            });
          }
        }
            } catch (saveError) {
        console.error("Error saving colors:", saveError?.message || saveError);
        toast({
          title: "Save Error",
          description: `Failed to save colors: ${saveError?.message || 'Unknown error'}`,
          variant: "destructive",
        });
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
      {/* Photo Upload Guidance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
            📸
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              📸 For Best Results
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">
              Upload a close-up photo of your face with:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-200 list-disc list-inside space-y-1">
              <li><strong>Hair visible</strong> - so we can detect your real hair color</li>
              <li><strong>Eyes clearly shown</strong> - for accurate eye color detection</li>
              <li><strong>Skin exposed</strong> - to analyze your skin tone properly</li>
              <li><strong>White/neutral background</strong> - prevents color interference</li>
              <li><strong>Good lighting</strong> - natural light works best</li>
            </ul>
          </div>
        </div>
      </div>

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
                {isAnalyzing ? "Analyzing Face..." : "Analyze My Colors"}
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
                ? "🔍 Detecting your facial features..."
                : "Upload your photo"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isAnalyzing
                ? "Analyzing your actual skin tone, hair color, and eye color"
                : "We'll detect your real skin tone, hair color, and eye color from your photo"}
            </p>
          </>
        )}

                                <Button
          type="button"
          disabled={isAnalyzing}
          className="shadow-button"
          onClick={() => {
            const input = document.getElementById("photo-input") as HTMLInputElement;
            if (input) {
              // Clear the input value to ensure onChange fires even for the same file
              input.value = "";
              // Force a small delay to ensure the clear takes effect
              setTimeout(() => {
                input.click();
              }, 10);
            }
          }}
        >
                    {isAnalyzing
            ? "Analyzing Features..."
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
                                        <p>🔍 Detecting your actual facial feature colors...</p>
          <p>
                        Analyzing your real skin tone, hair color, and eye color from the photo
          </p>
        </div>
      )}
    </div>
  );
};
