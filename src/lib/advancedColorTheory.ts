/**
 * Advanced Color Theory System for Style Recommendations
 *
 * This module implements modern color theory principles to enhance outfit recommendations.
 * It includes color harmony analysis, seasonal color palettes, and advanced color matching.
 */

export interface ColorHarmonyResult {
  isHarmonious: boolean;
  harmonyType: string;
  confidence: number;
  reasoning: string;
}

export interface ColorAnalysis {
  dominantColor: string;
  colorFamily: string;
  temperature: "warm" | "cool" | "neutral";
  intensity: "light" | "medium" | "dark";
  saturation: "low" | "medium" | "high";
}

export interface SeasonalColorProfile {
  season: "spring" | "summer" | "autumn" | "winter";
  palette: string[];
  characteristics: string[];
}

export class AdvancedColorTheory {
  private colorFamilies = {
    red: [
      "red",
      "crimson",
      "burgundy",
      "maroon",
      "cherry",
      "rose",
      "coral",
      "salmon",
      "pink",
      "blush",
      "fuchsia",
      "magenta",
    ],
    blue: [
      "blue",
      "navy",
      "royal",
      "sky",
      "powder",
      "teal",
      "turquoise",
      "cyan",
      "cerulean",
      "cobalt",
      "indigo",
      "sapphire",
    ],
    green: [
      "green",
      "forest",
      "olive",
      "lime",
      "mint",
      "sage",
      "emerald",
      "jade",
      "kelly",
      "hunter",
      "chartreuse",
      "seafoam",
    ],
    yellow: [
      "yellow",
      "gold",
      "mustard",
      "lemon",
      "cream",
      "butter",
      "champagne",
      "amber",
      "honey",
      "canary",
      "saffron",
    ],
    orange: [
      "orange",
      "peach",
      "apricot",
      "coral",
      "rust",
      "amber",
      "bronze",
      "tangerine",
      "papaya",
      "persimmon",
    ],
    purple: [
      "purple",
      "violet",
      "lavender",
      "plum",
      "mauve",
      "lilac",
      "amethyst",
      "orchid",
      "grape",
      "eggplant",
    ],
    neutral: [
      "black",
      "white",
      "grey",
      "gray",
      "beige",
      "tan",
      "brown",
      "taupe",
      "khaki",
      "camel",
      "cream",
      "ivory",
      "charcoal",
      "nude",
      "stone",
    ],
  };

  private complementaryPairs = [
    ["red", "green"],
    ["blue", "orange"],
    ["yellow", "purple"],
    ["pink", "mint"],
    ["coral", "teal"],
    ["navy", "gold"],
    ["burgundy", "forest"],
    ["rust", "sage"],
    ["plum", "lime"],
    ["lavender", "yellow"],
  ];

  private analogousSets = [
    ["red", "orange", "pink"],
    ["blue", "purple", "teal"],
    ["green", "yellow", "lime"],
    ["orange", "yellow", "red"],
    ["purple", "pink", "blue"],
    ["teal", "green", "blue"],
  ];

  private triadicSets = [
    ["red", "blue", "yellow"],
    ["green", "orange", "purple"],
    ["pink", "teal", "gold"],
    ["navy", "coral", "sage"],
  ];

  private seasonalPalettes: { [key: string]: SeasonalColorProfile } = {
    spring: {
      season: "spring",
      palette: [
        "coral",
        "peach",
        "yellow",
        "lime",
        "turquoise",
        "pink",
        "gold",
        "ivory",
        "light blue",
        "mint",
      ],
      characteristics: ["warm", "clear", "fresh", "bright"],
    },
    summer: {
      season: "summer",
      palette: [
        "lavender",
        "rose",
        "sage",
        "powder blue",
        "mint",
        "pearl",
        "champagne",
        "mauve",
        "soft pink",
        "grey",
      ],
      characteristics: ["cool", "soft", "muted", "elegant"],
    },
    autumn: {
      season: "autumn",
      palette: [
        "rust",
        "burgundy",
        "forest",
        "gold",
        "brown",
        "orange",
        "olive",
        "bronze",
        "terracotta",
        "mustard",
      ],
      characteristics: ["warm", "rich", "earthy", "deep"],
    },
    winter: {
      season: "winter",
      palette: [
        "navy",
        "black",
        "white",
        "crimson",
        "royal blue",
        "emerald",
        "silver",
        "purple",
        "hot pink",
        "charcoal",
      ],
      characteristics: ["cool", "clear", "intense", "dramatic"],
    },
  };

  private modernColorCombinations = [
    // Monochromatic modern
    {
      colors: ["light grey", "charcoal", "white"],
      type: "monochromatic",
      style: "minimalist",
    },
    {
      colors: ["navy", "powder blue", "cream"],
      type: "monochromatic",
      style: "classic",
    },
    {
      colors: ["blush", "rose", "burgundy"],
      type: "monochromatic",
      style: "romantic",
    },

    // Contemporary complementary
    {
      colors: ["sage", "terracotta"],
      type: "complementary",
      style: "earthy modern",
    },
    {
      colors: ["navy", "camel"],
      type: "complementary",
      style: "sophisticated",
    },
    {
      colors: ["charcoal", "mustard"],
      type: "complementary",
      style: "bold modern",
    },

    // Triadic modern
    {
      colors: ["coral", "mint", "cream"],
      type: "triadic",
      style: "fresh modern",
    },
    {
      colors: ["navy", "blush", "gold"],
      type: "triadic",
      style: "elegant modern",
    },
    {
      colors: ["forest", "rust", "ivory"],
      type: "triadic",
      style: "organic modern",
    },

    // Split complementary
    {
      colors: ["teal", "coral", "gold"],
      type: "split-complementary",
      style: "vibrant modern",
    },
    {
      colors: ["navy", "peach", "sage"],
      type: "split-complementary",
      style: "balanced modern",
    },

    // Analogous modern
    {
      colors: ["sage", "mint", "seafoam"],
      type: "analogous",
      style: "natural modern",
    },
    {
      colors: ["burgundy", "plum", "rose"],
      type: "analogous",
      style: "rich modern",
    },
    {
      colors: ["navy", "teal", "forest"],
      type: "analogous",
      style: "deep modern",
    },
  ];

  /**
   * Analyzes color harmony between two color arrays using modern color theory
   */
  public analyzeColorHarmony(
    colors1: string[],
    colors2: string[],
  ): ColorHarmonyResult {
    if (!colors1?.length || !colors2?.length) {
      return {
        isHarmonious: false,
        harmonyType: "unknown",
        confidence: 0,
        reasoning: "Insufficient color data",
      };
    }

    // Normalize colors
    const normalizedColors1 = colors1.map((c) => this.normalizeColor(c));
    const normalizedColors2 = colors2.map((c) => this.normalizeColor(c));

    // Check for neutral harmony (most forgiving)
    const neutralHarmony = this.checkNeutralHarmony(
      normalizedColors1,
      normalizedColors2,
    );
    if (neutralHarmony.isHarmonious) {
      return neutralHarmony;
    }

    // Check modern color combinations
    const modernHarmony = this.checkModernCombinations(
      normalizedColors1,
      normalizedColors2,
    );
    if (modernHarmony.isHarmonious) {
      return modernHarmony;
    }

    // Check traditional color theory harmonies
    const traditionalHarmony = this.checkTraditionalHarmonies(
      normalizedColors1,
      normalizedColors2,
    );
    if (traditionalHarmony.isHarmonious) {
      return traditionalHarmony;
    }

    // Check seasonal harmony
    const seasonalHarmony = this.checkSeasonalHarmony(
      normalizedColors1,
      normalizedColors2,
    );
    if (seasonalHarmony.isHarmonious) {
      return seasonalHarmony;
    }

    // Check color family harmony
    const familyHarmony = this.checkColorFamilyHarmony(
      normalizedColors1,
      normalizedColors2,
    );
    if (familyHarmony.isHarmonious) {
      return familyHarmony;
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0.1,
      reasoning: "Colors do not follow established harmony principles",
    };
  }

  /**
   * Analyzes individual color properties
   */
  public analyzeColor(color: string): ColorAnalysis {
    const normalized = this.normalizeColor(color);

    return {
      dominantColor: this.getDominantColor(normalized),
      colorFamily: this.getColorFamily(normalized),
      temperature: this.getColorTemperature(normalized),
      intensity: this.getColorIntensity(normalized),
      saturation: this.getColorSaturation(normalized),
    };
  }

  /**
   * Gets the current seasonal color palette
   */
  public getCurrentSeasonalPalette(): SeasonalColorProfile {
    const currentSeason = this.getCurrentSeason();
    return this.seasonalPalettes[currentSeason];
  }

  /**
   * Finds the best color harmony type for given colors
   */
  public findBestHarmony(allColors: string[]): ColorHarmonyResult {
    if (!allColors?.length) {
      return {
        isHarmonious: false,
        harmonyType: "unknown",
        confidence: 0,
        reasoning: "No colors provided",
      };
    }

    const normalized = allColors.map((c) => this.normalizeColor(c));

    // Try different harmony types and return the best one
    const harmonies = [
      this.checkMonochromatic(normalized),
      this.checkComplementary(normalized),
      this.checkAnalogous(normalized),
      this.checkTriadic(normalized),
      this.checkSeasonalPalette(normalized),
    ]
      .filter((h) => h.isHarmonious)
      .sort((a, b) => b.confidence - a.confidence);

    return (
      harmonies[0] || {
        isHarmonious: false,
        harmonyType: "mixed",
        confidence: 0.3,
        reasoning: "Colors create an eclectic mix",
      }
    );
  }

  /**
   * Generates harmonious color suggestions based on a base color
   */
  public generateHarmoniousColors(
    baseColor: string,
    harmonyType: string = "complementary",
  ): string[] {
    const normalized = this.normalizeColor(baseColor);
    const family = this.getColorFamily(normalized);

    switch (harmonyType) {
      case "complementary":
        return this.getComplementaryColors(family);
      case "analogous":
        return this.getAnalogousColors(family);
      case "triadic":
        return this.getTriadicColors(family);
      case "monochromatic":
        return this.getMonochromaticColors(family);
      case "seasonal":
        return this.getCurrentSeasonalPalette().palette;
      default:
        return this.getComplementaryColors(family);
    }
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
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
        };
      }
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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
      };
    }

    return {
      isHarmonious: false,
      harmonyType: "none",
      confidence: 0,
      reasoning: "",
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

  private getColorSaturation(color: string): "low" | "medium" | "high" {
    const lowSatKeywords = ["muted", "dusty", "grey", "gray", "sage", "mauve"];
    const highSatKeywords = ["bright", "vibrant", "neon", "electric", "hot"];

    if (lowSatKeywords.some((k) => color.includes(k))) return "low";
    if (highSatKeywords.some((k) => color.includes(k))) return "high";
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
