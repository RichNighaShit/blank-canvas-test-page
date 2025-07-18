interface ClothingAnalysisResult {
  isClothing: boolean;
  category: string;
  style: string;
  colors: string[];
  occasions: string[];
  seasons: string[];
  tags: string[];
  confidence: number;
  reasoning: string;
  subcategory?: string;
  patterns?: string[];
  materials?: string[];
}

interface VisionAPIResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      description: string;
      score: number;
      topicality: number;
    }>;
    localizedObjectAnnotations?: Array<{
      name: string;
      score: number;
      boundingPoly: {
        normalizedVertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
    imagePropertiesAnnotation?: {
      dominantColors: {
        colors: Array<{
          color: {
            red: number;
            green: number;
            blue: number;
          };
          score: number;
          pixelFraction: number;
        }>;
      };
    };
  }>;
}

export class AccurateClothingAnalyzer {
  private apiKey: string | null = null;

  constructor() {
    // API key will be provided when needed
  }

  /**
   * Initialize with API key (this would typically come from environment variables)
   */
  async initialize(apiKey?: string): Promise<void> {
    // For now, we'll use a fallback approach without requiring API key setup
    this.apiKey = apiKey || null;
  }

  /**
   * Main analysis function using Google Vision API and intelligent fallbacks
   */
  async analyzeClothing(input: File | string): Promise<ClothingAnalysisResult> {
    try {
      // Try Google Vision API first if available
      if (this.apiKey) {
        const visionResult = await this.analyzeWithVisionAPI(input);
        if (visionResult) {
          return visionResult;
        }
      }

      // Fall back to advanced heuristic analysis
      return await this.analyzeWithAdvancedHeuristics(input);
    } catch (error) {
      console.error("Clothing analysis failed:", error);
      return await this.analyzeWithAdvancedHeuristics(input);
    }
  }

  /**
   * Google Vision API analysis
   */
  private async analyzeWithVisionAPI(
    input: File | string,
  ): Promise<ClothingAnalysisResult | null> {
    if (!this.apiKey) return null;

    try {
      const base64Image = await this.convertToBase64(input);

      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              { type: "LABEL_DETECTION", maxResults: 20 },
              { type: "OBJECT_LOCALIZATION", maxResults: 20 },
              { type: "IMAGE_PROPERTIES", maxResults: 1 },
            ],
          },
        ],
      };

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        console.warn("Vision API request failed:", response.status);
        return null;
      }

      const data: VisionAPIResponse = await response.json();
      return this.processVisionAPIResponse(data);
    } catch (error) {
      console.warn("Vision API analysis failed:", error);
      return null;
    }
  }

  /**
   * Process Google Vision API response
   */
  private processVisionAPIResponse(
    data: VisionAPIResponse,
  ): ClothingAnalysisResult {
    const response = data.responses[0];
    const labels = response.labelAnnotations || [];
    const objects = response.localizedObjectAnnotations || [];
    const imageProperties = response.imagePropertiesAnnotation;

    // Extract clothing-related labels and objects
    const clothingLabels = this.filterClothingLabels(labels);
    const clothingObjects = this.filterClothingObjects(objects);

    // Determine if this is clothing
    const isClothing = clothingLabels.length > 0 || clothingObjects.length > 0;

    if (!isClothing) {
      return {
        isClothing: false,
        category: "other",
        style: "unknown",
        colors: ["neutral"],
        occasions: ["casual"],
        seasons: this.getCurrentSeasons(),
        tags: [],
        confidence: 0.1,
        reasoning: "No clothing detected by Vision API",
      };
    }

    // Analyze category from labels and objects
    const category = this.determineCategoryFromVision(
      clothingLabels,
      clothingObjects,
    );

    // Analyze style
    const style = this.determineStyleFromVision(clothingLabels);

    // Extract colors
    const colors = this.extractColorsFromVision(imageProperties);

    // Determine occasions and seasons
    const occasions = this.determineOccasions(category, style, colors);
    const seasons = this.determineSeasons(category, colors, style);

    // Calculate confidence based on API scores
    const confidence = this.calculateVisionConfidence(
      clothingLabels,
      clothingObjects,
    );

    return {
      isClothing: true,
      category,
      style,
      colors,
      occasions,
      seasons,
      tags: this.extractTags(clothingLabels),
      confidence,
      reasoning: `Vision API detected ${clothingLabels.length} clothing labels and ${clothingObjects.length} clothing objects`,
    };
  }

  /**
   * Advanced heuristic analysis as fallback
   */
  private async analyzeWithAdvancedHeuristics(
    input: File | string,
  ): Promise<ClothingAnalysisResult> {
    const imageElement = await this.createImageElement(input);

    // Extract filename if available
    const filename = input instanceof File ? input.name : "";

    // First check if this appears to be clothing
    const clothingDetection = this.detectClothingFromFilename(filename);

    if (!clothingDetection.isClothing) {
      return {
        isClothing: false,
        category: "other",
        style: "unknown",
        colors: ["neutral"],
        occasions: ["casual"],
        seasons: this.getCurrentSeasons(),
        tags: [],
        confidence: clothingDetection.confidence,
        reasoning: clothingDetection.reasoning,
      };
    }

    // Analyze colors using canvas
    const colors = await this.extractColorsFromCanvas(imageElement);

    // Intelligent category detection from filename and basic image analysis
    const category = this.smartCategoryDetection(filename, imageElement);

    // Smart style detection
    const style = this.smartStyleDetection(category, colors, filename);

    // Generate occasions and seasons
    const occasions = this.determineOccasions(category, style, colors);
    const seasons = this.determineSeasons(category, colors, style);

    return {
      isClothing: true,
      category,
      style,
      colors,
      occasions,
      seasons,
      tags: this.generateSmartTags(category, style, colors),
      confidence: Math.max(0.75, clothingDetection.confidence), // Use higher of detection or analysis confidence
      reasoning:
        clothingDetection.reasoning + " - Clothing detected and analyzed",
    };
  }

  /**
   * Detect if filename suggests clothing (lenient check)
   */
  private detectClothingFromFilename(filename: string): {
    isClothing: boolean;
    confidence: number;
    reasoning: string;
  } {
    const fname = filename.toLowerCase();

    // Strong clothing indicators
    const strongClothingKeywords = [
      "shirt",
      "top",
      "blouse",
      "sweater",
      "hoodie",
      "tshirt",
      "t-shirt",
      "tank",
      "pullover",
      "cardigan",
      "pant",
      "jean",
      "trouser",
      "short",
      "legging",
      "slack",
      "chino",
      "skirt",
      "dress",
      "gown",
      "frock",
      "sundress",
      "maxi",
      "mini",
      "jacket",
      "coat",
      "blazer",
      "parka",
      "windbreaker",
      "bomber",
      "shoe",
      "boot",
      "sneaker",
      "sandal",
      "heel",
      "pump",
      "loafer",
      "oxford",
      "runner",
      "bag",
      "purse",
      "backpack",
      "hat",
      "cap",
      "scarf",
      "belt",
      "watch",
      "clothing",
      "apparel",
      "fashion",
      "wear",
      "outfit",
    ];

    // Non-clothing indicators (be conservative to avoid false rejections)
    const nonClothingKeywords = [
      "food",
      "drink",
      "kitchen",
      "cooking",
      "recipe",
      "car",
      "vehicle",
      "auto",
      "motorcycle",
      "bike",
      "animal",
      "dog",
      "cat",
      "pet",
      "bird",
      "building",
      "house",
      "architecture",
      "room",
      "furniture",
      "nature",
      "landscape",
      "tree",
      "flower",
      "plant",
      "document",
      "paper",
      "text",
      "book",
      "magazine",
      "computer",
      "phone",
      "electronic",
      "device",
      "screen",
      "medical",
      "hospital",
      "doctor",
      "medicine",
    ];

    // Check for strong clothing indicators
    const hasClothingKeyword = strongClothingKeywords.some((keyword) =>
      fname.includes(keyword),
    );
    if (hasClothingKeyword) {
      return {
        isClothing: true,
        confidence: 0.9,
        reasoning: "Filename contains clothing-related keywords",
      };
    }

    // Check for non-clothing indicators
    const hasNonClothingKeyword = nonClothingKeywords.some((keyword) =>
      fname.includes(keyword),
    );
    if (hasNonClothingKeyword) {
      return {
        isClothing: false,
        confidence: 0.8,
        reasoning: "Filename suggests non-clothing item",
      };
    }

    // Check for generic image names (assume clothing to be lenient)
    const genericNames = [
      "img",
      "image",
      "pic",
      "photo",
      "screenshot",
      "photo_",
      "img_",
    ];
    const isGeneric =
      genericNames.some((name) => fname.includes(name)) ||
      /^\d+\.(jpg|jpeg|png|webp)$/.test(fname);

    if (isGeneric || fname.length < 3) {
      return {
        isClothing: true,
        confidence: 0.6,
        reasoning: "Generic filename - assuming clothing (lenient mode)",
      };
    }

    // For any other filenames, be lenient and assume clothing
    return {
      isClothing: true,
      confidence: 0.7,
      reasoning: "No clear non-clothing indicators found - assuming clothing",
    };
  }

  /**
   * Enhanced smart category detection using multiple signals
   */
  private smartCategoryDetection(
    filename: string,
    imageElement: HTMLImageElement,
  ): string {
    const fname = filename.toLowerCase();

    // Enhanced filename analysis with more specific keywords
    const categoryKeywords = {
      tops: [
        "shirt",
        "top",
        "blouse",
        "sweater",
        "hoodie",
        "pullover",
        "cardigan",
        "tshirt",
        "t-shirt",
        "tank",
        "polo",
        "henley",
        "crop",
        "tube",
        "halter",
        "camisole",
        "vest",
        "turtleneck",
        "sweatshirt",
        "jersey",
        "bodysuit",
        "leotard",
      ],
      bottoms: [
        "pant",
        "jean",
        "trouser",
        "short",
        "legging",
        "skirt",
        "chino",
        "slack",
        "khaki",
        "cargo",
        "jogger",
        "sweatpant",
        "yoga",
        "capri",
        "bermuda",
        "culottes",
        "palazzo",
        "wide-leg",
        "skinny",
        "bootcut",
        "straight-leg",
        "flare",
      ],
      dresses: [
        "dress",
        "gown",
        "frock",
        "sundress",
        "maxi",
        "mini",
        "midi",
        "cocktail",
        "evening",
        "wedding",
        "prom",
        "formal",
        "shift",
        "wrap",
        "a-line",
        "bodycon",
        "slip",
        "tunic",
        "kaftan",
      ],
      outerwear: [
        "jacket",
        "coat",
        "blazer",
        "parka",
        "windbreaker",
        "bomber",
        "denim jacket",
        "leather jacket",
        "trench",
        "peacoat",
        "puffer",
        "anorak",
        "vest",
        "poncho",
        "cape",
        "shawl",
        "wrap",
        "cardigan",
        "overcoat",
        "raincoat",
      ],
      shoes: [
        "shoe",
        "boot",
        "sneaker",
        "sandal",
        "heel",
        "pump",
        "loafer",
        "oxford",
        "runner",
        "trainer",
        "athletic",
        "tennis",
        "basketball",
        "running",
        "walking",
        "hiking",
        "combat",
        "ankle",
        "knee-high",
        "platform",
        "wedge",
        "stiletto",
        "flat",
        "ballet",
        "slip-on",
        "lace-up",
        "moccasin",
        "clog",
        "flip-flop",
        "thong",
        "slide",
      ],
      accessories: [
        "bag",
        "purse",
        "backpack",
        "hat",
        "cap",
        "scarf",
        "belt",
        "watch",
        "necklace",
        "bracelet",
        "earring",
        "ring",
        "brooch",
        "pin",
        "tie",
        "bowtie",
        "cufflink",
        "glasses",
        "sunglasses",
        "glove",
        "mitten",
        "wallet",
        "clutch",
        "tote",
        "crossbody",
        "messenger",
        "satchel",
        "duffel",
        "fanny",
        "headband",
        "hair",
        "beanie",
        "fedora",
        "visor",
      ],
    };

    // Check filename for category keywords with confidence scoring
    let bestMatch = { category: "", confidence: 0 };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (fname.includes(keyword)) {
          const confidence = keyword.length / fname.length; // Longer matches get higher confidence
          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence };
          }
        }
      }
    }

    if (bestMatch.confidence > 0.1) {
      return bestMatch.category;
    }

    // Advanced image analysis
    const aspectRatio = imageElement.width / imageElement.height;
    const imageAnalysis = this.analyzeImageShape(imageElement, aspectRatio);

    return imageAnalysis;
  }

  /**
   * Analyze image shape and characteristics for category detection
   */
  private analyzeImageShape(
    imageElement: HTMLImageElement,
    aspectRatio: number,
  ): string {
    const width = imageElement.width;
    const height = imageElement.height;

    // Very wide images are likely shoes or accessories
    if (aspectRatio > 1.5) {
      return "shoes";
    }

    // Very tall images are likely dresses or full-body shots
    if (aspectRatio < 0.6) {
      return "dresses";
    }

    // Square-ish images with moderate size often accessories
    if (
      aspectRatio >= 0.8 &&
      aspectRatio <= 1.2 &&
      width < 800 &&
      height < 800
    ) {
      return "accessories";
    }

    // Wider than tall but not extremely wide - likely tops or bottoms
    if (aspectRatio > 1.0 && aspectRatio <= 1.5) {
      // Use additional heuristics
      return height > width * 0.8 ? "tops" : "bottoms";
    }

    // Taller than wide - likely tops, dresses, or outerwear
    if (aspectRatio < 1.0) {
      // Very tall suggests dresses
      if (aspectRatio < 0.7) return "dresses";
      // Moderately tall suggests tops or outerwear
      return "tops";
    }

    // Default fallback with smarter logic
    return "tops"; // Most common category
  }

  /**
   * Smart style detection
   */
  private smartStyleDetection(
    category: string,
    colors: string[],
    filename: string,
  ): string {
    const fname = filename.toLowerCase();

    // Style keywords
    if (
      fname.includes("formal") ||
      fname.includes("dress") ||
      fname.includes("suit")
    )
      return "formal";
    if (
      fname.includes("sport") ||
      fname.includes("gym") ||
      fname.includes("athletic")
    )
      return "sporty";
    if (fname.includes("casual") || fname.includes("everyday")) return "casual";
    if (
      fname.includes("elegant") ||
      fname.includes("evening") ||
      fname.includes("cocktail")
    )
      return "elegant";
    if (
      fname.includes("bohemian") ||
      fname.includes("boho") ||
      fname.includes("hippie")
    )
      return "bohemian";
    if (
      fname.includes("minimalist") ||
      fname.includes("simple") ||
      fname.includes("clean")
    )
      return "minimalist";
    if (
      fname.includes("street") ||
      fname.includes("urban") ||
      fname.includes("hip")
    )
      return "streetwear";
    if (
      fname.includes("vintage") ||
      fname.includes("retro") ||
      fname.includes("classic")
    )
      return "vintage";

    // Color-based style hints
    if (colors.includes("black") && colors.length === 1) return "minimalist";
    if (colors.includes("pink") || colors.includes("purple")) return "elegant";
    if (colors.includes("neon") || colors.includes("bright"))
      return "streetwear";

    // Category-based defaults
    switch (category) {
      case "dresses":
        return "elegant";
      case "outerwear":
        return "formal";
      case "shoes":
        return "sporty";
      default:
        return "casual";
    }
  }

  /**
   * Extract colors using canvas analysis
   */
  private async extractColorsFromCanvas(
    imageElement: HTMLImageElement,
  ): Promise<string[]> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return ["neutral"];

      // Resize for faster processing
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(imageElement, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);

      return this.analyzeImageColors(imageData);
    } catch (error) {
      console.warn("Color extraction failed:", error);
      return ["neutral"];
    }
  }

  /**
   * Advanced color analysis with background detection
   */
  private analyzeImageColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorCounts = new Map<string, number>();
    const edgeColors = new Map<string, number>();
    const centerColors = new Map<string, number>();

    const width = imageData.width;
    const height = imageData.height;
    const edgeThreshold = Math.min(width, height) * 0.1; // 10% of image edge

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip transparent pixels
      if (alpha < 128) continue;

      const colorName = this.rgbToColorName(r, g, b);
      colorCounts.set(colorName, (colorCounts.get(colorName) || 0) + 1);

      // Detect edge pixels (likely background)
      const isEdge =
        x < edgeThreshold ||
        x > width - edgeThreshold ||
        y < edgeThreshold ||
        y > height - edgeThreshold;

      if (isEdge) {
        edgeColors.set(colorName, (edgeColors.get(colorName) || 0) + 1);
      } else {
        centerColors.set(colorName, (centerColors.get(colorName) || 0) + 1);
      }
    }

    // Detect background colors (most frequent at edges)
    const backgroundColors = this.detectBackgroundColors(
      edgeColors,
      centerColors,
    );

    // Filter out background colors from final result
    const clothingColors = this.filterBackgroundColors(
      colorCounts,
      backgroundColors,
    );

    // Sort colors by frequency and return top 3
    const sortedColors = Array.from(clothingColors.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([color]) => color)
      .filter((color) => color !== "neutral" && !backgroundColors.has(color));

    return sortedColors.length > 0 ? sortedColors : ["neutral"];
  }

  /**
   * Detect background colors based on edge analysis
   */
  private detectBackgroundColors(
    edgeColors: Map<string, number>,
    centerColors: Map<string, number>,
  ): Set<string> {
    const backgroundColors = new Set<string>();
    const totalEdgePixels = Array.from(edgeColors.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const totalCenterPixels = Array.from(centerColors.values()).reduce(
      (a, b) => a + b,
      0,
    );

    for (const [color, edgeCount] of edgeColors.entries()) {
      const centerCount = centerColors.get(color) || 0;
      const edgeRatio = edgeCount / totalEdgePixels;
      const centerRatio =
        totalCenterPixels > 0 ? centerCount / totalCenterPixels : 0;

      // If color is much more frequent at edges than center, it's likely background
      if (edgeRatio > 0.15 && edgeRatio > centerRatio * 2) {
        backgroundColors.add(color);
      }

      // Very common edge colors are likely background
      if (edgeRatio > 0.3) {
        backgroundColors.add(color);
      }
    }

    // Common background colors
    const commonBackgrounds = [
      "white",
      "light-gray",
      "gray",
      "black",
      "neutral",
    ];
    commonBackgrounds.forEach((color) => {
      const edgeRatio = (edgeColors.get(color) || 0) / totalEdgePixels;
      if (edgeRatio > 0.2) {
        backgroundColors.add(color);
      }
    });

    return backgroundColors;
  }

  /**
   * Filter out background colors from clothing colors
   */
  private filterBackgroundColors(
    allColors: Map<string, number>,
    backgroundColors: Set<string>,
  ): Map<string, number> {
    const filteredColors = new Map<string, number>();

    for (const [color, count] of allColors.entries()) {
      if (!backgroundColors.has(color)) {
        filteredColors.set(color, count);
      }
    }

    // If no colors remain after filtering, keep the most common non-background color
    if (filteredColors.size === 0 && allColors.size > 0) {
      const sortedAll = Array.from(allColors.entries()).sort(
        ([, a], [, b]) => b - a,
      );

      for (const [color] of sortedAll) {
        if (!["white", "light-gray"].includes(color)) {
          filteredColors.set(color, allColors.get(color)!);
          break;
        }
      }
    }

    return filteredColors.size > 0 ? filteredColors : allColors;
  }

  /**
   * Enhanced RGB to color name conversion
   */
  private rgbToColorName(r: number, g: number, b: number): string {
    // Convert to HSL for better color categorization
    const [h, s, l] = this.rgbToHsl(r, g, b);

    // Black and white
    if (l < 15) return "black";
    if (l > 85 && s < 20) return "white";

    // Grays
    if (s < 15) {
      if (l < 30) return "charcoal";
      if (l < 70) return "gray";
      return "light-gray";
    }

    // Colors based on hue
    if (h >= 0 && h < 15) return s > 50 ? "red" : "pink";
    if (h >= 15 && h < 45) return s > 60 ? "orange" : "coral";
    if (h >= 45 && h < 75) return s > 40 ? "yellow" : "cream";
    if (h >= 75 && h < 150) return s > 30 ? "green" : "sage";
    if (h >= 150 && h < 190) return "cyan";
    if (h >= 190 && h < 250) return s > 40 ? "blue" : "navy";
    if (h >= 250 && h < 290) return "purple";
    if (h >= 290 && h < 330) return "magenta";
    if (h >= 330) return s > 50 ? "red" : "pink";

    return "neutral";
  }

  /**
   * RGB to HSL conversion
   */
  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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
  }

  /**
   * Helper functions for Google Vision API
   */
  private filterClothingLabels(
    labels: Array<{ description: string; score: number }>,
  ): Array<{ description: string; score: number }> {
    const clothingTerms = [
      "clothing",
      "apparel",
      "fashion",
      "shirt",
      "pants",
      "dress",
      "jacket",
      "shoe",
      "boot",
      "sweater",
      "coat",
      "skirt",
      "blouse",
      "top",
      "bottom",
      "sneaker",
      "sandal",
      "heel",
      "accessory",
      "bag",
      "purse",
      "hat",
      "cap",
      "scarf",
      "belt",
      "watch",
      "jewelry",
    ];

    return labels.filter(
      (label) =>
        clothingTerms.some((term) =>
          label.description.toLowerCase().includes(term),
        ) && label.score > 0.5,
    );
  }

  private filterClothingObjects(
    objects: Array<{ name: string; score: number }>,
  ): Array<{ name: string; score: number }> {
    const clothingObjects = [
      "person",
      "clothing",
      "footwear",
      "fashion accessory",
      "bag",
      "shoe",
    ];

    return objects.filter(
      (obj) =>
        clothingObjects.some((term) => obj.name.toLowerCase().includes(term)) &&
        obj.score > 0.5,
    );
  }

  private determineCategoryFromVision(
    labels: Array<{ description: string; score: number }>,
    objects: Array<{ name: string; score: number }>,
  ): string {
    const allTerms = [
      ...labels.map((l) => l.description.toLowerCase()),
      ...objects.map((o) => o.name.toLowerCase()),
    ];

    if (
      allTerms.some((term) =>
        ["shoe", "boot", "sneaker", "sandal", "footwear"].some((t) =>
          term.includes(t),
        ),
      )
    ) {
      return "shoes";
    }
    if (
      allTerms.some((term) => ["dress", "gown"].some((t) => term.includes(t)))
    ) {
      return "dresses";
    }
    if (
      allTerms.some((term) =>
        ["jacket", "coat", "blazer"].some((t) => term.includes(t)),
      )
    ) {
      return "outerwear";
    }
    if (
      allTerms.some((term) =>
        ["pants", "jeans", "trousers", "shorts", "skirt"].some((t) =>
          term.includes(t),
        ),
      )
    ) {
      return "bottoms";
    }
    if (
      allTerms.some((term) =>
        [
          "bag",
          "purse",
          "backpack",
          "hat",
          "cap",
          "scarf",
          "belt",
          "accessory",
        ].some((t) => term.includes(t)),
      )
    ) {
      return "accessories";
    }

    return "tops"; // Default
  }

  private determineStyleFromVision(
    labels: Array<{ description: string; score: number }>,
  ): string {
    const styleTerms = labels.map((l) => l.description.toLowerCase()).join(" ");

    if (
      styleTerms.includes("formal") ||
      styleTerms.includes("suit") ||
      styleTerms.includes("business")
    ) {
      return "formal";
    }
    if (
      styleTerms.includes("sport") ||
      styleTerms.includes("athletic") ||
      styleTerms.includes("gym")
    ) {
      return "sporty";
    }
    if (
      styleTerms.includes("elegant") ||
      styleTerms.includes("evening") ||
      styleTerms.includes("cocktail")
    ) {
      return "elegant";
    }

    return "casual";
  }

  private extractColorsFromVision(imageProperties: any): string[] {
    if (!imageProperties?.dominantColors?.colors) {
      return ["neutral"];
    }

    return imageProperties.dominantColors.colors
      .slice(0, 3)
      .map((colorInfo: any) => {
        const { red = 0, green = 0, blue = 0 } = colorInfo.color;
        return this.rgbToColorName(red, green, blue);
      })
      .filter(
        (color: string, index: number, array: string[]) =>
          array.indexOf(color) === index,
      );
  }

  private calculateVisionConfidence(
    labels: Array<{ score: number }>,
    objects: Array<{ score: number }>,
  ): number {
    const allScores = [
      ...labels.map((l) => l.score),
      ...objects.map((o) => o.score),
    ];
    const avgScore =
      allScores.length > 0
        ? allScores.reduce((a, b) => a + b) / allScores.length
        : 0.5;
    return Math.min(0.95, Math.max(0.3, avgScore));
  }

  private extractTags(
    labels: Array<{ description: string; score: number }>,
  ): string[] {
    return labels
      .filter((label) => label.score > 0.7)
      .slice(0, 5)
      .map((label) => label.description.toLowerCase());
  }

  /**
   * Common utility functions
   */
  private determineOccasions(
    category: string,
    style: string,
    colors: string[],
  ): string[] {
    const occasions = new Set<string>();

    // Style-based occasions
    switch (style) {
      case "formal":
        occasions.add("work");
        occasions.add("formal");
        break;
      case "sporty":
        occasions.add("sport");
        occasions.add("casual");
        break;
      case "elegant":
        occasions.add("party");
        occasions.add("date");
        occasions.add("formal");
        break;
      default:
        occasions.add("casual");
    }

    // Category-specific occasions
    switch (category) {
      case "outerwear":
        occasions.add("travel");
        break;
      case "dresses":
        occasions.add("party");
        occasions.add("date");
        break;
      case "shoes":
        if (style === "sporty") occasions.add("sport");
        break;
    }

    // Color-based occasions
    if (
      colors.includes("black") ||
      colors.includes("navy") ||
      colors.includes("charcoal")
    ) {
      occasions.add("work");
      occasions.add("formal");
    }

    return Array.from(occasions).slice(0, 3);
  }

  private determineSeasons(
    category: string,
    colors: string[],
    style: string,
  ): string[] {
    const seasons = new Set<string>();

    // Color-based seasons
    const lightColors = [
      "white",
      "cream",
      "light-gray",
      "pink",
      "coral",
      "yellow",
    ];
    const darkColors = ["black", "navy", "charcoal", "purple"];

    if (colors.some((c) => lightColors.includes(c))) {
      seasons.add("spring");
      seasons.add("summer");
    }

    if (colors.some((c) => darkColors.includes(c))) {
      seasons.add("fall");
      seasons.add("winter");
    }

    // Category-based seasons
    switch (category) {
      case "outerwear":
        seasons.add("fall");
        seasons.add("winter");
        break;
      case "shoes":
        if (style === "sporty") {
          seasons.add("spring");
          seasons.add("summer");
        }
        break;
    }

    // Ensure at least 2 seasons
    if (seasons.size < 2) {
      seasons.add("spring");
      seasons.add("fall");
    }

    return Array.from(seasons);
  }

  private getCurrentSeasons(): string[] {
    const currentMonth = new Date().getMonth() + 1;

    if (currentMonth >= 3 && currentMonth <= 5) return ["spring", "summer"];
    if (currentMonth >= 6 && currentMonth <= 8) return ["summer", "fall"];
    if (currentMonth >= 9 && currentMonth <= 11) return ["fall", "winter"];
    return ["winter", "spring"];
  }

  private generateSmartTags(
    category: string,
    style: string,
    colors: string[],
  ): string[] {
    const tags = [];

    // Add category-specific tags
    switch (category) {
      case "tops":
        tags.push("versatile", "layerable");
        break;
      case "bottoms":
        tags.push("essential", "wardrobe-staple");
        break;
      case "dresses":
        tags.push("statement-piece", "feminine");
        break;
      case "outerwear":
        tags.push("layering", "weather-protection");
        break;
      case "shoes":
        tags.push("footwear", "comfort");
        break;
      case "accessories":
        tags.push("accent", "finishing-touch");
        break;
    }

    // Add style tags
    if (style !== "casual") {
      tags.push(style);
    }

    // Add color tags
    if (colors.length === 1 && colors[0] !== "neutral") {
      tags.push(`${colors[0]}-piece`);
    }

    return tags.slice(0, 3);
  }

  /**
   * Utility functions
   */
  private async convertToBase64(input: File | string): Promise<string> {
    if (typeof input === "string") {
      // If it's a URL, fetch and convert
      const response = await fetch(input);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(",")[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // If it's a File, convert directly
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(",")[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(input);
      });
    }
  }

  private async createImageElement(
    input: File | string,
  ): Promise<HTMLImageElement> {
    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
      imageElement.onload = () => resolve(imageElement);
      imageElement.onerror = reject;

      if (typeof input === "string") {
        imageElement.src = input;
      } else {
        imageElement.src = URL.createObjectURL(input);
      }
    });
  }
}

// Export a singleton instance
export const accurateClothingAnalyzer = new AccurateClothingAnalyzer();
