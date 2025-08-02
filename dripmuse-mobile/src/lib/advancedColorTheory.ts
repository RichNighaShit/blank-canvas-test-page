/**
 * Advanced Color Theory System - Enhanced Version
 *
 * This module implements modern color theory principles with:
 * - Improved hex color handling and validation
 * - Enhanced color harmony analysis using CIELAB color space
 * - Better seasonal color matching
 * - Sophisticated color temperature analysis
 * - Advanced complementary and analogous color generation
 */

export interface ColorHarmonyResult {
  isHarmonious: boolean;
  harmonyType: string;
  confidence: number;
  reasoning: string;
  colorDistance: number;
  perceptualMatch: boolean;
}

export interface ColorAnalysis {
  dominantColor: string;
  colorFamily: string;
  temperature: "warm" | "cool" | "neutral";
  intensity: "light" | "medium" | "dark";
  saturation: "low" | "medium" | "high";
  hexValue: string;
  labValues: { l: number; a: number; b: number };
}

export interface SeasonalColorProfile {
  season: "spring" | "summer" | "autumn" | "winter";
  palette: string[];
  characteristics: string[];
  hexPalette: string[];
}

export class AdvancedColorTheory {
  private colorFamilies = {
    red: [
      "#FF0000", "#DC143C", "#8B0000", "#800000", "#DC143C", "#FF1493", "#FF69B4", "#FFB6C1", "#FFC0CB", "#FF69B4", "#FF00FF", "#FF00FF",
    ],
    blue: [
      "#0000FF", "#000080", "#4169E1", "#87CEEB", "#B0E0E6", "#008080", "#40E0D0", "#00FFFF", "#1E90FF", "#0000CD", "#4B0082", "#191970",
    ],
    green: [
      "#008000", "#228B22", "#808000", "#32CD32", "#98FB98", "#00FF00", "#228B22", "#00FF7F", "#32CD32", "#006400", "#7FFF00", "#98FB98",
    ],
    yellow: [
      "#FFFF00", "#FFD700", "#FFD700", "#FFFF00", "#FFFACD", "#F0E68C", "#DAA520", "#FFD700", "#FFD700", "#FFFF00", "#FFD700", "#FFD700",
    ],
    orange: [
      "#FFA500", "#FFC0CB", "#FFB6C1", "#FF69B4", "#FF4500", "#FFD700", "#CD853F", "#FF8C00", "#FFA500", "#FF6347",
    ],
    purple: [
      "#800080", "#EE82EE", "#E6E6FA", "#DDA0DD", "#E0B0FF", "#C8A2C8", "#9370DB", "#DA70D6", "#9932CC", "#8B008B",
    ],
    neutral: [
      "#000000", "#FFFFFF", "#808080", "#808080", "#F5F5DC", "#D2B48C", "#A0522D", "#483D8B", "#F4A460", "#D2B48C", "#F5DEB3", "#FFFFF0", "#696969", "#F5F5DC", "#F5F5DC", "#F5F5DC",
    ],
  };

  private complementaryPairs = [
    ["#FF0000", "#00FF00"],
    ["#0000FF", "#FFA500"],
    ["#FFFF00", "#800080"],
    ["#FF69B4", "#98FB98"],
    ["#FF7F50", "#008080"],
    ["#000080", "#FFD700"],
    ["#8B0000", "#228B22"],
    ["#FF4500", "#98FB98"],
    ["#800080", "#32CD32"],
    ["#E6E6FA", "#FFFF00"],
  ];

  private analogousSets = [
    ["#FF0000", "#FFA500", "#FF69B4"],
    ["#0000FF", "#800080", "#008080"],
    ["#008000", "#FFFF00", "#32CD32"],
    ["#FFA500", "#FFFF00", "#FF0000"],
    ["#800080", "#FF69B4", "#0000FF"],
    ["#008080", "#008000", "#0000FF"],
  ];

  private triadicSets = [
    ["#FF0000", "#0000FF", "#FFFF00"],
    ["#008000", "#FFA500", "#800080"],
    ["#FF69B4", "#008080", "#FFD700"],
    ["#000080", "#FF7F50", "#98FB98"],
  ];

  private seasonalPalettes: { [key: string]: SeasonalColorProfile } = {
    spring: {
      season: "spring",
      palette: [
        "coral", "peach", "yellow", "lime", "turquoise", "pink", "gold", "ivory", "light blue", "mint",
      ],
      characteristics: ["warm", "clear", "fresh", "bright"],
      hexPalette: [
        "#FF7F50", "#FFC0CB", "#FFFF00", "#32CD32", "#40E0D0", "#FF69B4", "#FFD700", "#FFFFF0", "#87CEEB", "#98FB98",
      ],
    },
    summer: {
      season: "summer",
      palette: [
        "lavender", "rose", "sage", "powder blue", "mint", "pearl", "champagne", "mauve", "soft pink", "grey",
      ],
      characteristics: ["cool", "soft", "muted", "elegant"],
      hexPalette: [
        "#E6E6FA", "#FF1493", "#98FB98", "#B0E0E6", "#98FB98", "#F0E68C", "#F0E68C", "#E0B0FF", "#FFC0CB", "#808080",
      ],
    },
    autumn: {
      season: "autumn",
      palette: [
        "rust", "burgundy", "forest", "gold", "brown", "orange", "olive", "bronze", "terracotta", "mustard",
      ],
      characteristics: ["warm", "rich", "earthy", "deep"],
      hexPalette: [
        "#FF4500", "#8B0000", "#228B22", "#FFD700", "#A0522D", "#FFA500", "#808000", "#CD853F", "#E2725B", "#FFD700",
      ],
    },
    winter: {
      season: "winter",
      palette: [
        "navy", "black", "white", "crimson", "royal blue", "emerald", "silver", "purple", "hot pink", "charcoal",
      ],
      characteristics: ["cool", "clear", "intense", "dramatic"],
      hexPalette: [
        "#000080", "#000000", "#FFFFFF", "#DC143C", "#4169E1", "#00FF7F", "#C0C0C0", "#800080", "#FF69B4", "#36454F",
      ],
    },
  };

  private modernColorCombinations = [
    // Monochromatic modern
    {
      colors: ["#D3D3D3", "#696969", "#FFFFFF"],
      type: "monochromatic",
      style: "minimalist",
    },
    {
      colors: ["#000080", "#B0E0E6", "#F5DEB3"],
      type: "monochromatic",
      style: "classic",
    },
    {
      colors: ["#FFB6C1", "#FF69B4", "#8B0000"],
      type: "monochromatic",
      style: "romantic",
    },

    // Contemporary complementary
    {
      colors: ["#98FB98", "#E2725B"],
      type: "complementary",
      style: "earthy modern",
    },
    {
      colors: ["#000080", "#D2B48C"],
      type: "complementary",
      style: "sophisticated",
    },
    {
      colors: ["#FF69B4", "#32CD32"],
      type: "complementary",
      style: "bold",
    },

    // Triadic modern
    {
      colors: ["#FF0000", "#00FF00", "#0000FF"],
      type: "triadic",
      style: "vibrant",
    },
    {
      colors: ["#FFA500", "#800080", "#008000"],
      type: "triadic",
      style: "creative",
    },
  ];

  /**
   * Enhanced color harmony analysis using CIELAB color space
   */
  public analyzeColorHarmony(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    try {
      const allColors = [...colors1, ...colors2];
      const normalizedColors = allColors.map(color => this.normalizeColor(color));
      
      // Convert to CIELAB for perceptual analysis
      const labColors = normalizedColors.map(hex => {
        const rgb = this.hexToRgb(hex);
        return this.rgbToLab(rgb.r, rgb.g, rgb.b);
      });

      // Calculate average perceptual distance
      const distances = [];
      for (let i = 0; i < labColors.length; i++) {
        for (let j = i + 1; j < labColors.length; j++) {
          distances.push(this.calculateLabDistance(labColors[i], labColors[j]));
        }
      }
      
      const avgDistance = distances.length > 0 ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 0;
      const perceptualMatch = avgDistance < 50; // Threshold for perceptual harmony

      // Check for specific harmony types
      const harmonyChecks = [
        this.checkMonochromatic(normalizedColors),
        this.checkComplementary(normalizedColors),
        this.checkAnalogous(normalizedColors),
        this.checkTriadic(normalizedColors),
        this.checkSeasonalPalette(normalizedColors),
        this.checkModernCombinations(normalizedColors, []),
        this.checkNeutralHarmony(normalizedColors, normalizedColors),
      ];

      // Find the best harmony match
      const bestHarmony = harmonyChecks.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return {
        isHarmonious: bestHarmony.confidence > 0.6,
        harmonyType: bestHarmony.harmonyType,
        confidence: bestHarmony.confidence,
        reasoning: bestHarmony.reasoning,
        colorDistance: avgDistance,
        perceptualMatch,
      };
    } catch (error) {
      console.warn("Color harmony analysis failed:", error);
      return {
        isHarmonious: false,
        harmonyType: "unknown",
        confidence: 0.3,
        reasoning: "Analysis failed",
        colorDistance: 100,
        perceptualMatch: false,
      };
    }
  }

  /**
   * Enhanced color analysis with CIELAB values
   */
  public analyzeColor(color: string): ColorAnalysis {
    const normalizedColor = this.normalizeColor(color);
    const rgb = this.hexToRgb(normalizedColor);
    const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      dominantColor: this.getDominantColor(normalizedColor),
      colorFamily: this.getColorFamily(normalizedColor),
      temperature: this.getColorTemperature(normalizedColor),
      intensity: this.getColorIntensity(normalizedColor),
      saturation: this.getColorSaturation(hsl.s),
      hexValue: normalizedColor,
      labValues: lab,
    };
  }

  /**
   * Get current seasonal palette with hex values
   */
  public getCurrentSeasonalPalette(): SeasonalColorProfile {
    const currentSeason = this.getCurrentSeason();
    return this.seasonalPalettes[currentSeason] || this.seasonalPalettes.spring;
  }

  /**
   * Find best harmony among all colors
   */
  public findBestHarmony(allColors: string[]): ColorHarmonyResult {
    if (allColors.length < 2) {
      return {
        isHarmonious: true,
        harmonyType: "single-color",
        confidence: 1.0,
        reasoning: "Single color is always harmonious",
        colorDistance: 0,
        perceptualMatch: true,
      };
    }

    return this.analyzeColorHarmony(allColors, []);
  }

  /**
   * Generate harmonious colors from base color
   */
  public generateHarmoniousColors(
    baseColor: string,
    harmonyType: string = "complementary",
  ): string[] {
    const normalizedBase = this.normalizeColor(baseColor);
    const rgb = this.hexToRgb(normalizedBase);
    const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);

    switch (harmonyType) {
      case "complementary":
        return this.generateComplementaryColors(lab);
      case "analogous":
        return this.generateAnalogousColors(lab);
      case "triadic":
        return this.generateTriadicColors(lab);
      case "monochromatic":
        return this.generateMonochromaticColors(lab);
      default:
        return this.generateComplementaryColors(lab);
    }
  }

  /**
   * Convert RGB to CIELAB color space
   */
  private rgbToLab(r: number, g: number, blue: number): { l: number; a: number; b: number } {
    // Convert RGB to XYZ
    const xyz = this.rgbToXyz(r, g, blue);

    // Convert XYZ to CIELAB
    const xn = 0.95047, yn = 1.00000, zn = 1.08883; // D65 illuminant

    const xr = this.xyzToLab(xyz.x / xn);
    const yr = this.xyzToLab(xyz.y / yn);
    const zr = this.xyzToLab(xyz.z / zn);

    const l = 116 * yr - 16;
    const a = 500 * (xr - yr);
    const b = 200 * (yr - zr);

    return { l, a, b };
  }

  /**
   * Convert CIELAB to RGB
   */
  private labToRgb(l: number, a: number, bLab: number): { r: number; g: number; b: number } {
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;

    const yr = (l + 16) / 116;
    const xr = a / 500 + yr;
    const zr = yr - bLab / 200;

    const x = xn * this.labToXyz(xr);
    const y = yn * this.labToXyz(yr);
    const z = zn * this.labToXyz(zr);

    return this.xyzToRgb(x, y, z);
  }

  /**
   * Convert RGB to XYZ
   */
  private rgbToXyz(r: number, g: number, blue: number): { x: number; y: number; z: number } {
    r = r / 255;
    g = g / 255;
    blue = blue / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    blue = blue > 0.04045 ? Math.pow((blue + 0.055) / 1.055, 2.4) : blue / 12.92;

    const x = r * 0.4124 + g * 0.3576 + blue * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + blue * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + blue * 0.9505;

    return { x, y, z };
  }

  /**
   * Convert XYZ to RGB
   */
  private xyzToRgb(x: number, y: number, z: number): { r: number; g: number; b: number } {
    const rCalc = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const gCalc = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const bCalc = x * 0.0557 + y * -0.2040 + z * 1.0570;

    const rNorm = Math.max(0, Math.min(1, rCalc));
    const gNorm = Math.max(0, Math.min(1, gCalc));
    const bNorm = Math.max(0, Math.min(1, bCalc));

    const rFinal = rNorm > 0.0031308 ? 1.055 * Math.pow(rNorm, 1/2.4) - 0.055 : 12.92 * rNorm;
    const gFinal = gNorm > 0.0031308 ? 1.055 * Math.pow(gNorm, 1/2.4) - 0.055 : 12.92 * gNorm;
    const bFinal = bNorm > 0.0031308 ? 1.055 * Math.pow(bNorm, 1/2.4) - 0.055 : 12.92 * bNorm;

    return {
      r: Math.round(rFinal * 255),
      g: Math.round(gFinal * 255),
      b: Math.round(bFinal * 255)
    };
  }

  /**
   * Helper functions for CIELAB conversion
   */
  private xyzToLab(t: number): number {
    return t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);
  }

  private labToXyz(t: number): number {
    return t > 0.206893 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787;
  }

  /**
   * Calculate perceptual distance in CIELAB color space
   */
  private calculateLabDistance(lab1: { l: number; a: number; b: number }, lab2: { l: number; a: number; b: number }): number {
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  /**
   * Generate complementary colors
   */
  private generateComplementaryColors(baseLab: { l: number; a: number; b: number }): string[] {
    const complementaryLab = { l: baseLab.l, a: -baseLab.a, b: -baseLab.b };
    const rgb = this.labToRgb(complementaryLab.l, complementaryLab.a, complementaryLab.b);
    return [this.rgbToHex(rgb.r, rgb.g, rgb.b)];
  }

  /**
   * Generate analogous colors
   */
  private generateAnalogousColors(baseLab: { l: number; a: number; b: number }): string[] {
    const colors = [];
    for (let i = 1; i <= 3; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const newA = baseLab.a * Math.cos(angle) - baseLab.b * Math.sin(angle);
      const newB = baseLab.a * Math.sin(angle) + baseLab.b * Math.cos(angle);
      const rgb = this.labToRgb(baseLab.l, newA, newB);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors;
  }

  /**
   * Generate triadic colors
   */
  private generateTriadicColors(baseLab: { l: number; a: number; b: number }): string[] {
    const colors = [];
    for (let i = 1; i <= 2; i++) {
      const angle = (i * 120) * Math.PI / 180;
      const newA = baseLab.a * Math.cos(angle) - baseLab.b * Math.sin(angle);
      const newB = baseLab.a * Math.sin(angle) + baseLab.b * Math.cos(angle);
      const rgb = this.labToRgb(baseLab.l, newA, newB);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors;
  }

  /**
   * Generate monochromatic colors
   */
  private generateMonochromaticColors(baseLab: { l: number; a: number; b: number }): string[] {
    const colors = [];
    for (let i = 1; i <= 3; i++) {
      const newL = Math.max(0, Math.min(100, baseLab.l + (i * 10 - 20)));
      const rgb = this.labToRgb(newL, baseLab.a, baseLab.b);
      colors.push(this.rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, blue: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`.toUpperCase();
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
   * Convert RGB to HSL
   */
  private rgbToHsl(r: number, g: number, blue: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    blue /= 255;

    const max = Math.max(r, g, blue);
    const min = Math.min(r, g, blue);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - blue) / d + (g < blue ? 6 : 0);
          break;
        case g:
          h = (blue - r) / d + 2;
          break;
        case blue:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private normalizeColor(color: string): string {
    return color
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, "");
  }

  private checkNeutralHarmony(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    const neutrals = this.colorFamilies.neutral;

    const hasNeutral1 = colors1.some((c) =>
      neutrals.some((n) => c.includes(n)),
    );
    const hasNeutral2 = colors2.some((c) =>
      neutrals.some((n) => c.includes(n)),
    );

    if (hasNeutral1 || hasNeutral2) {
      const confidence = hasNeutral1 && hasNeutral2 ? 0.95 : 0.85;
      return {
        isHarmonious: true,
        harmonyType: "neutral",
        confidence,
        reasoning: "Neutral colors provide universal harmony",
        colorDistance: 0,
        perceptualMatch: true,
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkModernCombinations(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    for (const combo of this.modernColorCombinations) {
      const matches1 = colors1.some((c1) =>
        combo.colors.some((cc) => c1.includes(cc) || cc.includes(c1)),
      );
      const matches2 = colors2.some((c2) =>
        combo.colors.some((cc) => c2.includes(cc) || cc.includes(c2)),
      );

      if (matches1 && matches2) {
        return {
          isHarmonious: true,
          harmonyType: `modern-${combo.type}`,
          confidence: 0.9,
          reasoning: `Modern ${combo.style} color combination`,
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkTraditionalHarmonies(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    // Check complementary
    for (const [color1, color2] of this.complementaryPairs) {
      const hasColor1_1 = colors1.some((c) => c.includes(color1));
      const hasColor2_1 = colors1.some((c) => c.includes(color2));
      const hasColor1_2 = colors2.some((c) => c.includes(color1));
      const hasColor2_2 = colors2.some((c) => c.includes(color2));

      if ((hasColor1_1 && hasColor2_2) || (hasColor2_1 && hasColor1_2)) {
        return {
          isHarmonious: true,
          harmonyType: "complementary",
          confidence: 0.8,
          reasoning: `Complementary colors create dynamic contrast`,
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    // Check analogous
    for (const analogousSet of this.analogousSets) {
      const matches1 = colors1.some((c1) =>
        analogousSet.some((a) => c1.includes(a)),
      );
      const matches2 = colors2.some((c2) =>
        analogousSet.some((a) => c2.includes(a)),
      );

      if (matches1 && matches2) {
        return {
          isHarmonious: true,
          harmonyType: "analogous",
          confidence: 0.75,
          reasoning: "Analogous colors create pleasing harmony",
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    // Check triadic
    for (const triadicSet of this.triadicSets) {
      const matches1 = colors1.some((c1) =>
        triadicSet.some((t) => c1.includes(t)),
      );
      const matches2 = colors2.some((c2) =>
        triadicSet.some((t) => c2.includes(t)),
      );

      if (matches1 && matches2) {
        return {
          isHarmonious: true,
          harmonyType: "triadic",
          confidence: 0.7,
          reasoning: "Triadic colors create vibrant balance",
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkSeasonalHarmony(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    const currentSeason = this.getCurrentSeason();
    const seasonalPalette = this.seasonalPalettes[currentSeason].palette;

    const seasonal1 = colors1.some((c1) =>
      seasonalPalette.some((sp) => c1.includes(sp) || sp.includes(c1)),
    );
    const seasonal2 = colors2.some((c2) =>
      seasonalPalette.some((sp) => c2.includes(sp) || sp.includes(c2)),
    );

    if (seasonal1 && seasonal2) {
      return {
        isHarmonious: true,
        harmonyType: "seasonal",
        confidence: 0.8,
        reasoning: `Perfect for ${currentSeason} season`,
        colorDistance: 0,
        perceptualMatch: true,
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkColorFamilyHarmony(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    for (const [familyName, familyColors] of Object.entries(
      this.colorFamilies,
    )) {
      if (familyName === "neutral") continue;

      const inFamily1 = colors1.some((c1) =>
        familyColors.some((fc) => c1.includes(fc)),
      );
      const inFamily2 = colors2.some((c2) =>
        familyColors.some((fc) => c2.includes(fc)),
      );

      if (inFamily1 && inFamily2) {
        return {
          isHarmonious: true,
          harmonyType: "monochromatic",
          confidence: 0.7,
          reasoning: `Monochromatic ${familyName} harmony`,
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkMonochromatic(colors: string[]): ColorHarmonyResult {
    const families = Object.entries(this.colorFamilies);

    for (const [familyName, familyColors] of families) {
      const familyMatches = colors.filter((c) =>
        familyColors.some((fc) => c.includes(fc) || fc.includes(c)),
      );

      if (familyMatches.length >= colors.length * 0.7) {
        return {
          isHarmonious: true,
          harmonyType: "monochromatic",
          confidence: 0.85,
          reasoning: `Beautiful ${familyName} monochromatic scheme`,
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkComplementary(colors: string[]): ColorHarmonyResult {
    for (const [color1, color2] of this.complementaryPairs) {
      const hasColor1 = colors.some((c) => c.includes(color1));
      const hasColor2 = colors.some((c) => c.includes(color2));

      if (hasColor1 && hasColor2) {
        return {
          isHarmonious: true,
          harmonyType: "complementary",
          confidence: 0.8,
          reasoning: "Dynamic complementary color harmony",
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkAnalogous(colors: string[]): ColorHarmonyResult {
    for (const analogousSet of this.analogousSets) {
      const matches = colors.filter((c) =>
        analogousSet.some((a) => c.includes(a)),
      );

      if (matches.length >= 2) {
        return {
          isHarmonious: true,
          harmonyType: "analogous",
          confidence: 0.75,
          reasoning: "Soothing analogous color harmony",
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkTriadic(colors: string[]): ColorHarmonyResult {
    for (const triadicSet of this.triadicSets) {
      const matches = colors.filter((c) =>
        triadicSet.some((t) => c.includes(t)),
      );

      if (matches.length >= 2) {
        return {
          isHarmonious: true,
          harmonyType: "triadic",
          confidence: 0.7,
          reasoning: "Balanced triadic color harmony",
          colorDistance: 0,
          perceptualMatch: true,
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private checkSeasonalPalette(colors: string[]): ColorHarmonyResult {
    const currentSeason = this.getCurrentSeason();
    const palette = this.seasonalPalettes[currentSeason].palette;

    const seasonalMatches = colors.filter((c) =>
      palette.some((p) => c.includes(p) || p.includes(c)),
    );

    if (seasonalMatches.length >= colors.length * 0.6) {
      return {
        isHarmonious: true,
        harmonyType: "seasonal",
        confidence: 0.8,
        reasoning: `Perfect ${currentSeason} seasonal palette`,
        colorDistance: 0,
        perceptualMatch: true,
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
      colorDistance: 100,
      perceptualMatch: false,
    };
  }

  private getDominantColor(color: string): string {
    for (const [familyName, familyColors] of Object.entries(
      this.colorFamilies,
    )) {
      if (familyColors.some((fc) => color.includes(fc))) {
        return familyName;
      }
    }
    return "unknown";
  }

  private getColorFamily(color: string): string {
    return this.getDominantColor(color);
  }

  private getColorTemperature(color: string): "warm" | "cool" | "neutral" {
    const warmFamilies = ["red", "orange", "yellow"];
    const coolFamilies = ["blue", "green", "purple"];

    const family = this.getColorFamily(color);

    if (warmFamilies.includes(family)) return "warm";
    if (coolFamilies.includes(family)) return "cool";
    return "neutral";
  }

  private getColorIntensity(color: string): "light" | "medium" | "dark" {
    const lightKeywords = ["light", "pale", "pastel", "powder", "baby", "soft"];
    const darkKeywords = [
      "dark",
      "deep",
      "rich",
      "charcoal",
      "navy",
      "forest",
      "burgundy",
    ];

    if (lightKeywords.some((k) => color.includes(k))) return "light";
    if (darkKeywords.some((k) => color.includes(k))) return "dark";
    return "medium";
  }

  private getColorSaturation(s: number): "low" | "medium" | "high" {
    if (s < 20) return "low";
    if (s > 60) return "high";
    return "medium";
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  }

  private getComplementaryColors(family: string): string[] {
    const complementaryMap: { [key: string]: string[] } = {
      red: ["green", "teal", "mint"],
      blue: ["orange", "coral", "peach"],
      green: ["red", "pink", "coral"],
      yellow: ["purple", "violet", "plum"],
      orange: ["blue", "navy", "teal"],
      purple: ["yellow", "gold", "lime"],
    };
    return complementaryMap[family] || [];
  }

  private getAnalogousColors(family: string): string[] {
    const analogousMap: { [key: string]: string[] } = {
      red: ["orange", "pink", "coral"],
      blue: ["purple", "teal", "green"],
      green: ["yellow", "lime", "teal"],
      yellow: ["orange", "green", "gold"],
      orange: ["red", "yellow", "coral"],
      purple: ["blue", "pink", "violet"],
    };
    return analogousMap[family] || [];
  }

  private getTriadicColors(family: string): string[] {
    const triadicMap: { [key: string]: string[] } = {
      red: ["blue", "yellow"],
      blue: ["red", "yellow"],
      yellow: ["red", "blue"],
      green: ["orange", "purple"],
      orange: ["green", "purple"],
      purple: ["green", "orange"],
    };
    return triadicMap[family] || [];
  }

  private getMonochromaticColors(family: string): string[] {
    return this.colorFamilies[family as keyof typeof this.colorFamilies] || [];
  }
}

// Export singleton instance
export const advancedColorTheory = new AdvancedColorTheory();
