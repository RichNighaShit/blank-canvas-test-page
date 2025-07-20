/**
 * Accurate Facial Feature Color Analysis Service
 * 
 * Detects and returns the ACTUAL colors of hair, eyes, and skin tone
 * NOT "flattering" colors - shows what the person actually looks like
 */

export interface FacialFeatureColors {
  skinTone: {
    color: string;
    lightness: "very-light" | "light" | "medium" | "dark" | "very-dark";
    undertone: "warm" | "cool" | "neutral";
    confidence: number;
  };
  hairColor: {
    color: string;
    description: string; // e.g., "Black", "Dark Brown", "Light Brown", etc.
    confidence: number;
  };
  eyeColor: {
    color: string;
    description: string; // e.g., "Dark Brown", "Brown", "Blue", etc.
    confidence: number;
  };
  overallConfidence: number;
  detectedFeatures: boolean;
}

class AccurateFacialFeatureAnalysis {
  /**
   * Analyze image to detect actual hair, eye, and skin colors
   */
  async detectFacialFeatureColors(imageInput: string | File | Blob): Promise<FacialFeatureColors> {
    try {
      const img = await this.loadImage(imageInput);
      
      // Get different regions of the face
      const regions = await this.analyzeImageRegions(img);
      
      // Detect skin tone from cheek/forehead area
      const skinTone = this.detectSkinTone(regions.skinPixels);
      
      // Detect hair color from top region
      const hairColor = this.detectHairColor(regions.hairPixels);
      
      // Detect eye color from eye region (simplified)
      const eyeColor = this.detectEyeColor(regions.eyePixels);
      
      const overallConfidence = (skinTone.confidence + hairColor.confidence + eyeColor.confidence) / 3;

      return {
        skinTone,
        hairColor,
        eyeColor,
        overallConfidence,
        detectedFeatures: true
      };
    } catch (error) {
      console.error("Facial feature detection failed:", error);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Load image from various input types
   */
  private async loadImage(input: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      if (typeof input === "string") {
        img.src = input;
      } else {
        const url = URL.createObjectURL(input);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
      }
    });
  }

  /**
   * Analyze different regions of the image for facial features
   */
  private async analyzeImageRegions(img: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    // Resize for consistent analysis
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, size, size);
    
    // Define regions (simplified face layout)
    const regions = {
      // Hair region (top 30% of image)
      hairPixels: this.extractRegionPixels(imageData, 0, 0, size, size * 0.3),
      
      // Skin region (middle area, avoiding hair and eyes)
      skinPixels: this.extractRegionPixels(imageData, size * 0.2, size * 0.3, size * 0.6, size * 0.4),
      
      // Eye region (upper middle area)
      eyePixels: this.extractRegionPixels(imageData, size * 0.3, size * 0.35, size * 0.4, size * 0.15)
    };
    
    return regions;
  }

  /**
   * Extract pixels from a specific region
   */
  private extractRegionPixels(imageData: ImageData, x: number, y: number, width: number, height: number): Array<{r: number, g: number, b: number}> {
    const pixels: Array<{r: number, g: number, b: number}> = [];
    const data = imageData.data;
    const imgWidth = imageData.width;
    
    for (let row = Math.floor(y); row < Math.floor(y + height); row++) {
      for (let col = Math.floor(x); col < Math.floor(x + width); col++) {
        if (row >= 0 && row < imageData.height && col >= 0 && col < imgWidth) {
          const index = (row * imgWidth + col) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          
          if (r !== undefined && g !== undefined && b !== undefined) {
            pixels.push({ r, g, b });
          }
        }
      }
    }
    
    return pixels;
  }

  /**
   * Detect actual skin tone from skin pixels
   */
  private detectSkinTone(skinPixels: Array<{r: number, g: number, b: number}>) {
    const validSkinPixels = skinPixels.filter(pixel => this.isSkinColor(pixel.r, pixel.g, pixel.b));
    
    if (validSkinPixels.length === 0) {
      return {
        color: "#D4A574",
        lightness: "medium" as const,
        undertone: "neutral" as const,
        confidence: 0.3
      };
    }
    
    // Get average skin color
    const avgR = Math.round(validSkinPixels.reduce((sum, p) => sum + p.r, 0) / validSkinPixels.length);
    const avgG = Math.round(validSkinPixels.reduce((sum, p) => sum + p.g, 0) / validSkinPixels.length);
    const avgB = Math.round(validSkinPixels.reduce((sum, p) => sum + p.b, 0) / validSkinPixels.length);
    
    const skinColor = this.rgbToHex(avgR, avgG, avgB);
    const lightness = this.classifySkinLightness(avgR, avgG, avgB);
    const undertone = this.classifyUndertone(avgR, avgG, avgB);
    
    return {
      color: skinColor,
      lightness,
      undertone,
      confidence: Math.min(0.9, validSkinPixels.length / skinPixels.length + 0.3)
    };
  }

  /**
   * Detect actual hair color from hair pixels
   */
  private detectHairColor(hairPixels: Array<{r: number, g: number, b: number}>) {
    const validHairPixels = hairPixels.filter(pixel => this.isHairColor(pixel.r, pixel.g, pixel.b));
    
    if (validHairPixels.length === 0) {
      return {
        color: "#3C2415",
        description: "Dark Brown",
        confidence: 0.3
      };
    }
    
    // Get average hair color
    const avgR = Math.round(validHairPixels.reduce((sum, p) => sum + p.r, 0) / validHairPixels.length);
    const avgG = Math.round(validHairPixels.reduce((sum, p) => sum + p.g, 0) / validHairPixels.length);
    const avgB = Math.round(validHairPixels.reduce((sum, p) => sum + p.b, 0) / validHairPixels.length);
    
    const hairColor = this.rgbToHex(avgR, avgG, avgB);
    const description = this.classifyHairColor(avgR, avgG, avgB);
    
    return {
      color: hairColor,
      description,
      confidence: Math.min(0.9, validHairPixels.length / hairPixels.length + 0.4)
    };
  }

  /**
   * Detect actual eye color from eye pixels
   */
  private detectEyeColor(eyePixels: Array<{r: number, g: number, b: number}>) {
    const validEyePixels = eyePixels.filter(pixel => this.isEyeColor(pixel.r, pixel.g, pixel.b));
    
    if (validEyePixels.length === 0) {
      return {
        color: "#654321",
        description: "Dark Brown",
        confidence: 0.3
      };
    }
    
    // Get average eye color
    const avgR = Math.round(validEyePixels.reduce((sum, p) => sum + p.r, 0) / validEyePixels.length);
    const avgG = Math.round(validEyePixels.reduce((sum, p) => sum + p.g, 0) / validEyePixels.length);
    const avgB = Math.round(validEyePixels.reduce((sum, p) => sum + p.b, 0) / validEyePixels.length);
    
    const eyeColor = this.rgbToHex(avgR, avgG, avgB);
    const description = this.classifyEyeColor(avgR, avgG, avgB);
    
    return {
      color: eyeColor,
      description,
      confidence: Math.min(0.8, validEyePixels.length / eyePixels.length + 0.3)
    };
  }

  /**
   * Check if pixel is likely skin color
   */
  private isSkinColor(r: number, g: number, b: number): boolean {
    // Basic skin color detection
    return (r > 95 && g > 40 && b > 20) &&
           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
           (Math.abs(r - g) > 15) && (r > g) && (r > b) &&
           (r + g + b > 80) && (r + g + b < 650);
  }

  /**
   * Check if pixel is likely hair color
   */
  private isHairColor(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    // Hair is typically darker and has less variation
    return brightness < 150 && (Math.max(r, g, b) - Math.min(r, g, b) < 50);
  }

  /**
   * Check if pixel is likely eye color (excluding whites and lashes)
   */
  private isEyeColor(r: number, g: number, b: number): boolean {
    const brightness = (r + g + b) / 3;
    // Eyes have moderate brightness, not too bright (whites) or too dark (lashes)
    return brightness > 30 && brightness < 180 && 
           (Math.max(r, g, b) - Math.min(r, g, b) > 10);
  }

  /**
   * Classify skin lightness based on RGB values
   */
  private classifySkinLightness(r: number, g: number, b: number): "very-light" | "light" | "medium" | "dark" | "very-dark" {
    const brightness = (r + g + b) / 3;
    
    if (brightness > 200) return "very-light";
    if (brightness > 160) return "light";
    if (brightness > 120) return "medium";
    if (brightness > 80) return "dark";
    return "very-dark";
  }

  /**
   * Classify undertone based on RGB ratios
   */
  private classifyUndertone(r: number, g: number, b: number): "warm" | "cool" | "neutral" {
    const ratio1 = r / g;
    const ratio2 = r / b;
    
    if (ratio1 > 1.1 && ratio2 > 1.2) return "warm";   // More red
    if (ratio1 < 0.95 && ratio2 < 1.1) return "cool";  // More blue/green
    return "neutral";
  }

  /**
   * Classify hair color based on RGB values
   */
  private classifyHairColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    const maxChannel = Math.max(r, g, b);
    
    if (brightness < 30) return "Black";
    if (brightness < 50) return "Very Dark Brown";
    if (brightness < 70) return "Dark Brown";
    if (brightness < 90) return "Medium Brown";
    if (brightness < 110) return "Light Brown";
    if (brightness < 140 && r > g && r > b) return "Auburn/Red";
    if (brightness < 160) return "Dark Blonde";
    if (brightness < 200) return "Blonde";
    return "Light Blonde";
  }

  /**
   * Classify eye color based on RGB values
   */
  private classifyEyeColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    
    if (brightness < 40) return "Very Dark Brown";
    if (brightness < 60) return "Dark Brown";
    if (brightness < 80) return "Brown";
    if (brightness < 100 && r > b) return "Hazel";
    if (brightness < 120 && g > r && g > b) return "Green";
    if (brightness < 140 && b > r && b > g) return "Blue";
    if (brightness < 160) return "Light Brown";
    return "Light Eyes";
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Get fallback features when detection fails
   */
  private getFallbackFeatures(): FacialFeatureColors {
    return {
      skinTone: {
        color: "#D4A574",
        lightness: "medium",
        undertone: "neutral",
        confidence: 0.3
      },
      hairColor: {
        color: "#3C2415",
        description: "Dark Brown",
        confidence: 0.3
      },
      eyeColor: {
        color: "#654321",
        description: "Dark Brown", 
        confidence: 0.3
      },
      overallConfidence: 0.3,
      detectedFeatures: false
    };
  }
}

// Export singleton instance
export const accurateFacialFeatureAnalysis = new AccurateFacialFeatureAnalysis();
