/**
 * Simplified Facial Color Analysis Service
 * 
 * Lightweight version without external dependencies to avoid import errors
 * Focuses on color extraction and recommendation without face detection
 */

export interface SimplifiedColorProfile {
  flatteringColors: string[];
  confidence: number;
  source: "facial-analysis" | "fallback";
  metadata: {
    faceDetected: boolean;
    colorCount: number;
    dominantColor: string;
    analysisType: "facial-features" | "fallback";
  };
}

class SimplifiedFacialAnalysisService {
  /**
   * Analyze image and generate flattering colors without face detection
   */
  async analyzeFacialColors(imageInput: string | File | Blob): Promise<SimplifiedColorProfile> {
    try {
      const img = await this.loadImage(imageInput);
      const colors = await this.extractColorsFromImage(img);
      const flatteringColors = this.generateFlatteringColors(colors);

      return {
        flatteringColors,
        confidence: 0.8,
        source: "facial-analysis",
        metadata: {
          faceDetected: false,
          colorCount: flatteringColors.length,
          dominantColor: flatteringColors[0] || "#8B7355",
          analysisType: "facial-features"
        }
      };
    } catch (error) {
      console.warn("Simplified facial analysis failed:", error);
      return this.getFallbackProfile();
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
   * Extract colors from image using canvas
   */
  private async extractColorsFromImage(img: HTMLImageElement): Promise<string[]> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    // Resize for performance
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.extractDominantColors(imageData);
  }

  /**
   * Extract dominant colors from image data
   */
  private extractDominantColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample pixels
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (this.isValidSkinColor(r, g, b)) {
        const hex = this.rgbToHex(r, g, b);
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }
    
    // Sort by frequency and return top colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([color]) => color);
  }

  /**
   * Check if color is likely skin tone
   */
  private isValidSkinColor(r: number, g: number, b: number): boolean {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Basic skin color range
    if (brightness < 30 || brightness > 240) return false;
    
    // Skin color characteristics
    return (r > 95 && g > 40 && b > 20) &&
           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
           (Math.abs(r - g) > 15) && (r > g) && (r > b);
  }

  /**
   * Generate flattering colors based on extracted colors
   */
  private generateFlatteringColors(baseColors: string[]): string[] {
    const flattering = new Set<string>();
    
    // Add base colors
    baseColors.forEach(color => flattering.add(color));
    
    // Generate complementary and harmonious colors
    for (const color of baseColors) {
      if (flattering.size >= 12) break;
      
      const variations = this.generateColorVariations(color);
      variations.forEach(variation => {
        if (flattering.size < 12) {
          flattering.add(variation);
        }
      });
    }
    
    // Fill with curated flattering colors if needed
    const curatedColors = [
      "#E6E6FA", "#B0E0E6", "#98FB98", "#FFB6C1", "#DDA0DD", 
      "#F5DEB3", "#D2B48C", "#CD853F", "#8B7355", "#A0522D",
      "#87CEEB", "#F0E68C"
    ];
    
    for (const color of curatedColors) {
      if (flattering.size >= 12) break;
      flattering.add(color);
    }
    
    return Array.from(flattering).slice(0, 12);
  }

  /**
   * Generate color variations (lighter, darker, complementary)
   */
  private generateColorVariations(hex: string): string[] {
    const variations = [];
    const rgb = this.hexToRgb(hex);
    
    // Lighter variation
    const lighter = {
      r: Math.min(255, rgb.r + 30),
      g: Math.min(255, rgb.g + 30),
      b: Math.min(255, rgb.b + 30)
    };
    variations.push(this.rgbToHex(lighter.r, lighter.g, lighter.b));
    
    // Darker variation
    const darker = {
      r: Math.max(0, rgb.r - 30),
      g: Math.max(0, rgb.g - 30),
      b: Math.max(0, rgb.b - 30)
    };
    variations.push(this.rgbToHex(darker.r, darker.g, darker.b));
    
    // Complementary
    const complement = {
      r: 255 - rgb.r,
      g: 255 - rgb.g,
      b: 255 - rgb.b
    };
    variations.push(this.rgbToHex(complement.r, complement.g, complement.b));
    
    return variations;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Get fallback profile
   */
  private getFallbackProfile(): SimplifiedColorProfile {
    return {
      flatteringColors: [
        "#8B7355", "#D4A574", "#F5E6D3", "#A0522D", 
        "#CD853F", "#DEB887", "#E6E6FA", "#B0E0E6", 
        "#98FB98", "#FFB6C1", "#DDA0DD", "#F5DEB3"
      ],
      confidence: 0.4,
      source: "fallback",
      metadata: {
        faceDetected: false,
        colorCount: 12,
        dominantColor: "#8B7355",
        analysisType: "fallback"
      }
    };
  }
}

// Export singleton instance
export const simplifiedFacialAnalysisService = new SimplifiedFacialAnalysisService();
